import type { Product, ProductRow, SubmitProductForm, SizeTable, ProductMetadataPayload } from '../types';
import { STORAGE_BUCKET, STORAGE_PREFIX } from '../constants';
import { supabase, assertSupabaseClient } from '../lib/supabase';
import { getFileExtension } from '../utils/image';
import { normalizeSizeTable } from '../utils/sizeTable';
import { normalizeProduct } from '../utils/product';

export const searchProducts = async (query: string): Promise<Product[]> => {
  assertSupabaseClient();
  const keyword = query.trim();
  let request = supabase!
    .from('products')
    .select('id,brand,name,category,url,size_table,created_at,image_path')
    .order('created_at', { ascending: false });
  if (keyword) request = request.or(`brand.ilike.%${keyword}%,name.ilike.%${keyword}%`);
  const { data, error } = await request;
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
  assertSupabaseClient();
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

  const payload = {
    brand: form.brand,
    name: form.name,
    category,
    url: form.url || null,
    image_path: imagePath,
    size_table: form.sizeTable ?? null,
  };

  const { error } = await supabase!.from('products').insert(payload);
  if (error) {
    console.error('[submitProduct] insert failed', error.message, error);
    throw new Error(error.message);
  }
};

const parseApiJson = async <T,>(response: Response, endpoint: string): Promise<T> => {
  const rawText = await response.text();
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    const preview = rawText.slice(0, 120).replace(/\s+/g, ' ').trim();
    throw new Error(`${endpoint} returned non-JSON response (${response.status}). ${preview}`);
  }

  try {
    return JSON.parse(rawText);
  } catch {
    const preview = rawText.slice(0, 120).replace(/\s+/g, ' ').trim();
    throw new Error(`${endpoint} returned invalid JSON (${response.status}). ${preview}`);
  }
};

export const fetchProductMetadataFromUrl = async (url: string): Promise<ProductMetadataPayload> => {
  const response = await fetch('/api/product-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string; data?: ProductMetadataPayload }>(
    response,
    '/api/product-metadata'
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
  const response = await fetch('/api/product-metadata-from-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64Image, mimeType }),
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string; data?: ProductMetadataPayload }>(
    response,
    '/api/product-metadata-from-image'
  );
  if (!response.ok || !payload?.ok || !payload?.data) {
    throw new Error(payload?.error || 'Failed to extract metadata from image');
  }
  return payload.data as ProductMetadataPayload;
};

export const extractSizeTableFromImage = async (base64Image: string, mimeType = 'image/png'): Promise<SizeTable> => {
  const response = await fetch('/api/size-table', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64Image, mimeType }),
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string; data?: unknown }>(
    response,
    '/api/size-table'
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
  const response = await fetch('/api/remove-bg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64Image, mimeType: 'image/png' }),
  });
  const payload = await parseApiJson<{ ok?: boolean; error?: string; data?: { imageBase64?: string } }>(
    response,
    '/api/remove-bg'
  );
  if (!response.ok || !payload?.ok || !payload?.data?.imageBase64) return base64Image;
  return String(payload.data.imageBase64);
};
