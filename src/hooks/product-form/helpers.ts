import {
  MAX_PRODUCT_IMAGE_CANDIDATES,
} from '../../constants';
import type {
  AddProductFormData,
  ProductMetadataPayload,
  ProductTaggingMetadata,
  SizeTable,
  SubmitProductForm,
} from '../../types';
import {
  normalizeCategoryOption,
  uniqHttpUrls,
} from '../../utils/product';
import { normalizeSizeTableForCategory } from '../../utils/sizeTable';
import type { MessageKey } from '../../i18n/messages';

export const getAutofillCandidateUrls = (extracted: ProductMetadataPayload): string[] =>
  uniqHttpUrls([
    extracted.image_path || '',
    ...(Array.isArray(extracted.productImageCandidates) ? extracted.productImageCandidates : []),
    extracted.productImage?.sourceUrl || '',
  ]).slice(0, MAX_PRODUCT_IMAGE_CANDIDATES);

export const applyUrlAutofill = (
  prev: AddProductFormData,
  extracted: ProductMetadataPayload,
  selectedCandidateUrl: string
): AddProductFormData => ({
  ...prev,
  brand: extracted.brand || prev.brand,
  name: extracted.name || prev.name,
  category: normalizeCategoryOption(extracted.category || '') || prev.category,
  url: extracted.url || prev.url,
  productImage: selectedCandidateUrl || prev.productImage,
});

export const applyCaptureAutofill = (
  prev: AddProductFormData,
  extracted: ProductMetadataPayload,
  selectedCandidateUrl: string,
  croppedProductImage: string,
  normalizedTable: SizeTable | null,
  optimizedDataUrl: string
): AddProductFormData => ({
  ...prev,
  brand: extracted.brand || prev.brand,
  name: extracted.name || prev.name,
  category: normalizeCategoryOption(extracted.category || '') || prev.category,
  url: extracted.url || prev.url,
  productImage: selectedCandidateUrl || croppedProductImage || prev.productImage,
  rawExtractedTable: normalizedTable || prev.rawExtractedTable,
  extractedTable:
    normalizeSizeTableForCategory(
      normalizeCategoryOption(extracted.category || '') || prev.category,
      normalizedTable
    ) || prev.extractedTable,
  sizeChartImage: optimizedDataUrl,
});

export const getCaptureProductImageNotice = (
  selectedCandidateUrl: string,
  croppedProductImage: string,
  t: (key: MessageKey) => string
): string | null => {
  if (selectedCandidateUrl) return null;
  if (croppedProductImage) {
    return t('addProduct.screenshotCropOnly');
  }
  return t('addProduct.officialImageNotFoundFromScreenshot');
};

export const hasEmptyCaptureAutofillResult = (
  extracted: ProductMetadataPayload,
  selectedCandidateUrl: string,
  croppedProductImage: string,
  normalizedTable: SizeTable | null
): boolean =>
  !extracted.brand &&
  !extracted.name &&
  !selectedCandidateUrl &&
  !croppedProductImage &&
  !normalizedTable;

interface SubmitValidationInput {
  hasBrand: boolean;
  hasName: boolean;
  hasProductImageCheck: boolean;
  hasCategory: boolean;
  hasValidatedSizeTable: boolean;
  isSizeTableOptionalCategory: boolean;
}

export const getSubmitValidationError = (
  {
    hasBrand,
    hasName,
    hasProductImageCheck,
    hasCategory,
    hasValidatedSizeTable,
    isSizeTableOptionalCategory,
  }: SubmitValidationInput,
  t: (key: MessageKey) => string
): string | null => {
  if (!hasBrand) return t('addProduct.brandRequired');
  if (!hasName) return t('addProduct.nameRequired');
  if (!hasProductImageCheck) return t('addProduct.photoRequired');
  if (!hasCategory) return t('addProduct.categoryRequired');
  if (!isSizeTableOptionalCategory && !hasValidatedSizeTable) {
    return t('addProduct.sizeTableRequired');
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
  category: formData.category || null,
  url: formData.url || null,
  sizeTable: formData.category === 'Bottom'
    ? (formData.rawExtractedTable || formData.extractedTable)
    : formData.extractedTable,
  normalizedSizeTable: formData.extractedTable,
  productPhoto: productPhotoFile,
  productImageUrl: autofilledProductImageUrl,
  productMetadata,
});

interface FormFlagsInput {
  formData: AddProductFormData;
  productPhotoFile: File | null;
  autofilledProductImageUrl: string | null;
  isSizeTableOptionalCategory: boolean;
  isAutofillingFromUrl: boolean;
  isAutofillingFromImage: boolean;
  isProcessingImage: boolean;
  isAnalyzingTable: boolean;
  isSaving: boolean;
}

export const getProductFormFlags = ({
  formData,
  productPhotoFile,
  autofilledProductImageUrl,
  isSizeTableOptionalCategory,
  isAutofillingFromUrl,
  isAutofillingFromImage,
  isProcessingImage,
  isAnalyzingTable,
  isSaving,
}: FormFlagsInput, t: (key: MessageKey) => string) => {
  const hasSizeData = Boolean(formData.extractedTable);
  const hasProductImage = Boolean(productPhotoFile) || Boolean(autofilledProductImageUrl);
  const isPreviewOnlyProductImage =
    Boolean(formData.productImage) && !productPhotoFile && !autofilledProductImageUrl;
  const isFormValid =
    Boolean(formData.brand.trim()) &&
    Boolean(formData.name.trim()) &&
    Boolean(formData.category.trim()) &&
    hasProductImage &&
    (hasSizeData || isSizeTableOptionalCategory) &&
    !isAutofillingFromUrl &&
    !isAutofillingFromImage &&
    !isProcessingImage &&
    !isAnalyzingTable &&
    !isSaving;
  const isCaptureReviewReady =
    Boolean(formData.brand.trim()) ||
    Boolean(formData.name.trim()) ||
    Boolean(formData.category.trim()) ||
    Boolean(formData.url.trim()) ||
    Boolean(formData.productImage) ||
    Boolean(formData.extractedTable);
  const incompleteMessage = getSubmitValidationError({
    hasBrand: Boolean(formData.brand.trim()),
    hasName: Boolean(formData.name.trim()),
    hasProductImageCheck: hasProductImage,
    hasCategory: Boolean(formData.category.trim()),
    hasValidatedSizeTable: hasSizeData,
    isSizeTableOptionalCategory,
  }, t);

  return {
    hasSizeData,
    hasProductImage,
    isPreviewOnlyProductImage,
    isFormValid,
    isCaptureReviewReady,
    incompleteMessage,
  };
};
