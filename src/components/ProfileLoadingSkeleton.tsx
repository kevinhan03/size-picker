import type { Locale } from "../i18n/locale";

/** Keeps the dynamic profile route visually stable while profile data streams. */
export function ProfileLoadingSkeleton({ locale = "ko" }: { locale?: Locale }) {
  const loadingLabel = locale === "en" ? "Loading profile" : "프로필 불러오는 중";

  return (
    <main
      aria-busy="true"
      aria-label={loadingLabel}
      className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white"
    >
      <div className="mx-auto w-full max-w-[66rem] animate-pulse motion-reduce:animate-none">
        <header className="flex flex-wrap items-center justify-between gap-6 pb-8">
          <div className="flex min-w-0 items-center gap-5">
            <span className="h-[5.5rem] w-[5.5rem] shrink-0 rounded-full border border-white/[0.08] bg-white/[0.06]" />
            <div className="min-w-0 space-y-3">
              <div className="h-7 w-32 rounded bg-white/[0.1]" />
              <div className="flex gap-3">
                <span className="h-4 w-14 rounded bg-white/[0.07]" />
                <span className="h-4 w-14 rounded bg-white/[0.07]" />
                <span className="h-4 w-14 rounded bg-white/[0.07]" />
              </div>
              <div className="h-4 w-52 max-w-full rounded bg-white/[0.07]" />
            </div>
          </div>
          <span className="h-10 w-10 rounded-lg bg-white/[0.06]" />
        </header>

        <div className="mb-8 grid grid-cols-2 gap-2">
          <span className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.05]" />
          <span className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.05]" />
        </div>

        <section className="border-y border-white/[0.08] py-6">
          <div className="flex items-center justify-between gap-4">
            <span className="h-4 w-20 rounded bg-white/[0.1]" />
            <span className="h-3 w-24 rounded bg-white/[0.06]" />
          </div>
          <div className="mt-5 h-7 w-3/4 max-w-[34rem] rounded bg-white/[0.09]" />
          <div className="mt-3 h-5 w-2/3 max-w-[28rem] rounded bg-white/[0.06]" />
          <div className="mt-5 flex gap-2">
            <span className="h-7 w-16 rounded-full bg-white/[0.07]" />
            <span className="h-7 w-20 rounded-full bg-white/[0.07]" />
            <span className="h-7 w-16 rounded-full bg-white/[0.07]" />
          </div>
        </section>

        <div className="grid grid-cols-2 border-b border-white/[0.08]">
          <span className="h-[3.25rem] border-b-2 border-white/[0.16]" />
          <span className="h-[3.25rem]" />
        </div>
        <div className="h-48" />
      </div>
    </main>
  );
}
