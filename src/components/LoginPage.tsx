import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LogIn, UserPlus } from 'lucide-react';

type AuthTab = 'login' | 'signup';

interface LoginPageProps {
  supabase: SupabaseClient;
  onSuccess: () => void;
  googleAuthError?: string | null;
  onClearGoogleAuthError?: () => void;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export const LoginPage = ({ supabase, onSuccess, googleAuthError, onClearGoogleAuthError }: LoginPageProps) => {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupEmail, setSignupEmail] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    localStorage.setItem('google_oauth_intent', tab);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) { localStorage.removeItem('google_oauth_intent'); setError(authError.message); }
  };

  const reset = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setPasswordConfirm('');
    setError(null);
    setInfo(null);
  };

  const switchTab = (next: AuthTab) => {
    setTab(next);
    reset();
    onClearGoogleAuthError?.();
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail) { setError('이메일을 입력하세요.'); return; }
    if (tab === 'signup' && !username.trim()) { setError('계정이름을 입력하세요.'); return; }
    if (!trimmedPassword) { setError('비밀번호를 입력하세요.'); return; }
    if (tab === 'signup' && password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }

    setIsSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      if (tab === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (authError) throw authError;
        onSuccess();
      } else {
        const trimmedUsername = username.trim();

        // username 중복 체크
        const { data: existing } = await supabase
          .from('users')
          .select('username')
          .eq('username', trimmedUsername)
          .maybeSingle();
        if (existing) {
          setError('이미 사용중인 이름입니다. 다른 이름을 사용해 주세요.');
          return;
        }

        const { error: authError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: { username: trimmedUsername },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (authError) throw authError;
        setSignupEmail(trimmedEmail);
        reset();
        setTab('login');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {signupEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.6)] max-w-sm w-full mx-4 text-center">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-white font-bold text-lg mb-2">이메일 인증이 필요해요</h2>
            <p className="text-gray-400 text-sm mb-1">
              <span className="text-orange-400 font-semibold">{signupEmail}</span> 으로
            </p>
            <p className="text-gray-300 text-sm mb-6">
              인증 메일을 보냈어요.<br />
              메일함에서 <span className="text-orange-400 font-semibold">인증 버튼</span>을 눌러주세요.
            </p>
            <button
              onClick={() => setSignupEmail(null)}
              className="w-full py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-black transition"
            >
              확인
            </button>
          </div>
        </div>
      )}
    <div className="w-full max-w-md mx-auto mt-16 px-4">
      <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-8">
          <button
            onClick={() => switchTab('login')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition ${
              tab === 'login'
                ? 'bg-orange-500 text-black'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            로그인
          </button>
          <button
            onClick={() => switchTab('signup')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition ${
              tab === 'signup'
                ? 'bg-orange-500 text-black'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            회원가입
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
              placeholder="example@email.com"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 placeholder:text-sm focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          {tab === 'signup' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
                placeholder="사용할 이름을 입력하세요"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 placeholder:text-sm focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
              placeholder={tab === 'signup' ? '8자 이상 입력하세요' : '비밀번호 입력'}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 placeholder:text-sm focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          {tab === 'signup' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 placeholder:text-sm focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-green-400 bg-green-900/20 border border-green-500/30 rounded-lg px-3 py-2">
              {info}
            </p>
          )}

          <button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl text-sm font-bold transition ${
              isSubmitting
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-400 text-black'
            }`}
          >
            {isSubmitting
              ? tab === 'login' ? '로그인 중...' : '가입 중...'
              : tab === 'login' ? '로그인' : '회원가입'}
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#1a1a1a] px-3 text-xs text-gray-500">또는</span>
            </div>
          </div>

          {googleAuthError && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
              {googleAuthError}
            </p>
          )}

          <button
            onClick={() => void handleGoogleLogin()}
            type="button"
            className="w-full py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-900"
          >
            <GoogleIcon />
            {tab === 'login' ? 'Google로 로그인' : 'Google로 회원가입'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
