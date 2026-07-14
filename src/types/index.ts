export interface SizeTable {
  headers: string[];
  rows: string[][];
  extra?: {
    headers: string[];
    rows: string[][];
  } | null;
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
  normalizedSizeTable?: SizeTable | null;
  createdAt?: string;
  registeredBy?: string | null;
  isInstagram?: boolean;
  instagramOrder?: number | null;
  closetSelectedSizeLabel?: string | null;
  closetSelectedSizeRowIndex?: number | null;
  closetSelectedSizeSnapshot?: ClosetSizeSnapshot | null;
  styleTags?: StyleTags | null;
  styleAttributes?: StyleAttributes | null;
  styleTagsEvidence?: StyleTagsEvidence | null;
  styleTagsConfidence?: number | null;
  taggingStatus?: string | null;
  taggingError?: string | null;
  taggedAt?: string | null;
  humanStyleTags?: StyleTags | null;
  humanStyleAttributes?: StyleAttributes | null;
  humanStyleTagsEvidence?: StyleTagsEvidence | null;
  tagReviewStatus?: TagReviewStatus | null;
  tagReviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  imageEmbedding?: string | number[] | null;
}

export type StyleTagName =
  | 'casual'
  | 'minimal'
  | 'street'
  | 'classic'
  | 'vintage'
  | 'lovely_romantic'
  | 'sporty'
  | 'workwear_gorpcore'
  | 'chic_modern'
  | 'glam_sexy';

export type StyleTags = Record<StyleTagName, number>;
export type StyleAttributes = Record<string, unknown>;
export type StyleTagsEvidence = Partial<Record<StyleTagName, string[]>>;
export type TagReviewStatus = 'needs_review' | 'approved' | 'edited' | 'rejected';

export interface RelatedGraphReason {
  similarity: number;
  sharedTags: Array<{ tag: StyleTagName; score: number }>;
  sameCategory: boolean;
  hasHumanReviewedTags: boolean;
}

export interface ProductStyleReviewInput {
  tagReviewStatus?: TagReviewStatus;
  humanStyleTags?: StyleTags | null;
  humanStyleAttributes?: StyleAttributes | null;
  humanStyleTagsEvidence?: StyleTagsEvidence | null;
  tagReviewNote?: string | null;
}

export interface ClosetSizeSnapshot {
  headers: string[];
  row: string[];
}

export type MySizeSnapshot = ClosetSizeSnapshot;

export interface MySizeProfile {
  id: string;
  userId?: string;
  sourceProductId: string | null;
  brand: string | null;
  category: string;
  title: string;
  sizeLabel: string | null;
  measurementSnapshot: MySizeSnapshot;
  fitNote: string | null;
  createdAt?: string | null;
}

export interface MySizeInput {
  sourceProductId?: string | null;
  brand?: string | null;
  category: string;
  title: string;
  sizeLabel?: string | null;
  measurementSnapshot: MySizeSnapshot;
  fitNote?: string | null;
}

export type MySizeUpdateInput = Partial<MySizeInput>;

export interface ClosetSizeSelection {
  label: string | null;
  rowIndex: number | null;
  snapshot: ClosetSizeSnapshot | null;
}

export interface ProductRow {
  id: string | number;
  brand: string;
  name: string;
  category?: string | null;
  url?: string | null;
  size_table?: unknown;
  normalized_size_table?: unknown;
  created_at?: string | null;
  image_path?: string | null;
  slug?: string | null;
  is_instagram?: boolean | null;
  instagram_order?: number | null;
  registered_by?: string | null;
  style_tags?: unknown;
  style_attributes?: unknown;
  style_tags_evidence?: unknown;
  style_tags_confidence?: number | null;
  tagging_status?: string | null;
  tagging_error?: string | null;
  tagged_at?: string | null;
  human_style_tags?: unknown;
  human_style_attributes?: unknown;
  human_style_tags_evidence?: unknown;
  tag_review_status?: string | null;
  tag_review_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  image_embedding?: unknown;
}

export interface SubmitProductForm {
  brand: string;
  name: string;
  category?: string | null;
  url?: string | null;
  sizeTable?: SizeTable | null;
  normalizedSizeTable?: SizeTable | null;
  productPhoto?: File | null;
  productImageUrl?: string | null;
  productMetadata?: ProductTaggingMetadata | null;
}

export interface AddProductFormData {
  brand: string;
  name: string;
  category: string;
  url: string;
  productImage: string | null;
  sizeChartImage: string | null;
  extractedTable: SizeTable | null;
  rawExtractedTable: SizeTable | null;
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
  taggingTextCandidates?: string[];
  sizeTable?: unknown;
}

export interface ProductTaggingMetadata {
  image_candidates?: string[];
  tagging_text_candidates?: string[];
  metadata_source?: string;
}

export interface AdminEditForm {
  brand: string;
  name: string;
  category: string;
  url: string;
}

export interface BrandRule {
  matchType: 'brand';
  matchValue: string;
  canonicalBrand: string;
}

export interface BrandInfo {
  brand: string;
  count: number;
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

export interface SizeRecommendation {
  product: Product;
  rowIndex: number;
  score: number;
}

export type AddProductMode = 'menu' | 'capture' | 'url' | 'manual';

export type OutfitRequestStatus = 'open' | 'accepted' | 'closed';
export type OutfitRequestScope = 'open' | 'completed' | 'mine';
export type OutfitRequestMineStatus = 'all' | OutfitRequestStatus;
export type OutfitFocusMatch = 'all' | 'partial' | 'none' | 'not_applicable';

export interface OutfitRequestSummary {
  id: string;
  authorId: string;
  authorUsername: string;
  description: string;
  status: OutfitRequestStatus;
  acceptedProposalId: string | null;
  createdAt: string;
  itemCount: number;
  proposalCount: number;
  previewProducts: Product[];
  focusProducts: Product[];
}

export interface OutfitProposal {
  id: string;
  authorId: string;
  authorUsername: string;
  explanation: string;
  createdAt: string;
  products: Product[];
  focusMatch: OutfitFocusMatch;
  matchedFocusItemCount: number;
}

export interface OutfitRequestDetail {
  id: string;
  authorId: string;
  authorUsername: string;
  description: string;
  status: OutfitRequestStatus;
  acceptedProposalId: string | null;
  createdAt: string;
  products: Product[];
  focusProductIds: string[];
  proposals: OutfitProposal[];
}
