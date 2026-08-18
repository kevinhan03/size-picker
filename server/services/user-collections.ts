import type { ClosetSizeSnapshot, DigboxSizeDecision, DiscoveryProduct, MySizeProfile, Product, SizeDecisionFit, SizeDecisionSource } from "../../src/types";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { normalizeClientProduct, normalizeProductCard } from "./catalog";

type CollectionRow = Record<string, unknown>;

function normalizeSizeSnapshot(value: unknown): ClosetSizeSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const headers = Array.isArray(record.headers) ? record.headers.map((value) => String(value ?? "").trim()) : [];
  const row = Array.isArray(record.row) ? record.row.map((value) => String(value ?? "").trim()) : [];
  return headers.length && row.length ? { headers, row } : null;
}

function normalizeDigboxSizeDecision(row: CollectionRow): DigboxSizeDecision | null {
  const label = String(row.size_decision_label ?? "").trim() || null;
  if (!label) return null;
  const sources = Array.isArray(row.size_decision_sources)
    ? row.size_decision_sources.map((source) => String(source)).filter((source): source is SizeDecisionSource => ["comparison", "try_on", "worn"].includes(source))
    : [];
  const fit = String(row.size_decision_fit ?? "");
  return {
    label,
    rowIndex: Number.isInteger(row.size_decision_row_index) ? Number(row.size_decision_row_index) : null,
    snapshot: normalizeSizeSnapshot(row.size_decision_snapshot),
    sources,
    fit: ["tight", "true_to_size", "roomy"].includes(fit) ? fit as SizeDecisionFit : null,
    note: String(row.size_decision_note ?? "").trim() || null,
    updatedAt: String(row.size_decision_updated_at ?? "").trim() || null,
  };
}

export async function getClosetProducts(userId: string): Promise<Product[]> {
  assertSupabaseConfig();
  const { data, error } = await supabase!.rpc("get_closet_products", { target_user_id: userId });
  if (error) throw error;

  return ((data ?? []) as CollectionRow[]).flatMap((row) => {
    const product = normalizeClientProduct({ ...row, collection_added_at: row.added_at });
    if (!product) return [];
    return [{
      ...product,
      closetSelectedSizeLabel: String(row.selected_size_label ?? "").trim() || null,
      closetSelectedSizeRowIndex: Number.isInteger(row.selected_size_row_index) ? Number(row.selected_size_row_index) : null,
      closetSelectedSizeSnapshot: normalizeSizeSnapshot(row.selected_size_snapshot),
    }];
  });
}

export async function getDigboxProducts(userId: string): Promise<{
  products: Product[];
  discoveredDigboxCounts: Record<string, number>;
}> {
  assertSupabaseConfig();
  const { data, error } = await supabase!.rpc("get_digbox_products", { target_user_id: userId });
  if (error) throw error;

  const products: Product[] = [];
  const discoveredDigboxCounts: Record<string, number> = {};
  for (const row of (data ?? []) as CollectionRow[]) {
    const product = normalizeClientProduct({ ...row, collection_added_at: row.added_at });
    if (!product) continue;
    products.push({ ...product, digboxSizeDecision: normalizeDigboxSizeDecision(row) });
    const count = Math.max(0, Number(row.discovered_save_count) || 0);
    if (count > 0) discoveredDigboxCounts[product.id] = count;
  }
  return { products, discoveredDigboxCounts };
}

function normalizeMySize(row: CollectionRow): MySizeProfile | null {
  const snapshot = normalizeSizeSnapshot(row.measurement_snapshot);
  if (!snapshot) return null;
  return {
    id: String(row.id),
    userId: String(row.user_id || "") || undefined,
    sourceProductId: String(row.source_product_id || "").trim() || null,
    brand: String(row.brand || "").trim() || null,
    category: String(row.category || "").trim(),
    title: String(row.title || "").trim(),
    sizeLabel: String(row.size_label || "").trim() || null,
    measurementSnapshot: snapshot,
    fitNote: String(row.fit_note || "").trim() || null,
    createdAt: String(row.created_at || "") || null,
  };
}

export async function getMySizes(userId: string): Promise<MySizeProfile[]> {
  assertSupabaseConfig();
  const { data, error } = await supabase!
    .from("user_my_size_profiles")
    .select("id,user_id,source_product_id,brand,category,title,size_label,measurement_snapshot,fit_note,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data || []) as CollectionRow[]).map(normalizeMySize).filter((value): value is MySizeProfile => Boolean(value));
}

export async function getUserDiscoveries(userId: string): Promise<{ products: DiscoveryProduct[]; totalSaveCount: number }> {
  assertSupabaseConfig();
  const { data, error } = await supabase!.rpc("get_user_discovery_summary", { target_user_id: userId });
  if (error) throw error;
  const products = ((data || []) as CollectionRow[]).flatMap((row) => {
    const product = normalizeProductCard(row);
    return product ? [{ ...product, saveCount: Math.max(0, Number(row.save_count) || 0) }] : [];
  });
  return { products, totalSaveCount: products.reduce((sum, product) => sum + product.saveCount, 0) };
}
