import type { Product } from "../../src/types";
import {
  calculateTasteSwipeProfile,
  type DigMatchProfile,
  type TasteSwipeAction,
} from "../../src/utils/digMatch";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { normalizeAnalysisProduct } from "./catalog";

type StoredProfile = {
  version?: unknown;
  completedSessions?: unknown;
};

type StoredSwipeEvent = {
  product_id?: unknown;
  decision?: unknown;
  created_at?: unknown;
};

/**
 * Converts a legacy taste profile from the user's recorded swipe products.
 * The product's current eight-axis values are intentionally used here: legacy
 * tag signals cannot be mapped safely to the new ten-centre model.
 */
export async function migrateTasteProfileFromSwipeEvents(
  userId: string,
  storedProfile: StoredProfile
): Promise<DigMatchProfile | null> {
  if (Number(storedProfile.version) === 2) return null;

  assertSupabaseConfig();
  const { data: eventRows, error: eventError } = await supabase!
    .from("user_taste_swipe_events")
    .select("product_id,decision,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (eventError) throw eventError;

  const events = (Array.isArray(eventRows) ? eventRows : []) as StoredSwipeEvent[];
  const ids = [...new Set(events.map((event) => String(event.product_id || "").trim()).filter(Boolean))];
  if (!ids.length) return null;

  const { data: productRows, error: productError } = await supabase!
    .from("products")
    .select("id,brand,name,category,url,image_path,slug,style_attributes,style_axes,human_style_attributes,human_style_axes,style_axes_reviewed_at")
    .in("id", ids);
  if (productError) throw productError;

  const products = (Array.isArray(productRows) ? productRows : [])
    .map(normalizeAnalysisProduct)
    .filter((product): product is Product => Boolean(product));
  if (!products.length) return null;

  const productIds = new Set(products.map((product) => product.id));
  const actions: TasteSwipeAction[] = events
    .filter((event) => productIds.has(String(event.product_id || "")))
    .filter((event): event is StoredSwipeEvent & { decision: "like" | "pass" } => event.decision === "like" || event.decision === "pass")
    .map((event) => ({
      productId: String(event.product_id),
      decision: event.decision,
      decidedAt: String(event.created_at || ""),
    }));
  if (!actions.length) return null;

  const calculated = calculateTasteSwipeProfile(null, products, actions);
  return {
    ...calculated,
    completedSessions: Math.max(0, Number(storedProfile.completedSessions || 0)),
  };
}
