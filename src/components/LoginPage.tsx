import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LogIn, UserPlus } from 'lucide-react';
import { completeMyProfile } from '../api';
import { getAuthErrorMessage } from '../utils/authMessage';
import { validateUsername } from '../utils/username';

type AuthTab = 'login' | 'signup';

interface LoginPageProps {
  supabase: SupabaseClient;
  onSuccess: () => void;
  initialInfo?: string | null;
  googleAuthError?: string | null;
  onClearGoogleAuthError?: () => void;
}

type PendingSignup = {
  email: string;
  password: string;
  username: string;
} | null;

const SIGNUP_VERIFIED_TOAST_KEY = 'digbox_signup_verified_toast';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

export const LoginPage = ({
  supabase,
  onSuccess,
  initialInfo = null,
  googleAuthError,
  onClearGoogleAuthError,
}: LoginPageProps) => {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(initialInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupEmail, setSignupEmail] = useState<string | null>(null);
  const [pendingSignup, setPendingSignup] = useState<PendingSignup>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isSignupVerified, setIsSignupVerified] = useState(false);

  const reset = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setPasswordConfirm('');
    setError(null);
    setInfo(null);
  };

  const handleCompleteEmailSignup = useCallback(async () => {
    if (!pendingSignup) {
      setSignupEmail(null);
      setTab('login');
      setInfo('이메일 인증이 완료되었습니다. 로그인해 주세요.');
      return;
    }

    const token = verificationCode.trim().replace(/\s/g, '');
    if (!token) {
      setError('메일에 표시된 인증코드를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingSignup.email,
        token,
        type: 'signup',
      });
      if (verifyError) throw verifyError;
      await completeMyProfile(pendingSignup.username);
      sessionStorage.setItem(SIGNUP_VERIFIED_TOAST_KEY, '1');
      setPendingSignup(null);
      setSignupEmail(null);
      setVerificationCode('');
      setIsSignupVerified(false);
      onSuccess();
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, '인증코드가 올바르지 않거나 만료되었습니다. 다시 확인해 주세요.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [onSuccess, pendingSignup, supabase, verificationCode]);

  useEffect(() => {
    if (initialInfo) setInfo(initialInfo);
  }, [initialInfo]);

  const switchTab = (next: AuthTab) => {
    setTab(next);
    reset();
    onClearGoogleAuthError?.();
  };

  const handleGoogleLogin = async () => {
    setError(null);
    localStorage.setItem('google_oauth_intent', tab);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) {
      localStorage.removeItem('google_oauth_intent');
      setError(getAuthErrorMessage(authError, 'Google 로그인에 실패했습니다. 다시 시도해 주세요.'));
    }
  };

  const handleResendCode = async () => {
    if (!pendingSignup) return;
    setIsResending(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: pendingSignup.email,
      });
      if (resendError) throw resendError;
      setInfo('인증코드를 다시 보냈습니다. 메일함을 확인해 주세요.');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, '인증코드 재전송에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail) {
      setError('이메일을 입력해 주세요.');
      return;
    }
    if (tab === 'signup') {
      const usernameError = validateUsername(username);
      if (usernameError) {
        setError(usernameError);
        return;
      }
    }
    if (!trimmedPassword) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }
    if (tab === 'signup' && password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

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
        const { data: existing } = await supabase
          .from('users')
          .select('username')
          .ilike('username', trimmedUsername)
          .maybeSingle();
        if (existing) {
          setError('이미 사용 중인 유저네임입니다. 다른 유저네임을 사용해 주세요.');
          return;
        }

        const { data: signUpData, error: authError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: { username: trimmedUsername },
          },
        });
        if (authError) throw authError;
        if (signUpData.session?.access_token) {
          await completeMyProfile(trimmedUsername);
          onSuccess();
          return;
        }
        setPendingSignup({ email: trimmedEmail, password: trimmedPassword, username: trimmedUsername });
        setSignupEmail(trimmedEmail);
        setVerificationCode('');
        setIsSignupVerified(false);
        reset();
        setTab('login');
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {signupEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">DIGBOX</p>
            <h2 className="mt-3 text-lg font-bold text-white">
              {isSignupVerified ? '이메일 인증이 완료되었습니다' : '이메일 인증이 필요해요'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              {isSignupVerified ? (
                '가입이 완료되었습니다. DIGBOX로 이동합니다.'
              ) : (
                <>
                  <span className="font-semibold text-orange-400">{signupEmail}</span> 주소로 인증코드를 보냈습니다.
                  메일에 표시된 코드를 입력하면 바로 가입이 완료됩니다.
                </>
              )}
            </p>
            {!isSignupVerified && (
              <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-gray-400">
                이미 가입한 이메일이라면 인증코드가 새로 발송되지 않을 수 있습니다. 이 경우 로그인으로 이용해 주세요.
              </p>
            )}
            <input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') void handleCompleteEmailSignup(); }}
              disabled={isSignupVerified}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="인증코드 입력"
              className="mt-5 w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-center text-lg font-black tracking-[0.2em] text-white placeholder-gray-500 placeholder:text-sm placeholder:font-semibold placeholder:tracking-normal transition focus:border-orange-500 focus:outline-none"
            />
            {error && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            <button
              onClick={() => void handleCompleteEmailSignup()}
              disabled={isSubmitting || isSignupVerified}
              className="mt-6 w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
            >
              {isSignupVerified ? '완료되었습니다' : isSubmitting ? '확인 중...' : '가입 완료'}
            </button>
            <button
              type="button"
              onClick={() => void handleResendCode()}
              disabled={isResending || isSignupVerified}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-gray-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              {isResending ? '재전송 중...' : '인증코드 다시 보내기'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSignupEmail(null);
                setPendingSignup(null);
                setVerificationCode('');
                setIsSignupVerified(false);
                setError(null);
                setEmail(signupEmail || '');
                setPassword('');
                setTab('login');
              }}
              className="mt-2 w-full py-2 text-xs font-semibold text-gray-500 transition hover:text-gray-300"
            >
              로그인으로 이동
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto mt-16 w-full max-w-md px-4">
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="mb-8 flex overflow-hidden rounded-xl border border-white/10">
            <button
              onClick={() => switchTab('login')}
              className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-bold transition ${
                tab === 'login' ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <LogIn className="h-4 w-4" />
              로그인
            </button>
            <button
              onClick={() => switchTab('signup')}
              className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-bold transition ${
                tab === 'signup' ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              회원가입
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') void handleSubmit(); }}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 placeholder:text-sm transition focus:border-orange-500 focus:outline-none"
              />
            </div>

            {tab === 'signup' && (
              <div>
                <label className="mb-1.5 block text-xs text-gray-400">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void handleSubmit(); }}
                  placeholder="유저네임을 입력해 주세요"
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 placeholder:text-sm transition focus:border-orange-500 focus:outline-none"
                />
                <p className="mt-1.5 text-xs font-medium text-gray-500">
                  영문, 숫자, 밑줄(_)만 사용해 3-20자로 입력해 주세요.
                </p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs text-gray-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') void handleSubmit(); }}
                placeholder={tab === 'signup' ? '8자 이상 입력해 주세요' : '비밀번호 입력'}
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 placeholder:text-sm transition focus:border-orange-500 focus:outline-none"
              />
            </div>

            {tab === 'signup' && (
              <div>
                <label className="mb-1.5 block text-xs text-gray-400">Confirm Password</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void handleSubmit(); }}
                  placeholder="비밀번호를 다시 입력해 주세요"
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 placeholder:text-sm transition focus:border-orange-500 focus:outline-none"
                />
              </div>
            )}

            {error && !signupEmail && (
              <p className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg border border-green-500/30 bg-green-900/20 px-3 py-2 text-sm text-green-400">
                {info}
              </p>
            )}

            <button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className={`w-full rounded-xl py-3 text-sm font-bold transition ${
                isSubmitting
                  ? 'cursor-not-allowed bg-gray-700 text-gray-400'
                  : 'bg-orange-500 text-black hover:bg-orange-400'
              }`}
            >
              {isSubmitting ? (tab === 'login' ? '로그인 중...' : '가입 중...') : (tab === 'login' ? '로그인' : '회원가입')}
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
              <p className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {googleAuthError}
              </p>
            )}

            <button
              onClick={() => void handleGoogleLogin()}
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
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
