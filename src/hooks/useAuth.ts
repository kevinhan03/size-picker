import { useEffect, useState } from 'react';
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

  const checkAndSetUser = async (user: AuthUser) => {
    setAuthUser(user);
    if (!user || !supabase) { setDbUsername(null); return; }
    const { data } = await supabase.from('users').select('id, username').eq('id', user.id).maybeSingle();
    if (!data) {
      const intent = localStorage.getItem('google_oauth_intent');
      localStorage.removeItem('google_oauth_intent');
      if (intent === 'login') {
        void supabase.auth.signOut();
        setAuthUser(null);
        setGoogleAuthError('가입되지 않은 구글 계정입니다. 회원가입 탭에서 구글로 가입해 주세요.');
        onNavigateToLogin();
      } else {
        setNeedsUsername(true);
      }
    } else {
      setDbUsername(data.username as string);
    }
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      void checkAndSetUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void checkAndSetUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const submitUsername = async (onSuccess: () => void) => {
    const trimmed = pendingUsername.trim();
    if (!trimmed) { setUsernameError('이름을 입력하세요.'); return; }
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
    if (existing) { setUsernameError('이미 사용중인 이름입니다.'); setIsSubmittingUsername(false); return; }
    const { error: insertError } = await supabase!.from('users').insert({ id: currentUser.id, username: trimmed });
    if (insertError) { console.error('users insert error:', insertError); setUsernameError('오류가 발생했습니다. 다시 시도해주세요.'); setIsSubmittingUsername(false); return; }
    setNeedsUsername(false);
    setDbUsername(trimmed);
    setPendingUsername('');
    setGoogleSignupComplete(true);
    onSuccess();
  };

  return {
    authUser,
    dbUsername,
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
