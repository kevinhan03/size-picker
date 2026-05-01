import { useCallback, useEffect, useState } from "react";
import type { AddProductFormData, AddProductMode, ClosetSizeSelection } from "../../types";
import { DEFAULT_PRODUCT_PLACEHOLDER, EMPTY_FORM_DATA } from "../../constants";

export function useProductFormState() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addProductMode, setAddProductMode] = useState<AddProductMode>("url");
  const [showDuplicateProductModal, setShowDuplicateProductModal] = useState(false);

  const [formData, setFormData] = useState<AddProductFormData>(EMPTY_FORM_DATA);
  const [addToDigboxOnSubmit, setAddToDigboxOnSubmit] = useState(true);
  const [addToClosetOnSubmit, setAddToClosetOnSubmit] = useState(false);
  const [closetSizeSelection, setClosetSizeSelection] = useState<ClosetSizeSelection | null>(null);
  const [submitToast, setSubmitToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
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

  const [isInstagramMode, setIsInstagramMode] = useState(false);

  const [tableEditingCell, setTableEditingCell] = useState<
    | { kind: "header"; colIdx: number }
    | { kind: "row"; rowIdx: number; colIdx: number }
    | null
  >(null);

  useEffect(() => {
    const nextSrc = String(autofilledProductImageUrl || "").trim();
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

  const clearSelectedProductImage = () => {
    setAutofilledProductImageUrl(null);
    setAutofilledProductImageCandidates([]);
    setProductPhotoFile(null);
  };

  const clearAutoFillFeedback = () => {
    setAutoFillError(null);
    setProductImageNotice(null);
  };

  const showSubmitToast = useCallback((toast: { message: string; type: "success" | "error" }) => {
    setSubmitToast(toast);
  }, []);

  const clearSubmitToast = useCallback(() => {
    setSubmitToast(null);
  }, []);

  const resetState = () => {
    setFormData(EMPTY_FORM_DATA);
    setAddToDigboxOnSubmit(true);
    setAddToClosetOnSubmit(false);
    setClosetSizeSelection(null);
    clearSelectedProductImage();
    clearAutoFillFeedback();
    setAiPreviewImageSrc(null);
    setIsAiPreviewLoading(false);
    setDidFallbackAiPreviewImage(false);
    setIsProcessingImage(false);
    setIsAnalyzingTable(false);
    setIsAutofillingFromUrl(false);
    setIsAutofillingFromImage(false);
    setIsSaving(false);
    setShowDuplicateProductModal(false);
    setAddProductMode("url");
    setTableEditingCell(null);
    setIsInstagramMode(false);
  };

  const openModal = () => {
    resetState();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    resetState();
    setIsModalOpen(false);
  };

  const handleAiPreviewLoad = () => {
    setIsAiPreviewLoading(false);
  };

  const handleAiPreviewError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const currentSrc = String(image.getAttribute("src") || "").trim();
    if (currentSrc.endsWith(DEFAULT_PRODUCT_PLACEHOLDER)) {
      setIsAiPreviewLoading(false);
      return;
    }
    setDidFallbackAiPreviewImage(true);
    setIsAiPreviewLoading(false);
    setAiPreviewImageSrc(DEFAULT_PRODUCT_PLACEHOLDER);
  };

  const handleThumbnailLoadError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const currentSrc = String(image.getAttribute("src") || "").trim();
    if (currentSrc.endsWith(DEFAULT_PRODUCT_PLACEHOLDER)) return;
    image.src = DEFAULT_PRODUCT_PLACEHOLDER;
  };

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
    addToDigboxOnSubmit,
    setAddToDigboxOnSubmit,
    addToClosetOnSubmit,
    setAddToClosetOnSubmit,
    closetSizeSelection,
    setClosetSizeSelection,
    submitToast,
    showSubmitToast,
    clearSubmitToast,
    productPhotoFile,
    setProductPhotoFile,
    autofilledProductImageUrl,
    setAutofilledProductImageUrl,
    autofilledProductImageCandidates,
    setAutofilledProductImageCandidates,
    isProcessingImage,
    setIsProcessingImage,
    isAnalyzingTable,
    setIsAnalyzingTable,
    isSaving,
    setIsSaving,
    isAutofillingFromUrl,
    setIsAutofillingFromUrl,
    isAutofillingFromImage,
    setIsAutofillingFromImage,
    autoFillError,
    setAutoFillError,
    productImageNotice,
    setProductImageNotice,
    aiPreviewImageSrc,
    isAiPreviewLoading,
    didFallbackAiPreviewImage,
    tableEditingCell,
    setTableEditingCell,
    clearSelectedProductImage,
    clearAutoFillFeedback,
    resetState,
    handleAiPreviewLoad,
    handleAiPreviewError,
    handleThumbnailLoadError,
    isInstagramMode,
    setIsInstagramMode,
  };
}
