import type { BrandBackfillResult, BrandRule } from "../../types";

interface BrandRulesPanelProps {
  brandRules: BrandRule[];
  brandBackfillResult: BrandBackfillResult | null;
  isBrandRulesLoading: boolean;
  isBrandRulesSaving: boolean;
  isBrandBackfillRunning: boolean;
  onReload: () => void;
  onSave: () => void;
  onBackfill: () => void;
  onChange: (updater: (prev: BrandRule[]) => BrandRule[]) => void;
}

export function BrandRulesPanel({
  brandRules,
  brandBackfillResult,
  isBrandRulesLoading,
  isBrandRulesSaving,
  isBrandBackfillRunning,
  onReload,
  onSave,
  onBackfill,
  onChange,
}: BrandRulesPanelProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">브랜드 대표명 규칙</h2>
          <p className="text-sm text-gray-400">추출 브랜드명과 기존 브랜드명을 하나의 대표명으로 정리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onBackfill}
            disabled={isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning}
            className="rounded-lg border border-orange-500/40 px-4 py-2 text-sm text-orange-200 hover:bg-orange-900/30 disabled:cursor-not-allowed disabled:border-gray-800 disabled:bg-gray-800 disabled:text-gray-500"
          >
            {isBrandBackfillRunning ? "적용 중..." : "기존 상품 일괄 적용"}
          </button>
          <button
            onClick={onReload}
            disabled={isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning}
            className="rounded-lg px-3 py-2 text-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500"
          >
            새로고침
          </button>
          <button
            onClick={onSave}
            disabled={isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-black hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
          >
            {isBrandRulesSaving ? "저장 중..." : "규칙 저장"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="border-b border-gray-800 bg-gray-950/60 text-gray-300">
            <tr>
              <th className="px-3 py-3 text-left">매칭 타입</th>
              <th className="px-3 py-3 text-left">매칭 값</th>
              <th className="px-3 py-3 text-left">대표 브랜드명</th>
              <th className="px-3 py-3 text-left">동작</th>
            </tr>
          </thead>
          <tbody>
            {brandRules.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">등록된 규칙이 없습니다.</td>
              </tr>
            ) : null}
            {brandRules.map((rule, index) => (
              <tr key={`${rule.matchType}-${index}`} className="border-b border-gray-800">
                <td className="px-3 py-3">
                  <select
                    value={rule.matchType}
                    onChange={(event) =>
                      onChange((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, matchType: event.target.value as BrandRule["matchType"] }
                            : item
                        )
                      )
                    }
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                  >
                    <option value="domain">domain</option>
                    <option value="url">url</option>
                    <option value="brand">brand</option>
                    <option value="brand_contains">brand_contains</option>
                  </select>
                </td>
                <td className="px-3 py-3">
                  <input
                    value={rule.matchValue}
                    onChange={(event) =>
                      onChange((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, matchValue: event.target.value } : item
                        )
                      )
                    }
                    placeholder="afterpray.com / after pray"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    value={rule.canonicalBrand}
                    onChange={(event) =>
                      onChange((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, canonicalBrand: event.target.value } : item
                        )
                      )
                    }
                    placeholder="애프터프레이(afterpray)"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                  />
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => onChange((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                    className="rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-900/30"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <div>`domain`은 도메인, `brand`는 정확히 일치, `brand_contains`는 부분 일치, `url`은 URL 포함 문자열 기준입니다.</div>
        <button
          onClick={() => onChange((prev) => [...prev, { matchType: "domain", matchValue: "", canonicalBrand: "" }])}
          className="rounded-lg px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
        >
          규칙 추가
        </button>
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
