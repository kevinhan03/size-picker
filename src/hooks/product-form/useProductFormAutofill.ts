import type { ChangeEvent } from "react";
import type { AddProductFormData, SizeTable } from "../../types";
import {
  cropImageByBoundingBox,
  dataUrlToFile,
  normalizeCaptureBoundingBox,
  readFileAsDataUrl,
  resizeImage,
} from "../../utils/image";
import {
  isDuplicateProductErrorMessage,
  isOptionalMetadataCategory,
  normalizeComparableProductUrl,
} from "../../utils/product";
import { normalizeSizeTable, normalizeSizeTableForCategory } from "../../utils/sizeTable";
import {
  extractSizeTableFromImage,
  fetchProductMetadataFromImage,
  fetchProductMetadataFromUrl,
  removeBackgroundWithGemini,
} from "../../api";
import { DUPLICATE_PRODUCT_MESSAGE } from "../../constants";
import {
  applyCaptureAutofill,
  applyUrlAutofill,
  getAutofillCandidateUrls,
  getCaptureProductImageNotice,
  hasEmptyCaptureAutofillResult,
} from "./helpers";

interface ProductFormAutofillState {
  formData: AddProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<AddProductFormData>>;
  productPhotoFile: File | null;
  setProductPhotoFile: (file: File | null) => void;
  autofilledProductImageUrl: string | null;
  setAutofilledProductImageUrl: (value: string | null) => void;
  setAutofilledProductImageCandidates: (value: string[]) => void;
  setProductImageNotice: (value: string | null) => void;
  setAutoFillError: (value: string | null) => void;
  setIsProcessingImage: (value: boolean) => void;
  setIsAnalyzingTable: (value: boolean) => void;
  setIsAutofillingFromUrl: (value: boolean) => void;
  setIsAutofillingFromImage: (value: boolean) => void;
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

export function useProductFormAutofill({ state, productUrlSet }: UseProductFormAutofillOptions) {
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>, type: "product" | "chart") => {
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
          state.setFormData((prev) => ({ ...prev, productImage: processedDataUrl }));
          state.setProductPhotoFile(dataUrlToFile(processedDataUrl, `product-${crypto.randomUUID()}`));
        } catch (bgError) {
          console.error("[handleFileUpload] remove bg failed, using original image", bgError);
          state.setProductPhotoFile(file);
          state.setProductImageNotice("배경 제거에 실패했습니다. 원본 이미지를 사용합니다.");
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
        const tableData = await extractSizeTableFromImage(optimizedBase64, "image/png");
        const rawTable = normalizeSizeTable(tableData);
        state.setFormData((prev) => ({
          ...prev,
          rawExtractedTable: rawTable,
          extractedTable: normalizeSizeTableForCategory(prev.category, rawTable),
        }));
      } catch (extractError: unknown) {
        const message = extractError instanceof Error ? extractError.message : "Size table extraction failed.";
        alert(`${message} (check /api/size-table server logs)`);
      } finally {
        state.setIsAnalyzingTable(false);
      }
    })();
  };

  const handleDroppedFile = (file: File, type: "product" | "chart") => {
    if (!file.type.startsWith("image/")) {
      state.setAutoFillError("이미지 파일만 업로드할 수 있습니다.");
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
          state.setFormData((prev) => ({ ...prev, productImage: processedDataUrl }));
          state.setProductPhotoFile(dataUrlToFile(processedDataUrl, `product-${crypto.randomUUID()}`));
        } catch (bgError) {
          console.error("[handleDroppedFile] remove bg failed, using original image", bgError);
          state.setProductPhotoFile(file);
          state.setProductImageNotice("배경 제거에 실패했습니다. 원본 이미지를 사용합니다.");
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
        const tableData = await extractSizeTableFromImage(optimizedBase64, "image/png");
        const rawTable = normalizeSizeTable(tableData);
        state.setFormData((prev) => ({
          ...prev,
          rawExtractedTable: rawTable,
          extractedTable: normalizeSizeTableForCategory(prev.category, rawTable),
        }));
      } catch (extractError: unknown) {
        const message = extractError instanceof Error ? extractError.message : "Size table extraction failed.";
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
      state.setAutoFillError("상품 URL을 입력해 주세요.");
      return;
    }

    state.setIsAutofillingFromUrl(true);
    state.clearAutoFillFeedback();
    state.setAutofilledProductImageCandidates([]);

    try {
      const extracted = await fetchProductMetadataFromUrl(targetUrl);
      const normalizedExtractedUrl = normalizeComparableProductUrl(extracted.url || targetUrl);
      if (normalizedExtractedUrl && productUrlSet.has(normalizedExtractedUrl)) {
        state.setAutoFillError(DUPLICATE_PRODUCT_MESSAGE);
        state.clearSelectedProductImage();
        state.setFormData((prev) => ({
          ...prev,
          url: extracted.url || prev.url,
        }));
        return;
      }

      const candidateUrls = getAutofillCandidateUrls(extracted);
      const selectedCandidateUrl = candidateUrls[0] || "";

      state.setProductPhotoFile(null);
      if (selectedCandidateUrl) {
        state.setAutofilledProductImageUrl(selectedCandidateUrl);
        state.setProductImageNotice(null);
      } else {
        state.setAutofilledProductImageUrl(null);
        state.setProductImageNotice("Official product image was not found from the page. Upload the brand image manually.");
      }

      state.setAutofilledProductImageCandidates(candidateUrls);
      state.setFormData((prev) => applyUrlAutofill(prev, extracted, selectedCandidateUrl));

      if (!extracted.brand && !extracted.name && !selectedCandidateUrl) {
        state.setAutoFillError("공식 홈페이지에서 정보를 불러오지 못했습니다. 비어 있는 항목을 직접 입력해 주세요.");
      }
    } catch {
      state.setAutoFillError("공식 홈페이지에서 정보를 불러오지 못했습니다. 비어 있는 항목을 직접 입력해 주세요.");
    } finally {
      state.setIsAutofillingFromUrl(false);
    }
  };

  const handleCaptureUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    void (async () => {
      const dataUrl = await readFileAsDataUrl(file);
      const optimizedDataUrl = await resizeImage(dataUrl, 1600);
      const optimizedBase64 = optimizedDataUrl.split(",")[1] || "";
      const effectiveMimeType = file.type || "image/png";

      state.setIsAutofillingFromImage(true);
      state.clearAutoFillFeedback();
      state.setIsAnalyzingTable(true);
      state.setFormData((prev) => ({ ...prev, sizeChartImage: optimizedDataUrl }));

      try {
        const extracted = await fetchProductMetadataFromImage(optimizedBase64, effectiveMimeType);
        const productImageBox = normalizeCaptureBoundingBox(extracted.product_image_bbox ?? null);
        const sizeChartBox = normalizeCaptureBoundingBox(extracted.size_chart_bbox ?? null);
        const candidateUrls = getAutofillCandidateUrls(extracted);
        const selectedCandidateUrl = candidateUrls[0] || "";
        let normalizedTable: SizeTable | null = normalizeSizeTable(extracted.sizeTable ?? null);
        const croppedProductImage =
          !selectedCandidateUrl && productImageBox ? await cropImageByBoundingBox(optimizedDataUrl, productImageBox) : "";

        if (!normalizedTable && sizeChartBox) {
          const croppedSizeChartImage = await cropImageByBoundingBox(optimizedDataUrl, sizeChartBox);
          if (croppedSizeChartImage) {
            const croppedBase64 = croppedSizeChartImage.split(",")[1] || "";
            if (croppedBase64) {
              normalizedTable = await extractSizeTableFromImage(croppedBase64, "image/png");
            }
          }
        }

        state.setAutofilledProductImageCandidates(candidateUrls);
        state.setProductPhotoFile(null);
        state.setAutofilledProductImageUrl(selectedCandidateUrl || null);
        state.setProductImageNotice(getCaptureProductImageNotice(selectedCandidateUrl, croppedProductImage));
        state.setFormData((prev) =>
          applyCaptureAutofill(prev, extracted, selectedCandidateUrl, croppedProductImage, normalizedTable, optimizedDataUrl)
        );

        if (hasEmptyCaptureAutofillResult(extracted, selectedCandidateUrl, croppedProductImage, normalizedTable)) {
          state.setAutoFillError("캡처 이미지에서 자동 입력 데이터를 찾지 못했습니다.");
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Image analysis failed.";
        state.setAutoFillError(message);
      } finally {
        state.setIsAnalyzingTable(false);
        state.setIsAutofillingFromImage(false);
      }
    })();
  };

  return {
    handleFileUpload,
    handleDroppedFile,
    handleSelectAutofilledProductImage,
    handleAutoFillFromUrl,
    handleCaptureUpload,
  };
}
