type OutfitLoadingVariant = "list" | "request" | "detail";

interface OutfitLoadingStateProps {
  variant: OutfitLoadingVariant;
  title: string;
  description: string;
}

const shimmer = "rounded bg-white/[0.07]";

export function OutfitLoadingState({ variant, title, description }: OutfitLoadingStateProps) {
  return (
    <main aria-busy="true" aria-live="polite" className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white lg:pt-24">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-7">
          <p className="text-lg font-black tracking-[-0.02em]">{title}</p>
          <p className="mt-1 text-sm text-white/45">{description}</p>
        </div>
        <div className="animate-pulse motion-reduce:animate-none">
          {variant === "list" && <OutfitListSkeleton />}
          {variant === "request" && <OutfitRequestFormSkeleton />}
          {variant === "detail" && <OutfitDetailSkeleton />}
        </div>
      </div>
    </main>
  );
}

function OutfitListSkeleton() {
  return (
    <>
      <div className="flex gap-2 border-b border-white/[0.08] pb-3">
        {["one", "two", "three"].map((key) => <span key={key} className="h-10 w-20 rounded-full bg-white/[0.06]" />)}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {["one", "two", "three", "four"].map((key) => (
          <section key={key} className="rounded-3xl border border-white/[0.08] bg-[#111114] p-5">
            <div className={`${shimmer} h-3 w-24`} />
            <div className={`${shimmer} mt-4 h-5 w-3/4`} />
            <div className="mt-6 flex items-end justify-between"><div className={`${shimmer} h-3 w-20`} /><div className={`${shimmer} h-9 w-28 rounded-xl`} /></div>
          </section>
        ))}
      </div>
    </>
  );
}

function OutfitRequestFormSkeleton() {
  return (
    <>
      <section className="rounded-3xl border border-white/[0.1] bg-[#111114] p-5 sm:p-7">
        <div className="flex items-center justify-between"><span className={`${shimmer} h-10 w-10 rounded-full`} /><span className={`${shimmer} h-4 w-28`} /><span className={`${shimmer} h-3 w-10`} /></div>
        <div className="mt-4 h-48 rounded-2xl border border-white/[0.08] bg-black/25" />
        <div className={`${shimmer} mt-3 h-3 w-36`} />
      </section>
      <section className="mt-8">
        <div className={`${shimmer} h-6 w-32`} />
        <div className={`${shimmer} mt-2 h-4 w-64`} />
        <div className="mt-4 flex justify-center gap-2">{["one", "two", "three", "four", "five"].map((key) => <span key={key} className="h-10 w-16 rounded-full bg-white/[0.06]" />)}</div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{["one", "two", "three", "four", "five"].map((key) => <div key={key} className="aspect-[3/4] rounded-2xl border border-white/[0.08] bg-[#111114]" />)}</div>
      </section>
    </>
  );
}

function OutfitDetailSkeleton() {
  return (
    <>
      <section className="rounded-3xl border border-white/[0.1] bg-[#111114] p-5 sm:p-7">
        <div className="flex justify-between"><span className={`${shimmer} h-4 w-24`} /><span className={`${shimmer} h-8 w-16 rounded-full`} /></div>
        <div className={`${shimmer} mt-6 h-8 w-3/5`} />
        <div className="mt-7 border-t border-white/[0.08] pt-5"><div className={`${shimmer} h-3 w-24`} /><div className="mt-4 flex gap-3">{["one", "two"].map((key) => <div key={key} className="h-40 w-32 rounded-xl bg-white/[0.06]" />)}</div></div>
      </section>
      <section className="mt-10"><div className={`${shimmer} h-6 w-48`} /><div className="mt-4 flex justify-center gap-2">{["one", "two", "three", "four", "five"].map((key) => <span key={key} className="h-10 w-16 rounded-full bg-white/[0.06]" />)}</div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{["one", "two", "three", "four", "five"].map((key) => <div key={key} className="aspect-[3/4] rounded-2xl border border-white/[0.08] bg-[#111114]" />)}</div></section>
    </>
  );
}
