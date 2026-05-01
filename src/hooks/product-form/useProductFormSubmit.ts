import { isDuplicateProductErrorMessage, isOptionalMetadataCategory } from "../../utils/product";
import { submitProduct } from "../../api";
import { buildSubmitProductPayload, getProductFormFlags, getSubmitValidationError } from "./helpers";
import type { AddProductFormData, ClosetSizeSelection } from "../../types";

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
  addToDigboxOnSubmit: boolean;
  addToClosetOnSubmit: boolean;
  closetSizeSelection: ClosetSizeSelection | null;
  setIsSaving: (value: boolean) => void;
  setShowDuplicateProductModal: (value: boolean) => void;
  showSubmitToast: (toast: { message: string; type: "success" | "error" }) => void;
  closeModal: () => void;
}

interface UseProductFormSubmitOptions {
  state: ProductFormSubmitState;
  onSubmitSuccess: () => void;
  onAddToDigbox?: (productId: string) => Promise<void>;
  onAddToCloset?: (productId: string, sizeSelection?: ClosetSizeSelection | null) => Promise<void>;
}

function getSuccessMessage(addToDigbox: boolean, addToCloset: boolean) {
  if (addToDigbox && addToCloset) return "상품이 등록되고 DIGBOX와 옷장에 담겼습니다.";
  if (addToDigbox) return "상품이 등록되고 DIGBOX에 담겼습니다.";
  if (addToCloset) return "상품이 등록되고 옷장에 담겼습니다.";
  return "상품이 등록되었습니다.";
}

export function useProductFormSubmit({
  state,
  onSubmitSuccess,
  onAddToDigbox,
  onAddToCloset,
}: UseProductFormSubmitOptions) {
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
      const product = await submitProduct(
        buildSubmitProductPayload(state.formData, state.productPhotoFile, state.autofilledProductImageUrl),
        state.isInstagramMode
      );

      try {
        const collectionAdds: Promise<void>[] = [];
        if (state.addToDigboxOnSubmit && onAddToDigbox) {
          collectionAdds.push(onAddToDigbox(product.id));
        }
        if (state.addToClosetOnSubmit && onAddToCloset) {
          collectionAdds.push(onAddToCloset(product.id, state.closetSizeSelection));
        }
        await Promise.all(collectionAdds);
        state.showSubmitToast({
          message: getSuccessMessage(state.addToDigboxOnSubmit, state.addToClosetOnSubmit),
          type: "success",
        });
      } catch (collectionError) {
        console.error("[handleSubmitProduct] collection add failed", collectionError);
        state.showSubmitToast({ message: "상품은 등록됐지만 담기에 실패했습니다.", type: "error" });
      }

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
