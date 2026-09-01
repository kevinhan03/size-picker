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
  subCategory?: string | null;
  categoryReviewed?: boolean;
  categoryAnalysisStatus?: "pending" | "completed" | "failed";
  url: string;
  image: string;
  thumbnailImage?: string;
  imagePath?: string | null;
  slug?: string | null;
  sizeTable?: SizeTable | null;
  normalizedSizeTable?: SizeTable | null;
  createdAt?: string;
  /** When this product was saved to a user's collection, distinct from catalog registration time. */
  collectionAddedAt?: string | null;
  registeredBy?: string | null;
  isInstagram?: boolean;
  instagramOrder?: number | null;
  closetSelectedSizeLabel?: string | null;
  closetSelectedSizeRowIndex?: number | null;
  closetSelectedSizeSnapshot?: ClosetSizeSnapshot | null;
  digboxSizeDecision?: DigboxSizeDecision | null;
  styleTags?: StyleTags | null;
  styleAttributes?: StyleAttributes | null;
  styleAxes?: StyleAxes | null;
  styleTagsEvidence?: StyleTagsEvidence | null;
  styleTagsConfidence?: number | null;
  taggingStatus?: string | null;
  styleAxisAnalysisStatus?: string | null;
  styleAxisAnalysisError?: string | null;
  styleAxisAnalyzedAt?: string | null;
  styleAxisReviewRequired?: boolean;
  factsReviewedAt?: string | null;
  factsReviewedBy?: string | null;
  styleAxesReviewedAt?: string | null;
  styleAxesReviewedBy?: string | null;
  taggingError?: string | null;
  taggedAt?: string | null;
  humanStyleTags?: StyleTags | null;
  humanStyleAttributes?: StyleAttributes | null;
  humanStyleAxes?: StyleAxes | null;
  humanStyleTagsEvidence?: StyleTagsEvidence | null;
  tagReviewStatus?: TagReviewStatus | null;
  tagReviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  imageEmbedding?: string | number[] | null;
  targetGender?: ProductTargetGender | null;
  humanTargetGender?: ProductTargetGender | null;
  targetGenderReviewedBy?: string | null;
  targetGenderReviewedAt?: string | null;
}

export type ProductCardData = Pick<
  Product,
  | "id"
  | "brand"
  | "name"
  | "category"
  | "subCategory"
  | "categoryAnalysisStatus"
  | "url"
  | "image"
  | "thumbnailImage"
  | "slug"
  | "createdAt"
  | "isInstagram"
  | "instagramOrder"
  | "targetGender"
>;

export type ProductDetailData = Pick<
  Product,
  | keyof ProductCardData
  | "imagePath"
  | "sizeTable"
  | "normalizedSizeTable"
  | "registeredBy"
  | "styleTags"
  | "styleAttributes"
  | "styleAxes"
  | "humanStyleTags"
  | "humanStyleAttributes"
  | "humanStyleAxes"
  | "styleAxisReviewRequired"
  | "factsReviewedAt"
  | "styleAxesReviewedAt"
  | "tagReviewStatus"
  | "taggingStatus"
>;

export interface CatalogPage {
  products: ProductCardData[];
  nextOffset: number | null;
}

export interface AuthInitialState {
  user: { id: string; email?: string } | null;
  username: string | null;
  needsUsername: boolean;
}

export type DiscoveryProduct = Product & {
  saveCount: number;
};

export interface MyPageInitialData {
  closetProducts: Product[];
  mySizes: MySizeProfile[];
  discoveries: DiscoveryProduct[];
  discoveryTotalSaveCount: number;
}

export type ProductTargetGender =
  "menswear" | "womenswear" | "unisex" | "unknown";

export type StyleTagName =
  | "casual"
  | "minimal"
  | "street"
  | "classic"
  | "vintage"
  | "lovely_romantic"
  | "sporty"
  | "workwear_gorpcore"
  | "chic_modern"
  | "glam_sexy";

export type StyleTags = Record<StyleTagName, number>;
export type StyleAttributes = Record<string, unknown>;
export type StyleAxisName =
  | "formality"
  | "refinement"
  | "technicality"
  | "historical_orientation"
  | "visual_boldness"
  | "affective_softness"
  | "unconventionality"
  | "sensuality";
export type StyleAxes = Record<StyleAxisName, number>;
export type StyleAttributeEvidence = Partial<Record<string, string[]>>;
export type StyleTagsEvidence = Partial<Record<StyleTagName, string[]>> & {
  attributes?: StyleAttributeEvidence;
};
export type TagReviewStatus =
  "needs_review" | "approved" | "edited" | "rejected";

export interface ProductStyleReviewInput {
  tagReviewStatus?: TagReviewStatus;
  humanStyleTags?: StyleTags | null;
  humanStyleAttributes?: StyleAttributes | null;
  humanStyleAxes?: StyleAxes | null;
  approveFacts?: boolean;
  approveStyleAxes?: boolean;
  humanStyleTagsEvidence?: StyleTagsEvidence | null;
  tagReviewNote?: string | null;
  targetGender?: ProductTargetGender;
  category?: string | null;
  subCategory?: string | null;
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

export type SizeDecisionSource = "comparison" | "try_on" | "worn";
export type SizeDecisionFit = "tight" | "true_to_size" | "roomy";

export interface DigboxSizeDecision {
  label: string | null;
  rowIndex: number | null;
  snapshot: ClosetSizeSnapshot | null;
  sources: SizeDecisionSource[];
  fit: SizeDecisionFit | null;
  note: string | null;
  updatedAt?: string | null;
}

export type DigboxSizeDecisionInput = Omit<DigboxSizeDecision, "updatedAt">;

export interface ProductRow {
  id: string | number;
  brand: string;
  name: string;
  category?: string | null;
  sub_category?: string | null;
  category_reviewed?: boolean | null;
  category_analysis_status?: "pending" | "completed" | "failed" | null;
  url?: string | null;
  size_table?: unknown;
  normalized_size_table?: unknown;
  created_at?: string | null;
  collection_added_at?: string | null;
  image_path?: string | null;
  slug?: string | null;
  is_instagram?: boolean | null;
  instagram_order?: number | null;
  registered_by?: string | null;
  style_tags?: unknown;
  style_attributes?: unknown;
  style_axes?: unknown;
  style_tags_evidence?: unknown;
  style_tags_confidence?: number | null;
  tagging_status?: string | null;
  tagging_error?: string | null;
  tagged_at?: string | null;
  human_style_tags?: unknown;
  human_style_attributes?: unknown;
  human_style_axes?: unknown;
  style_axis_analysis_status?: string | null;
  style_axis_analysis_error?: string | null;
  style_axis_analyzed_at?: string | null;
  style_axis_review_required?: boolean;
  facts_reviewed_at?: string | null;
  facts_reviewed_by?: string | null;
  style_axes_reviewed_at?: string | null;
  style_axes_reviewed_by?: string | null;
  human_style_tags_evidence?: unknown;
  tag_review_status?: string | null;
  tag_review_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  image_embedding?: unknown;
  target_gender?: string | null;
  human_target_gender?: string | null;
  target_gender_reviewed_by?: string | null;
  target_gender_reviewed_at?: string | null;
}

export interface SubmitProductForm {
  brand: string;
  name: string;
  category: string;
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

export interface ProductMetadataPayload {
  url: string;
  brand: string;
  name: string;
  image_path?: string;
  productImageCandidates?: string[];
  productMetadata?: ProductTaggingMetadata | null;
  sizeTable?: unknown;
}

export interface ProductTaggingMetadata {
  metadata_source: "product_page";
  product_summary: string;
  materials: string[];
  fit_silhouette: string[];
  design_details: string[];
  functional_features: string[];
  color: string[];
  pattern_texture: string[];
  target_gender_evidence: string[];
  care: string[];
  category_details:
    | {
        detail_type: string;
        attributes: Record<string, string[]>;
      }
    | Record<string, never>;
}

export interface AdminEditForm {
  brand: string;
  name: string;
  category: string;
  subCategory: string;
  url: string;
}

export interface BrandRule {
  matchType: "brand";
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

export type OutfitRequestStatus = "open" | "accepted" | "closed";
export type OutfitRequestScope = "open" | "completed" | "mine" | "proposed";
export type OutfitRequestMineStatus = "all" | OutfitRequestStatus;
export type OutfitFocusMatch = "all" | "partial" | "none" | "not_applicable";

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
  myProposalId?: string;
  proposedAt?: string;
  isAccepted?: boolean;
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
