import {
  Camera,
  Globe,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { CATEGORY_OPTIONS } from '../../constants';
import type { useProductForm } from '../../hooks/useProductForm';
import { ProductImageSection } from './ProductImageSection';
import { SizeTableSection } from './SizeTableSection';

type ProductForm = ReturnType<typeof useProductForm>;

interface AddProductFormFieldsProps {
  form: ProductForm;
}

export function AddProductFormFields({ form }: AddProductFormFieldsProps) {
  return (
    <>
      <input className="w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition" placeholder={'\uBE0C\uB79C\uB4DC\uBA85'} value={form.formData.brand} onChange={(e) => form.setFormData({ ...form.formData, brand: e.target.value })} />
      <input className="w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition" placeholder={'\uC0C1\uD488\uBA85'} value={form.formData.name} onChange={(e) => form.setFormData({ ...form.formData, name: e.target.value })} />
      <select
        className={`w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl backdrop-blur-sm focus:outline-none focus:border-orange-500 transition [&>option]:bg-gray-900 [&>option]:text-white ${form.formData.category ? 'text-white' : 'text-gray-400'}`}
        value={form.formData.category}
        onChange={(e) => form.setFormData({ ...form.formData, category: e.target.value })}
      >
        <option value="">{'\uCE74\uD14C\uACE0\uB9AC'}</option>
        {CATEGORY_OPTIONS.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
      <div className="space-y-2">
        <div className="relative">
          <Globe className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
          <input
            className="w-full pl-10 pr-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition"
            placeholder={'\uACF5\uC2DD URL (\uC120\uD0DD)'}
            value={form.formData.url}
            onChange={(e) => {
              form.setFormData({ ...form.formData, url: e.target.value });
              form.setAutoFillError(null);
            }}
          />
        </div>
        {form.addProductMode === 'url' ? (
          <button
            onClick={() => void form.handleAutoFillFromUrl()}
            disabled={form.isAutofillingFromUrl || !form.formData.url.trim() || form.isSaving}
            className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold border transition flex items-center justify-center gap-2 ${
              (form.isAutofillingFromUrl || !form.formData.url.trim() || form.isSaving)
                ? 'border-white/10 text-gray-500 bg-white/[0.04] cursor-not-allowed'
                : 'border-orange-500/60 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20'
            }`}
          >
            {form.isAutofillingFromUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {form.isAutofillingFromUrl ? 'URL \uBD84\uC11D \uC911...' : 'URL\uB85C \uC790\uB3D9 \uC785\uB825'}
          </button>
        ) : null}
        {form.autoFillError ? <p className="text-xs text-red-400">{form.autoFillError}</p> : null}
      </div>
      {form.addProductMode === 'url' ? (
        <section className="space-y-2 rounded-2xl border border-[#1ED760]/40 bg-[#121212] p-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#1ED760]">{'AI \uCD94\uCD9C \uC774\uBBF8\uC9C0 \uBBF8\uB9AC\uBCF4\uAE30'}</label>
            {form.isAutofillingFromUrl ? <span className="text-xs text-[#1ED760]">{'Gemini \uBD84\uC11D \uC911...'}</span> : null}
          </div>
          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-700 bg-gray-900/70 flex items-center justify-center">
            {!form.aiPreviewImageSrc && !form.isAutofillingFromUrl ? (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Camera className="w-6 h-6" />
                <span className="text-xs">{'URL \uC790\uB3D9 \uC785\uB825 \uD6C4 \uB300\uD45C \uC774\uBBF8\uC9C0\uAC00 \uD45C\uC2DC\uB429\uB2C8\uB2E4.'}</span>
              </div>
            ) : null}
            {form.aiPreviewImageSrc ? (
              <img
                src={form.aiPreviewImageSrc}
                className={`h-full max-w-full object-contain transition-opacity duration-200 ${form.isAiPreviewLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={form.handleAiPreviewLoad}
                onError={form.handleAiPreviewError}
                alt="AI extracted product preview"
              />
            ) : null}
            {(form.isAutofillingFromUrl || form.isAiPreviewLoading) ? (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
            ) : null}
          </div>
          {form.didFallbackAiPreviewImage ? (
            <p className="text-xs text-amber-300">{'\uC774\uBBF8\uC9C0\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD574 \uAE30\uBCF8 \uC774\uBBF8\uC9C0\uB85C \uB300\uCCB4\uD588\uC2B5\uB2C8\uB2E4.'}</p>
          ) : null}
        </section>
      ) : null}
      <ProductImageSection form={form} />
      <SizeTableSection form={form} />
    </>
  );
}
