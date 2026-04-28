import type {
  BrandBackfillResult,
  BrandRule,
  ClosetSizeSelection,
  Product,
  ProductMetadataPayload,
  ProductRow,
  SizeTable,
  SubmitProductForm,
} from '../types';
import { STORAGE_BUCKET, STORAGE_PREFIX } from '../constants';
import { supabase, assertSupabaseClient } from '../lib/supabase';
import { getFileExtension } from '../utils/image';
import { normalizeSizeTable } from '../utils/sizeTable';
import { normalizeProduct } from '../utils/product';
import { parseApiJson, postJson } from './shared';

export const fetchAllProducts = async (): Promise<Product[]> => {
  assertSupabaseClient();
  const { data, error } = await supabase!
    .from('products')
    .select('id,brand,name,category,url,size_table,normalized_size_table,created_at,image_path,slug,is_instagram,instagram_order')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? (data as ProductRow[]) : [];
  return rows
    .map((row) => normalizeProduct(row))
    .filter((product: Product | null): product is Product => product !== null);
};

export const uploadSubmissionImage = async (file: File): Promise<string> => {
  assertSupabaseClient();
  const extension = getFileExtension(file);
  const path = `${STORAGE_PREFIX}${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase!.storage.from(STORAGE_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error || !data?.path) {
    console.error('[uploadSubmissionImage] upload failed', {
      errorMessage: error?.message,
      error,
      path,
      bucket: STORAGE_BUCKET,
      startsWithSubmissions: path.startsWith(STORAGE_PREFIX),
    });
    throw new Error(error?.message || 'Image upload failed');
  }
  return data.path;
};

export const submitProduct = async (form: SubmitProductForm, isInstagram = false): Promise<void> => {
  const category = String(form.category || '').trim();
  if (!category) {
    throw new Error('카테고리는 필수입니다.');
  }
  let imagePath = '';
  if (form.productPhoto) {
    imagePath = await uploadSubmissionImage(form.productPhoto);
  } else {
    imagePath = String(form.productImageUrl || '').trim();
  }
  if (!imagePath) {
    throw new Error('상품 사진은 필수입니다.');
  }

  const { response, payload } = await postJson<object, unknown>('/api/products', {
    brand: form.brand,
    name: form.name,
    category,
    url: form.url || null,
    image_path: imagePath,
    sizeTable: form.sizeTable ?? null,
    normalizedSizeTable: form.normalizedSizeTable ?? null,
    isInstagram,
  });
  if (!response.ok || !payload?.ok) {
    console.error('[submitProduct] insert failed', payload?.error);
    throw new Error(payload?.error || 'Product submission failed');
  }
};

const getAccessToken = async (): Promise<string> => {
  assertSupabaseClient();
  const { data: { session } } = await supabase!.auth.getSession();
  return String(session?.access_token || '').trim();
};

export const fetchProductMetadataFromUrl = async (url: string): Promise<ProductMetadataPayload> => {
  const { response, payload } = await postJson<{ url: string }, ProductMetadataPayload>(
    '/api/product-metadata',
    { url }
  );
  if (!response.ok || !payload?.ok || !payload?.data) {
    throw new Error(payload?.error || 'Failed to extract metadata from URL');
  }
  return payload.data as ProductMetadataPayload;
};

export const fetchProductMetadataFromImage = async (
  base64Image: string,
  mimeType = 'image/png'
): Promise<ProductMetadataPayload> => {
  const token = await getAccessToken();
  const { response, payload } = await postJson<
    { imageBase64: string; mimeType: string },
    ProductMetadataPayload
  >(
    '/api/product-metadata-from-image',
    { imageBase64: base64Image, mimeType },
    token ? { Authorization: `Bearer ${token}` } : undefined
  );
  if (!response.ok || !payload?.ok || !payload?.data) {
    throw new Error(payload?.error || 'Failed to extract metadata from image');
  }
  return payload.data as ProductMetadataPayload;
};

export const extractSizeTableFromImage = async (base64Image: string, mimeType = 'image/png'): Promise<SizeTable> => {
  const token = await getAccessToken();
  const { response, payload } = await postJson<{ imageBase64: string; mimeType: string }, unknown>(
    '/api/size-table',
    { imageBase64: base64Image, mimeType },
    token ? { Authorization: `Bearer ${token}` } : undefined
  );
  if (!response.ok || !payload?.ok || !payload?.data) {
    throw new Error(payload?.error ?? 'Failed to extract size table');
  }
  const normalized = normalizeSizeTable(payload.data);
  if (!normalized) {
    throw new Error('Failed to normalize extracted size table');
  }
  return normalized;
};

export const removeBackgroundWithGemini = async (base64Image: string): Promise<string> => {
  const token = await getAccessToken();
  const { response, payload } = await postJson<
    { imageBase64: string; mimeType: string },
    { imageBase64?: string }
  >(
    '/api/remove-bg',
    { imageBase64: base64Image, mimeType: 'image/png' },
    token ? { Authorization: `Bearer ${token}` } : undefined
  );
  if (!response.ok || !payload?.ok || !payload?.data?.imageBase64) return base64Image;
  return String(payload.data.imageBase64);
};

export const fetchClosetItems = async (): Promise<Product[]> => {
  const token = await getAccessToken();
  if (!token) return [];
  const response = await fetch('/api/closet', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await parseApiJson<{ ok?: boolean; data?: { products?: unknown[] }; error?: string }>(response, '/api/closet');
  if (!response.ok || !payload?.ok) return [];
  const rows = Array.isArray(payload?.data?.products) ? payload.data!.products : [];
  return rows.filter((p): p is Product => p !== null && typeof p === 'object');
};

export const addToCloset = async (productId: string, sizeSelection?: ClosetSizeSelection | null): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const response = await fetch('/api/closet', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      selectedSizeLabel: sizeSelection?.label ?? null,
      selectedSizeRowIndex: sizeSelection?.rowIndex ?? null,
      selectedSizeSnapshot: sizeSelection?.snapshot ?? null,
    }),
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(response, '/api/closet');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || '옷장 추가 실패');
};

export const removeFromCloset = async (productId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const response = await fetch(`/api/closet/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(response, '/api/closet/[productId]');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || '옷장 제거 실패');
};

export const fetchDigboxItems = async (): Promise<Product[]> => {
  const token = await getAccessToken();
  if (!token) return [];
  const response = await fetch('/api/digbox', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await parseApiJson<{ ok?: boolean; data?: { products?: unknown[] }; error?: string }>(response, '/api/digbox');
  if (!response.ok || !payload?.ok) return [];
  const rows = Array.isArray(payload?.data?.products) ? payload.data!.products : [];
  return rows.filter((p): p is Product => p !== null && typeof p === 'object');
};

export const addToDigbox = async (productId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const response = await fetch('/api/digbox', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(response, '/api/digbox');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'DIGBOX 추가 실패');
};

export const removeFromDigbox = async (productId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const response = await fetch(`/api/digbox/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(response, '/api/digbox/[productId]');
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'DIGBOX 제거 실패');
};

export const deleteMyAccount = async (): Promise<void> => {
  assertSupabaseClient();
  const {
    data: { session },
  } = await supabase!.auth.getSession();
  const accessToken = String(session?.access_token || '').trim();
  if (!accessToken) {
    throw new Error('Authentication is required');
  }

  const response = await fetch('/api/auth/delete-account', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string }>(
    response,
    '/api/auth/delete-account'
  );
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to delete account');
  }
};
