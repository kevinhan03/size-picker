"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownAZ, Clock3, Search, X } from "lucide-react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

export interface BrandSummary {
  name: string;
  itemCount: number;
  latestCreatedAt: string | null;
}

interface BrandExplorerProps {
  open: boolean;
  onClose: () => void;
  brands: BrandSummary[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  onClearBrand: () => void;
}

type BrandSort = "recent" | "alphabetical";

export function BrandExplorer({ open, onClose, brands, selectedBrand, onSelectBrand, onClearBrand }: BrandExplorerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<BrandSort>("recent");
  useBodyScrollLock(panelRef, open);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSort("recent");
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" aria-label="브랜드 탐색 닫기" onClick={onClose} className="absolute inset-0 bg-black/75" />
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="brand-explorer-title" className="relative flex h-[min(82dvh,46rem)] max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#121214] shadow-[0_24px_70px_rgba(0,0,0,0.62)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 pb-4 pt-5 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">Brand discovery</p>
            <h2 id="brand-explorer-title" className="mt-1 text-lg font-black text-white">등록된 브랜드 {brands.length}개</h2>
            <p className="mt-1 text-xs text-gray-400">사용자들이 등록한 상품에서 발견한 브랜드예요.</p>
          </div>
          <button type="button" aria-label="닫기" onClick={onClose} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="브랜드명 검색" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-gray-500 focus:border-orange-400/70 focus:bg-white/[0.08] focus:ring-2 focus:ring-orange-500/15" />
          </label>
          <div className="mt-3 flex gap-2" role="group" aria-label="브랜드 정렬">
            <button type="button" onClick={() => setSort("recent")} className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-black transition ${sort === "recent" ? "bg-orange-500 text-black" : "border border-white/10 bg-white/[0.04] text-gray-400 hover:text-white"}`}>
              <Clock3 className="h-3.5 w-3.5" /> 최근 등록
            </button>
            <button type="button" onClick={() => setSort("alphabetical")} className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-black transition ${sort === "alphabetical" ? "bg-orange-500 text-black" : "border border-white/10 bg-white/[0.04] text-gray-400 hover:text-white"}`}>
              <ArrowDownAZ className="h-3.5 w-3.5" /> 가나다순
            </button>
          </div>
        </div>

        <div data-scroll-lock-allow className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:p-4">
          {visibleBrands.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {visibleBrands.map((brand) => {
                const selected = brand.name === selectedBrand;
                return (
                  <button key={brand.name} type="button" onClick={() => selected ? onClearBrand() : onSelectBrand(brand.name)} className={`flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/80 ${selected ? "border-orange-400/70 bg-orange-500/[0.12]" : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.07]"}`}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-white">{brand.name}</span>
                      <span className="mt-1 block text-[11px] font-semibold text-gray-500">등록 상품 {brand.itemCount}개</span>
                    </span>
                    {selected && <span className="text-[10px] font-black text-orange-300">선택 해제</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-48 items-center justify-center px-6 text-center text-sm text-gray-500">일치하는 등록 브랜드가 없어요.</div>
          )}
        </div>
      </section>
    </div>
  );
}
