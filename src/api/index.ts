import type {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained as part of the existing API type surface.
  BrandBackfillResult,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained as part of the existing API type surface.
  BrandRule,
  CatalogPage,
  ClosetSizeSelection,
  DigboxSizeDecisionInput,
  MySizeInput,
  MySizeProfile,
  MySizeUpdateInput,
  Product,
  ProductCardData,
  ProductMetadataPayload,
  SizeTable,
  SubmitProductForm,
} from '../types';
import { normalizeSizeTable } from '../utils/sizeTable';
import { authenticatedFetch, parseApiJson, postJson } from './shared';
import { apiMessage } from './apiMessage';
import type { SerializedTasteGraphState, TasteCollectionSource } from "../utils/tasteGraph";

export type CollectionBootstrapData = {
  closet: Product[];
  digbox: { products: Product[]; discoveredDigboxCounts: Record<string, number> };
  profiles: MySizeProfile[];
};

export const fetchCollectionsBootstrap = async (): Promise<CollectionBootstrapData> => {
  const endpoint = "/api/collections/bootstrap";
  const response = await authenticatedFetch(endpoint);
  const payload = await parseApiJson<{ ok?: boolean; data?: { closet?: { products?: unknown[] }; digbox?: { products?: unknown[]; discoveredDigboxCounts?: Record<string, unknown> }; profiles?: unknown[] }; error?: string }>(response, endpoint);
  if (!response.ok || !payload.ok) throw new Error(payload.error || "Failed to load collections");
  const counts: Record<string, number> = {};
  for (const [id, value] of Object.entries(payload.data?.digbox?.discoveredDigboxCounts || {})) {
    const count = Number(value) || 0;
    if (id && count > 0) counts[id] = count;
  }
  return {
    closet: (payload.data?.closet?.products || []).filter((value): value is Product => Boolean(value) && typeof value === "object"),
    digbox: { products: (payload.data?.digbox?.products || []).filter((value): value is Product => Boolean(value) && typeof value === "object"), discoveredDigboxCounts: counts },
    profiles: (payload.data?.profiles || []).filter((value): value is MySizeProfile => Boolean(value) && typeof value === "object"),
  };
};

export const fetchTasteAnalysis = async (source: TasteCollectionSource): Promise<{ source: TasteCollectionSource; products: Product[]; graph: SerializedTasteGraphState }> => {
  const endpoint = `/api/taste-analysis?source=${encodeURIComponent(source)}`;
  const response = await authenticatedFetch(endpoint);
  const payload = await parseApiJson<{ ok?: boolean; data?: { source?: TasteCollectionSource; products?: Product[]; graph?: SerializedTasteGraphState }; error?: string }>(response, endpoint);
  if (!response.ok || !payload.ok || !payload.data?.graph) throw new Error(payload.error || apiMessage('tasteAnalysisLoadFailed'));
  return {
    source: payload.data.source === "closet" ? "closet" : "digbox",
    products: Array.isArray(payload.data.products) ? payload.data.products : [],
    graph: payload.data.graph,
  };
};

export const fetchAllProducts = async (): Promise<Product[]> => {
  const endpoint = '/api/admin/products';
  const response = await fetch(endpoint, { cache: 'no-store' });
  const payload = await parseApiJson<{ ok?: boolean; data?: { products?: Product[] }; error?: string }>(response, endpoint);
  if (!response.ok || !payload.ok) throw new Error(payload.error || apiMessage('loadProducts'));
  return Array.isArray(payload.data?.products) ? payload.data.products : [];
};

const catalogRequests = new Map<string, Promise<CatalogPage>>();

export const fetchCatalogProducts = (offset = 0, limit = 24): Promise<CatalogPage> => {
  const endpoint = `/api/catalog/products?offset=${encodeURIComponent(offset)}&limit=${encodeURIComponent(limit)}`;
  const existing = catalogRequests.get(endpoint);
  if (existing) return existing;
  const request = (async () => {
  const response = await fetch(endpoint);
  const payload = await parseApiJson<{ ok?: boolean; data?: { products?: ProductCardData[]; nextOffset?: number | null }; error?: string }>(response, endpoint);
  if (!response.ok || !payload.ok) throw new Error(payload.error || apiMessage('loadProducts'));
  return {
    products: Array.isArray(payload.data?.products) ? payload.data.products : [],
    nextOffset: typeof payload.data?.nextOffset === "number" ? payload.data.nextOffset : null,
  };
  })();
  catalogRequests.set(endpoint, request);
  void request.then(
    () => catalogRequests.delete(endpoint),
    () => catalogRequests.delete(endpoint),
  );
  return request;
};

export const searchCatalogProducts = async (query: string, signal?: AbortSignal, limit = 8): Promise<Product[]> => {
  const endpoint = `/api/catalog/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`;
  const response = await fetch(endpoint, { signal });
  const payload = await parseApiJson<{ ok?: boolean; data?: { products?: Product[] }; error?: string }>(response, endpoint);
  if (!response.ok || !payload.ok) throw new Error(payload.error || apiMessage('searchProducts'));
  return Array.isArray(payload.data?.products) ? payload.data.products : [];
};

export const fetchCatalogProductsByIds = async (ids: string[], signal?: AbortSignal): Promise<Product[]> => {
  const uniqueIds = Array.from(new Set(ids.map(String).filter(Boolean))).slice(0, 3);
  if (!uniqueIds.length) return [];
  const endpoint = `/api/catalog/by-ids?ids=${encodeURIComponent(uniqueIds.join(','))}`;
  const response = await fetch(endpoint, { signal });
  const payload = await parseApiJson<{ ok?: boolean; data?: { products?: Product[] }; error?: string }>(response, endpoint);
  if (!response.ok || !payload.ok) throw new Error(payload.error || apiMessage('loadProductInfo'));
  return Array.isArray(payload.data?.products) ? payload.data.products : [];
};

export const uploadSubmissionImage = async (file: File): Promise<string> => {
  const form = new FormData();
  form.set('file', file);
  const response = await authenticatedFetch('/api/uploads/product-image', { method: 'POST', body: form });
  const payload = await parseApiJson<{ ok?: boolean; data?: { path?: string }; error?: string }>(response, '/api/uploads/product-image');
  if (!response.ok || !payload.ok || !payload.data?.path) throw new Error(payload.error || apiMessage('imageUploadFailed'));
  return payload.data.path;
};

export const submitProduct = async (form: SubmitProductForm, isInstagram = false): Promise<Product> => {
  let imagePath = '';
  if (form.productPhoto) {
    imagePath = await uploadSubmissionImage(form.productPhoto);
  } else {
    imagePath = String(form.productImageUrl || '').trim();
  }
  if (!imagePath) {
    throw new Error(apiMessage('productPhotoRequired'));
  }

  const { response, payload } = await postJson<object, { product?: Product }>(
    '/api/products',
    {
      brand: form.brand,
      name: form.name,
      category: form.category,
      url: form.url || null,
      image_path: imagePath,
      sizeTable: form.sizeTable ?? null,
      normalizedSizeTable: form.normalizedSizeTable ?? null,
      productMetadata: form.productMetadata ?? null,
      isInstagram,
    }
  );
  if (!response.ok || !payload?.ok) {
    console.error('[submitProduct] insert failed', payload?.error);
    throw new Error(payload?.error || apiMessage('productSubmitFailed'));
  }
  if (!payload.data?.product) {
    throw new Error(apiMessage('productSubmitNoProduct'));
  }
  return payload.data.product;
};

export const fetchProductMetadataFromUrl = async (url: string): Promise<ProductMetadataPayload> => {
  const { response, payload } = await postJson<{ url: string }, ProductMetadataPayload>(
    '/api/product-metadata',
    { url }
  );
  if (!response.ok || !payload?.ok || !payload?.data) {
    throw new Error(payload?.error || apiMessage('metadataFromUrlFailed'));
  }
  return payload.data as ProductMetadataPayload;
};

export const isProductUrlAlreadyRegistered = async (url: string): Promise<boolean> => {
  const endpoint = `/api/products?url=${encodeURIComponent(url)}`;
  const response = await fetch(endpoint, { cache: "no-store" });
  const payload = await parseApiJson<{ ok?: boolean; data?: { exists?: boolean }; error?: string }>(response, endpoint);
  if (!response.ok || !payload.ok) throw new Error(payload.error || apiMessage('loadProducts'));
  return Boolean(payload.data?.exists);
};

export const analyzeProductCategory = async (input: {
  brand: string;
  name: string;
  productMetadata?: ProductMetadataPayload['productMetadata'] | null;
  imageBase64?: string;
  mimeType?: string;
  imageUrl?: string;
}): Promise<string> => {
  const { response, payload } = await postJson<typeof input, { category?: string }>(
    '/api/product-category',
    input
  );
  if (!response.ok || !payload?.ok || !payload.data?.category) {
    throw new Error(payload?.error || '카테고리 분석에 실패했습니다.');
  }
  return String(payload.data.category);
};

export const extractSizeTableFromImage = async (base64Image: string, mimeType = 'image/png'): Promise<SizeTable> => {
  const { response, payload } = await postJson<{ imageBase64: string; mimeType: string }, unknown>(
    '/api/size-table',
    { imageBase64: base64Image, mimeType }
  );
  if (!response.ok || !payload?.ok || !payload?.data) {
    throw new Error(payload?.error ?? apiMessage('sizeTableExtractFailed'));
  }
  const normalized = normalizeSizeTable(payload.data);
  if (!normalized) {
    throw new Error(apiMessage('sizeTableNormalizeFailed'));
  }
  return normalized;
};

export const removeBackgroundWithGemini = async (base64Image: string): Promise<string> => {
  const { response, payload } = await postJson<
    { imageBase64: string; mimeType: string },
    { imageBase64?: string }
  >(
    '/api/remove-bg',
    { imageBase64: base64Image, mimeType: 'image/png' }
  );
  if (!response.ok || !payload?.ok || !payload?.data?.imageBase64) return base64Image;
  return String(payload.data.imageBase64);
};

export const fetchClosetItems = async (includeAnalysis = false): Promise<Product[]> => {
  const response = await authenticatedFetch(`/api/closet${includeAnalysis ? '?analysis=1' : ''}`);
  const payload = await parseApiJson<{ ok?: boolean; data?: { products?: unknown[] }; error?: string }>(response, '/api/closet');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || apiMessage('closetLoadFailed'));
  const rows = Array.isArray(payload?.data?.products) ? payload.data!.products : [];
  return rows.filter((p): p is Product => p !== null && typeof p === 'object');
};

export const addToCloset = async (productId: string, sizeSelection?: ClosetSizeSelection | null): Promise<void> => {
  const response = await authenticatedFetch('/api/closet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      selectedSizeLabel: sizeSelection?.label ?? null,
      selectedSizeRowIndex: sizeSelection?.rowIndex ?? null,
      selectedSizeSnapshot: sizeSelection?.snapshot ?? null,
    }),
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(response, '/api/closet');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || apiMessage('closetAddFailed'));
};

export const removeFromCloset = async (productId: string): Promise<void> => {
  const response = await authenticatedFetch(`/api/closet/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(response, '/api/closet/[productId]');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || apiMessage('closetRemoveFailed'));
};

export const fetchMySizes = async (): Promise<MySizeProfile[]> => {
  const response = await authenticatedFetch('/api/my-sizes');
  const payload = await parseApiJson<{ ok?: boolean; data?: { profiles?: unknown[] }; error?: string }>(response, '/api/my-sizes');
  if (!response.ok || !payload?.ok) return [];
  const rows = Array.isArray(payload?.data?.profiles) ? payload.data!.profiles : [];
  return rows.filter((profile): profile is MySizeProfile => profile !== null && typeof profile === 'object');
};

export const createMySize = async (input: MySizeInput): Promise<MySizeProfile> => {
  const { response, payload } = await postJson<MySizeInput, { profile?: MySizeProfile }>(
    '/api/my-sizes',
    input
  );
  if (!response.ok || !payload?.ok || !payload.data?.profile) {
    throw new Error(payload?.error || apiMessage('mySizeCreateFailed'));
  }
  return payload.data.profile;
};

export const updateMySize = async (id: string, input: MySizeUpdateInput): Promise<MySizeProfile> => {
  const response = await authenticatedFetch(`/api/my-sizes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await parseApiJson<{ ok?: boolean; data?: { profile?: MySizeProfile }; error?: string }>(response, '/api/my-sizes/[id]');
  if (!response.ok || !payload?.ok || !payload.data?.profile) {
    throw new Error(payload?.error || apiMessage('mySizeUpdateFailed'));
  }
  return payload.data.profile;
};

export const deleteMySize = async (id: string): Promise<void> => {
  const response = await authenticatedFetch(`/api/my-sizes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(response, '/api/my-sizes/[id]');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || apiMessage('mySizeDeleteFailed'));
};

export const fetchDigboxItems = async (): Promise<Product[]> => {
  const data = await fetchDigboxData();
  return data.products;
};

export const fetchDigboxData = async (includeAnalysis = false): Promise<{ products: Product[]; discoveredDigboxCounts: Record<string, number> }> => {
  const response = await authenticatedFetch(`/api/digbox${includeAnalysis ? '?analysis=1' : ''}`);
  const payload = await parseApiJson<{
    ok?: boolean;
    data?: { products?: unknown[]; discoveredDigboxCounts?: Record<string, unknown> };
    error?: string;
  }>(response, '/api/digbox');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || apiMessage('digboxLoadFailed'));
  const rows = Array.isArray(payload?.data?.products) ? payload.data!.products : [];
  const counts = payload?.data?.discoveredDigboxCounts;
  const discoveredDigboxCounts: Record<string, number> = {};
  for (const [productId, count] of Object.entries(counts && typeof counts === 'object' ? counts : {})) {
    const numericCount = Number(count) || 0;
    if (productId && numericCount > 0) {
      discoveredDigboxCounts[productId] = numericCount;
    }
  }
  return {
    products: rows.filter((p): p is Product => p !== null && typeof p === 'object'),
    discoveredDigboxCounts,
  };
};

export const addToDigbox = async (productId: string): Promise<void> => {
  const response = await authenticatedFetch('/api/digbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(response, '/api/digbox');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || apiMessage('digboxAddFailed'));
};

export const removeFromDigbox = async (productId: string): Promise<void> => {
  const response = await authenticatedFetch(`/api/digbox/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(response, '/api/digbox/[productId]');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || apiMessage('digboxRemoveFailed'));
};

export const updateDigboxSizeDecision = async (
  productId: string,
  decision: DigboxSizeDecisionInput | null
): Promise<void> => {
  const response = await authenticatedFetch(`/api/digbox/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(response, '/api/digbox/[productId]');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || apiMessage('digboxSizeDecisionSaveFailed'));
};

export const deleteMyAccount = async (): Promise<void> => {
  const response = await authenticatedFetch('/api/auth/delete-account', {
    method: 'POST',
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(
    response,
    '/api/auth/delete-account'
  );
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || apiMessage('accountDeleteFailed'));
  }
};

export const cleanupUnregisteredGoogleAccount = async (): Promise<void> => {
  const response = await authenticatedFetch('/api/auth/cleanup-unregistered', {
    method: 'POST',
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(response, '/api/auth/cleanup-unregistered');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || apiMessage('cleanupFailed'));
};

export const completeMyProfile = async (username: string): Promise<string> => {
  const { response, payload } = await postJson<{ username: string }, { username?: string }>(
    '/api/auth/complete-profile',
    { username }
  );
  if (!response.ok || !payload?.ok || !payload.data?.username) {
    throw new Error(payload?.error || apiMessage('profileCompleteFailed'));
  }
  return payload.data.username;
};
