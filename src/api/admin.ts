import type { BrandBackfillResult, BrandInfo, BrandRule } from "../types";
import { parseApiJson } from "./shared";

export const fetchBrands = async (): Promise<BrandInfo[]> => {
  const response = await fetch("/api/admin/brands", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string; data?: { brands?: BrandInfo[] } }>(
    response,
    "/api/admin/brands"
  );
  if (!response.ok || !payload?.ok || !Array.isArray(payload?.data?.brands)) {
    throw new Error(payload?.error || "Failed to fetch brands");
  }
  return payload.data.brands;
};

export const fetchBrandRules = async (): Promise<BrandRule[]> => {
  const response = await fetch("/api/admin/brand-rules", {
    method: "GET",
    credentials: "include",
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string; data?: { rules?: BrandRule[] } }>(
    response,
    "/api/admin/brand-rules"
  );
  if (!response.ok || !payload?.ok || !Array.isArray(payload?.data?.rules)) {
    throw new Error(payload?.error || "Failed to fetch brand rules");
  }
  return payload.data.rules;
};

export const saveBrandRules = async (rules: BrandRule[]): Promise<BrandRule[]> => {
  const response = await fetch("/api/admin/brand-rules", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ rules }),
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string; data?: { rules?: BrandRule[] } }>(
    response,
    "/api/admin/brand-rules"
  );
  if (!response.ok || !payload?.ok || !Array.isArray(payload?.data?.rules)) {
    throw new Error(payload?.error || "Failed to save brand rules");
  }
  return payload.data.rules;
};

export const backfillBrandRules = async (): Promise<BrandBackfillResult> => {
  const response = await fetch("/api/admin/brand-rules/backfill", {
    method: "POST",
    credentials: "include",
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string; data?: BrandBackfillResult }>(
    response,
    "/api/admin/brand-rules/backfill"
  );
  if (!response.ok || !payload?.ok || !payload?.data) {
    throw new Error(payload?.error || "Failed to backfill brand rules");
  }
  return payload.data;
};
