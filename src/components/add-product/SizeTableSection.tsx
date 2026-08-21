import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronDown, Expand, Upload, X } from 'lucide-react';
import { ITEM_LABEL } from '../../constants';
import { useLocaleContext } from '../../contexts/LocaleContext';
import type { useProductForm } from '../../hooks/useProductForm';
import { displayTableCell, normalizeCellText } from '../../utils/sizeTable';

type ProductForm = ReturnType<typeof useProductForm>;

interface SizeTableSectionProps {
  form: ProductForm;
}

function commitTableCell(form: ProductForm, value: string) {
  const cell = form.tableEditingCell;
  if (!cell) return;
  form.setFormData((prev) => {
    if (!prev.extractedTable) return prev;
    if (cell.kind === 'header') {
      const headers = [...prev.extractedTable.headers];
      headers[cell.colIdx] = value;
      return { ...prev, extractedTable: { ...prev.extractedTable, headers } };
    }
    const rows = prev.extractedTable.rows.map((row, ri) =>
      ri === cell.rowIdx
        ? row.map((c, ci) => (ci === cell.colIdx ? value : c))
        : row
    );
    return { ...prev, extractedTable: { ...prev.extractedTable, rows } };
  });
  form.setTableEditingCell(null);
}

export function SizeTableSection({ form }: SizeTableSectionProps) {
  const { t } = useLocaleContext();
  const [isExtraOpen, setIsExtraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const isComparisonMode = Boolean(form.formData.sizeChartImage && form.formData.extractedTable);

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
      {!isComparisonMode ? <div>
        <label className="text-sm font-semibold text-gray-300">
          {t("sizeTable.title")} <span className="text-orange-300">{t("addProduct.required")}</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">{t("sizeTable.uploadHelp")}</p>
      </div> : null}
      {!isComparisonMode ? <div>
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
            if (file) form.handleDroppedFile(file, 'chart');
          }}
          className={`cursor-pointer w-full h-28 border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden transition backdrop-blur-sm relative ${
            isDragging
              ? 'border-orange-500/70 bg-orange-500/10'
              : 'border-white/15 bg-white/[0.06] hover:bg-white/[0.09] hover:border-orange-500/45'
          }`}
        >
          {!form.formData.sizeChartImage ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Upload className="w-8 h-8" />
              <span className="text-xs font-bold">{t("addProduct.uploadHint")}</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- Preserve the existing upload-preview DOM and loading behavior.
            <img src={form.formData.sizeChartImage} className="h-full object-contain" />
          )}
          {form.isAnalyzingTable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-xs text-orange-400">{t("sizeTable.extracting")}</span>
            </div>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => form.handleFileUpload(e, 'chart')} />
        </label>
      </div> : null}
      {!form.formData.extractedTable && form.formData.sizeChartImage && !form.isAnalyzingTable ? (
        <div className="text-xs text-amber-300">{t("sizeTable.unverified")}</div>
      ) : null}
      {form.formData.extractedTable && !form.isAnalyzingTable ? (
        <div className="flex gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2.5 text-xs leading-5 text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p>{t("sizeTable.warning")}</p>
        </div>
      ) : null}
      {form.formData.extractedTable && !form.isAnalyzingTable ? (
        <div className={isComparisonMode ? "space-y-3" : ""}>
          {isComparisonMode ? (
            <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.03]">
              <button
                type="button"
                onClick={() => setIsImagePreviewOpen(true)}
                className="group relative block w-full overflow-hidden bg-black/30"
                aria-label={t("sizeTable.originalAria")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Preserve native loading for uploaded chart object URLs. */}
                <img src={form.formData.sizeChartImage || ""} alt={t("sizeTable.original")} className="block h-auto w-full" />
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                  <Expand className="h-3.5 w-3.5" /> {t("sizeTable.viewLarge")}
                </span>
              </button>
              <div className="border-t border-white/10 px-3 py-2 text-xs text-gray-400">{t("sizeTable.originalHint")}</div>
            </div>
          ) : null}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="text-xs text-gray-500">{form.tableEditingCell ? t("sizeTable.editingHint") : t("sizeTable.editHint")}</span>
            <span className="text-xs font-semibold text-gray-500">{t("sizeTable.unit")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              {form.formData.extractedTable.headers.length > 0 ? (
                <thead className="border-b border-white/10">
                  <tr>
                    {form.formData.extractedTable.headers.map((header, colIdx) => {
                      const isEditing = form.tableEditingCell?.kind === 'header' && form.tableEditingCell.colIdx === colIdx;
                      return (
                      <th
                        key={colIdx}
                        onClick={() => form.setTableEditingCell({ kind: 'header', colIdx })}
                        className={`relative cursor-pointer whitespace-nowrap px-2 py-1.5 font-semibold ${isEditing ? 'bg-orange-500/[0.12]' : 'hover:bg-white/[0.06]'} ${normalizeCellText(header) === ITEM_LABEL ? 'text-gray-200' : 'text-green-400'} ${colIdx === 0 ? 'border-r border-white/10' : ''}`}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            defaultValue={header}
                            aria-label={t("sizeTable.editCell", { value: header })}
                            onFocus={(event) => event.currentTarget.select()}
                            onBlur={(e) => commitTableCell(form, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitTableCell(form, (e.target as HTMLInputElement).value);
                              if (e.key === 'Escape') form.setTableEditingCell(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 h-full w-full bg-[#1b1b1f] px-2 text-left text-xs font-semibold text-white shadow-[inset_0_0_0_1px_rgba(249,115,22,0.75)] outline-none"
                          />
                        ) : header}
                      </th>
                      );
                    })}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {form.formData.extractedTable.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-white/[0.06]">
                    {row.map((cell, colIdx) => {
                      const isEditing = form.tableEditingCell?.kind === 'row' && form.tableEditingCell.rowIdx === rowIdx && form.tableEditingCell.colIdx === colIdx;
                      return (
                      <td
                        key={colIdx}
                        onClick={() => form.setTableEditingCell({ kind: 'row', rowIdx, colIdx })}
                        className={`relative cursor-pointer whitespace-nowrap px-2 py-1.5 ${isEditing ? 'bg-orange-500/[0.12]' : 'hover:bg-white/[0.06]'} ${colIdx === 0 ? 'text-gray-300 border-r border-white/10' : 'text-gray-400'}`}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            defaultValue={cell}
                            aria-label={t("sizeTable.editCell", { value: displayTableCell(cell) })}
                            onFocus={(event) => event.currentTarget.select()}
                            onBlur={(e) => commitTableCell(form, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitTableCell(form, (e.target as HTMLInputElement).value);
                              if (e.key === 'Escape') form.setTableEditingCell(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 h-full w-full bg-[#1b1b1f] px-2 text-left text-xs font-semibold text-white shadow-[inset_0_0_0_1px_rgba(249,115,22,0.75)] outline-none"
                          />
                        ) : displayTableCell(cell)}
                      </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      ) : null}
      {isImagePreviewOpen && form.formData.sizeChartImage && typeof document !== 'undefined'
        ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={t("sizeTable.dialog")}
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
              {/* eslint-disable-next-line @next/next/no-img-element -- Preserve the existing full-resolution chart preview. */}
              <img src={form.formData.sizeChartImage} alt={t("sizeTable.dialog")} className="max-h-[90vh] max-w-[95vw] object-contain" />
            </div>
          </div>,
          document.body
        )
        : null}
      {form.formData.extractedTable?.extra?.headers?.length && !form.isAnalyzingTable ? (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsExtraOpen((value) => !value)}
            className="flex w-full items-center justify-between px-3 py-2 bg-white/[0.04] text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:bg-white/[0.07] hover:text-gray-200 transition"
          >
            <span>{t("sizeTable.extra")}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExtraOpen ? 'rotate-180' : ''}`} />
          </button>
          {isExtraOpen ? (
            <div className="overflow-x-auto border-t border-white/10">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-white/10">
                  <tr>
                    {form.formData.extractedTable.extra.headers.map((header, colIdx) => (
                      <th
                        key={colIdx}
                        className={`px-2 py-1.5 font-semibold whitespace-nowrap ${normalizeCellText(header) === ITEM_LABEL ? 'text-gray-200' : 'text-green-400'} ${colIdx === 0 ? 'border-r border-white/10' : ''}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.formData.extractedTable.extra.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-white/[0.06]">
                      {row.map((cell, colIdx) => (
                        <td
                          key={colIdx}
                          className={`px-2 py-1.5 whitespace-nowrap ${colIdx === 0 ? 'text-gray-300 border-r border-white/10' : 'text-gray-400'}`}
                        >
                          {displayTableCell(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
