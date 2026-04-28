import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";
import { normalizeProductRow } from "../../../server/utils/product.js";
import { refreshBrandRulesCache } from "../../../server/utils/brand-rules.js";
import { DigboxPageClient } from "../../../src/components/pages/DigboxPageClient";
import type { Product } from "../../../src/types";

export const revalidate = 60;

interface Props {
  params: Promise<{ username: string }>;
}

type ClosetRow = {
  product_id: string;
  added_at?: string | null;
};

async function fetchUserDigbox(username: string): Promise<{ username: string; bio: string; products: Product[] } | null> {
  const normalizedUsername = decodeURIComponent(username).trim();
  if (!normalizedUsername) return null;

  assertSupabaseConfig();
  const db = supabase!;

  const { data: user, error: userError } = await db
    .from("users")
    .select("id, username, bio")
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (userError) throw userError;
  if (!user?.id) return null;

  const closetResult = await db
    .from("user_digbox_items")
    .select("product_id, added_at")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (closetResult.error) throw closetResult.error;

  const closetRows = Array.isArray(closetResult.data) ? (closetResult.data as ClosetRow[]) : [];
  const productIds = closetRows.map((row) => String(row.product_id || "").trim()).filter(Boolean);
  const bio = String((user as { bio?: string | null }).bio ?? "").trim();

  if (productIds.length === 0) {
    return { username: String(user.username || normalizedUsername), bio, products: [] };
  }

  const { data: productsData, error: productsError } = await db
    .from("products")
    .select("id,brand,name,category,url,size_table,normalized_size_table,created_at,image_path,slug,is_instagram,instagram_order")
    .in("id", productIds);

  if (productsError) throw productsError;

  await refreshBrandRulesCache();

  const productMap = new Map((productsData ?? []).map((product: { id: string }) => [String(product.id), product]));
  const products = productIds
    .map((id) => normalizeProductRow(productMap.get(id)))
    .filter((product) => product !== null) as Product[];

  return { username: String(user.username || normalizedUsername), bio, products };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username).trim();
  return {
    title: `${decodedUsername}'s DIGBOX`,
    description: `${decodedUsername}'s DIGBOX`,
  };
}

export default async function PublicDigboxPage({ params }: Props) {
  const { username } = await params;
  const digbox = await fetchUserDigbox(username);
  if (!digbox) notFound();

  return <DigboxPageClient username={digbox.username} bio={digbox.bio} products={digbox.products} />;
}
