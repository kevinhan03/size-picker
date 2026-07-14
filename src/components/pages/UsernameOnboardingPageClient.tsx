"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../contexts/AuthContext";
import { clearAuthContinuation, readAuthContinuation } from "../../utils/authNavigation";
import { readGuestDigbox, requestGuestDigboxImport } from "../../utils/guestDigbox";

export function UsernameOnboardingPageClient() {
  const router = useRouter();
  const auth = useAuthContext();

  useEffect(() => {
    if (readGuestDigbox().length) requestGuestDigboxImport();
  }, []);

  useEffect(() => {
    if (auth.isAuthLoading) return;
    if (!auth.authUser) {
      router.replace('/login');
      return;
    }
    if (!auth.dbUsername) return;
    const continuation = readAuthContinuation();
    clearAuthContinuation();
    router.replace(continuation?.returnTo || '/');
  }, [auth.authUser, auth.dbUsername, auth.isAuthLoading, router]);

  if (auth.isAuthLoading || !auth.authUser || auth.dbUsername) {
    return <main className="min-h-screen bg-black" />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <section className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1a1a1d] p-7 shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">DIGBOX</p>
        <h1 className="mt-3 text-2xl font-black">닉네임을 설정해 주세요</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">회원가입을 마무리하고 내 DIGBOX를 시작해 보세요.</p>
        <input
          type="text"
          value={auth.pendingUsername}
          onChange={(event) => auth.setPendingUsername(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void auth.submitUsername(() => {});
          }}
          autoFocus
          placeholder="닉네임 입력"
          className="mt-6 w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 transition focus:border-orange-500 focus:outline-none"
        />
        <p className="mt-2 text-xs text-gray-500">영문, 숫자, 밑줄(_), 마침표(.)로 3~20자</p>
        {auth.usernameError && <p className="mt-4 rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-300">{auth.usernameError}</p>}
        <button
          type="button"
          onClick={() => void auth.submitUsername(() => {})}
          disabled={auth.isSubmittingUsername}
          className="mt-5 w-full rounded-xl bg-orange-500 py-3 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
        >
          {auth.isSubmittingUsername ? '저장 중...' : '가입 완료'}
        </button>
      </section>
    </main>
  );
}
