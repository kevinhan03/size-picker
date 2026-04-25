import { useCallback, useState } from "react";
import type { BrandBackfillResult, BrandRule } from "../../types";
import { backfillBrandRules, fetchBrandRules, saveBrandRules } from "../../api/admin";

interface UseBrandRulesOptions {
  onProductMutated: () => void;
  setAdminActionError: (message: string | null) => void;
}

export function useBrandRules({ onProductMutated, setAdminActionError }: UseBrandRulesOptions) {
  const [brandRules, setBrandRules] = useState<BrandRule[]>([]);
  const [savedRules, setSavedRules] = useState<BrandRule[]>([]);
  const [isBrandRulesLoading, setIsBrandRulesLoading] = useState(false);
  const [isBrandRulesSaving, setIsBrandRulesSaving] = useState(false);
  const [isBrandBackfillRunning, setIsBrandBackfillRunning] = useState(false);
  const [brandBackfillResult, setBrandBackfillResult] = useState<BrandBackfillResult | null>(null);

  const hasUnsavedBrandRules = JSON.stringify(brandRules) !== JSON.stringify(savedRules);

  const loadBrandRules = useCallback(async () => {
    setIsBrandRulesLoading(true);
    try {
      const rules = await fetchBrandRules();
      setBrandRules(rules);
      setSavedRules(rules);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "브랜드 규칙을 불러오지 못했습니다.";
      setAdminActionError(message);
    } finally {
      setIsBrandRulesLoading(false);
    }
  }, [setAdminActionError]);

  const handleBrandRulesSave = async () => {
    const normalizedRules = brandRules.map((rule) => ({
      matchType: rule.matchType,
      matchValue: rule.matchValue.trim(),
      canonicalBrand: rule.canonicalBrand.trim(),
    }));

    if (normalizedRules.some((rule) => !rule.matchType || !rule.matchValue || !rule.canonicalBrand)) {
      setAdminActionError("브랜드 규칙의 모든 항목에 매칭 타입, 매칭 값, 대표 브랜드명을 입력해 주세요.");
      return;
    }

    setIsBrandRulesSaving(true);
    try {
      const saved = await saveBrandRules(normalizedRules);
      setBrandRules(saved);
      setSavedRules(saved);
      setAdminActionError(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "브랜드 규칙 저장에 실패했습니다.";
      setAdminActionError(message);
    } finally {
      setIsBrandRulesSaving(false);
    }
  };

  const handleBrandRulesBackfill = async () => {
    setIsBrandBackfillRunning(true);
    try {
      const result = await backfillBrandRules();
      setBrandBackfillResult(result);
      setAdminActionError(null);
      onProductMutated();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "기존 상품 브랜드 일괄 적용에 실패했습니다.";
      setAdminActionError(message);
    } finally {
      setIsBrandBackfillRunning(false);
    }
  };

  const resetBrandRulesState = () => {
    setBrandRules([]);
    setSavedRules([]);
    setBrandBackfillResult(null);
  };

  return {
    brandRules,
    setBrandRules,
    hasUnsavedBrandRules,
    isBrandRulesLoading,
    isBrandRulesSaving,
    isBrandBackfillRunning,
    brandBackfillResult,
    loadBrandRules,
    handleBrandRulesSave,
    handleBrandRulesBackfill,
    resetBrandRulesState,
  };
}
