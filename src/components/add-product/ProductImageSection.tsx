import { useEffect, useMemo, useState } from 'react';
import { Camera, ChevronDown } from 'lucide-react';
import type { useProductForm } from '../../hooks/useProductForm';

type ProductForm = ReturnType<typeof useProductForm>;

interface ProductImageSectionProps {
  form: ProductForm;
}

const UPLOAD_HINT = '클릭하거나 드래그해서 업로드';

export function ProductImageSection({ form }: ProductImageSectionProps) {
  const [isCandidatesOpen, setIsCandidatesOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [failedCandidateUrls, setFailedCandidateUrls] = useState<Set<string>>(() => new Set());
  const visibleCandidateUrls = useMemo(
    () => form.autofilledProductImageCandidates.filter((candidateUrl) => !failedCandidateUrls.has(candidateUrl)),
    [failedCandidateUrls, form.autofilledProductImageCandidates]
  );
  const candidateCount = visibleCandidateUrls.length;

  useEffect(() => {
    setFailedCandidateUrls(new Set());
  }, [form.autofilledProductImageCandidates]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-gray-300">상품 이미지 <span className="text-orange-300">필수</span></label>
          <p className="mt-1 text-xs text-gray-500">직접 업로드하거나 후보 중 선택하세요.</p>
        </div>
        {candidateCount > 0 ? (
          <button
            type="button"
            onClick={() => setIsCandidatesOpen((value) => !value)}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-bold text-gray-300 transition hover:border-orange-500/40 hover:text-orange-300"
          >
            후보 보기
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isCandidatesOpen ? 'rotate-180' : ''}`} />
          </button>
        ) : null}
      </div>
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
        className={`group relative cursor-pointer w-full h-28 border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden transition backdrop-blur-sm ${
          isDragging
            ? 'border-orange-500/70 bg-orange-500/10'
            : 'border-white/15 bg-white/[0.06] hover:bg-white/[0.09] hover:border-orange-500/45'
        }`}
      >
        {form.formData.productImage ? (
          <>
            <img src={form.formData.productImage} className="h-full object-contain" onError={form.handleThumbnailLoadError} />
            <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 transition group-hover:opacity-100">
              {UPLOAD_HINT}
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Camera className="w-8 h-8" />
            <span className="text-xs font-bold">{UPLOAD_HINT}</span>
          </div>
        )}
        <input type="file" className="hidden" accept="image/*" onChange={(e) => form.handleFileUpload(e, 'product')} />
      </label>
      {candidateCount > 0 && isCandidatesOpen ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>{`후보 ${candidateCount}개`}</span>
            <span>원하는 후보를 선택할 수 있습니다.</span>
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
                    {index === 0 ? '추천' : index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {form.isProcessingImage ? <div className="text-xs text-orange-400">이미지 처리 중...</div> : null}
      {form.productImageNotice ? <div className="text-xs text-amber-300">{form.productImageNotice}</div> : null}
      {form.isPreviewOnlyProductImage ? (
        <div className="text-xs text-amber-300">현재 이미지는 미리보기 전용이라 저장용 상품 이미지를 직접 올려야 합니다.</div>
      ) : null}
    </div>
  );
}
