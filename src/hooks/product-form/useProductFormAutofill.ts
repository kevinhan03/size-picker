import type { ChangeEvent } from "react";
import type {
  AddProductFormData,
  ProductMetadataPayload,
  ProductTaggingMetadata,
} from "../../types";
import {
  dataUrlToFile,
  readFileAsDataUrl,
  resizeImage,
} from "../../utils/image";
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing runtime contract.
  isDuplicateProductErrorMessage,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Retained to preserve the existing runtime contract.
  isOptionalMetadataCategory,
  normalizeComparableProductUrl,
} from "../../utils/product";
import { normalizeSizeTable } from "../../utils/sizeTable";
import {
  extractSizeTableFromImage,
  fetchProductMetadataFromUrl,
  removeBackgroundWithGemini,
} from "../../api";
import { applyUrlAutofill, getAutofillCandidateUrls } from "./helpers";
import { useLocaleContext } from "../../contexts/LocaleContext";

interface ProductFormAutofillState {
  formData: AddProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<AddProductFormData>>;
  productPhotoFile: File | null;
  setProductPhotoFile: (file: File | null) => void;
  autofilledProductImageUrl: string | null;
  setAutofilledProductImageUrl: (value: string | null) => void;
  setAutofilledProductImageCandidates: (value: string[]) => void;
  setProductTaggingMetadata: (value: ProductTaggingMetadata | null) => void;
  setInferredProductCategory: (value: string) => void;
  setProductImageNotice: (value: string | null) => void;
  setAutoFillError: (value: string | null) => void;
  setIsProcessingImage: (value: boolean) => void;
  setIsAnalyzingTable: (value: boolean) => void;
  setIsAutofillingFromUrl: (value: boolean) => void;
  setTableEditingCell: (
    value:
      | { kind: "header"; colIdx: number }
      | { kind: "row"; rowIdx: number; colIdx: number }
      | null
  ) => void;
  clearSelectedProductImage: () => void;
  clearAutoFillFeedback: () => void;
}

interface UseProductFormAutofillOptions {
  state: ProductFormAutofillState;
  productUrlSet: Set<string>;
}

const buildProductTaggingMetadata = (
  extracted: ProductMetadataPayload
): ProductTaggingMetadata => {
  const metadata = extracted.productMetadata;
  return metadata && typeof metadata === "object"
    ? metadata
    : {
        metadata_source: "product_page",
        product_summary: "",
        materials: [],
        fit_silhouette: [],
        design_details: [],
        functional_features: [],
        color: [],
        pattern_texture: [],
        target_gender_evidence: [],
        care: [],
        category_details: {},
      };
};

export function useProductFormAutofill({
  state,
  productUrlSet,
}: UseProductFormAutofillOptions) {
  const { t } = useLocaleContext();
  const handleFileUpload = (
    event: ChangeEvent<HTMLInputElement>,
    type: "product" | "chart"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === "product") {
      void (async () => {
        const dataUrl = await readFileAsDataUrl(file);
        state.clearSelectedProductImage();
        state.setProductImageNotice(null);
        const base64 = dataUrl.split(",")[1] || "";
        state.setFormData((prev) => ({ ...prev, productImage: dataUrl }));
        state.setProductPhotoFile(file);
        state.setIsProcessingImage(true);
        try {
          const processedBase64 = await removeBackgroundWithGemini(base64);
          const processedDataUrl = `data:image/png;base64,${processedBase64}`;
          state.setFormData((prev) => ({
            ...prev,
            productImage: processedDataUrl,
          }));
          state.setProductPhotoFile(
            dataUrlToFile(processedDataUrl, `product-${crypto.randomUUID()}`)
          );
        } catch (bgError) {
          console.error(
            "[handleFileUpload] remove bg failed, using original image",
            bgError
          );
          state.setProductPhotoFile(file);
          state.setProductImageNotice(t("addProduct.bgRemoveFailed"));
        } finally {
          state.setIsProcessingImage(false);
        }
      })();
      return;
    }

    void (async () => {
      const dataUrl = await readFileAsDataUrl(file);
      const optimizedDataUrl = await resizeImage(dataUrl, 1600);
      const optimizedBase64 = optimizedDataUrl.split(",")[1] || "";
      state.setFormData((prev) => ({
        ...prev,
        sizeChartImage: optimizedDataUrl,
        extractedTable: null,
        rawExtractedTable: null,
      }));
      state.setTableEditingCell(null);
      state.setIsAnalyzingTable(true);
      try {
        const tableData = await extractSizeTableFromImage(
          optimizedBase64,
          "image/png"
        );
        const rawTable = normalizeSizeTable(tableData);
        state.setFormData((prev) => ({
          ...prev,
          rawExtractedTable: rawTable,
          extractedTable: rawTable,
        }));
      } catch (extractError: unknown) {
        const message =
          extractError instanceof Error
            ? extractError.message
            : t("addProduct.sizeTableExtractFailed");
        alert(`${message} (check /api/size-table server logs)`);
      } finally {
        state.setIsAnalyzingTable(false);
      }
    })();
  };

  const handleDroppedFile = (file: File, type: "product" | "chart") => {
    if (!file.type.startsWith("image/")) {
      state.setAutoFillError(t("addProduct.imageFilesOnly"));
      return;
    }

    if (type === "product") {
      void (async () => {
        const dataUrl = await readFileAsDataUrl(file);
        state.clearSelectedProductImage();
        state.setProductImageNotice(null);
        const base64 = dataUrl.split(",")[1] || "";
        state.setFormData((prev) => ({ ...prev, productImage: dataUrl }));
        state.setProductPhotoFile(file);
        state.setIsProcessingImage(true);
        try {
          const processedBase64 = await removeBackgroundWithGemini(base64);
          const processedDataUrl = `data:image/png;base64,${processedBase64}`;
          state.setFormData((prev) => ({
            ...prev,
            productImage: processedDataUrl,
          }));
          state.setProductPhotoFile(
            dataUrlToFile(processedDataUrl, `product-${crypto.randomUUID()}`)
          );
        } catch (bgError) {
          console.error(
            "[handleDroppedFile] remove bg failed, using original image",
            bgError
          );
          state.setProductPhotoFile(file);
          state.setProductImageNotice(t("addProduct.bgRemoveFailed"));
        } finally {
          state.setIsProcessingImage(false);
        }
      })();
      return;
    }

    void (async () => {
      const dataUrl = await readFileAsDataUrl(file);
      const optimizedDataUrl = await resizeImage(dataUrl, 1600);
      const optimizedBase64 = optimizedDataUrl.split(",")[1] || "";
      state.setFormData((prev) => ({
        ...prev,
        sizeChartImage: optimizedDataUrl,
        extractedTable: null,
        rawExtractedTable: null,
      }));
      state.setTableEditingCell(null);
      state.setIsAnalyzingTable(true);
      try {
        const tableData = await extractSizeTableFromImage(
          optimizedBase64,
          "image/png"
        );
        const rawTable = normalizeSizeTable(tableData);
        state.setFormData((prev) => ({
          ...prev,
          rawExtractedTable: rawTable,
          extractedTable: rawTable,
        }));
      } catch (extractError: unknown) {
        const message =
          extractError instanceof Error
            ? extractError.message
            : t("addProduct.sizeTableExtractFailed");
        alert(`${message} (check /api/size-table server logs)`);
      } finally {
        state.setIsAnalyzingTable(false);
      }
    })();
  };

  const handleSelectAutofilledProductImage = (imageUrl: string) => {
    const nextUrl = String(imageUrl || "").trim();
    if (!nextUrl) return;
    state.setAutofilledProductImageUrl(nextUrl);
    state.setProductImageNotice(null);
    state.setProductPhotoFile(null);
    state.setFormData((prev) => ({ ...prev, productImage: nextUrl }));
    state.setAutoFillError(null);
  };

  const handleAutoFillFromUrl = async () => {
    const targetUrl = state.formData.url.trim();
    if (!targetUrl) {
      state.setAutoFillError(t("addProduct.urlRequired"));
      return;
    }

    state.setIsAutofillingFromUrl(true);
    state.clearAutoFillFeedback();
    state.setAutofilledProductImageCandidates([]);
    state.setProductTaggingMetadata(null);
    state.setInferredProductCategory("");

    try {
      const extracted = await fetchProductMetadataFromUrl(targetUrl);
      const normalizedExtractedUrl = normalizeComparableProductUrl(
        extracted.url || targetUrl
      );
      if (normalizedExtractedUrl && productUrlSet.has(normalizedExtractedUrl)) {
        state.setAutoFillError(t("duplicateProduct.title"));
        state.clearSelectedProductImage();
        state.setFormData((prev) => ({
          ...prev,
          url: extracted.url || prev.url,
        }));
        return;
      }

      const candidateUrls = getAutofillCandidateUrls(extracted);
      const selectedCandidateUrl = candidateUrls[0] || "";
      state.setProductTaggingMetadata(buildProductTaggingMetadata(extracted));
      state.setInferredProductCategory(String(extracted.category || "").trim());
      state.setProductPhotoFile(null);
      if (selectedCandidateUrl) {
        state.setAutofilledProductImageUrl(selectedCandidateUrl);
        state.setProductImageNotice(null);
      } else {
        state.setAutofilledProductImageUrl(null);
        state.setProductImageNotice(t("addProduct.officialImageNotFound"));
      }

      state.setAutofilledProductImageCandidates(candidateUrls);
      state.setFormData((prev) =>
        applyUrlAutofill(prev, extracted, selectedCandidateUrl)
      );

      if (!extracted.brand && !extracted.name && !selectedCandidateUrl) {
        state.setAutoFillError(t("addProduct.urlAutofillFailed"));
      }
    } catch {
      state.setAutoFillError(t("addProduct.urlAutofillFailed"));
    } finally {
      state.setIsAutofillingFromUrl(false);
    }
  };

  return {
    handleFileUpload,
    handleDroppedFile,
    handleSelectAutofilledProductImage,
    handleAutoFillFromUrl,
  };
}
