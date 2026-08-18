type RouteLoadingSkeletonProps = {
  eyebrow: string;
  title: string;
  variant: "outfits" | "taste";
};

export function RouteLoadingSkeleton({ eyebrow, title, variant }: RouteLoadingSkeletonProps) {
  return (
    <main aria-busy="true" aria-label={`${title} 불러오는 중`} className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)] text-white">
      <div className="mx-auto w-full max-w-[70rem] animate-pulse motion-reduce:animate-none">
        <p className="text-xs font-extrabold tracking-[0.14em] text-orange-300">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.03em]">{title}</h1>
        {variant === "outfits" ? <>
          <div className="mt-7 flex gap-2 border-b border-white/[0.1] pb-3">
            {Array.from({ length: 3 }).map((_, index) => <span key={index} className="h-9 w-20 rounded-xl bg-white/[0.07]" />)}
          </div>
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => <section key={index} className="rounded-2xl border border-white/[0.08] bg-[#111114] p-5"><div className="h-4 w-1/3 rounded bg-white/[0.1]" /><div className="mt-3 h-3 w-5/6 rounded bg-white/[0.07]" /><div className="mt-5 h-16 rounded-xl bg-white/[0.045]" /></section>)}
          </div>
        </> : <>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => <section key={index} className="h-28 rounded-2xl border border-white/[0.08] bg-[#111114]" />)}
          </div>
          <div className="mt-5 h-56 rounded-3xl border border-sky-300/10 bg-[#111114]" />
        </>}
      </div>
    </main>
  );
}
