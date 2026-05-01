import { useState } from 'react';
import { Camera, ChevronDown, Upload } from 'lucide-react';
import { ITEM_LABEL } from '../../constants';
import type { useProductForm } from '../../hooks/useProductForm';
import { displayTableCell, normalizeCellText } from '../../utils/sizeTable';

type ProductForm = ReturnType<typeof useProductForm>;

interface SizeTableSectionProps {
  form: ProductForm;
}

const UPLOAD_HINT = '클릭하거나 드래그해서 업로드';

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
  const [isExtraOpen, setIsExtraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isOptional = form.isSizeTableOptionalCategory;

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-semibold text-gray-300">
          사이즈표 <span className={isOptional ? "text-gray-500" : "text-orange-300"}>{isOptional ? "선택" : "필수"}</span>
        </label>
        {form.addProductMode !== 'capture' ? (
          <p className="mt-1 text-xs text-gray-500">
            {'\uC0AC\uC774\uC988\uD45C \uC0AC\uC9C4\uC744 \uC62C\uB9AC\uBA74 \uC790\uB3D9\uC73C\uB85C \uD45C\uB97C \uCD94\uCD9C\uD569\uB2C8\uB2E4.'}
          </p>
        ) : (
          <p className="mt-1 text-xs text-gray-500">
            {'\uCEA1\uCC98\uBCF8\uC5D0\uC11C \uCD94\uCD9C\uD55C \uC0AC\uC774\uC988\uD45C\uB97C \uD655\uC778\uD558\uC138\uC694.'}
          </p>
        )}
      </div>
      <div>
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
              <span className="text-xs font-bold">{UPLOAD_HINT}</span>
            </div>
          ) : (
            <img src={form.formData.sizeChartImage} className="h-full object-contain" />
          )}
          {form.isAnalyzingTable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-xs text-orange-400">{'\uC0AC\uC774\uC988\uD45C \uCD94\uCD9C \uC911...'}</span>
            </div>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => form.handleFileUpload(e, 'chart')} />
        </label>
      </div>
      {!form.formData.extractedTable && form.formData.sizeChartImage && !form.isAnalyzingTable ? (
        <div className="text-xs text-amber-300">{'\uC0AC\uC774\uC988\uD45C \uC774\uBBF8\uC9C0\uB294 \uC788\uC9C0\uB9CC \uAC80\uC99D\uB41C \uD45C \uCD94\uCD9C\uC740 \uC544\uC9C1 \uC644\uB8CC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.'}</div>
      ) : null}
      {form.formData.extractedTable && !form.isAnalyzingTable ? (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-white/[0.04] border-b border-white/10">
            <span className="text-xs text-gray-500">{'\uC140\uC744 \uD074\uB9AD\uD558\uBA74 \uC218\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'}</span>
            <span className="text-xs font-semibold text-gray-500">{'단위: cm'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              {form.formData.extractedTable.headers.length > 0 ? (
                <thead className="border-b border-white/10">
                  <tr>
                    {form.formData.extractedTable.headers.map((header, colIdx) => (
                      <th
                        key={colIdx}
                        onClick={() => form.setTableEditingCell({ kind: 'header', colIdx })}
                        className={`px-2 py-1.5 font-semibold whitespace-nowrap cursor-pointer hover:bg-white/[0.06] transition ${normalizeCellText(header) === ITEM_LABEL ? 'text-gray-200' : 'text-green-400'} ${colIdx === 0 ? 'border-r border-white/10' : ''}`}
                      >
                        {form.tableEditingCell?.kind === 'header' && form.tableEditingCell.colIdx === colIdx ? (
                          <input
                            autoFocus
                            defaultValue={header}
                            onBlur={(e) => commitTableCell(form, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitTableCell(form, (e.target as HTMLInputElement).value);
                              if (e.key === 'Escape') form.setTableEditingCell(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent border-b border-orange-400 outline-none w-full min-w-[40px] text-white"
                          />
                        ) : header}
                      </th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {form.formData.extractedTable.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-white/[0.06]">
                    {row.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        onClick={() => form.setTableEditingCell({ kind: 'row', rowIdx, colIdx })}
                        className={`px-2 py-1.5 whitespace-nowrap cursor-pointer hover:bg-white/[0.06] transition ${colIdx === 0 ? 'text-gray-300 border-r border-white/10' : 'text-gray-400'}`}
                      >
                        {form.tableEditingCell?.kind === 'row' && form.tableEditingCell.rowIdx === rowIdx && form.tableEditingCell.colIdx === colIdx ? (
                          <input
                            autoFocus
                            defaultValue={cell}
                            onBlur={(e) => commitTableCell(form, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitTableCell(form, (e.target as HTMLInputElement).value);
                              if (e.key === 'Escape') form.setTableEditingCell(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent border-b border-orange-400 outline-none w-full min-w-[40px] text-white"
                          />
                        ) : displayTableCell(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {form.formData.extractedTable?.extra?.headers?.length && !form.isAnalyzingTable ? (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsExtraOpen((value) => !value)}
            className="flex w-full items-center justify-between px-3 py-2 bg-white/[0.04] text-[10px] font-semibold uppercase tracking-wide text-gray-400 hover:bg-white/[0.07] hover:text-gray-200 transition"
          >
            <span>{'추가 실측 정보'}</span>
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
      {form.addProductMode === 'capture' ? (
        <label className="cursor-pointer w-full h-20 bg-white/[0.06] border border-dashed border-white/15 rounded-xl flex items-center justify-center overflow-hidden hover:border-white/25 hover:bg-white/[0.09] transition backdrop-blur-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Camera className="w-4 h-4" />
            <span className="text-xs">{'\uCEA1\uCC98\uBCF8 \uB2E4\uC2DC \uC5C5\uB85C\uB4DC'}</span>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={form.handleCaptureUpload} />
        </label>
      ) : null}
      {form.isAutofillingFromImage ? <div className="text-xs text-[#1ED760]">{'\uCEA1\uCC98 \uC774\uBBF8\uC9C0 AI \uBD84\uC11D \uC911...'}</div> : null}
    </div>
  );
}
