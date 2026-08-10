import { useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Globe,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { CATEGORY_OPTIONS } from '../../constants';
import type { useProductForm } from '../../hooks/useProductForm';
import { normalizeMeasurementLabel, normalizeMeasurementValueForDisplay, normalizeSizeTableForCategory } from '../../utils/sizeTable';
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

function getSizeSummary(selection: ProductForm['closetSizeSelection']) {
  if (!selection?.snapshot) return '';
  const label = normalizeMeasurementLabel(selection.snapshot.headers[1] || '');
  const value = normalizeMeasurementValueForDisplay(selection.snapshot.row[1]);
  return label && value ? `${label} ${value}` : '';
}

export function AddProductFormFields({ form }: AddProductFormFieldsProps) {
  const [manualClosetSize, setManualClosetSize] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const sizeRows = form.formData.extractedTable?.rows || [];
  const sizeHeaders = form.formData.extractedTable?.headers || [];
  const selectedSizeLabel = form.closetSizeSelection?.label || form.closetSizeSelection?.snapshot?.row?.[0] || '';
  const selectedSizeSummary = getSizeSummary(form.closetSizeSelection);

  const selectClosetSize = (rowIndex: number) => {
    const row = sizeRows[rowIndex]?.map((cell) => String(cell ?? '').trim());
    if (!row) return;
    const headers = sizeHeaders.map((header) => String(header ?? '').trim());
    form.setClosetSizeSelection({ label: row[0] || null, rowIndex, snapshot: row[0] ? { headers, row } : null });
  };

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

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
        <div>
          <span className="text-sm font-bold text-gray-100">등록 후 저장</span>
          <p className="mt-1 text-xs leading-5 text-gray-500">나중에 다시 볼 상품은 저장함에, 이미 가진 옷은 내 옷장에 담으세요.</p>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            aria-pressed={form.addToDigboxOnSubmit}
            onClick={() => form.setAddToDigboxOnSubmit(!form.addToDigboxOnSubmit)}
            className={`ui-save-location-row flex min-h-16 w-full items-center gap-3 rounded-xl border px-3 text-left transition ${form.addToDigboxOnSubmit ? 'border-yellow-300/30 bg-yellow-400/[0.08] text-yellow-100' : 'border-white/10 bg-black/10 text-gray-300 hover:bg-white/[0.05]'}`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${form.addToDigboxOnSubmit ? 'border-yellow-300 bg-yellow-400 text-black' : 'border-white/25 text-transparent'}`}>
              <Check aria-hidden="true" className={`h-3.5 w-3.5 transition-all duration-150 ${form.addToDigboxOnSubmit ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} />
            </span>
            <span className="min-w-0"><span className="block text-sm font-bold">저장함</span><span className="mt-0.5 block text-xs font-medium text-yellow-100/55">나중에 다시 볼 상품</span></span>
          </button>

          <div className={`overflow-hidden rounded-xl border transition ${form.addToClosetOnSubmit ? 'border-orange-400/30 bg-orange-500/[0.07]' : 'border-white/10 bg-black/10'}`}>
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
              className={`ui-save-location-row flex min-h-16 w-full items-center gap-3 px-3 text-left transition ${form.addToClosetOnSubmit ? 'text-orange-100' : 'text-gray-300 hover:bg-white/[0.05]'}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${form.addToClosetOnSubmit ? 'border-orange-400 bg-orange-500 text-black' : 'border-white/25 text-transparent'}`}>
                <Check aria-hidden="true" className={`h-3.5 w-3.5 transition-all duration-150 ${form.addToClosetOnSubmit ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} />
              </span>
              <span className="min-w-0"><span className="block text-sm font-bold">내 옷장에도 추가</span><span className="mt-0.5 block text-xs font-medium text-orange-100/55">보유한 사이즈를 함께 기록</span></span>
            </button>
            {form.addToClosetOnSubmit ? (
              <div className="border-t border-orange-300/15 px-3 pb-3 pt-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-orange-100">보유 사이즈 <span className="font-medium text-orange-100/55">(선택)</span></span>
                  <button type="button" onClick={() => form.setClosetSizeSelection(null)} className="text-xs font-semibold text-orange-200/70 underline underline-offset-4 hover:text-orange-100">사이즈는 나중에</button>
                </div>
                {sizeRows.length ? (
                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {sizeRows.map((row, rowIndex) => {
                      const label = String(row[0] ?? '').trim() || `Size ${rowIndex + 1}`;
                      const selected = form.closetSizeSelection?.rowIndex === rowIndex;
                      return <button key={`${label}-${rowIndex}`} type="button" aria-pressed={selected} onClick={() => selectClosetSize(rowIndex)} className={`h-10 rounded-lg border text-sm font-bold transition ${selected ? 'border-orange-300 bg-orange-500 text-black' : 'border-white/10 bg-black/15 text-gray-200 hover:border-orange-300/50 hover:text-orange-100'}`}>{label}</button>;
                    })}
                  </div>
                ) : (
                  <input value={manualClosetSize} onChange={(event) => { const value = event.target.value; setManualClosetSize(value); form.setClosetSizeSelection(value.trim() ? { label: value.trim(), rowIndex: null, snapshot: null } : null); }} placeholder="예: M, 32, 260, Free" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/15 px-3 text-sm font-semibold text-white outline-none placeholder:text-gray-600 focus:border-orange-400" />
                )}
                <p className="mt-2 text-xs text-orange-100/60">{selectedSizeLabel ? `${selectedSizeLabel}${selectedSizeSummary ? ` · ${selectedSizeSummary}` : ''}로 내 옷장에 저장됩니다.` : '사이즈는 상품 등록 후에도 선택할 수 있어요.'}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
