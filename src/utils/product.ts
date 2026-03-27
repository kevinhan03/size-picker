import type { Product, ProductRow } from '../types';
import { STORAGE_BUCKET, CATEGORY_OPTIONS, CATEGORY_OPTION_BY_LOWER } from '../constants';
import { supabase, assertSupabaseClient } from '../lib/supabase';
import { normalizeSizeTable } from './sizeTable';

export const isExternalHttpUrl = (value: string | null | undefined): boolean =>
  /^https?:\/\//i.test(String(value || '').trim());

export const uniqHttpUrls = (values: Array<string | null | undefined>): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (!/^https?:\/\//i.test(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
};

export const normalizeComparableProductUrl = (value: string): string => {
  const raw = String(value || '').trim();
  if (!raw || raw === '#') return '';

  try {
    const parsed = new URL(raw);
    const hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    const search = parsed.search || '';
    return `${parsed.protocol.toLowerCase()}//${hostname}${pathname}${search}`;
  } catch {
    return raw.toLowerCase();
  }
};

export const normalizeCategoryOption = (value: string): (typeof CATEGORY_OPTIONS)[number] | '' => {
  const normalized = String(value || '').trim().toLowerCase();
  return CATEGORY_OPTION_BY_LOWER[normalized] || '';
};

export const isOptionalMetadataCategory = (category: string): boolean =>
  category === 'Shoes' || category === 'Acc' || category === '단종된 상품(빈티지)';

export const isDuplicateProductErrorMessage = (message: string): boolean => {
  const normalized = String(message || '').toLowerCase();
  return (
    normalized.includes('products_unique_key') ||
    normalized.includes('duplicate key value') ||
    normalized.includes('unique constraint') ||
    normalized.includes('이미 등록된 상품')
  );
};

export const toPublicUrl = (
  path: string | null | undefined,
  options?: { width?: number; height?: number; quality?: number }
): string => {
  if (!path) return '';
  if (isExternalHttpUrl(path)) return path;
  assertSupabaseClient();
  const result = options
    ? supabase!.storage.from(STORAGE_BUCKET).getPublicUrl(path, {
        transform: {
          width: options.width,
          height: options.height,
          quality: options.quality,
        },
      })
    : supabase!.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return result.data.publicUrl;
};

export const normalizeProduct = (row: ProductRow): Product | null => {
  const id = String(row.id ?? '').trim();
  const brand = String(row.brand ?? '').trim();
  const name = String(row.name ?? '').trim();
  if (!id || !brand || !name) return null;
  const imagePath = row.image_path ?? null;
  return {
    id,
    brand,
    name,
    category: String(row.category ?? 'Uncategorized'),
    url: String(row.url ?? ''),
    image: toPublicUrl(imagePath),
    thumbnailImage: toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 }),
    imagePath,
    sizeTable: normalizeSizeTable(row.size_table),
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
};

export const generateFallbackResult = (term: string): Product => ({
  id: Date.now().toString(),
  brand: term.split(' ')[0].toUpperCase() || 'BRAND',
  name: term,
  category: 'Unknown',
  url: `https://www.google.com/search?q=${encodeURIComponent(term)}`,
  image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
  thumbnailImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=60',
  sizeTable: {
    headers: ['정보 없음'],
    rows: [['데이터베이스에 없는 상품입니다.']],
  },
});
