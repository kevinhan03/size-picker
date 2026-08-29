import { MAX_PRODUCT_IMAGE_CANDIDATES } from "../../constants";
import type {
  AddProductFormData,
  ProductMetadataPayload,
  ProductTaggingMetadata,
  SubmitProductForm,
} from "../../types";
import { uniqHttpUrls } from "../../utils/product";
import type { MessageKey } from "../../i18n/messages";

export const getAutofillCandidateUrls = (
  extracted: ProductMetadataPayload
): string[] =>
  uniqHttpUrls([
    extracted.image_path || "",
    ...(Array.isArray(extracted.productImageCandidates)
      ? extracted.productImageCandidates
      : []),
  ]).slice(0, MAX_PRODUCT_IMAGE_CANDIDATES);

export const applyUrlAutofill = (
  prev: AddProductFormData,
  extracted: ProductMetadataPayload,
  selectedCandidateUrl: string
): AddProductFormData => ({
  ...prev,
  brand: extracted.brand || prev.brand,
  name: extracted.name || prev.name,
  url: extracted.url || prev.url,
  productImage: selectedCandidateUrl || prev.productImage,
});

interface SubmitValidationInput {
  hasBrand: boolean;
  hasName: boolean;
  hasProductImageCheck: boolean;
  hasValidatedSizeTable: boolean;
  inferredProductCategory?: string;
}

// URL metadata currently reports legacy lowercase categories. "acc" covers bags,
// jewelry/watches, and fashion accessories before the final category analysis splits them.
export const canRegisterWithoutSizeTable = (
  category: string | undefined
): boolean =>
  ["shoes", "bag", "jewelrywatch", "fashionaccessory", "acc"].includes(
    String(category || "")
      .trim()
      .toLowerCase()
  );

export const getSubmitValidationError = (
  {
    hasBrand,
    hasName,
    hasProductImageCheck,
    hasValidatedSizeTable,
    inferredProductCategory,
  }: SubmitValidationInput,
  t: (key: MessageKey) => string
): string | null => {
  if (!hasBrand) return t("addProduct.brandRequired");
  if (!hasName) return t("addProduct.nameRequired");
  if (!hasProductImageCheck) return t("addProduct.photoRequired");
  if (
    !hasValidatedSizeTable &&
    !canRegisterWithoutSizeTable(inferredProductCategory)
  ) {
    return t("addProduct.sizeTableRequired");
  }
  return null;
};

export const buildSubmitProductPayload = (
  formData: AddProductFormData,
  productPhotoFile: File | null,
  autofilledProductImageUrl: string | null,
  productMetadata: ProductTaggingMetadata | null = null
): SubmitProductForm => ({
  brand: formData.brand,
  name: formData.name,
  url: formData.url || null,
  sizeTable: formData.rawExtractedTable || formData.extractedTable,
  normalizedSizeTable: null,
  productPhoto: productPhotoFile,
  productImageUrl: autofilledProductImageUrl,
  productMetadata,
});

interface FormFlagsInput {
  formData: AddProductFormData;
  productPhotoFile: File | null;
  autofilledProductImageUrl: string | null;
  isAutofillingFromUrl: boolean;
  isProcessingImage: boolean;
  isAnalyzingTable: boolean;
  isSaving: boolean;
  inferredProductCategory?: string;
}

export const getProductFormFlags = (
  {
    formData,
    productPhotoFile,
    autofilledProductImageUrl,
    isAutofillingFromUrl,
    isProcessingImage,
    isAnalyzingTable,
    isSaving,
    inferredProductCategory,
  }: FormFlagsInput,
  t: (key: MessageKey) => string
) => {
  const hasSizeData = Boolean(formData.extractedTable);
  const hasProductImage =
    Boolean(productPhotoFile) || Boolean(autofilledProductImageUrl);
  const isPreviewOnlyProductImage =
    Boolean(formData.productImage) &&
    !productPhotoFile &&
    !autofilledProductImageUrl;
  const isFormValid =
    Boolean(formData.brand.trim()) &&
    Boolean(formData.name.trim()) &&
    hasProductImage &&
    (hasSizeData || canRegisterWithoutSizeTable(inferredProductCategory)) &&
    !isAutofillingFromUrl &&
    !isProcessingImage &&
    !isAnalyzingTable &&
    !isSaving;
  const isCaptureReviewReady =
    Boolean(formData.brand.trim()) ||
    Boolean(formData.name.trim()) ||
    Boolean(formData.url.trim()) ||
    Boolean(formData.productImage) ||
    Boolean(formData.extractedTable);
  const incompleteMessage = getSubmitValidationError(
    {
      hasBrand: Boolean(formData.brand.trim()),
      hasName: Boolean(formData.name.trim()),
      hasProductImageCheck: hasProductImage,
      hasValidatedSizeTable: hasSizeData,
      inferredProductCategory,
    },
    t
  );

  return {
    hasSizeData,
    hasProductImage,
    isPreviewOnlyProductImage,
    isFormValid,
    isCaptureReviewReady,
    incompleteMessage,
  };
};
