import type { Product, ProductRow, SizeTable } from '../types';
import { STORAGE_BUCKET, CATEGORY_OPTIONS, CATEGORY_OPTION_BY_LOWER } from '../constants';
import { SUPABASE_URL } from '../constants';
import { normalizeSizeTable } from './sizeTable';
import type { MessageKey } from '../i18n/messages';

export const isExternalHttpUrl = (value: string | null | undefined): boolean =>
  /^https?:\/\//i.test(String(value || '').trim());

export const getProductPageUrl = (product: { id: string; slug?: string | null }): string => {
  const slug = String(product.slug || '').trim();
  return slug ? `/product/${product.id}-${slug}` : `/product/${product.id}`;
};

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
  category === 'Shoes' || category === 'Bag' || category === 'JewelryWatch' || category === 'FashionAccessory' || category === 'Acc' || category === '단종된 상품(빈티지)';

export const isDuplicateProductErrorMessage = (message: string): boolean => {
  const normalized = String(message || '').toLowerCase();
  return (
    normalized.includes('products_unique_key') ||
    normalized.includes('duplicate key value') ||
    normalized.includes('unique constraint') ||
    normalized.includes('이미 등록된 상품') ||
    normalized.includes('already been added')
  );
};

export const toPublicUrl = (
  path: string | null | undefined,
  options?: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' }
): string => {
  if (!path) return '';
  if (isExternalHttpUrl(path)) return path;
  if (!SUPABASE_URL) return path;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const base = options ? 'render/image/public' : 'object/public';
  const url = new URL(`${SUPABASE_URL}/storage/v1/${base}/${STORAGE_BUCKET}/${encodedPath}`);
  if (options?.width) url.searchParams.set('width', String(options.width));
  if (options?.height) url.searchParams.set('height', String(options.height));
  if (options?.resize) url.searchParams.set('resize', options.resize);
  if (options?.quality) url.searchParams.set('quality', String(options.quality));
  return url.toString();
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
    category: row.category ? String(row.category) : '',
    subCategory: row.sub_category ? String(row.sub_category) : null,
    categoryReviewed: Boolean(row.category_reviewed),
    categoryAnalysisStatus: row.category_analysis_status ?? 'completed',
    url: String(row.url ?? ''),
    image: toPublicUrl(imagePath),
    thumbnailImage: toPublicUrl(imagePath, { width: 320, height: 320, resize: 'contain', quality: 65 }),
    imagePath,
    slug: String(row.slug ?? '').trim() || null,
    sizeTable: normalizeSizeTable(row.size_table),
    normalizedSizeTable: (() => {
      const raw = row.normalized_size_table;
      if (!raw) return null;
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!parsed || !Array.isArray(parsed.headers) || !Array.isArray(parsed.rows)) return null;
        return parsed as SizeTable;
      } catch { return null; }
    })(),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    collectionAddedAt: row.collection_added_at ? String(row.collection_added_at) : null,
    registeredBy: row.registered_by ? String(row.registered_by) : null,
    isInstagram: Boolean(row.is_instagram),
    instagramOrder: typeof row.instagram_order === 'number' ? row.instagram_order : null,
    styleTags: (row.style_tags ?? null) as Product['styleTags'],
    styleAttributes: (row.style_attributes ?? null) as Product['styleAttributes'],
    styleTagsEvidence: (row.style_tags_evidence ?? null) as Product['styleTagsEvidence'],
    styleTagsConfidence: typeof row.style_tags_confidence === 'number' ? row.style_tags_confidence : null,
    taggingStatus: row.tagging_status ? String(row.tagging_status) : null,
    taggingError: row.tagging_error ? String(row.tagging_error) : null,
    taggedAt: row.tagged_at || null,
    humanStyleTags: (row.human_style_tags ?? null) as Product['humanStyleTags'],
    humanStyleAttributes: (row.human_style_attributes ?? null) as Product['humanStyleAttributes'],
    humanStyleTagsEvidence: (row.human_style_tags_evidence ?? null) as Product['humanStyleTagsEvidence'],
    tagReviewStatus: row.tag_review_status ? String(row.tag_review_status) as Product['tagReviewStatus'] : null,
    tagReviewNote: row.tag_review_note ? String(row.tag_review_note) : null,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewedAt: row.reviewed_at || null,
    imageEmbedding:
      typeof row.image_embedding === 'string' || Array.isArray(row.image_embedding)
        ? row.image_embedding
        : null,
    targetGender: row.target_gender ? String(row.target_gender) as Product['targetGender'] : null,
    humanTargetGender: row.human_target_gender ? String(row.human_target_gender) as Product['humanTargetGender'] : null,
    targetGenderReviewedBy: row.target_gender_reviewed_by ? String(row.target_gender_reviewed_by) : null,
    targetGenderReviewedAt: row.target_gender_reviewed_at || null,
  };
};

export const generateFallbackResult = (
  term: string,
  t: (key: MessageKey) => string
): Product => ({
  id: Date.now().toString(),
  brand: term.split(' ')[0].toUpperCase() || 'BRAND',
  name: term,
  category: 'Unknown',
  url: `https://www.google.com/search?q=${encodeURIComponent(term)}`,
  image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
  thumbnailImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=60',
  sizeTable: {
    headers: [t('search.fallbackNoInfo')],
    rows: [[t('search.fallbackNotInDatabase')]],
  },
});
