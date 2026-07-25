import { NextResponse } from "next/server";
import { assertSupabaseConfig, supabase } from "../../../../../server/lib/supabase.js";
import { normalizeProductRow } from "../../../../../server/utils/product.js";

export const dynamic = "force-dynamic";

// Recommendation cards only need product identity, presentation, and navigation fields.
// In particular, image embeddings are not part of behavioral ranking and must not be sent
// to the client with every related-product response.
const PRODUCT_SELECT = "id,brand,name,category,url,image_path,slug";
type InteractionRow = { user_id: string; product_id?: string; added_at?: string | null };
type CandidateAggregate = { users: Set<string>; weight: number; latestAddedAt: string | null };
type BehavioralProductCard = {
  id: string;
  brand: string;
  name: string;
  category: string;
  url: string;
  image: string;
  thumbnailImage: string;
  imagePath: string | null;
  slug: string | null;
};

function newerTimestamp(current: string | null, candidate: string | null | undefined): string | null {
  if (!candidate) return current;
  return !current || new Date(candidate).getTime() > new Date(current).getTime() ? candidate : current;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  if (!/^\d+$/.test(productId)) return NextResponse.json({ ok: false, error: "invalid product id" }, { status: 400 });

  try {
    assertSupabaseConfig();
    const db = supabase!;
    // IDs and event weights never leave this server-side aggregation. A pair
    // must be supported by two independent people before a card is returned.
    const [savedSource, closetSource] = await Promise.all([
      db.from("user_digbox_items").select("user_id").eq("product_id", productId),
      db.from("user_closet_items").select("user_id").eq("product_id", productId),
    ]);
    if (savedSource.error) throw savedSource.error;
    if (closetSource.error) throw closetSource.error;

    const sourceUserIds = [...new Set([
      ...((savedSource.data ?? []) as InteractionRow[]).map((row) => String(row.user_id)),
      ...((closetSource.data ?? []) as InteractionRow[]).map((row) => String(row.user_id)),
    ])];
    if (sourceUserIds.length < 2) return NextResponse.json({ ok: true, data: { products: [] } }, { headers: { "Cache-Control": "no-store" } });

    const [savedCandidates, closetCandidates] = await Promise.all([
      db.from("user_digbox_items").select("user_id,product_id,added_at").in("user_id", sourceUserIds).neq("product_id", productId),
      db.from("user_closet_items").select("user_id,product_id,added_at").in("user_id", sourceUserIds).neq("product_id", productId),
    ]);
    if (savedCandidates.error) throw savedCandidates.error;
    if (closetCandidates.error) throw closetCandidates.error;

    const candidates = new Map<string, CandidateAggregate>();
    const addInteractions = (rows: InteractionRow[], weight: number) => {
      for (const row of rows) {
        const candidateId = String(row.product_id || "").trim();
        if (!candidateId || candidateId === productId) continue;
        const aggregate = candidates.get(candidateId) ?? { users: new Set<string>(), weight: 0, latestAddedAt: null };
        aggregate.users.add(String(row.user_id));
        aggregate.weight += weight;
        aggregate.latestAddedAt = newerTimestamp(aggregate.latestAddedAt, row.added_at);
        candidates.set(candidateId, aggregate);
      }
    };
    addInteractions((savedCandidates.data ?? []) as InteractionRow[], 1);
    addInteractions((closetCandidates.data ?? []) as InteractionRow[], 2);

    const candidateIds = [...candidates.entries()]
      .filter(([, aggregate]) => aggregate.users.size >= 2)
      .sort(([leftId, left], [rightId, right]) => right.users.size - left.users.size || right.weight - left.weight || String(right.latestAddedAt || "").localeCompare(String(left.latestAddedAt || "")) || leftId.localeCompare(rightId))
      .slice(0, 12)
      .map(([candidateId]) => candidateId);
    if (!candidateIds.length) return NextResponse.json({ ok: true, data: { products: [] } }, { headers: { "Cache-Control": "no-store" } });

    const { data: productRows, error } = await db.from("products").select(PRODUCT_SELECT).in("id", candidateIds);
    if (error) throw error;
    const productById = new Map((productRows ?? []).map((product: { id: string }) => [String(product.id), product]));
    const products = candidateIds
      .map((candidateId) => normalizeProductRow(productById.get(candidateId)))
      .filter((product): product is NonNullable<typeof product> => product !== null)
      .map((product): BehavioralProductCard => ({
        id: product.id,
        brand: product.brand,
        name: product.name,
        category: product.category,
        url: product.url,
        image: product.image,
        thumbnailImage: product.thumbnailImage,
        imagePath: product.imagePath,
        slug: product.slug,
      }));
    return NextResponse.json({ ok: true, data: { products } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("behavioral related products fetch error", error);
    return NextResponse.json({ ok: false, error: "behavioral related products fetch error" }, { status: 500 });
  }
}
