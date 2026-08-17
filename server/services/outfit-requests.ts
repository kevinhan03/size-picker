import type { OutfitRequestMineStatus, OutfitRequestScope, OutfitRequestSummary, Product } from "../../src/types";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { normalizeProductRow } from "../utils/product.js";
import { hydrateRequestSummaries } from "../utils/outfits.js";

type CursorPayload = { createdAt: string; id: string };
type SummaryRpcRow = { summary?: Record<string, unknown>; total_count?: number | string; sort_created_at?: string; sort_id?: string };

function decodeCursor(cursor?: string | null): CursorPayload | null {
  if (!cursor) return null;
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as CursorPayload;
    if (!value.createdAt || !/^[0-9a-f-]{36}$/i.test(value.id) || Number.isNaN(Date.parse(value.createdAt))) return null;
    return value;
  } catch {
    return null;
  }
}

function encodeCursor(createdAt?: string, id?: string) {
  if (!createdAt || !id) return null;
  return Buffer.from(JSON.stringify({ createdAt, id }), "utf8").toString("base64url");
}

function normalizeProducts(value: unknown): Product[] {
  return (Array.isArray(value) ? value : []).map((row) => normalizeProductRow(row) as Product | null).filter((product): product is Product => Boolean(product));
}

function normalizeSummary(value: Record<string, unknown>): OutfitRequestSummary {
  const previewProducts = normalizeProducts(value.preview_products);
  return {
    id: String(value.id || ""), authorId: String(value.author_id || ""), authorUsername: String(value.author_username || ""),
    description: String(value.description || ""), status: String(value.status || "open") as OutfitRequestSummary["status"],
    acceptedProposalId: value.accepted_proposal_id ? String(value.accepted_proposal_id) : null, createdAt: String(value.created_at || ""),
    itemCount: Number(value.item_count) || previewProducts.length, proposalCount: Number(value.proposal_count) || 0, previewProducts,
    focusProducts: normalizeProducts(value.focus_products),
    ...(value.my_proposal_id ? { myProposalId: String(value.my_proposal_id), proposedAt: String(value.proposed_at || value.created_at || ""), isAccepted: Boolean(value.is_accepted) } : {}),
  };
}

export async function listOutfitRequests(userId: string | null, scope: OutfitRequestScope, cursor: string | null = null, mineStatus: OutfitRequestMineStatus = "all", limit = 20) {
  assertSupabaseConfig();
  const decoded = decodeCursor(cursor);
  if (cursor && !decoded) throw new Error("invalid cursor");
  const pageLimit = Math.min(20, Math.max(1, limit));

  if (!userId) {
    let query = supabase!
      .from("outfit_requests")
      .select("id,author_id,description,status,accepted_proposal_id,created_at", { count: "exact" })
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(pageLimit + 1);

    if (decoded) {
      query = query.or(`created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    const rows = (data || []) as Array<Record<string, unknown>>;
    const hasMore = rows.length > pageLimit;
    const pageRows = rows.slice(0, pageLimit);
    const requests = await hydrateRequestSummaries(supabase!, pageRows);
    const last = pageRows.at(-1);
    return {
      requests,
      total: count ?? pageRows.length,
      nextCursor: hasMore ? encodeCursor(String(last?.created_at || ""), String(last?.id || "")) : null,
      currentUserId: null,
    };
  }

  const result = await supabase!.rpc("list_outfit_request_summaries", {
    target_user_id: userId, request_scope: scope, mine_status: mineStatus,
    cursor_created_at: decoded?.createdAt || null, cursor_id: decoded?.id || null, page_limit: pageLimit,
  });
  if (result.error) throw result.error;
  const rows = (result.data || []) as SummaryRpcRow[];
  const requests = rows.map((row) => normalizeSummary(row.summary || {}));
  const last = rows.at(-1);
  return {
    requests, total: Number(rows[0]?.total_count) || 0,
    nextCursor: requests.length === pageLimit ? encodeCursor(last?.sort_created_at, last?.sort_id) : null,
    currentUserId: userId,
  };
}
