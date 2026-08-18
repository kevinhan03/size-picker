import { normalizeProductRow } from "./product.js";

export const OUTFIT_PRODUCT_SNAPSHOT_SELECT =
  "id,brand,name,category,url,created_at,image_path,slug";

const OUTFIT_MESSAGES = {
  ko: {
    invalidFocusProducts: "우선 활용할 상품 정보가 올바르지 않습니다.",
    descriptionLength: "요청 내용은 20자 이상 500자 이하로 작성해주세요.",
    tooManyFocusProducts: "우선 활용할 상품은 중복 없이 최대 3개까지 선택해주세요.",
    invalidProposalProductCount: "중복 없이 2개에서 6개의 상품을 선택해주세요.",
    explanationLength: "코디 설명은 10자 이상 300자 이하로 작성해주세요.",
    invalidProduct: "상품 정보가 올바르지 않습니다.",
    unknownUser: "알 수 없는 사용자",
    requestNotFound: "코디 요청을 찾을 수 없습니다.",
    requestLoadFailed: "코디 요청을 불러오지 못했습니다.",
    requestSaveFailed: "코디 요청을 저장하지 못했습니다.",
    requestUpdateFailed: "코디 요청 상태를 변경하지 못했습니다.",
    requestDeleteFailed: "코디 요청을 삭제하지 못했습니다.",
    requestAlreadyClosed: "이미 완료된 요청입니다.",
    requestAlreadyClosedByOther: "다른 작업으로 이미 완료된 요청입니다.",
    invalidAction: "올바른 작업이 아닙니다.",
    closetTooSmall: "코디 요청에는 Closet 상품이 2개 이상 필요합니다.",
    focusProductsMustBeInCloset: "우선 활용할 상품은 현재 Closet에서만 선택할 수 있습니다.",
    proposalNotFound: "코디 제안을 찾을 수 없습니다.",
    proposalSaveFailed: "코디 제안을 저장하지 못했습니다.",
    proposalUpdateFailed: "코디 제안을 수정하지 못했습니다.",
    proposalDeleteFailed: "코디 제안을 삭제하지 못했습니다.",
    cannotProposeOwnRequest: "자신의 요청에는 코디를 제안할 수 없습니다.",
    productsNotSharedWithRequest: "요청에 공유되지 않은 상품이 포함되어 있습니다.",
    proposalAlreadyExists: "이 요청에는 이미 코디를 제안했습니다.",
    proposalLocked: "완료되거나 채택된 코디 제안은 수정할 수 없습니다.",
    proposalDeleteLocked: "완료되거나 채택된 제안은 삭제할 수 없습니다.",
  },
  en: {
    invalidFocusProducts: "The featured item information isn't valid.",
    descriptionLength: "Please write between 20 and 500 characters.",
    tooManyFocusProducts: "Choose up to 3 featured items, with no duplicates.",
    invalidProposalProductCount: "Choose between 2 and 6 items, with no duplicates.",
    explanationLength: "Please write between 10 and 300 characters.",
    invalidProduct: "The product information isn't valid.",
    unknownUser: "Unknown user",
    requestNotFound: "We couldn't find that outfit request.",
    requestLoadFailed: "We couldn't load the outfit request.",
    requestSaveFailed: "We couldn't save the outfit request.",
    requestUpdateFailed: "We couldn't update the outfit request status.",
    requestDeleteFailed: "We couldn't delete the outfit request.",
    requestAlreadyClosed: "This request is already closed.",
    requestAlreadyClosedByOther: "This request was already closed by another action.",
    invalidAction: "That's not a valid action.",
    closetTooSmall: "An outfit request needs at least 2 Closet items.",
    focusProductsMustBeInCloset: "Featured items can only be chosen from your current Closet.",
    proposalNotFound: "We couldn't find that outfit proposal.",
    proposalSaveFailed: "We couldn't save the outfit proposal.",
    proposalUpdateFailed: "We couldn't update the outfit proposal.",
    proposalDeleteFailed: "We couldn't delete the outfit proposal.",
    cannotProposeOwnRequest: "You can't propose an outfit for your own request.",
    productsNotSharedWithRequest: "Some products aren't shared with this request.",
    proposalAlreadyExists: "You've already proposed an outfit for this request.",
    proposalLocked: "A closed or accepted outfit proposal can't be edited.",
    proposalDeleteLocked: "A closed or accepted proposal can't be deleted.",
  },
};

function messages(locale) {
  return OUTFIT_MESSAGES[locale] || OUTFIT_MESSAGES.ko;
}

export function outfitMessage(locale, key) {
  return messages(locale)[key];
}

export function getBearerToken(request) {
  return String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

export function validateRequestInput(body, locale = "ko") {
  const m = messages(locale);
  const description = String(body?.description || "").trim();
  if (body?.focusProductIds !== undefined && !Array.isArray(body.focusProductIds)) {
    return { error: m.invalidFocusProducts };
  }
  const rawFocusIds = body?.focusProductIds || [];
  const focusProductIds = rawFocusIds.map((value) => String(value || "").trim());
  if (description.length < 20 || description.length > 500) {
    return { error: m.descriptionLength };
  }
  if (
    focusProductIds.length > 3
    || new Set(focusProductIds).size !== focusProductIds.length
    || focusProductIds.some((id) => !/^\d+$/.test(id))
  ) {
    return { error: m.tooManyFocusProducts };
  }
  return { value: { description, focusProductIds } };
}

export function validateProposalInput(body, locale = "ko") {
  const m = messages(locale);
  const rawIds = Array.isArray(body?.productIds) ? body.productIds : [];
  const productIds = rawIds.map((value) => String(value || "").trim()).filter(Boolean);
  const explanation = String(body?.explanation || "").trim();
  if (productIds.length < 2 || productIds.length > 6 || new Set(productIds).size !== productIds.length) {
    return { error: m.invalidProposalProductCount };
  }
  if (explanation.length < 10 || explanation.length > 300) {
    return { error: m.explanationLength };
  }
  if (productIds.some((id) => !/^\d+$/.test(id))) return { error: m.invalidProduct };
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

export async function hydrateRequestSummaries(db, rows, locale = "ko") {
  const m = messages(locale);
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
      authorUsername: users.get(String(row.author_id)) || m.unknownUser,
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

export async function hydrateRequestDetail(db, row, locale = "ko") {
  const m = messages(locale);
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
      authorUsername: proposalUsers.get(String(proposal.author_id)) || m.unknownUser,
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
    authorUsername: users.get(String(row.author_id)) || m.unknownUser,
    description: String(row.description),
    status: String(row.status),
    acceptedProposalId: row.accepted_proposal_id ? String(row.accepted_proposal_id) : null,
    createdAt: row.created_at,
    products: items,
    focusProductIds,
    proposals,
  };
}
