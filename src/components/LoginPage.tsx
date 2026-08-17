import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { completeMyProfile } from '../api';
import { getAuthErrorMessage } from '../utils/authMessage';
import { validateUsername } from '../utils/username';
import { captureEvent } from '../utils/analytics';
import { readAuthContinuation, saveAuthContinuation } from '../utils/authNavigation';
import { readGuestDigbox, requestGuestDigboxImport } from '../utils/guestDigbox';
import { useLocaleContext } from '../contexts/LocaleContext';
import type { MessageKey } from '../i18n/messages';

type AuthTab = 'login' | 'signup';

interface LoginPageProps {
  onSuccess: () => void;
  initialInfo?: string | null;
  googleAuthError?: string | null;
  onClearGoogleAuthError?: () => void;
  initialTab?: AuthTab;
  isGuestDigboxSignup?: boolean;
  isUnregisteredGoogle?: boolean;
}

type PendingSignup = {
  email: string;
  username: string;
} | null;

const SIGNUP_VERIFIED_TOAST_KEY = 'digbox_signup_verified_toast';

const checkSignupUsernameAvailability = async (username: string, t: (key: MessageKey) => string) => {
  const response = await fetch(`/api/auth/username/availability?username=${encodeURIComponent(username)}`);
  const payload = await response.json() as { ok?: boolean; data?: { available?: boolean; reason?: string | null }; error?: string };
  if (!response.ok || !payload.ok) throw new Error(payload.error || t("auth.usernameCheckError"));
  return { available: Boolean(payload.data?.available), reason: payload.data?.reason || null };
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

export const LoginPage = ({
  onSuccess,
  initialInfo = null,
  googleAuthError,
  onClearGoogleAuthError,
  initialTab = 'login',
  isGuestDigboxSignup = false,
  isUnregisteredGoogle = false,
}: LoginPageProps) => {
  const { t } = useLocaleContext();
  const tRef = useRef(t);
  tRef.current = t;
  const [tab, setTab] = useState<AuthTab>(initialTab);
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
  const verificationCodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!signupEmail) return;
    const frame = window.requestAnimationFrame(() => verificationCodeInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [signupEmail]);

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
      setInfo(tRef.current("auth.verificationComplete"));
      return;
    }

    const token = verificationCode.trim().replace(/\s/g, '');
    if (!token) {
      setError(tRef.current("auth.enterCode"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingSignup.email, token, username: pendingSignup.username }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Verification failed');
      if (readGuestDigbox().length) requestGuestDigboxImport();
      sessionStorage.setItem(SIGNUP_VERIFIED_TOAST_KEY, '1');
      setPendingSignup(null);
      setSignupEmail(null);
      setVerificationCode('');
      setIsSignupVerified(false);
      onSuccess();
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, tRef.current("auth.codeInvalidOrExpired")));
    } finally {
      setIsSubmitting(false);
    }
  }, [onSuccess, pendingSignup, verificationCode]);

  useEffect(() => {
    if (initialInfo) setInfo(initialInfo);
  }, [initialInfo]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const switchTab = (next: AuthTab) => {
    setTab(next);
    reset();
    onClearGoogleAuthError?.();
  };

  const handleGoogleLogin = async (intent: AuthTab = tab) => {
    setError(null);
    const continuation = readAuthContinuation();
    if (continuation) saveAuthContinuation({ ...continuation, intent, method: 'google' });
    captureEvent('auth_started', { mode: intent, method: 'google', source: continuation?.source || 'direct', stage: 'submit' });
    window.location.assign(`/api/auth/oauth/google?intent=${encodeURIComponent(intent)}`);
  };

  const handleResendCode = async () => {
    if (!pendingSignup) return;
    setIsResending(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/resend', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: pendingSignup.email }),
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Resend failed');
      setInfo(t("auth.codeResent"));
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, t("auth.resendFailed")));
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail) {
      setError(t("auth.enterEmail"));
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
      setError(t("auth.enterPassword"));
      return;
    }
    if (tab === 'signup' && password !== passwordConfirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setInfo(null);

    const continuation = readAuthContinuation();
    if (continuation) saveAuthContinuation({ ...continuation, intent: tab, method: 'email' });
    captureEvent('auth_started', { mode: tab, method: 'email', source: continuation?.source || 'direct', stage: 'submit' });

    try {
      if (tab === 'login') {
        const response = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
        });
        const payload = await response.json() as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Login failed');
        onSuccess();
      } else {
        const trimmedUsername = username.trim();
        const { available, reason } = await checkSignupUsernameAvailability(trimmedUsername, t);
        if (!available) {
          setError(reason || t("auth.usernameTaken"));
          return;
        }

        const response = await fetch('/api/auth/signup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword, username: trimmedUsername }),
        });
        const payload = await response.json() as { ok?: boolean; data?: { requiresVerification?: boolean }; error?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Signup failed');
        if (!payload.data?.requiresVerification) {
          if (readGuestDigbox().length) requestGuestDigboxImport();
          await completeMyProfile(trimmedUsername);
          onSuccess();
          return;
        }
        setPendingSignup({ email: trimmedEmail, username: trimmedUsername });
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
          <div role="dialog" aria-modal="true" aria-labelledby="email-verification-title" className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1a] p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">DIGBOX</p>
            <h2 id="email-verification-title" className="mt-3 text-lg font-bold text-white">
              {isSignupVerified ? t("auth.emailVerified") : t("auth.emailVerificationRequired")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              {isSignupVerified ? (
                t("auth.signupComplete")
              ) : (
                t("auth.codeSent", { email: signupEmail })
              )}
            </p>
            {!isSignupVerified && (
              <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-gray-400">
                {t("auth.codeAlreadyRegistered")}
              </p>
            )}
            <input
              ref={verificationCodeInputRef}
              aria-label={t("auth.verificationCode")}
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') void handleCompleteEmailSignup(); }}
              disabled={isSignupVerified}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t("auth.verificationCode")}
              className="mt-5 w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-center text-lg font-black tracking-[0.2em] text-white placeholder-gray-500 placeholder:text-sm placeholder:font-semibold placeholder:tracking-normal transition-[border-color,box-shadow] duration-150 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus-visible:ring-orange-400 motion-reduce:transition-none"
            />
            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            <button
              onClick={() => void handleCompleteEmailSignup()}
              disabled={isSubmitting || isSignupVerified}
              className="mt-6 w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-black transition-[background-color,transform,box-shadow] duration-150 hover:bg-orange-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400 disabled:active:scale-100 motion-reduce:transform-none motion-reduce:transition-none"
            >
              {isSignupVerified ? t("auth.complete") : isSubmitting ? t("auth.checking") : t("auth.completeSignup")}
            </button>
            <button
              type="button"
              onClick={() => void handleResendCode()}
              disabled={isResending || isSignupVerified}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-gray-300 transition-[background-color,color,transform] duration-150 hover:bg-white/[0.08] hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] disabled:active:scale-100 motion-reduce:transform-none motion-reduce:transition-none"
            >
              {isResending ? t("auth.resending") : t("auth.resendCode")}
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
              className="mt-2 w-full rounded-lg py-2 text-xs font-semibold text-gray-500 transition-[color,transform] duration-150 hover:text-gray-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:active:scale-100 motion-reduce:transform-none motion-reduce:transition-none"
            >
              {t("auth.goToLogin")}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto mt-4 w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-[#151518] p-6 shadow-[0_12px_32px_rgba(0,0,0,0.36)] sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-[-0.02em] text-white">
              {tab === 'login' ? t("auth.welcomeBack") : t("auth.createAccount")}
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-gray-300">
              {tab === 'login' ? t("auth.loginDescription") : t("auth.signupDescription")}
            </p>
          </div>

          <div className="mb-6 flex overflow-hidden rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => switchTab('login')}
              aria-pressed={tab === 'login'}
              className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.98] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 motion-reduce:transform-none motion-reduce:transition-none ${
                tab === 'login' ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <LogIn className="h-4 w-4" />
              {t("auth.login")}
            </button>
            <button
              type="button"
              onClick={() => switchTab('signup')}
              aria-pressed={tab === 'signup'}
              className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.98] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 motion-reduce:transform-none motion-reduce:transition-none ${
                tab === 'signup' ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              {t("auth.signup")}
            </button>
          </div>

          <div className="space-y-4">
            {tab === 'login' && isUnregisteredGoogle && (
              <section role="alert" aria-labelledby="unregistered-google-title" className="rounded-2xl border border-orange-400/30 bg-orange-400/[0.08] p-4">
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-400/15 text-orange-300"><AlertCircle className="h-4.5 w-4.5" /></span>
                  <div>
                    <h2 id="unregistered-google-title" className="text-sm font-black text-orange-100">{t("auth.unregisteredGoogleTitle")}</h2>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-300">{t("auth.unregisteredGoogleDescription")}</p>
                  </div>
                </div>
              </section>
            )}
            {tab === 'signup' && isGuestDigboxSignup && (
              <div className="rounded-xl border border-orange-400/25 bg-orange-400/[0.08] px-4 py-3">
                <p className="text-sm font-black text-orange-300">{t("auth.guestSavedTitle")}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-300">
                  {t("auth.guestSavedDescription")}
                </p>
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-gray-300">{t("auth.email")}</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') void handleSubmit(); }}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-base text-white placeholder-gray-500 transition-[border-color,box-shadow] duration-150 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus-visible:ring-orange-400 motion-reduce:transition-none"
              />
            </div>

            {tab === 'signup' && (
              <div>
                <label htmlFor="auth-username" className="mb-1.5 block text-sm font-medium text-gray-300">{t("auth.username")}</label>
                <input
                  id="auth-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void handleSubmit(); }}
                  placeholder={t("auth.usernamePlaceholder")}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-base text-white placeholder-gray-500 transition-[border-color,box-shadow] duration-150 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus-visible:ring-orange-400 motion-reduce:transition-none"
                />
                <p className="mt-1.5 text-xs font-medium text-gray-500">
                  {t("auth.usernameHint")}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-medium text-gray-300">{t("auth.password")}</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') void handleSubmit(); }}
                placeholder={tab === 'signup' ? t("auth.passwordSignupPlaceholder") : t("auth.passwordPlaceholder")}
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-base text-white placeholder-gray-500 transition-[border-color,box-shadow] duration-150 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus-visible:ring-orange-400 motion-reduce:transition-none"
              />
            </div>

            {tab === 'signup' && (
              <div>
                <label htmlFor="auth-password-confirm" className="mb-1.5 block text-sm font-medium text-gray-300">{t("auth.confirmPassword")}</label>
                <input
                  id="auth-password-confirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void handleSubmit(); }}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-base text-white placeholder-gray-500 transition-[border-color,box-shadow] duration-150 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus-visible:ring-orange-400 motion-reduce:transition-none"
                />
              </div>
            )}

            {error && !signupEmail && (
              <p role="alert" className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="rounded-lg border border-green-500/30 bg-green-900/20 px-3 py-2 text-sm text-green-400">
                {info}
              </p>
            )}

            <button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className={`w-full rounded-xl py-3 text-sm font-bold transition-[background-color,color,transform,box-shadow] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151518] disabled:active:scale-100 motion-reduce:transform-none motion-reduce:transition-none ${
                isSubmitting
                  ? 'cursor-not-allowed bg-gray-700 text-gray-400'
                  : 'bg-orange-500 text-black hover:bg-orange-400'
              }`}
            >
              {isSubmitting ? (tab === 'login' ? t("auth.loggingIn") : t("auth.signingUp")) : (tab === 'login' ? t("auth.login") : t("auth.signup"))}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#1a1a1a] px-3 text-xs text-gray-500">{t("auth.or")}</span>
              </div>
            </div>

            {googleAuthError && (
              <p role="alert" className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {googleAuthError}
              </p>
            )}

            <button
              onClick={() => void handleGoogleLogin()}
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-gray-900 transition-[background-color,transform,box-shadow] duration-150 hover:bg-gray-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151518] motion-reduce:transform-none motion-reduce:transition-none"
            >
              <GoogleIcon />
              {tab === 'login' ? t("auth.loginWithGoogle") : t("auth.signupWithGoogle")}
            </button>

            {tab === 'signup' && (
              <p className="text-center text-[11px] font-medium leading-5 text-gray-500">
                {t("auth.termsPrefix")}{' '}
                <Link href="/terms" className="font-bold text-gray-300 underline underline-offset-2 hover:text-orange-300">
                  {t("footer.terms")}
                </Link>
                {' '}{t("auth.termsMiddle")}{' '}
                <Link href="/privacy" className="font-bold text-gray-300 underline underline-offset-2 hover:text-orange-300">
                  {t("footer.privacy")}
                </Link>
                {t("auth.termsSuffix")}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
