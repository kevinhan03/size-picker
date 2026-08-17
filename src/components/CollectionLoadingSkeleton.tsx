import { PageHeader } from "./PageHeader";

type CollectionLoadingSkeletonProps = {
  eyebrow: string;
  title: string;
};

/** Keeps collection pages visually stable while client-side auth and data finish loading. */
export function CollectionLoadingSkeleton({ eyebrow, title }: CollectionLoadingSkeletonProps) {
  return (
    <main
      aria-busy="true"
      aria-label={`${title} 불러오는 중`}
      className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)]"
    >
      <div className="mx-auto w-full max-w-[70rem] animate-pulse motion-reduce:animate-none">
        <PageHeader eyebrow={eyebrow} title={title} />
        <div className="mt-[var(--page-header-content-gap)] h-11 rounded-xl border border-white/[0.1] bg-white/[0.045]" />
        <div className="mb-5 flex h-11 border-b-2 border-white/[0.1]">
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={index} className="flex-1 border-r border-white/[0.08] last:border-r-0" />
          ))}
        </div>
        <div className="mb-3 h-4 w-28 rounded bg-white/[0.08]" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className="overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#111114] p-1.5 sm:p-3">
              <div className="h-44 rounded-[18px] bg-white/[0.055] sm:h-48" />
              <div className="space-y-2 px-2 pb-3 pt-3 sm:px-2 sm:pb-2">
                <div className="h-3 w-2/3 rounded bg-white/[0.08]" />
                <div className="h-4 w-5/6 rounded bg-white/[0.1]" />
                <div className="ml-auto mt-4 h-3 w-10 rounded bg-white/[0.06]" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
