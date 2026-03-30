export interface SizeTable {
  headers: string[];
  rows: string[][];
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  category: string;
  url: string;
  image: string;
  thumbnailImage?: string;
  imagePath?: string | null;
  slug?: string | null;
  sizeTable: SizeTable | null;
  createdAt?: string;
}

export interface ProductRow {
  id: string | number;
  brand: string;
  name: string;
  category?: string | null;
  url?: string | null;
  size_table?: unknown;
  created_at?: string | null;
  image_path?: string | null;
  slug?: string | null;
}

export interface SubmitProductForm {
  brand: string;
  name: string;
  category?: string | null;
  url?: string | null;
  sizeTable?: SizeTable | null;
  productPhoto?: File | null;
  productImageUrl?: string | null;
}

export interface AddProductFormData {
  brand: string;
  name: string;
  category: string;
  url: string;
  productImage: string | null;
  sizeChartImage: string | null;
  extractedTable: SizeTable | null;
}

export interface ProductMetadataImagePayload {
  sourceUrl: string;
  mimeType: string;
  base64: string;
}

export interface CaptureBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProductMetadataPayload {
  url: string;
  brand: string;
  name: string;
  category?: string;
  image_path?: string;
  product_image_bbox?: CaptureBoundingBox | null;
  size_chart_bbox?: CaptureBoundingBox | null;
  productImage: ProductMetadataImagePayload | null;
  productImageCandidates?: string[];
  sizeTable?: unknown;
}

export interface AdminEditForm {
  brand: string;
  name: string;
  category: string;
  url: string;
}

export interface BrandRule {
  matchType: 'domain' | 'url' | 'brand' | 'brand_contains';
  matchValue: string;
  canonicalBrand: string;
}

export interface BrandBackfillChange {
  id: string;
  name: string;
  url: string;
  previousBrand: string;
  canonicalBrand: string;
  updated: boolean;
  error: string;
}

export interface BrandBackfillResult {
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  changes: BrandBackfillChange[];
}

export interface SizeConversionRow {
  label: string;
  kr: string;
  jp: string;
  us: string;
  eu: string;
  uk: string;
}

export interface SizeRecommendation {
  product: Product;
  rowIndex: number;
  score: number;
}

export type SizeCategory = 'clothing' | 'shoes';
export type SizeGender = 'men' | 'women';
export type SizeRegionKey = 'kr' | 'jp' | 'us' | 'eu' | 'uk';
export type AddProductMode = 'menu' | 'capture' | 'url' | 'manual';
