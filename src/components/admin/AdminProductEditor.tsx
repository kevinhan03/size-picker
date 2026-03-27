import type { ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { CATEGORY_OPTIONS, ITEM_LABEL } from '../../constants';
import type { AdminEditForm, SizeTable } from '../../types';
import { normalizeCellText } from '../../utils/sizeTable';

type TableEditingCell =
  | { kind: 'header'; colIdx: number }
  | { kind: 'row'; rowIdx: number; colIdx: number }
  | null;

interface AdminProductEditorProps {
  adminEditForm: AdminEditForm;
  adminExtractedTable: SizeTable | null;
  adminImagePreview: string;
  adminSizeChartImage: string | null;
  isAdminActionLoading: boolean;
  isAdminAnalyzingTable: boolean;
  onCancelEdit: () => void;
  onEditFormChange: (updater: (prev: AdminEditForm) => AdminEditForm) => void;
  onExtractedTableChange: (table: SizeTable) => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>, type: 'product' | 'chart') => void;
  onUpdateProduct: () => void;
  setTableEditingCell: (cell: TableEditingCell) => void;
  tableEditingCell: TableEditingCell;
}

export function AdminProductEditor({
  adminEditForm,
  adminExtractedTable,
  adminImagePreview,
  adminSizeChartImage,
  isAdminActionLoading,
  isAdminAnalyzingTable,
  onCancelEdit,
  onEditFormChange,
  onExtractedTableChange,
  onFileUpload,
  onUpdateProduct,
  setTableEditingCell,
  tableEditingCell,
}: AdminProductEditorProps) {
  const commitTableCell = (value: string) => {
    if (!tableEditingCell || !adminExtractedTable) return;
    if (tableEditingCell.kind === 'header') {
      const headers = [...adminExtractedTable.headers];
      headers[tableEditingCell.colIdx] = value;
      onExtractedTableChange({ ...adminExtractedTable, headers });
    } else {
      const rows = adminExtractedTable.rows.map((row, ri) =>
        ri === tableEditingCell.rowIdx
          ? row.map((cell, ci) => (ci === tableEditingCell.colIdx ? value : cell))
          : row
      );
      onExtractedTableChange({ ...adminExtractedTable, rows });
    }
    setTableEditingCell(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          value={adminEditForm.brand}
          onChange={(event) => onEditFormChange((prev) => ({ ...prev, brand: event.target.value }))}
          placeholder="브랜드명"
        />
        <input
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          value={adminEditForm.name}
          onChange={(event) => onEditFormChange((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="상품명"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg ${adminEditForm.category ? 'text-white' : 'text-gray-400'}`}
          value={adminEditForm.category}
          onChange={(event) => onEditFormChange((prev) => ({ ...prev, category: event.target.value }))}
        >
          <option value="">카테고리</option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          value={adminEditForm.url}
          onChange={(event) => onEditFormChange((prev) => ({ ...prev, url: event.target.value }))}
          placeholder="공식 URL (선택)"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs text-gray-400">상품 이미지 교체</p>
          <label className="cursor-pointer w-full h-28 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            {adminImagePreview ? <img src={adminImagePreview} className="h-full object-contain" /> : <Upload className="w-6 h-6 text-gray-500" />}
            <input type="file" className="hidden" accept="image/*" onChange={(event) => onFileUpload(event, 'product')} />
          </label>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-gray-400">사이즈표 이미지 업로드</p>
          <label className="cursor-pointer w-full h-28 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            {adminSizeChartImage ? <img src={adminSizeChartImage} className="h-full object-contain" /> : <Upload className="w-6 h-6 text-gray-500" />}
            <input type="file" className="hidden" accept="image/*" onChange={(event) => onFileUpload(event, 'chart')} />
          </label>
        </div>
      </div>
      {isAdminAnalyzingTable ? <div className="text-xs text-orange-400">사이즈표 분석 중...</div> : null}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        {adminExtractedTable?.headers?.length ? (
          <table className="w-full text-xs text-left">
            <thead className="border-b border-gray-700">
              <tr>
                {adminExtractedTable.headers.map((header, colIdx) => (
                  <th
                    key={colIdx}
                    onClick={() => setTableEditingCell({ kind: 'header', colIdx })}
                    className={`px-3 py-2 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-800 transition ${normalizeCellText(header) === ITEM_LABEL ? 'text-gray-200' : 'text-green-400'} ${colIdx === 0 ? 'border-r border-gray-700' : ''}`}
                  >
                    {tableEditingCell?.kind === 'header' && tableEditingCell.colIdx === colIdx ? (
                      <input
                        autoFocus
                        defaultValue={header}
                        onBlur={(event) => commitTableCell(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') commitTableCell((event.target as HTMLInputElement).value);
                          if (event.key === 'Escape') setTableEditingCell(null);
                        }}
                        onClick={(event) => event.stopPropagation()}
                        className="bg-transparent border-b border-orange-400 outline-none w-full min-w-[40px] text-white"
                      />
                    ) : (
                      header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminExtractedTable.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-gray-800">
                  {row.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      onClick={() => setTableEditingCell({ kind: 'row', rowIdx, colIdx })}
                      className={`px-3 py-2 whitespace-nowrap cursor-pointer hover:bg-gray-800 transition ${colIdx === 0 ? 'text-gray-200 border-r border-gray-700' : 'text-gray-400'}`}
                    >
                      {tableEditingCell?.kind === 'row' &&
                      tableEditingCell.rowIdx === rowIdx &&
                      tableEditingCell.colIdx === colIdx ? (
                        <input
                          autoFocus
                          defaultValue={cell}
                          onBlur={(event) => commitTableCell(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') commitTableCell((event.target as HTMLInputElement).value);
                            if (event.key === 'Escape') setTableEditingCell(null);
                          }}
                          onClick={(event) => event.stopPropagation()}
                          className="bg-transparent border-b border-orange-400 outline-none w-full min-w-[40px] text-white"
                        />
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-3 py-4 text-xs text-gray-500">사이즈표 데이터가 없습니다.</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onUpdateProduct}
          disabled={isAdminActionLoading || isAdminAnalyzingTable}
          className={`px-4 py-2 rounded-lg text-sm font-bold text-black ${
            isAdminActionLoading || isAdminAnalyzingTable
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-400'
          }`}
        >
          저장
        </button>
        <button
          onClick={onCancelEdit}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800"
        >
          취소
        </button>
      </div>
    </div>
  );
}
