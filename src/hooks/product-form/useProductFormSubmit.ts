import { isDuplicateProductErrorMessage, isOptionalMetadataCategory } from "../../utils/product";
import { submitProduct } from "../../api";
import { buildSubmitProductPayload, getProductFormFlags, getSubmitValidationError } from "./helpers";
import type { AddProductFormData, ClosetSizeSelection, ProductTaggingMetadata } from "../../types";
import { useLocaleContext } from "../../contexts/LocaleContext";
import type { MessageKey } from "../../i18n/messages";

interface ProductFormSubmitState {
  formData: AddProductFormData;
  productPhotoFile: File | null;
  autofilledProductImageUrl: string | null;
  productTaggingMetadata: ProductTaggingMetadata | null;
  isAutofillingFromUrl: boolean;
  isAutofillingFromImage: boolean;
  isProcessingImage: boolean;
  isAnalyzingTable: boolean;
  isSaving: boolean;
  setIsSaveComplete: (value: boolean) => void;
  setSubmitError: (value: string | null) => void;
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
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

function getSuccessMessage(addToDigbox: boolean, addToCloset: boolean, t: (key: MessageKey) => string) {
  if (addToDigbox && addToCloset) return t("addProduct.successBoth");
  if (addToDigbox) return t("addProduct.successSavedOnly");
  if (addToCloset) return t("addProduct.successClosetOnly");
  return t("addProduct.successDefault");
}

export function useProductFormSubmit({
  state,
  onSubmitSuccess,
  onAddToDigbox,
  onAddToCloset,
  isLoggedIn = true,
  onLoginRequired,
}: UseProductFormSubmitOptions) {
  const { t } = useLocaleContext();
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
  }, t);

  const handleSubmitProduct = async () => {
    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }

    const validationError = getSubmitValidationError({
      hasBrand: Boolean(state.formData.brand.trim()),
      hasName: Boolean(state.formData.name.trim()),
      hasProductImageCheck: Boolean(state.productPhotoFile) || Boolean(state.autofilledProductImageUrl),
      hasCategory: Boolean(state.formData.category.trim()),
      hasValidatedSizeTable: Boolean(state.formData.extractedTable),
      isSizeTableOptionalCategory,
    }, t);

    if (validationError) {
      state.setSubmitError(validationError);
      return;
    }

    state.setSubmitError(null);
    state.setIsSaveComplete(false);
    state.setIsSaving(true);
    try {
      const product = await submitProduct(
        buildSubmitProductPayload(
          state.formData,
          state.productPhotoFile,
          state.autofilledProductImageUrl,
          state.productTaggingMetadata
        ),
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
          message: getSuccessMessage(state.addToDigboxOnSubmit, state.addToClosetOnSubmit, t),
          type: "success",
        });
      } catch (collectionError) {
        console.error("[handleSubmitProduct] collection add failed", collectionError);
        state.showSubmitToast({ message: t("addProduct.collectionAddFailed"), type: "error" });
      }

      state.setIsSaveComplete(true);
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      state.closeModal();
      onSubmitSuccess();
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : t("addProduct.submitFailedGeneric");
      console.error("[handleSubmitProduct] submit failed", submitError);
      if (isDuplicateProductErrorMessage(message)) {
        state.setShowDuplicateProductModal(true);
        return;
      }
      state.setSubmitError(t("addProduct.submitFailed", { message }));
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
