"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogOut } from "lucide-react";
import { UsernameSetupForm } from "../UsernameSetupForm";
import { useAuthContext } from "../../contexts/AuthContext";
import { clearAuthContinuation, readAuthContinuation } from "../../utils/authNavigation";
import { readGuestDigbox, requestGuestDigboxImport } from "../../utils/guestDigbox";
import { captureEvent } from "../../utils/analytics";
import { useLocaleContext } from "../../contexts/LocaleContext";

export function UsernameOnboardingPageClient() {
  const { t } = useLocaleContext();
  const router = useRouter();
  const auth = useAuthContext();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    captureEvent("username_onboarding_viewed", { method: "google" });
    if (readGuestDigbox().length) requestGuestDigboxImport();
  }, []);

  useEffect(() => {
    if (auth.isAuthLoading || !auth.authUser || !auth.dbUsername || !completed) return;
    const timer = window.setTimeout(() => {
      const continuation = readAuthContinuation();
      clearAuthContinuation();
      router.replace(continuation?.returnTo || "/");
    }, 850);
    return () => window.clearTimeout(timer);
  }, [auth.authUser, auth.dbUsername, auth.isAuthLoading, completed, router]);

  useEffect(() => {
    if (!auth.isAuthLoading && !auth.authUser) router.replace("/login");
    if (!auth.isAuthLoading && auth.dbUsername && !completed) router.replace("/");
  }, [auth.authUser, auth.dbUsername, auth.isAuthLoading, completed, router]);

  if (auth.isAuthLoading || !auth.authUser || (auth.dbUsername && !completed)) return <main className="min-h-screen bg-black" />;

  if (completed) {
    return <main className="flex min-h-[100dvh] items-start justify-center overflow-y-auto bg-black px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(4rem+env(safe-area-inset-top)+1.5rem)] text-white"><section className="w-full max-w-sm rounded-3xl border border-emerald-400/20 bg-[#171719] p-7 text-center shadow-[0_24px_64px_rgba(0,0,0,0.55)]"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" /><h1 className="mt-4 text-xl font-black">{t("onboarding.complete")}</h1><p className="mt-2 text-sm font-semibold text-gray-400">{t("onboarding.redirecting")}</p></section></main>;
  }

  return (
    <main className="flex min-h-[100dvh] items-start justify-center overflow-y-auto bg-black px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(4rem+env(safe-area-inset-top)+1.5rem)] text-white sm:pt-[calc(4rem+env(safe-area-inset-top)+2rem)]">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#171719] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:p-8">
        <p className="text-xs font-black tracking-[0.12em] text-orange-300">{t("onboarding.finalStep")}</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight">{t("onboarding.title")}</h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-400">{t("onboarding.description")}</p>
        <div className="mt-6">
          <UsernameSetupForm
            initialUsername={auth.pendingUsername}
            submitLabel={t("onboarding.submit")}
            analyticsSource="onboarding"
            onUsernameChange={auth.setPendingUsername}
            onSubmit={async (username) => {
              try {
                await auth.submitUsername(username);
                captureEvent("username_onboarding_completed", { method: "google" });
                setCompleted(true);
              } catch (error) {
                captureEvent("username_onboarding_error", { method: "google" });
                throw error;
              }
            }}
          />
        </div>
        {auth.usernameError && <p role="alert" className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200">{auth.usernameError}</p>}
        <div className="mt-5 flex items-center justify-between gap-3 text-xs font-bold">
          <button type="button" onClick={() => void auth.abandonIncompleteGoogleSignup("/")} className="rounded-lg px-2 py-2 text-gray-400 transition hover:text-white active:scale-[0.97] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60">{t("mypage.logout")}</button>
          <button type="button" onClick={() => void auth.abandonIncompleteGoogleSignup("/login?intent=signup")} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-orange-200 transition hover:text-orange-100 active:scale-[0.97] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"><LogOut className="h-3.5 w-3.5" />{t("onboarding.otherGoogle")}</button>
        </div>
      </section>
    </main>
  );
}
