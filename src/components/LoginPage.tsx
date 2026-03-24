import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LogIn, UserPlus } from 'lucide-react';

type AuthTab = 'login' | 'signup';

interface LoginPageProps {
  supabase: SupabaseClient;
  onSuccess: () => void;
}

export const LoginPage = ({ supabase, onSuccess }: LoginPageProps) => {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const { error: authError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: { data: { username: username.trim() } },
        });
        if (authError) throw authError;
        setInfo('가입 확인 이메일을 발송했습니다. 이메일을 확인해 주세요.');
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
        </div>
      </div>
    </div>
  );
};
