"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownAZ, Check, Clock3, Search, X } from "lucide-react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { usePresence } from "../hooks/usePresence";

export interface BrandSummary {
  name: string;
  itemCount: number;
  latestCreatedAt: string | null;
}

interface BrandExplorerProps {
  onClose: () => void;
  brands: BrandSummary[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  onClearBrand: () => void;
}

type BrandSort = "recent" | "alphabetical";

export function BrandExplorer({ onClose, brands, selectedBrand, onSelectBrand, onClearBrand }: BrandExplorerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<BrandSort>("recent");
  const presence = usePresence(true);
  useBodyScrollLock(panelRef, presence.isMounted);

  const close = () => presence.requestClose(onClose);

  useEffect(() => {
    setQuery("");
    setSort("recent");
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!presence.isMounted) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") presence.requestClose(onClose);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, presence]);

  const visibleBrands = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return brands
      .filter((brand) => !normalizedQuery || brand.name.toLocaleLowerCase().includes(normalizedQuery))
      .sort((a, b) => {
        if (sort === "alphabetical") return a.name.localeCompare(b.name, "ko");
        const aTime = a.latestCreatedAt ? Date.parse(a.latestCreatedAt) : 0;
        const bTime = b.latestCreatedAt ? Date.parse(b.latestCreatedAt) : 0;
        return bTime - aTime || a.name.localeCompare(b.name, "ko");
      });
  }, [brands, query, sort]);

  if (!presence.isMounted) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={close}
        className="ui-layer-scrim absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        data-visible={presence.isVisible}
      />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-explorer-title"
        className="ui-layer-modal ui-floating-surface relative flex h-[min(82dvh,46rem)] max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/[0.12] bg-[#1c1c1f] shadow-[0_24px_60px_rgba(0,0,0,0.38)]"
        data-visible={presence.isVisible}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 pb-4 pt-5 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 id="brand-explorer-title" className="text-xl font-black tracking-[-0.03em] text-white">브랜드 둘러보기</h2>
              <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-gray-400">총 {brands.length}개</span>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-gray-400">등록된 상품에서 발견한 브랜드를 빠르게 찾아보세요.</p>
          </div>
          <button type="button" aria-label="닫기" onClick={close} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-[background-color,color,transform] hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/[0.08] bg-black/20 px-5 py-4 sm:px-6">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="브랜드명 검색" className="h-11 w-full rounded-xl border border-white/[0.1] bg-[#18181b] pl-10 pr-4 text-sm font-semibold text-white outline-none transition-[background-color,border-color,box-shadow] placeholder:text-gray-500 focus:border-orange-400/70 focus:bg-[#1b1b1f] focus:ring-2 focus:ring-orange-500/15" />
          </label>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[11px] font-semibold text-gray-500">정렬</span>
            <div className="inline-flex rounded-xl bg-white/[0.035] p-1" role="group" aria-label="브랜드 정렬">
            <button type="button" aria-pressed={sort === "recent"} onClick={() => setSort("recent")} className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-[background-color,color,box-shadow] ${sort === "recent" ? "bg-[#27272b] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.24)]" : "text-gray-500 hover:bg-white/[0.05] hover:text-gray-200"}`}>
              <Clock3 className="h-3.5 w-3.5" /> 최근 등록
            </button>
            <button type="button" aria-pressed={sort === "alphabetical"} onClick={() => setSort("alphabetical")} className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-[background-color,color,box-shadow] ${sort === "alphabetical" ? "bg-[#27272b] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.24)]" : "text-gray-500 hover:bg-white/[0.05] hover:text-gray-200"}`}>
              <ArrowDownAZ className="h-3.5 w-3.5" /> 가나다순
            </button>
            </div>
          </div>
        </div>

        <div data-scroll-lock-allow className="min-h-0 flex-1 overflow-y-auto p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4">
          {visibleBrands.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {visibleBrands.map((brand) => {
                const selected = brand.name === selectedBrand;
                return (
                  <button key={brand.name} type="button" onClick={() => selected ? onClearBrand() : onSelectBrand(brand.name)} aria-pressed={selected} className={`brand-explorer-tile ui-card flex min-h-16 items-center gap-3 rounded-2xl px-4 py-3 text-left transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${selected ? "border-orange-400/70 bg-orange-500/[0.1]" : "hover:border-white/[0.18] hover:bg-[#1a1a1e]"}`}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white">{brand.name}</span>
                      <span className="mt-1 block text-[11px] font-medium text-gray-500">등록 상품 {brand.itemCount}개</span>
                    </span>
                    {selected && <Check className="h-4 w-4 flex-shrink-0 text-orange-300" aria-label="선택됨" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
              <p className="text-sm font-semibold text-gray-300">일치하는 브랜드가 없어요.</p>
              <p className="mt-1 text-xs text-gray-500">다른 이름으로 다시 검색해 보세요.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
