import { isDuplicateProductErrorMessage, isOptionalMetadataCategory } from "../../utils/product";
import { submitProduct } from "../../api";
import { buildSubmitProductPayload, getProductFormFlags, getSubmitValidationError } from "./helpers";
import type { AddProductFormData } from "../../types";

interface ProductFormSubmitState {
  formData: AddProductFormData;
  productPhotoFile: File | null;
  autofilledProductImageUrl: string | null;
  isAutofillingFromUrl: boolean;
  isAutofillingFromImage: boolean;
  isProcessingImage: boolean;
  isAnalyzingTable: boolean;
  isSaving: boolean;
  isInstagramMode: boolean;
  setIsSaving: (value: boolean) => void;
  setShowDuplicateProductModal: (value: boolean) => void;
  closeModal: () => void;
}

interface UseProductFormSubmitOptions {
  state: ProductFormSubmitState;
  onSubmitSuccess: () => void;
}

export function useProductFormSubmit({ state, onSubmitSuccess }: UseProductFormSubmitOptions) {
  const isSizeTableOptionalCategory = isOptionalMetadataCategory(state.formData.category);

  const flags = getProductFormFlags({
    formData: state.formData,
    productPhotoFile: state.productPhotoFile,
    autofilledProductImageUrl: state.autofilledProductImageUrl,
    isSizeTableOptionalCategory,
    isAutofillingFromUrl: state.isAutofillingFromUrl,
    isAutofillingFromImage: state.isAutofillingFromImage,
    isProcessingImage: state.isProcessingImage,
    isAnalyzingTable: state.isAnalyzingTable,
    isSaving: state.isSaving,
  });

  const handleSubmitProduct = async () => {
    const validationError = getSubmitValidationError({
      hasProductImageCheck: Boolean(state.productPhotoFile) || Boolean(state.autofilledProductImageUrl),
      hasCategory: Boolean(state.formData.category.trim()),
      hasValidatedSizeTable: Boolean(state.formData.extractedTable),
      isSizeTableOptionalCategory,
    });

    if (validationError) {
      alert(validationError);
      return;
    }

    state.setIsSaving(true);
    try {
      await submitProduct(
        buildSubmitProductPayload(state.formData, state.productPhotoFile, state.autofilledProductImageUrl),
        state.isInstagramMode
      );
      state.closeModal();
      onSubmitSuccess();
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : "Submission failed.";
      console.error("[handleSubmitProduct] submit failed", submitError);
      if (isDuplicateProductErrorMessage(message)) {
        state.setShowDuplicateProductModal(true);
        return;
      }
      alert(`상품 등록 실패: ${message}`);
    } finally {
      state.setIsSaving(false);
    }
  };

  return {
    ...flags,
    isSizeTableOptionalCategory,
    handleSubmitProduct,
  };
}
