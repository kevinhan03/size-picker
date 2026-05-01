import { useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Globe,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { CATEGORY_OPTIONS } from '../../constants';
import type { useProductForm } from '../../hooks/useProductForm';
import type { Product } from '../../types';
import { normalizeSizeTableForCategory } from '../../utils/sizeTable';
import { SizeSelectionSheet } from '../SizeSelectionSheet';
import { ProductImageSection } from './ProductImageSection';
import { SizeTableSection } from './SizeTableSection';

type ProductForm = ReturnType<typeof useProductForm>;

interface AddProductFormFieldsProps {
  form: ProductForm;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
      {children} <span className={required ? 'text-orange-300' : 'text-gray-600'}>{required ? '필수' : '선택'}</span>
    </label>
  );
}

export function AddProductFormFields({ form }: AddProductFormFieldsProps) {
  const [isSizeSheetOpen, setIsSizeSheetOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const draftProduct = useMemo<Product>(() => ({
    id: 'draft-product',
    brand: form.formData.brand.trim() || 'PRODUCT',
    name: form.formData.name.trim() || '상품',
    category: form.formData.category.trim() || 'User Uploaded',
    url: form.formData.url.trim() || '#',
    image: form.autofilledProductImageUrl || form.formData.productImage || '',
    sizeTable: form.formData.extractedTable,
    normalizedSizeTable: form.formData.extractedTable,
  }), [form.autofilledProductImageUrl, form.formData]);
  const selectedSizeLabel = form.closetSizeSelection?.label || form.closetSizeSelection?.snapshot?.row?.[0] || '';

  return (
    <>
      <section className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <FieldLabel>공식 홈페이지 URL</FieldLabel>
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
            <span className="hidden sm:inline">{form.isAutofillingFromUrl ? '분석 중' : '자동 입력'}</span>
          </button>
        </div>
        {form.autoFillError ? <p className="text-xs text-red-400">{form.autoFillError}</p> : null}
      </section>

      <section className="space-y-3">
        <div>
          <FieldLabel required>브랜드명</FieldLabel>
          <input
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500 focus:bg-white/[0.1]"
            placeholder="브랜드명"
            value={form.formData.brand}
            onChange={(e) => form.setFormData({ ...form.formData, brand: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel required>상품명</FieldLabel>
          <input
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500 focus:bg-white/[0.1]"
            placeholder="상품명"
            value={form.formData.name}
            onChange={(e) => form.setFormData({ ...form.formData, name: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel required>카테고리</FieldLabel>
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
              <span>{form.formData.category || '카테고리 선택'}</span>
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

      <section className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-white">등록 후 저장</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => form.setAddToDigboxOnSubmit(!form.addToDigboxOnSubmit)}
              className={`h-9 rounded-lg border px-3 text-xs font-black transition ${
                form.addToDigboxOnSubmit
                  ? 'border-yellow-400/60 bg-yellow-400/20 text-yellow-300'
                  : 'border-white/10 bg-white/[0.04] text-gray-500'
              }`}
            >
              DIGBOX
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !form.addToClosetOnSubmit;
                form.setAddToClosetOnSubmit(next);
                if (!next) form.setClosetSizeSelection(null);
              }}
              className={`h-9 rounded-lg border px-3 text-xs font-black transition ${
                form.addToClosetOnSubmit
                  ? 'border-orange-500/60 bg-orange-500/20 text-orange-300'
                  : 'border-white/10 bg-white/[0.04] text-gray-500'
              }`}
            >
              Closet
            </button>
          </div>
        </div>
        {form.addToClosetOnSubmit ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2">
            <span className="min-w-0 truncate text-xs font-semibold text-orange-100">
              {selectedSizeLabel ? selectedSizeLabel : '사이즈 선택 안 함'}
            </span>
            <button
              type="button"
              onClick={() => setIsSizeSheetOpen(true)}
              className="shrink-0 rounded-lg border border-orange-500/40 bg-orange-500/15 px-2.5 py-1.5 text-xs font-bold text-orange-200 transition hover:bg-orange-500/25"
            >
              사이즈 선택
            </button>
          </div>
        ) : null}
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
