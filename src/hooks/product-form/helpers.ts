import {
  MAX_PRODUCT_IMAGE_CANDIDATES,
} from '../../constants';
import type {
  AddProductFormData,
  ProductMetadataPayload,
  SizeTable,
  SubmitProductForm,
} from '../../types';
import {
  normalizeCategoryOption,
  uniqHttpUrls,
} from '../../utils/product';

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
  extractedTable: normalizedTable || prev.extractedTable,
  sizeChartImage: optimizedDataUrl,
});

export const getCaptureProductImageNotice = (
  selectedCandidateUrl: string,
  croppedProductImage: string
): string | null => {
  if (selectedCandidateUrl) return null;
  if (croppedProductImage) {
    return 'Only a screenshot crop was found. Upload the brand product image manually before saving.';
  }
  return 'Official product image was not found from the screenshot. Upload the brand image manually.';
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
  hasProductImageCheck: boolean;
  hasCategory: boolean;
  hasValidatedSizeTable: boolean;
  isSizeTableOptionalCategory: boolean;
}

export const getSubmitValidationError = ({
  hasProductImageCheck,
  hasCategory,
  hasValidatedSizeTable,
  isSizeTableOptionalCategory,
}: SubmitValidationInput): string | null => {
  if (!hasProductImageCheck) return '상품 사진은 필수입니다.';
  if (!hasCategory) return '카테고리는 필수입니다.';
  if (!isSizeTableOptionalCategory && !hasValidatedSizeTable) {
    return '검증된 사이즈표가 필요합니다. 설명 또는 사이즈표 이미지를 업로드해 주세요.';
  }
  return null;
};

export const buildSubmitProductPayload = (
  formData: AddProductFormData,
  productPhotoFile: File | null,
  autofilledProductImageUrl: string | null
): SubmitProductForm => ({
  brand: formData.brand,
  name: formData.name,
  category: formData.category || null,
  url: formData.url || null,
  sizeTable: formData.extractedTable,
  productPhoto: productPhotoFile,
  productImageUrl: autofilledProductImageUrl,
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
}: FormFlagsInput) => {
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

  return {
    hasSizeData,
    hasProductImage,
    isPreviewOnlyProductImage,
    isFormValid,
    isCaptureReviewReady,
  };
};
