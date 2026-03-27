import { useEffect, useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import type { AddProductFormData, AddProductMode, SizeTable } from '../types';
import {
  EMPTY_FORM_DATA,
  MAX_PRODUCT_IMAGE_CANDIDATES,
  DUPLICATE_PRODUCT_MESSAGE,
  DEFAULT_PRODUCT_PLACEHOLDER,
} from '../constants';
import {
  readFileAsDataUrl,
  dataUrlToFile,
  resizeImage,
  normalizeCaptureBoundingBox,
  cropImageByBoundingBox,
} from '../utils/image';
import { normalizeSizeTable } from '../utils/sizeTable';
import {
  normalizeComparableProductUrl,
  normalizeCategoryOption,
  isOptionalMetadataCategory,
  isDuplicateProductErrorMessage,
  uniqHttpUrls,
} from '../utils/product';
import {
  submitProduct,
  fetchProductMetadataFromUrl,
  fetchProductMetadataFromImage,
  extractSizeTableFromImage,
  removeBackgroundWithGemini,
} from '../api';

interface UseProductFormOptions {
  productUrlSet: Set<string>;
  onSubmitSuccess: () => void;
}

export function useProductForm({ productUrlSet, onSubmitSuccess }: UseProductFormOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addProductMode, setAddProductMode] = useState<AddProductMode>('menu');
  const [showDuplicateProductModal, setShowDuplicateProductModal] = useState(false);

  const [formData, setFormData] = useState<AddProductFormData>(EMPTY_FORM_DATA);
  const [productPhotoFile, setProductPhotoFile] = useState<File | null>(null);
  const [autofilledProductImageUrl, setAutofilledProductImageUrl] = useState<string | null>(null);
  const [autofilledProductImageCandidates, setAutofilledProductImageCandidates] = useState<string[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isAnalyzingTable, setIsAnalyzingTable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutofillingFromUrl, setIsAutofillingFromUrl] = useState(false);
  const [isAutofillingFromImage, setIsAutofillingFromImage] = useState(false);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);
  const [productImageNotice, setProductImageNotice] = useState<string | null>(null);
  const [aiPreviewImageSrc, setAiPreviewImageSrc] = useState<string | null>(null);
  const [isAiPreviewLoading, setIsAiPreviewLoading] = useState(false);
  const [didFallbackAiPreviewImage, setDidFallbackAiPreviewImage] = useState(false);
  const [tableEditingCell, setTableEditingCell] = useState<
    | { kind: 'header'; colIdx: number }
    | { kind: 'row'; rowIdx: number; colIdx: number }
    | null
  >(null);

  useEffect(() => {
    const nextSrc = String(autofilledProductImageUrl || '').trim();
    if (!nextSrc) {
      setAiPreviewImageSrc(null);
      setIsAiPreviewLoading(false);
      setDidFallbackAiPreviewImage(false);
      return;
    }
    setAiPreviewImageSrc(nextSrc);
    setIsAiPreviewLoading(true);
    setDidFallbackAiPreviewImage(false);
  }, [autofilledProductImageUrl]);

  const resetState = () => {
    setFormData(EMPTY_FORM_DATA);
    setProductPhotoFile(null);
    setAutofilledProductImageUrl(null);
    setAutofilledProductImageCandidates([]);
    setAutoFillError(null);
    setProductImageNotice(null);
    setAiPreviewImageSrc(null);
    setIsAiPreviewLoading(false);
    setDidFallbackAiPreviewImage(false);
    setIsProcessingImage(false);
    setIsAnalyzingTable(false);
    setIsAutofillingFromUrl(false);
    setIsAutofillingFromImage(false);
    setIsSaving(false);
    setShowDuplicateProductModal(false);
    setAddProductMode('menu');
  };

  const openModal = () => {
    resetState();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    resetState();
    setIsModalOpen(false);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>, type: 'product' | 'chart') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'product') {
      void (async () => {
        const dataUrl = await readFileAsDataUrl(file);
        setAutofilledProductImageUrl(null);
        setAutofilledProductImageCandidates([]);
        setProductImageNotice(null);
        const base64 = dataUrl.split(',')[1] || '';
        setFormData((prev) => ({ ...prev, productImage: dataUrl }));
        setProductPhotoFile(file);
        setIsProcessingImage(true);
        try {
          const processedBase64 = await removeBackgroundWithGemini(base64);
          const processedDataUrl = `data:image/png;base64,${processedBase64}`;
          setFormData((prev) => ({ ...prev, productImage: processedDataUrl }));
          setProductPhotoFile(dataUrlToFile(processedDataUrl, `product-${crypto.randomUUID()}`));
        } catch (bgError) {
          console.error('[handleFileUpload] remove bg failed, using original image', bgError);
          setProductPhotoFile(file);
        } finally {
          setIsProcessingImage(false);
        }
      })();
      return;
    }

    void (async () => {
      const dataUrl = await readFileAsDataUrl(file);
      const optimizedDataUrl = await resizeImage(dataUrl, 1600);
      const optimizedBase64 = optimizedDataUrl.split(',')[1] || '';
      setFormData((prev) => ({ ...prev, sizeChartImage: optimizedDataUrl, extractedTable: null }));
      setTableEditingCell(null);
      setIsAnalyzingTable(true);
      try {
        const tableData = await extractSizeTableFromImage(optimizedBase64, 'image/png');
        setFormData((prev) => ({ ...prev, extractedTable: tableData }));
      } catch (extractError: unknown) {
        const message = extractError instanceof Error ? extractError.message : 'Size table extraction failed.';
        alert(`${message} (check /api/size-table server logs)`);
      } finally {
        setIsAnalyzingTable(false);
      }
    })();
  };

  const handleSelectAutofilledProductImage = (imageUrl: string) => {
    const nextUrl = String(imageUrl || '').trim();
    if (!nextUrl) return;
    setAutofilledProductImageUrl(nextUrl);
    setProductImageNotice(null);
    setProductPhotoFile(null);
    setFormData((prev) => ({ ...prev, productImage: nextUrl }));
    setAutoFillError(null);
  };

  const handleAutoFillFromUrl = async () => {
    const targetUrl = formData.url.trim();
    if (!targetUrl) {
      setAutoFillError('상품 URL을 입력해 주세요.');
      return;
    }

    setIsAutofillingFromUrl(true);
    setIsAiPreviewLoading(true);
    setAutoFillError(null);
    setProductImageNotice(null);
    setAutofilledProductImageCandidates([]);

    try {
      const extracted = await fetchProductMetadataFromUrl(targetUrl);
      const normalizedExtractedUrl = normalizeComparableProductUrl(extracted.url || targetUrl);
      if (normalizedExtractedUrl && productUrlSet.has(normalizedExtractedUrl)) {
        setAutoFillError(DUPLICATE_PRODUCT_MESSAGE);
        setAutofilledProductImageUrl(null);
        setProductPhotoFile(null);
        setFormData((prev) => ({
          ...prev,
          url: extracted.url || prev.url,
        }));
        return;
      }
      const candidateUrls = uniqHttpUrls([
        extracted.image_path || '',
        ...(Array.isArray(extracted.productImageCandidates) ? extracted.productImageCandidates : []),
        extracted.productImage?.sourceUrl || '',
      ]).slice(0, MAX_PRODUCT_IMAGE_CANDIDATES);

      const selectedCandidateUrl = candidateUrls[0] || '';
      setProductPhotoFile(null);
      if (selectedCandidateUrl) {
        setAutofilledProductImageUrl(selectedCandidateUrl);
        setProductImageNotice(null);
      } else {
        setAutofilledProductImageUrl(null);
        setProductImageNotice('Official product image was not found from the page. Upload the brand image manually.');
      }

      setAutofilledProductImageCandidates(candidateUrls);

      setFormData((prev) => ({
        ...prev,
        brand: extracted.brand || prev.brand,
        name: extracted.name || prev.name,
        category: normalizeCategoryOption(extracted.category || '') || prev.category,
        url: extracted.url || prev.url,
        productImage: selectedCandidateUrl || prev.productImage,
      }));

      if (!extracted.brand && !extracted.name && !selectedCandidateUrl) {
        setAutoFillError('자동 입력 데이터를 찾지 못했습니다. 다른 상품 URL을 시도해 주세요.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'URL 분석 중 오류가 발생했습니다.';
      setAutoFillError(message);
    } finally {
      setIsAutofillingFromUrl(false);
    }
  };

  const handleCaptureUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    void (async () => {
      const dataUrl = await readFileAsDataUrl(file);
      const optimizedDataUrl = await resizeImage(dataUrl, 1600);
      const optimizedBase64 = optimizedDataUrl.split(',')[1] || '';
      const effectiveMimeType = file.type || 'image/png';

      setIsAutofillingFromImage(true);
      setAutoFillError(null);
      setProductImageNotice(null);
      setIsAnalyzingTable(true);
      setFormData((prev) => ({ ...prev, sizeChartImage: optimizedDataUrl }));

      try {
        const extracted = await fetchProductMetadataFromImage(optimizedBase64, effectiveMimeType);
        const productImageBox = normalizeCaptureBoundingBox(extracted.product_image_bbox ?? null);
        const sizeChartBox = normalizeCaptureBoundingBox(extracted.size_chart_bbox ?? null);
        const candidateUrls = uniqHttpUrls([
          extracted.image_path || '',
          ...(Array.isArray(extracted.productImageCandidates) ? extracted.productImageCandidates : []),
          extracted.productImage?.sourceUrl || '',
        ]).slice(0, MAX_PRODUCT_IMAGE_CANDIDATES);
        const selectedCandidateUrl = candidateUrls[0] || '';
        let normalizedTable: SizeTable | null = normalizeSizeTable(extracted.sizeTable ?? null);
        const croppedProductImage =
          !selectedCandidateUrl && productImageBox
            ? await cropImageByBoundingBox(optimizedDataUrl, productImageBox)
            : '';
        if (!normalizedTable && sizeChartBox) {
          const croppedSizeChartImage = await cropImageByBoundingBox(optimizedDataUrl, sizeChartBox);
          if (croppedSizeChartImage) {
            const croppedBase64 = croppedSizeChartImage.split(',')[1] || '';
            if (croppedBase64) {
              normalizedTable = await extractSizeTableFromImage(croppedBase64, 'image/png');
            }
          }
        }

        setAutofilledProductImageCandidates(candidateUrls);
        setProductPhotoFile(null);
        setAutofilledProductImageUrl(selectedCandidateUrl || null);
        setProductImageNotice(
          selectedCandidateUrl
            ? null
            : croppedProductImage
              ? 'Only a screenshot crop was found. Upload the brand product image manually before saving.'
              : 'Official product image was not found from the screenshot. Upload the brand image manually.'
        );

        setFormData((prev) => ({
          ...prev,
          brand: extracted.brand || prev.brand,
          name: extracted.name || prev.name,
          category: normalizeCategoryOption(extracted.category || '') || prev.category,
          url: extracted.url || prev.url,
          productImage: selectedCandidateUrl || croppedProductImage || prev.productImage,
          extractedTable: normalizedTable || prev.extractedTable,
          sizeChartImage: optimizedDataUrl,
        }));

        if (!extracted.brand && !extracted.name && !selectedCandidateUrl && !croppedProductImage && !normalizedTable) {
          setAutoFillError('캡쳐 이미지에서 자동 입력 데이터를 찾지 못했습니다.');
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Image analysis failed.';
        setAutoFillError(message);
      } finally {
        setIsAnalyzingTable(false);
        setIsAutofillingFromImage(false);
      }
    })();
  };

  const handleAiPreviewLoad = () => {
    setIsAiPreviewLoading(false);
  };

  const handleAiPreviewError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const currentSrc = String(image.getAttribute('src') || '').trim();
    if (currentSrc.endsWith(DEFAULT_PRODUCT_PLACEHOLDER)) {
      setIsAiPreviewLoading(false);
      return;
    }
    setDidFallbackAiPreviewImage(true);
    setIsAiPreviewLoading(false);
    setAiPreviewImageSrc(DEFAULT_PRODUCT_PLACEHOLDER);
  };

  const handleThumbnailLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const currentSrc = String(image.getAttribute('src') || '').trim();
    if (currentSrc.endsWith(DEFAULT_PRODUCT_PLACEHOLDER)) return;
    image.src = DEFAULT_PRODUCT_PLACEHOLDER;
  };

  const handleSubmitProduct = async () => {
    const hasProductImageCheck = Boolean(productPhotoFile) || Boolean(autofilledProductImageUrl);
    const hasCategory = Boolean(formData.category.trim());
    const hasValidatedSizeTable = Boolean(formData.extractedTable);
    const isSizeTableOptionalCategory = isOptionalMetadataCategory(formData.category);
    if (!hasProductImageCheck) {
      alert('상품 사진은 필수입니다.');
      return;
    }
    if (!hasCategory) {
      alert('카테고리는 필수입니다.');
      return;
    }
    if (!isSizeTableOptionalCategory && !hasValidatedSizeTable) {
      alert('검증된 사이즈표가 필요합니다. 더 선명한 사이즈표 이미지를 업로드해 주세요.');
      return;
    }
    setIsSaving(true);
    try {
      await submitProduct({
        brand: formData.brand,
        name: formData.name,
        category: formData.category || null,
        url: formData.url || null,
        sizeTable: formData.extractedTable,
        productPhoto: productPhotoFile,
        productImageUrl: autofilledProductImageUrl,
      });
      closeModal();
      onSubmitSuccess();
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : 'Submission failed.';
      console.error('[handleSubmitProduct] submit failed', submitError);
      if (isDuplicateProductErrorMessage(message)) {
        setShowDuplicateProductModal(true);
        return;
      }
      alert(`제출 실패: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const hasSizeData = Boolean(formData.extractedTable);
  const hasProductImage = Boolean(productPhotoFile) || Boolean(autofilledProductImageUrl);
  const isSizeTableOptionalCategory = isOptionalMetadataCategory(formData.category);
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
    isModalOpen,
    openModal,
    closeModal,
    addProductMode,
    setAddProductMode,
    showDuplicateProductModal,
    setShowDuplicateProductModal,
    formData,
    setFormData,
    productPhotoFile,
    autofilledProductImageUrl,
    setAutofilledProductImageUrl,
    autofilledProductImageCandidates,
    isProcessingImage,
    isAnalyzingTable,
    isSaving,
    isAutofillingFromUrl,
    isAutofillingFromImage,
    autoFillError,
    setAutoFillError,
    productImageNotice,
    aiPreviewImageSrc,
    isAiPreviewLoading,
    didFallbackAiPreviewImage,
    tableEditingCell,
    setTableEditingCell,
    hasSizeData,
    hasProductImage,
    isSizeTableOptionalCategory,
    isPreviewOnlyProductImage,
    isFormValid,
    isCaptureReviewReady,
    handleFileUpload,
    handleSelectAutofilledProductImage,
    handleAutoFillFromUrl,
    handleCaptureUpload,
    handleAiPreviewLoad,
    handleAiPreviewError,
    handleThumbnailLoadError,
    handleSubmitProduct,
  };
}
