import { useState } from 'react';
import {
  Check,
  ChevronDown,
  Globe,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useLocaleContext } from '../../contexts/LocaleContext';
import type { useProductForm } from '../../hooks/useProductForm';
import { ProductImageSection } from './ProductImageSection';
import { SizeTableSection } from './SizeTableSection';
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from '../../constants';

type ProductForm = ReturnType<typeof useProductForm>;

interface AddProductFormFieldsProps {
  form: ProductForm;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  const { t } = useLocaleContext();
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
      {children} <span className={required ? 'text-orange-300' : 'text-gray-600'}>{required ? t("addProduct.required") : t("addProduct.optional")}</span>
    </label>
  );
}

export function AddProductFormFields({ form }: AddProductFormFieldsProps) {
  const { t } = useLocaleContext();
  const [manualClosetSize, setManualClosetSize] = useState('');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const sizeRows = form.formData.extractedTable?.rows || [];
  const sizeHeaders = form.formData.extractedTable?.headers || [];
  const selectClosetSize = (rowIndex: number) => {
    const row = sizeRows[rowIndex]?.map((cell) => String(cell ?? '').trim());
    if (!row) return;
    const headers = sizeHeaders.map((header) => String(header ?? '').trim());
    form.setClosetSizeSelection({ label: row[0] || null, rowIndex, snapshot: row[0] ? { headers, row } : null });
  };

  return (
    <>
      <section className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <FieldLabel>{t("addProduct.websiteUrl")}</FieldLabel>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Globe className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
            <input
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.07] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500 focus:bg-white/[0.1]"
              placeholder="https://brand.com/..."
              value={form.formData.url}
              onChange={(e) => {
                form.setFormData({ ...form.formData, url: e.target.value });
                form.setAutoFillError(null);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => void form.handleAutoFillFromUrl()}
            disabled={form.isAutofillingFromUrl || !form.formData.url.trim() || form.isSaving}
            className={`h-11 rounded-xl px-3 text-sm font-bold transition inline-flex items-center justify-center gap-2 ${
              (form.isAutofillingFromUrl || !form.formData.url.trim() || form.isSaving)
                ? 'bg-white/[0.04] text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-black hover:bg-orange-400'
            }`}
          >
            {form.isAutofillingFromUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="hidden sm:inline">{form.isAutofillingFromUrl ? t("addProduct.analyzing") : t("addProduct.autofill")}</span>
          </button>
        </div>
        {form.autoFillError ? <p className="text-xs text-red-400">{form.autoFillError}</p> : null}
      </section>

      <section className="space-y-3">
        <div>
          <FieldLabel required>{t("addProduct.brand")}</FieldLabel>
          <input
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500 focus:bg-white/[0.1]"
            placeholder={t("addProduct.brand")}
            value={form.formData.brand}
            onChange={(e) => form.setFormData({ ...form.formData, brand: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel required>{t("addProduct.name")}</FieldLabel>
          <input
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500 focus:bg-white/[0.1]"
            placeholder={t("addProduct.name")}
            value={form.formData.name}
            onChange={(e) => form.setFormData({ ...form.formData, name: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel required>{t("addProduct.category")}</FieldLabel>
          <button
            type="button"
            aria-expanded={isCategoryPickerOpen}
            aria-controls="product-category-options"
            onClick={() => setIsCategoryPickerOpen((open) => !open)}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.07] px-4 text-left text-sm font-bold text-white transition hover:border-orange-300/50 focus:border-orange-500 focus:outline-none"
          >
            <span>{form.formData.category ? CATEGORY_LABELS[form.formData.category as keyof typeof CATEGORY_LABELS] : t("addProduct.selectCategory")}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isCategoryPickerOpen ? 'rotate-180' : ''}`} />
          </button>
          {isCategoryPickerOpen ? (
            <div id="product-category-options" role="group" aria-label={t("addProduct.category")} className="mt-2 grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] sm:grid-cols-4">
              {CATEGORY_OPTIONS.map((category) => {
                const selected = form.formData.category === category;
                return <button key={category} type="button" aria-pressed={selected} onClick={() => { form.setFormData({ ...form.formData, category }); setIsCategoryPickerOpen(false); }} className={`min-h-11 border-b border-r border-white/10 px-3 text-sm font-bold transition last:border-b-0 sm:[&:nth-child(4n)]:border-r-0 ${selected ? 'bg-orange-500 text-black' : 'text-gray-300 hover:bg-white/[0.08] hover:text-orange-100'}`}>{CATEGORY_LABELS[category]}</button>;
              })}
            </div>
          ) : null}
        </div>
      </section>

      <ProductImageSection form={form} />
      <SizeTableSection form={form} />

      <section className="space-y-1">
        <div className="pb-1">
          <span className="text-sm font-bold text-gray-100">{t("addProduct.saveAfterRegister")}</span>
          <p className="mt-1 text-xs leading-5 text-gray-500">{t("addProduct.saveAfterRegisterHelp")}</p>
        </div>
        <div>
          <button
            type="button"
            aria-pressed={form.addToDigboxOnSubmit}
            onClick={() => form.setAddToDigboxOnSubmit(!form.addToDigboxOnSubmit)}
            className={`ui-save-location-row flex min-h-16 w-full items-center gap-3 border-b border-white/10 px-1 text-left transition ${form.addToDigboxOnSubmit ? 'text-yellow-100' : 'text-gray-300 hover:text-white'}`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${form.addToDigboxOnSubmit ? 'border-yellow-300 bg-yellow-400 text-black' : 'border-white/25 text-transparent'}`}>
              <Check aria-hidden="true" className={`h-3.5 w-3.5 transition-all duration-150 ${form.addToDigboxOnSubmit ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} />
            </span>
            <span className="min-w-0"><span className="block text-sm font-bold">{t("addProduct.savedLabel")}</span><span className="mt-0.5 block text-xs font-medium text-yellow-100/55">{t("addProduct.savedLabelHelp")}</span></span>
          </button>

          <div>
            <button
              type="button"
              aria-pressed={form.addToClosetOnSubmit}
              onClick={() => {
                const next = !form.addToClosetOnSubmit;
                form.setAddToClosetOnSubmit(next);
                if (!next) {
                  form.setClosetSizeSelection(null);
                  setManualClosetSize('');
                }
              }}
              className={`ui-save-location-row flex min-h-16 w-full items-center gap-3 border-b border-white/10 px-1 text-left transition ${form.addToClosetOnSubmit ? 'text-orange-100' : 'text-gray-300 hover:text-white'}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${form.addToClosetOnSubmit ? 'border-orange-400 bg-orange-500 text-black' : 'border-white/25 text-transparent'}`}>
                <Check aria-hidden="true" className={`h-3.5 w-3.5 transition-all duration-150 ${form.addToClosetOnSubmit ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} />
              </span>
              <span className="min-w-0"><span className="block text-sm font-bold">{t("addProduct.addToClosetLabel")}</span><span className="mt-0.5 block text-xs font-medium text-orange-100/55">{t("addProduct.addToClosetLabelHelp")}</span></span>
            </button>
            {form.addToClosetOnSubmit ? (
              <div className="ml-8 pb-3 pt-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-orange-100">{t("addProduct.ownedSize")} <span className="font-medium text-orange-100/55">({t("addProduct.optional")})</span></span>
                </div>
                {sizeRows.length ? (
                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {sizeRows.map((row, rowIndex) => {
                      const label = String(row[0] ?? '').trim() || `Size ${rowIndex + 1}`;
                      const selected = form.closetSizeSelection?.rowIndex === rowIndex;
                      return <button key={`${label}-${rowIndex}`} type="button" aria-pressed={selected} onClick={() => selected ? form.setClosetSizeSelection(null) : selectClosetSize(rowIndex)} className={`h-10 rounded-lg border text-sm font-bold transition ${selected ? 'border-orange-300 bg-orange-500 text-black' : 'border-white/10 bg-white/[0.04] text-gray-200 hover:border-orange-300/50 hover:text-orange-100'}`}>{label}</button>;
                    })}
                  </div>
                ) : (
                  <input value={manualClosetSize} onChange={(event) => { const value = event.target.value; setManualClosetSize(value); form.setClosetSizeSelection(value.trim() ? { label: value.trim(), rowIndex: null, snapshot: null } : null); }} placeholder={t("addProduct.manualSizePlaceholder")} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white outline-none placeholder:text-gray-600 focus:border-orange-400" />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
