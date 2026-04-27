"use client";

import { useState, useCallback, useMemo } from "react";
import { fetchBrands } from "../../api/admin";
import type { BrandInfo, BrandRule } from "../../types";

interface BrandUnifyPanelProps {
  existingRules: BrandRule[];
  onAddRules: (rules: BrandRule[]) => void;
  onBrandsLoaded?: (brands: string[]) => void;
}

export function BrandUnifyPanel({ existingRules, onAddRules, onBrandsLoaded }: BrandUnifyPanelProps) {
  const [brands, setBrands] = useState<BrandInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [canonical, setCanonical] = useState("");
  const [search, setSearch] = useState("");

  const mappedBrands = useMemo(() => {
    const set = new Set<string>();
    for (const rule of existingRules) {
      set.add(rule.matchValue.replace(/\s+/g, ' ').trim());
      set.add(rule.canonicalBrand.replace(/\s+/g, ' ').trim());
    }
    return set;
  }, [existingRules]);

  const existingCanonicals = useMemo(() => {
    const seen = new Set<string>();
    return existingRules
      .map((r) => r.canonicalBrand)
      .filter((c) => c && !seen.has(c) && seen.add(c));
  }, [existingRules]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBrands();
      setBrands(data);
      setLoaded(true);
      onBrandsLoaded?.(data.map((b) => b.brand));
    } catch (err) {
      setError(err instanceof Error ? err.message : "불러오기 실패");
    } finally {
      setIsLoading(false);
    }
  }, [onBrandsLoaded]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return brands.filter((b) => {
      if (mappedBrands.has(b.brand.replace(/\s+/g, ' ').trim())) return false;
      if (q && !b.brand.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [brands, search, mappedBrands]);

  const hiddenCount = brands.filter((b) => mappedBrands.has(b.brand.replace(/\s+/g, ' ').trim())).length;

  const toggleSelect = (brand: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map((b) => b.brand)));
  const clearAll = () => setSelected(new Set());

  const handleAddRules = () => {
    if (!canonical.trim() || selected.size === 0) return;
    const newRules: BrandRule[] = Array.from(selected).map((brand) => ({
      matchType: "brand",
      matchValue: brand,
      canonicalBrand: canonical.trim(),
    }));
    onAddRules(newRules);
    setSelected(new Set());
    setCanonical("");
  };

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">DB 브랜드 현황</h2>
            <p className="text-sm text-gray-400">DB에 등록된 브랜드명을 확인하고 룰을 일괄 생성합니다.</p>
          </div>
          <button
            onClick={() => void load()}
            disabled={isLoading}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500"
          >
            {isLoading ? "불러오는 중..." : "브랜드 불러오기"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">DB 브랜드 현황</h2>
          <p className="text-sm text-gray-400">
            미설정 {filtered.length}개 · {hiddenCount > 0 ? `룰 있음 ${hiddenCount}개 숨김 · ` : ""}{selected.size > 0 ? `${selected.size}개 선택됨` : "선택 없음"}
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={isLoading}
          className="rounded-lg px-3 py-2 text-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500"
        >
          {isLoading ? "새로고침 중..." : "새로고침"}
        </button>
      </div>

      {/* 검색 + 전체선택 */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="브랜드명 검색..."
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
        />
        <button
          onClick={selectAll}
          className="rounded-lg border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800"
        >
          전체선택
        </button>
        <button
          onClick={clearAll}
          className="rounded-lg border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800"
        >
          선택해제
        </button>
      </div>

      {/* 브랜드 목록 */}
      <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-800">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            {search ? "검색 결과 없음" : "브랜드가 없습니다."}
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = selected.has(item.brand);
            return (
              <label
                key={item.brand}
                className={`flex cursor-pointer items-center gap-3 border-b border-gray-800 px-4 py-3 last:border-0 hover:bg-gray-800/60 ${isSelected ? "bg-orange-900/20" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(item.brand)}
                  className="h-4 w-4 accent-orange-500"
                />
                <span className="flex-1 text-sm">{item.brand}</span>
                <span className="text-xs text-gray-500">{item.count}개</span>
              </label>
            );
          })
        )}
      </div>

      {/* 대표 브랜드명 입력 + 룰 추가 */}
      <div className="flex gap-2">
        <input
          value={canonical}
          onChange={(e) => setCanonical(e.target.value)}
          placeholder="대표 브랜드명 (예: 나이키(Nike))"
          list="canonical-brands-list"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
          onKeyDown={(e) => { if (e.key === "Enter") handleAddRules(); }}
        />
        <datalist id="canonical-brands-list">
          {existingCanonicals.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <button
          onClick={handleAddRules}
          disabled={selected.size === 0 || !canonical.trim()}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-black hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
        >
          룰 추가 ({selected.size})
        </button>
      </div>
      <p className="text-xs text-gray-500">
        선택한 브랜드명마다 <code>brand</code> 타입 룰이 생성됩니다. 추가 후 위에서 저장하세요.
      </p>
    </section>
  );
}
