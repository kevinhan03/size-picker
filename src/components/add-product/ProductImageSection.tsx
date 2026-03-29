import { Camera } from 'lucide-react';
import type { useProductForm } from '../../hooks/useProductForm';

type ProductForm = ReturnType<typeof useProductForm>;

interface ProductImageSectionProps {
  form: ProductForm;
}

export function ProductImageSection({ form }: ProductImageSectionProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">{'\uC0C1\uD488 \uC774\uBBF8\uC9C0'}</label>
      <label className="cursor-pointer w-full h-28 bg-white/[0.06] border-2 border-dashed border-white/15 rounded-xl flex items-center justify-center overflow-hidden hover:bg-white/[0.09] hover:border-white/25 transition backdrop-blur-sm">
        {form.formData.productImage ? <img src={form.formData.productImage} className="h-full object-contain" onError={form.handleThumbnailLoadError} /> : <Camera className="w-8 h-8 text-gray-500" />}
        <input type="file" className="hidden" accept="image/*" onChange={(e) => form.handleFileUpload(e, 'product')} />
      </label>
      {form.autofilledProductImageCandidates.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>{`\uD6C4\uBCF4 ${form.autofilledProductImageCandidates.length}\uAC1C`}</span>
            <span>{'\uCCAB \uBC88\uC9F8 \uCE74\uB4DC\uAC00 \uD604\uC7AC \uCD94\uCC9C \uC21C\uC704\uC785\uB2C8\uB2E4.'}</span>
          </div>
          <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-1">
            {form.autofilledProductImageCandidates.map((candidateUrl, index) => {
              const isActive = candidateUrl === form.autofilledProductImageUrl;
              return (
                <button
                  key={candidateUrl}
                  type="button"
                  onClick={() => form.handleSelectAutofilledProductImage(candidateUrl)}
                  className={`relative h-16 rounded-lg border overflow-hidden ${isActive ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-700 hover:border-gray-500'}`}
                  title={candidateUrl}
                >
                  <img src={candidateUrl} className="w-full h-full object-cover" onError={form.handleThumbnailLoadError} />
                  <span className={`absolute left-1 top-1 rounded px-1 py-0.5 text-[10px] font-semibold ${index === 0 ? 'bg-orange-500 text-black' : 'bg-black/70 text-white'}`}>
                    {index === 0 ? '\uCD94\uCC9C' : index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {form.isProcessingImage ? <div className="text-xs text-orange-400">{'\uC774\uBBF8\uC9C0 \uCC98\uB9AC \uC911...'}</div> : null}
      {form.productImageNotice ? <div className="text-xs text-amber-300">{form.productImageNotice}</div> : null}
      {form.isPreviewOnlyProductImage ? (
        <div className="text-xs text-amber-300">{'\uD604\uC7AC \uC774\uBBF8\uC9C0\uB294 \uBBF8\uB9AC\uBCF4\uAE30 \uC804\uC6A9\uC774\uB77C \uC800\uC7A5\uC6A9 \uC0C1\uD488 \uC774\uBBF8\uC9C0\uB97C \uC9C1\uC811 \uC62C\uB824\uC57C \uD569\uB2C8\uB2E4.'}</div>
      ) : null}
    </div>
  );
}
