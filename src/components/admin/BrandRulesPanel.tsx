import { useState, useMemo } from "react";
import type { BrandBackfillResult, BrandRule } from "../../types";

interface BrandRulesPanelProps {
  brandRules: BrandRule[];
  brandBackfillResult: BrandBackfillResult | null;
  isBrandRulesLoading: boolean;
  isBrandRulesSaving: boolean;
  isBrandBackfillRunning: boolean;
  hasUnsavedChanges: boolean;
  dbBrands: string[];
  onReload: () => void;
  onSave: () => void;
  onBackfill: () => void;
  onChange: (updater: (prev: BrandRule[]) => BrandRule[]) => void;
}

interface RuleGroup {
  canonicalBrand: string;
  matchValues: string[];
}

export function BrandRulesPanel({
  brandRules,
  brandBackfillResult,
  isBrandRulesLoading,
  isBrandRulesSaving,
  isBrandBackfillRunning,
  hasUnsavedChanges,
  dbBrands,
  onReload,
  onSave,
  onBackfill,
  onChange,
}: BrandRulesPanelProps) {
  const [editingGroups, setEditingGroups] = useState<Set<string>>(new Set());
  const [canonicalInputs, setCanonicalInputs] = useState<Record<string, string>>({});
  const [newMatchInputs, setNewMatchInputs] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const groups = useMemo<RuleGroup[]>(() => {
    const map = new Map<string, string[]>();
    for (const rule of brandRules) {
      const key = rule.canonicalBrand;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(rule.matchValue);
    }
    return Array.from(map.entries())
      .map(([canonicalBrand, matchValues]) => ({ canonicalBrand, matchValues }))
      .sort((a, b) => a.canonicalBrand.localeCompare(b.canonicalBrand));
  }, [brandRules]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.canonicalBrand.toLowerCase().includes(q) ||
        g.matchValues.some((mv) => mv.toLowerCase().includes(q))
    );
  }, [groups, search]);

  const allMappedBrands = useMemo(() => {
    const set = new Set<string>();
    for (const r of brandRules) {
      set.add(r.matchValue.replace(/\s+/g, ' ').trim());
      set.add(r.canonicalBrand.replace(/\s+/g, ' ').trim());
    }
    return set;
  }, [brandRules]);

  const isDisabled = isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning;

  const startEdit = (canonicalBrand: string) => {
    setEditingGroups((prev) => new Set(prev).add(canonicalBrand));
    setCanonicalInputs((prev) => ({ ...prev, [canonicalBrand]: canonicalBrand }));
  };

  const finishEdit = (canonicalBrand: string) => {
    const newName = (canonicalInputs[canonicalBrand] ?? canonicalBrand).trim();
    if (newName && newName !== canonicalBrand) {
      onChange((prev) => prev.map((r) => r.canonicalBrand === canonicalBrand ? { ...r, canonicalBrand: newName } : r));
    }
    setEditingGroups((prev) => { const next = new Set(prev); next.delete(canonicalBrand); return next; });
    setNewMatchInputs((prev) => { const next = { ...prev }; delete next[canonicalBrand]; return next; });
  };

  const removeMatchValue = (canonicalBrand: string, matchValue: string) => {
    onChange((prev) =>
      prev.filter((r) => !(r.canonicalBrand === canonicalBrand && r.matchValue === matchValue))
    );
  };

  const removeGroup = (canonicalBrand: string) => {
    if (!confirm(`"${canonicalBrand}" 룰을 삭제할까요? 매칭값 ${groups.find((g) => g.canonicalBrand === canonicalBrand)?.matchValues.length ?? 0}개가 모두 삭제됩니다.`)) return;
    onChange((prev) => prev.filter((r) => r.canonicalBrand !== canonicalBrand));
    setEditingGroups((prev) => { const next = new Set(prev); next.delete(canonicalBrand); return next; });
  };

  const addMatchValue = (canonicalBrand: string) => {
    const value = (newMatchInputs[canonicalBrand] ?? "").trim();
    if (!value) return;
    const alreadyExists = brandRules.some(
      (r) => r.canonicalBrand === canonicalBrand && r.matchValue.toLowerCase() === value.toLowerCase()
    );
    if (alreadyExists) return;
    onChange((prev) => [...prev, { matchType: "brand", matchValue: value, canonicalBrand }]);
    setNewMatchInputs((prev) => ({ ...prev, [canonicalBrand]: "" }));
  };

  return (
    <section className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">브랜드 대표명 규칙</h2>
          <p className="text-sm text-gray-400">총 {groups.length}개 브랜드 · {brandRules.length}개 매칭값</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onBackfill}
            disabled={isDisabled}
            className="rounded-lg border border-orange-500/40 px-4 py-2 text-sm text-orange-200 hover:bg-orange-900/30 disabled:cursor-not-allowed disabled:border-gray-800 disabled:bg-gray-800 disabled:text-gray-500"
          >
            {isBrandBackfillRunning ? "적용 중..." : "기존 상품 일괄 적용"}
          </button>
          <button
            onClick={() => {
              if (hasUnsavedChanges && !confirm("저장하지 않은 변경사항이 있습니다. 새로고침하면 사라집니다. 계속할까요?")) return;
              onReload();
            }}
            disabled={isDisabled}
            className="rounded-lg px-3 py-2 text-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500"
          >
            새로고침
          </button>
          <button
            onClick={onSave}
            disabled={isDisabled}
            className={`rounded-lg px-4 py-2 text-sm font-bold text-black hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400 ${hasUnsavedChanges ? "animate-pulse bg-orange-400" : "bg-orange-500"}`}
          >
            {isBrandRulesSaving ? "저장 중..." : hasUnsavedChanges ? "저장 필요!" : "규칙 저장"}
          </button>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="대표명 또는 매칭값 검색..."
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
      />

      <div className="space-y-2">
        {groups.length === 0 ? (
          <div className="rounded-xl border border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
            등록된 규칙이 없습니다.
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="rounded-xl border border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
            검색 결과 없음
          </div>
        ) : (
          filteredGroups.map((group, groupIdx) => {
            const isEditing = editingGroups.has(group.canonicalBrand);
            return (
              <div
                key={group.canonicalBrand}
                className={`rounded-xl border bg-gray-950/40 p-4 ${isEditing ? "border-orange-500/40" : "border-gray-800"}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={canonicalInputs[group.canonicalBrand] ?? group.canonicalBrand}
                      onChange={(e) =>
                        setCanonicalInputs((prev) => ({ ...prev, [group.canonicalBrand]: e.target.value }))
                      }
                      onKeyDown={(e) => { if (e.key === "Enter") finishEdit(group.canonicalBrand); }}
                      className="flex-1 rounded-lg border border-orange-500/60 bg-gray-800 px-3 py-1 text-sm font-semibold text-white focus:outline-none"
                    />
                  ) : (
                    <span className="flex-1 font-semibold text-white">{group.canonicalBrand}</span>
                  )}

                  {isEditing ? (
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        onClick={() => removeGroup(group.canonicalBrand)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        전체 삭제
                      </button>
                      <button
                        onClick={() => finishEdit(group.canonicalBrand)}
                        className="rounded-lg bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600"
                      >
                        완료
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(group.canonicalBrand)}
                      className="flex-shrink-0 rounded-lg border border-gray-700 px-3 py-1 text-xs text-gray-400 hover:border-gray-500 hover:text-white"
                    >
                      수정
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {group.matchValues.map((mv) => (
                    <span
                      key={mv}
                      className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-sm"
                    >
                      {mv}
                      {isEditing && (
                        <button
                          onClick={() => removeMatchValue(group.canonicalBrand, mv)}
                          className="text-gray-500 hover:text-red-400"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}

                  {isEditing && (
                    <div className="flex items-center gap-1">
                      <input
                        value={newMatchInputs[group.canonicalBrand] ?? ""}
                        onChange={(e) =>
                          setNewMatchInputs((prev) => ({ ...prev, [group.canonicalBrand]: e.target.value }))
                        }
                        onKeyDown={(e) => { if (e.key === "Enter") addMatchValue(group.canonicalBrand); }}
                        placeholder="매칭값 추가..."
                        list={`db-brands-${groupIdx}`}
                        className="w-36 rounded-full border border-dashed border-gray-600 bg-transparent px-3 py-1 text-sm text-gray-400 placeholder-gray-600 focus:border-gray-400 focus:outline-none"
                      />
                      <datalist id={`db-brands-${groupIdx}`}>
                        {dbBrands
                          .filter((b) => !allMappedBrands.has(b.replace(/\s+/g, ' ').trim()))
                          .map((b) => <option key={b} value={b} />)}
                      </datalist>
                      <button
                        onClick={() => addMatchValue(group.canonicalBrand)}
                        className="rounded-full border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-400 hover:text-white"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {brandBackfillResult ? (
        <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-sm">
          <div className="flex flex-wrap gap-3">
            <span className="text-green-400">업데이트: {brandBackfillResult.updatedCount}</span>
            <span className="text-gray-400">유지: {brandBackfillResult.skippedCount}</span>
            <span className="text-red-400">실패: {brandBackfillResult.failedCount}</span>
          </div>
          {brandBackfillResult.changes.length > 0 ? (
            <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-gray-800">
              <table className="w-full text-xs">
                <thead className="bg-gray-950/70 text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left">상품</th>
                    <th className="px-3 py-2 text-left">기존 브랜드</th>
                    <th className="px-3 py-2 text-left">대표 브랜드</th>
                    <th className="px-3 py-2 text-left">결과</th>
                  </tr>
                </thead>
                <tbody>
                  {brandBackfillResult.changes.slice(0, 50).map((change) => (
                    <tr key={change.id} className="border-t border-gray-800">
                      <td className="px-3 py-2">{change.name || change.id}</td>
                      <td className="px-3 py-2 text-gray-400">{change.previousBrand}</td>
                      <td className="px-3 py-2">{change.canonicalBrand}</td>
                      <td className={`px-3 py-2 ${change.updated ? "text-green-400" : "text-red-400"}`}>
                        {change.updated ? "적용됨" : change.error || "실패"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-3 text-xs text-gray-500">변경된 상품이 없습니다.</div>
          )}
        </div>
      ) : null}
    </section>
  );
}
