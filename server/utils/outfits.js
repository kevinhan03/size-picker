import { normalizeProductRow } from "./product.js";

export const OUTFIT_PRODUCT_SNAPSHOT_SELECT =
  "id,brand,name,category,url,created_at,image_path,slug";

export function getBearerToken(request) {
  return String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

export function validateRequestInput(body) {
  const description = String(body?.description || "").trim();
  if (body?.focusProductIds !== undefined && !Array.isArray(body.focusProductIds)) {
    return { error: "우선 활용할 상품 정보가 올바르지 않습니다." };
  }
  const rawFocusIds = body?.focusProductIds || [];
  const focusProductIds = rawFocusIds.map((value) => String(value || "").trim());
  if (description.length < 20 || description.length > 500) {
    return { error: "요청 내용은 20자 이상 500자 이하로 작성해주세요." };
  }
  if (
    focusProductIds.length > 3
    || new Set(focusProductIds).size !== focusProductIds.length
    || focusProductIds.some((id) => !/^\d+$/.test(id))
  ) {
    return { error: "우선 활용할 상품은 중복 없이 최대 3개까지 선택해주세요." };
  }
  return { value: { description, focusProductIds } };
}

export function validateProposalInput(body) {
  const rawIds = Array.isArray(body?.productIds) ? body.productIds : [];
  const productIds = rawIds.map((value) => String(value || "").trim()).filter(Boolean);
  const explanation = String(body?.explanation || "").trim();
  if (productIds.length < 2 || productIds.length > 6 || new Set(productIds).size !== productIds.length) {
    return { error: "중복 없이 2개에서 6개의 상품을 선택해주세요." };
  }
  if (explanation.length < 10 || explanation.length > 300) {
    return { error: "코디 설명은 10자 이상 300자 이하로 작성해주세요." };
  }
  if (productIds.some((id) => !/^\d+$/.test(id))) return { error: "상품 정보가 올바르지 않습니다." };
  return { value: { productIds, explanation } };
}

async function fetchUsers(db, ids) {
  if (!ids.length) return new Map();
  const { data, error } = await db.from("users").select("id,username").in("id", [...new Set(ids)]);
  if (error) throw error;
  return new Map((data || []).map((row) => [String(row.id), String(row.username || "") ]));
}

function snapshotProducts(itemRows) {
  return new Map(
    (itemRows || [])
      .map((item) => normalizeProductRow(item.product_snapshot))
      .filter(Boolean)
      .map((product) => [String(product.id), product])
  );
}

export async function hydrateRequestSummaries(db, rows) {
  const requestIds = rows.map((row) => String(row.id));
  if (!requestIds.length) return [];
  const [{ data: itemRows, error: itemError }, { data: proposalRows, error: proposalError }, users] =
    await Promise.all([
      db.from("outfit_request_items").select("request_id,product_id,sort_order,is_focus,product_snapshot").in("request_id", requestIds),
      db.from("outfit_proposals").select("id,request_id").in("request_id", requestIds),
      fetchUsers(db, rows.map((row) => String(row.author_id))),
    ]);
  if (itemError) throw itemError;
  if (proposalError) throw proposalError;
  const products = snapshotProducts(itemRows);

  return rows.map((row) => {
    const requestItems = (itemRows || [])
      .filter((item) => String(item.request_id) === String(row.id))
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
    return {
      id: String(row.id),
      authorId: String(row.author_id),
      authorUsername: users.get(String(row.author_id)) || "알 수 없는 사용자",
      description: String(row.description),
      status: String(row.status),
      acceptedProposalId: row.accepted_proposal_id ? String(row.accepted_proposal_id) : null,
      createdAt: row.created_at,
      itemCount: requestItems.length,
      proposalCount: (proposalRows || []).filter((proposal) => String(proposal.request_id) === String(row.id)).length,
      previewProducts: requestItems.slice(0, 4).map((item) => products.get(String(item.product_id))).filter(Boolean),
      focusProducts: requestItems
        .filter((item) => item.is_focus)
        .map((item) => products.get(String(item.product_id)))
        .filter(Boolean),
    };
  });
}

export async function hydrateRequestDetail(db, row) {
  const requestId = String(row.id);
  const [{ data: itemRows, error: itemError }, { data: proposalRows, error: proposalError }, users] =
    await Promise.all([
      db.from("outfit_request_items").select("request_id,product_id,sort_order,is_focus,product_snapshot").eq("request_id", requestId),
      db.from("outfit_proposals").select("id,request_id,author_id,explanation,created_at").eq("request_id", requestId).order("created_at", { ascending: false }),
      fetchUsers(db, [String(row.author_id)]),
    ]);
  if (itemError) throw itemError;
  if (proposalError) throw proposalError;

  const proposalIds = (proposalRows || []).map((proposal) => String(proposal.id));
  const { data: proposalItemRows, error: proposalItemError } = proposalIds.length
    ? await db.from("outfit_proposal_items").select("proposal_id,product_id,sort_order").in("proposal_id", proposalIds)
    : { data: [], error: null };
  if (proposalItemError) throw proposalItemError;

  const products = snapshotProducts(itemRows);
  const proposalUsers = await fetchUsers(db, (proposalRows || []).map((proposal) => String(proposal.author_id)));

  const items = (itemRows || [])
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((item) => products.get(String(item.product_id)))
    .filter(Boolean);
  const focusProductIds = (itemRows || [])
    .filter((item) => item.is_focus)
    .map((item) => String(item.product_id));
  const proposals = (proposalRows || []).map((proposal) => {
    const proposalProducts = (proposalItemRows || [])
      .filter((item) => String(item.proposal_id) === String(proposal.id))
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((item) => products.get(String(item.product_id)))
      .filter(Boolean);
    const proposalProductIds = new Set(proposalProducts.map((product) => String(product.id)));
    const matchedFocusItemCount = focusProductIds.filter((id) => proposalProductIds.has(id)).length;
    const focusMatch = focusProductIds.length === 0
      ? "not_applicable"
      : matchedFocusItemCount === 0
        ? "none"
        : matchedFocusItemCount === focusProductIds.length
          ? "all"
          : "partial";
    return {
      id: String(proposal.id),
      authorId: String(proposal.author_id),
      authorUsername: proposalUsers.get(String(proposal.author_id)) || "알 수 없는 사용자",
      explanation: String(proposal.explanation),
      createdAt: proposal.created_at,
      products: proposalProducts,
      focusMatch,
      matchedFocusItemCount,
    };
  });

  return {
    id: requestId,
    authorId: String(row.author_id),
    authorUsername: users.get(String(row.author_id)) || "알 수 없는 사용자",
    description: String(row.description),
    status: String(row.status),
    acceptedProposalId: row.accepted_proposal_id ? String(row.accepted_proposal_id) : null,
    createdAt: row.created_at,
    products: items,
    focusProductIds,
    proposals,
  };
}
