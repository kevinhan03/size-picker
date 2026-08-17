import { useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Globe,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { CATEGORY_OPTIONS } from '../../constants';
import { useLocaleContext } from '../../contexts/LocaleContext';
import type { useProductForm } from '../../hooks/useProductForm';
import type { Product } from '../../types';
import { normalizeMeasurementLabel, normalizeMeasurementValueForDisplay, normalizeSizeTableForCategory } from '../../utils/sizeTable';
import { SizeSelectionSheet } from '../SizeSelectionSheet';
import { ProductImageSection } from './ProductImageSection';
import { SizeTableSection } from './SizeTableSection';

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

function getSizeSummary(selection: ProductForm['closetSizeSelection']) {
  if (!selection?.snapshot) return '';
  const label = normalizeMeasurementLabel(selection.snapshot.headers[1] || '');
  const value = normalizeMeasurementValueForDisplay(selection.snapshot.row[1]);
  return label && value ? `${label} ${value}` : '';
}

export function AddProductFormFields({ form }: AddProductFormFieldsProps) {
  const { t } = useLocaleContext();
  const [isSizeSheetOpen, setIsSizeSheetOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const draftProduct = useMemo<Product>(() => ({
    id: 'draft-product',
    brand: form.formData.brand.trim() || 'PRODUCT',
    name: form.formData.name.trim() || t("header.product"),
    category: form.formData.category.trim() || 'User Uploaded',
    url: form.formData.url.trim() || '#',
    image: form.autofilledProductImageUrl || form.formData.productImage || '',
    sizeTable: form.formData.extractedTable,
    normalizedSizeTable: form.formData.extractedTable,
  }), [form.autofilledProductImageUrl, form.formData, t]);
  const selectedSizeLabel = form.closetSizeSelection?.label || form.closetSizeSelection?.snapshot?.row?.[0] || '';
  const selectedSizeSummary = getSizeSummary(form.closetSizeSelection);

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
          <div
            ref={categoryMenuRef}
            className="relative"
            onBlur={(event) => {
              if (!categoryMenuRef.current?.contains(event.relatedTarget as Node | null)) {
                setIsCategoryOpen(false);
              }
            }}
          >
            <button
              type="button"
              onClick={() => setIsCategoryOpen((value) => !value)}
              aria-haspopup="listbox"
              aria-expanded={isCategoryOpen}
              className={`flex h-11 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-bold outline-none transition ${
                isCategoryOpen
                  ? 'border-orange-500 bg-[#28282f] text-white shadow-[0_0_0_1px_rgba(249,115,22,0.22)]'
                  : 'border-white/10 bg-white/[0.07] hover:border-white/20 hover:bg-white/[0.1]'
              } ${form.formData.category ? 'text-white' : 'text-gray-500'}`}
            >
              <span>{form.formData.category || t("addProduct.selectCategory")}</span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isCategoryOpen ? 'rotate-180 text-orange-300' : ''}`} />
            </button>
            {isCategoryOpen ? (
              <div
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-white/12 bg-[#17171a] p-1 shadow-[0_18px_44px_rgba(0,0,0,0.48)]"
              >
                {CATEGORY_OPTIONS.map((category) => {
                  const selected = form.formData.category === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        const sourceTable = form.formData.rawExtractedTable || form.formData.extractedTable;
                        form.setFormData({
                          ...form.formData,
                          category,
                          extractedTable: normalizeSizeTableForCategory(category, sourceTable),
                        });
                        setIsCategoryOpen(false);
                      }}
                      className={`flex h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-bold transition ${
                        selected
                          ? 'bg-orange-500 text-black'
                          : 'text-gray-200 hover:bg-white/[0.07] hover:text-orange-300'
                      }`}
                    >
                      <span>{category}</span>
                      {selected ? <span className="text-[10px] font-black uppercase">Selected</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <ProductImageSection form={form} />
      <SizeTableSection form={form} />

      <section className="space-y-2">
        <div>
          <span className="text-sm font-semibold text-gray-300">{t("addProduct.saveLocation")}</span>
          <p className="mt-1 text-xs text-gray-500">{t("addProduct.saveLocationHelp")}</p>
        </div>
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 bg-black/10">
          <button
            type="button"
            aria-pressed={form.addToDigboxOnSubmit}
            onClick={() => form.setAddToDigboxOnSubmit(!form.addToDigboxOnSubmit)}
            className={`ui-save-location-row flex min-h-14 w-full items-center gap-2 border-r border-white/10 px-3 text-left transition ${form.addToDigboxOnSubmit ? 'bg-yellow-400/[0.07] text-yellow-100' : 'text-gray-300 hover:bg-white/[0.05]'}`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${form.addToDigboxOnSubmit ? 'border-yellow-300 bg-yellow-400 text-black' : 'border-white/25 text-transparent'}`}>
              <Check aria-hidden="true" className={`h-3.5 w-3.5 transition-all duration-150 ${form.addToDigboxOnSubmit ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} />
            </span>
            <span className="min-w-0"><span className="block whitespace-nowrap text-sm font-bold">{t("addProduct.savedProducts")}</span><span className="hidden text-xs text-gray-500 sm:block">{t("addProduct.savedProductsHelp")}</span></span>
          </button>
          <button
            type="button"
            aria-pressed={form.addToClosetOnSubmit}
            onClick={() => {
              const next = !form.addToClosetOnSubmit;
              form.setAddToClosetOnSubmit(next);
              if (!next) form.setClosetSizeSelection(null);
            }}
            className={`ui-save-location-row flex min-h-14 w-full items-center gap-2 px-3 text-left transition ${form.addToClosetOnSubmit ? 'bg-orange-500/[0.07] text-orange-100' : 'text-gray-300 hover:bg-white/[0.05]'}`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${form.addToClosetOnSubmit ? 'border-orange-400 bg-orange-500 text-black' : 'border-white/25 text-transparent'}`}>
              <Check aria-hidden="true" className={`h-3.5 w-3.5 transition-all duration-150 ${form.addToClosetOnSubmit ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} />
            </span>
            <span className="min-w-0"><span className="block whitespace-nowrap text-sm font-bold">{t("addProduct.closet")}</span><span className="hidden text-xs text-gray-500 sm:block">{t("addProduct.closetHelp")}</span></span>
          </button>
          {form.addToClosetOnSubmit ? (
          <div className="col-span-2 flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-3 py-3">
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-orange-100">{selectedSizeLabel ? t("addProduct.selectedSize", { size: selectedSizeLabel }) : t("addProduct.selectSize")}</span>
              <span className="mt-0.5 block truncate text-xs text-orange-200/70">{selectedSizeLabel ? (selectedSizeSummary || t("addProduct.sizeTableReference")) : t("addProduct.sizeSelectionHelp")}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsSizeSheetOpen(true)}
              className="shrink-0 rounded-lg bg-orange-500/15 px-2.5 py-1.5 text-xs font-bold text-orange-200 transition hover:bg-orange-500/25"
            >
              {selectedSizeLabel ? t("addProduct.change") : t("addProduct.select")}
            </button>
          </div>
          ) : null}
        </div>
      </section>

      {isSizeSheetOpen ? (
        <SizeSelectionSheet
          product={draftProduct}
          initialRowIndex={form.closetSizeSelection?.rowIndex ?? null}
          onClose={() => setIsSizeSheetOpen(false)}
          onConfirm={(selection) => {
            form.setClosetSizeSelection(selection);
            setIsSizeSheetOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
