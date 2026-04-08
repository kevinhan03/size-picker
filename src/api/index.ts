import type {
  BrandBackfillResult,
  BrandRule,
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
    .select('id,brand,name,category,url,size_table,created_at,image_path,slug')
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

export const submitProduct = async (form: SubmitProductForm): Promise<void> => {
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
