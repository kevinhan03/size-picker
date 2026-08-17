import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ChevronDown, Expand, Upload, X } from 'lucide-react';
import type { useProductForm } from '../../hooks/useProductForm';
import { useLocaleContext } from '../../contexts/LocaleContext';

type ProductForm = ReturnType<typeof useProductForm>;

interface ProductImageSectionProps {
  form: ProductForm;
}

export function ProductImageSection({ form }: ProductImageSectionProps) {
  const { t } = useLocaleContext();
  const [isCandidatesOpen, setIsCandidatesOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [failedCandidateUrls, setFailedCandidateUrls] = useState<Set<string>>(() => new Set());
  const visibleCandidateUrls = useMemo(
    () => form.autofilledProductImageCandidates.filter((candidateUrl) => !failedCandidateUrls.has(candidateUrl)),
    [failedCandidateUrls, form.autofilledProductImageCandidates]
  );
  const candidateCount = visibleCandidateUrls.length;

  useEffect(() => {
    setFailedCandidateUrls(new Set());
  }, [form.autofilledProductImageCandidates]);

  useEffect(() => {
    if (!isImagePreviewOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsImagePreviewOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImagePreviewOpen]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-gray-300">{t("addProduct.image")} <span className="text-orange-300">{t("addProduct.required")}</span></label>
          <p className="mt-1 text-xs text-gray-500">{t("addProduct.imageHelp")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {form.formData.productImage ? (
            <label className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-bold text-gray-300 transition hover:border-orange-500/40 hover:text-orange-300">
              <Upload className="h-3.5 w-3.5" /> {t("addProduct.changeImage")}
              <input type="file" className="hidden" accept="image/*" onChange={(e) => form.handleFileUpload(e, 'product')} />
            </label>
          ) : null}
          {candidateCount > 0 ? (
          <button
            type="button"
            onClick={() => setIsCandidatesOpen((value) => !value)}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-bold text-gray-300 transition hover:border-orange-500/40 hover:text-orange-300"
          >
            {t("addProduct.viewCandidates")}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isCandidatesOpen ? 'rotate-180' : ''}`} />
          </button>
          ) : null}
        </div>
      </div>
      {form.formData.productImage ? (
        <div className="relative h-[360px] overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <button
            type="button"
            onClick={() => setIsImagePreviewOpen(true)}
            className="group flex h-full w-full items-center justify-center"
            aria-label={t("addProduct.enlargeImage")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Upload previews may use object URLs and must keep native loading behavior. */}
            <img src={form.formData.productImage} alt={t("addProduct.selectedImage")} className="h-full w-full object-contain" onError={form.handleThumbnailLoadError} />
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
              <Expand className="h-3.5 w-3.5" /> {t("addProduct.viewLarge")}
            </span>
          </button>
        </div>
      ) : (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) form.handleDroppedFile(file, 'product');
          }}
          className={`relative flex h-28 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition backdrop-blur-sm ${
            isDragging
              ? 'border-orange-500/70 bg-orange-500/10'
              : 'border-white/15 bg-white/[0.06] hover:border-orange-500/45 hover:bg-white/[0.09]'
          }`}
        >
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Camera className="w-8 h-8" />
            <span className="text-xs font-bold">{t("addProduct.uploadHint")}</span>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={(e) => form.handleFileUpload(e, 'product')} />
        </label>
      )}
      {isImagePreviewOpen && form.formData.productImage && typeof document !== 'undefined'
        ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={t("addProduct.imageDialog")}
            onClick={() => setIsImagePreviewOpen(false)}
          >
            <div className="relative flex max-h-full max-w-full items-center justify-center" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                autoFocus
                aria-label={t("common.close")}
                onClick={() => setIsImagePreviewOpen(false)}
                className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                <X className="h-5 w-5" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element -- Preserve the existing full-resolution preview behavior. */}
              <img src={form.formData.productImage} alt={t("addProduct.enlargedImage")} className="max-h-[90vh] max-w-[95vw] object-contain" />
            </div>
          </div>,
          document.body
        )
        : null}
      {candidateCount > 0 && isCandidatesOpen ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>{t("addProduct.candidates", { count: candidateCount })}</span>
            <span>{t("addProduct.candidatesHelp")}</span>
          </div>
          <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-1">
            {visibleCandidateUrls.map((candidateUrl, index) => {
              const isActive = candidateUrl === form.autofilledProductImageUrl;
              return (
                <button
                  key={candidateUrl}
                  type="button"
                  onClick={() => form.handleSelectAutofilledProductImage(candidateUrl)}
                  className={`relative h-16 rounded-lg border overflow-hidden ${isActive ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-700 hover:border-gray-500'}`}
                  title={candidateUrl}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- Candidate thumbnails preserve the existing unlabeled native preview DOM. */}
                  <img
                    src={candidateUrl}
                    className="w-full h-full object-cover"
                    onError={() => {
                      setFailedCandidateUrls((prev) => {
                        const next = new Set(prev);
                        next.add(candidateUrl);
                        return next;
                      });
                    }}
                  />
                  <span className={`absolute left-1 top-1 rounded px-1 py-0.5 text-[10px] font-semibold ${index === 0 ? 'bg-orange-500 text-black' : 'bg-black/70 text-white'}`}>
                    {index === 0 ? t("addProduct.recommended") : index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {form.isProcessingImage ? <div className="text-xs text-orange-400">{t("addProduct.processingImage")}</div> : null}
      {form.productImageNotice ? <div className="text-xs text-amber-300">{form.productImageNotice}</div> : null}
      {form.isPreviewOnlyProductImage ? (
        <div className="text-xs text-amber-300">{t("addProduct.previewOnlyImage")}</div>
      ) : null}
    </div>
  );
}
