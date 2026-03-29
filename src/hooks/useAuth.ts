import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthUser = { id?: string; email?: string; user_metadata?: Record<string, unknown> } | null;

interface UseAuthOptions {
  onNavigateToLogin: () => void;
}

export function useAuth({ onNavigateToLogin }: UseAuthOptions) {
  const [authUser, setAuthUser] = useState<AuthUser>(null);
  const [dbUsername, setDbUsername] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [pendingUsername, setPendingUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [googleSignupComplete, setGoogleSignupComplete] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // onNavigateToLogin을 ref로 보관 → checkAndSetUser 의존성에서 제거
  // (App 렌더마다 새 함수가 넘어와도 useEffect/checkAndSetUser가 재생성되지 않음)
  const onNavigateToLoginRef = useRef(onNavigateToLogin);
  useEffect(() => { onNavigateToLoginRef.current = onNavigateToLogin; });

  // getSession()과 onAuthStateChange가 동시에 호출될 때 중복 처리 방지
  const processingUserIdRef = useRef<string | null>(null);

  const checkAndSetUser = useCallback(async (user: AuthUser) => {
    setAuthUser(user);
    if (!user || !supabase) {
      processingUserIdRef.current = null;
      setDbUsername(null);
      setNeedsUsername(false);
      setIsAuthLoading(false);
      return;
    }

    // 동일 유저에 대한 중복 호출이면 skip (race condition 방지)
    if (processingUserIdRef.current === (user.id ?? null)) return;
    processingUserIdRef.current = user.id ?? null;

    // intent는 async 작업 전에 미리 읽어야 다른 concurrent call에게 빼앗기지 않음
    const rawIntent = localStorage.getItem('google_oauth_intent');
    localStorage.removeItem('google_oauth_intent');
    const intent = rawIntent === 'login' || rawIntent === 'signup' ? rawIntent : null;

    const { data } = await supabase.from('users').select('id, username').eq('id', user.id).maybeSingle();

    // 처리 도중 다른 사용자로 변경된 경우 무시
    if (processingUserIdRef.current !== user.id) return;

    if (!data) {
      setDbUsername(null);
      if (intent === 'login') {
        processingUserIdRef.current = null;
        // DB 함수로 auth 항목 직접 삭제 (서버 없이 DB 레벨에서 처리)
        try {
          await supabase.rpc('delete_my_unregistered_auth_user');
        } catch {
          // 삭제 실패해도 로그아웃은 진행
        }
        await supabase.auth.signOut();
        setAuthUser(null);
        setNeedsUsername(false);
        setGoogleAuthError('가입되지 않은 구글 계정입니다. 회원가입 페이지에서 구글로 가입해 주세요.');
        setIsAuthLoading(false);
        onNavigateToLoginRef.current();
      } else {
        setNeedsUsername(true);
        setIsAuthLoading(false);
      }
    } else {
      setNeedsUsername(false);
      setDbUsername(data.username as string);
      setIsAuthLoading(false);
    }
  }, []); // onNavigateToLogin을 의존성에서 제거 → 리스너가 딱 한 번만 등록됨

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      void checkAndSetUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void checkAndSetUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [checkAndSetUser]);

  const submitUsername = async (onSuccess: () => void) => {
    const trimmed = pendingUsername.trim();
    if (!trimmed) { setUsernameError('이름을 입력해 주세요.'); return; }
    if (isSubmittingUsername) return;
    setIsSubmittingUsername(true);
    setUsernameError(null);
    const { data: { user: currentUser } } = await supabase!.auth.getUser();
    if (!currentUser) {
      await supabase!.auth.signOut();
      setNeedsUsername(false);
      setUsernameError(null);
      setIsSubmittingUsername(false);
      onNavigateToLogin();
      return;
    }
    const { data: existing } = await supabase!.from('users').select('username').eq('username', trimmed).maybeSingle();
    if (existing) { setUsernameError('이미 사용 중인 이름입니다.'); setIsSubmittingUsername(false); return; }
    const { error: insertError } = await supabase!.from('users').insert({ id: currentUser.id, username: trimmed });
    if (insertError) { console.error('users insert error:', insertError); setUsernameError('오류가 발생했습니다. 다시 시도해 주세요.'); setIsSubmittingUsername(false); return; }
    setNeedsUsername(false);
    setDbUsername(trimmed);
    setPendingUsername('');
    setGoogleSignupComplete(true);
    onSuccess();
  };

  return {
    authUser,
    dbUsername,
    isAuthLoading,
    needsUsername,
    pendingUsername,
    setPendingUsername,
    usernameError,
    isSubmittingUsername,
    googleAuthError,
    setGoogleAuthError,
    googleSignupComplete,
    setGoogleSignupComplete,
    submitUsername,
  };
}
