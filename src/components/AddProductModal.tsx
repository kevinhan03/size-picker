import {
  Camera,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import type { useProductForm } from '../hooks/useProductForm';
import { CATEGORY_OPTIONS, ITEM_LABEL } from '../constants';
import { normalizeCellText } from '../utils/sizeTable';

type ProductForm = ReturnType<typeof useProductForm>;

interface AddProductModalProps {
  form: ProductForm;
}

function ProductImageSection({ form }: AddProductModalProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">상품 이미지</label>
      <label className="cursor-pointer w-full h-28 bg-white/[0.06] border-2 border-dashed border-white/15 rounded-xl flex items-center justify-center overflow-hidden hover:bg-white/[0.09] hover:border-white/25 transition backdrop-blur-sm">
        {form.formData.productImage ? <img src={form.formData.productImage} className="h-full object-contain" onError={form.handleThumbnailLoadError} /> : <Camera className="w-8 h-8 text-gray-500" />}
        <input type="file" className="hidden" accept="image/*" onChange={(e) => form.handleFileUpload(e, 'product')} />
      </label>
      {form.autofilledProductImageCandidates.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>후보 {form.autofilledProductImageCandidates.length}장</span>
            <span>왼쪽 카드가 현재 추천 순위입니다.</span>
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

function SizeTableSection({ form }: AddProductModalProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">사이즈표 이미지</label>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="cursor-pointer w-full sm:w-2/3 h-28 bg-white/[0.06] border-2 border-dashed border-white/15 rounded-xl flex items-center justify-center shrink-0 overflow-hidden hover:bg-white/[0.09] hover:border-white/25 transition backdrop-blur-sm relative">
          {!form.formData.sizeChartImage ? (
            <Upload className="w-8 h-8 text-gray-500" />
          ) : (
            <img src={form.formData.sizeChartImage} className="h-full object-contain" />
          )}
          {form.isAnalyzingTable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-xs text-orange-400">사이즈표 추출 중...</span>
            </div>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => form.handleFileUpload(e, 'chart')} />
        </label>
        {form.addProductMode !== 'capture' ? (
          <p className="text-xs text-gray-400 leading-relaxed">사이즈표 사진을 올리면<br />자동으로 표를 추출합니다.</p>
        ) : (
          <p className="text-xs text-gray-400 leading-relaxed">캡쳐본에서 추출한 사이즈표를 확인하세요.<br />필요하면 다시 캡쳐해서 재업로드할 수 있습니다.</p>
        )}
      </div>
      {!form.formData.extractedTable && form.formData.sizeChartImage && !form.isAnalyzingTable ? (
        <div className="text-xs text-amber-300">사이즈표 이미지는 있지만 검증된 표 추출은 아직 완료되지 않았습니다.</div>
      ) : null}
      {form.formData.extractedTable && !form.isAnalyzingTable ? (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-white/10">
            <span className="text-[10px] text-gray-400">추출된 사이즈표 — 셀을 클릭하면 수정할 수 있습니다</span>
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
                        ) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {form.addProductMode === 'capture' ? (
        <label className="cursor-pointer w-full h-20 bg-white/[0.06] border border-dashed border-white/15 rounded-xl flex items-center justify-center overflow-hidden hover:border-white/25 hover:bg-white/[0.09] transition backdrop-blur-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Camera className="w-4 h-4" />
            <span className="text-xs">캡쳐본 다시 업로드</span>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={form.handleCaptureUpload} />
        </label>
      ) : null}
      {form.isAutofillingFromImage ? <div className="text-xs text-[#1ED760]">캡쳐 이미지 AI 분석 중...</div> : null}
    </div>
  );
}

function AddProductForm({ form }: AddProductModalProps) {
  return (
    <>
      <input className="w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition" placeholder="브랜드명" value={form.formData.brand} onChange={(e) => form.setFormData({ ...form.formData, brand: e.target.value })} />
      <input className="w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition" placeholder="상품명" value={form.formData.name} onChange={(e) => form.setFormData({ ...form.formData, name: e.target.value })} />
      <select
        className={`w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl backdrop-blur-sm focus:outline-none focus:border-orange-500 transition [&>option]:bg-gray-900 [&>option]:text-white ${form.formData.category ? 'text-white' : 'text-gray-400'}`}
        value={form.formData.category}
        onChange={(e) => form.setFormData({ ...form.formData, category: e.target.value })}
      >
        <option value="">카테고리</option>
        {CATEGORY_OPTIONS.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
      <div className="space-y-2">
        <div className="relative">
          <Globe className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
          <input
            className="w-full pl-10 pr-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition"
            placeholder="공식 URL (선택)"
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
            {form.isAutofillingFromUrl ? 'URL 분석 중...' : 'URL로 자동 입력'}
          </button>
        ) : null}
        {form.autoFillError ? <p className="text-xs text-red-400">{form.autoFillError}</p> : null}
      </div>
      {form.addProductMode === 'url' ? (
        <section className="space-y-2 rounded-2xl border border-[#1ED760]/40 bg-[#121212] p-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#1ED760]">AI 추출 이미지 미리보기</label>
            {form.isAutofillingFromUrl ? <span className="text-xs text-[#1ED760]">Gemini 분석 중...</span> : null}
          </div>
          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-700 bg-gray-900/70 flex items-center justify-center">
            {!form.aiPreviewImageSrc && !form.isAutofillingFromUrl ? (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Camera className="w-6 h-6" />
                <span className="text-xs">URL 자동 입력 후 대표 이미지가 표시됩니다.</span>
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
            <p className="text-xs text-amber-300">이미지를 불러오지 못해 기본 이미지로 대체했습니다.</p>
          ) : null}
        </section>
      ) : null}
      <ProductImageSection form={form} />
      <SizeTableSection form={form} />
    </>
  );
}

function ModalBody({ form }: AddProductModalProps) {
  if (form.addProductMode === 'menu') {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => form.setAddProductMode('url')}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-5 py-5 text-left transition hover:border-orange-500/60 hover:bg-white/[0.1]"
        >
          <div>
            <p className="text-sm font-semibold text-white sm:text-base">공식홈페이지 URL 업로드해서 추가</p>
          </div>
          <Globe className="h-5 w-5 text-orange-400" />
        </button>
        <button
          type="button"
          onClick={() => form.setAddProductMode('manual')}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-5 py-5 text-left transition hover:border-white/20 hover:bg-white/[0.1]"
        >
          <div>
            <p className="text-sm font-semibold text-white sm:text-base">직접 추가</p>
          </div>
          <Plus className="h-5 w-5 text-gray-300" />
        </button>
      </div>
    );
  }

  if (form.addProductMode === 'capture' && !form.isCaptureReviewReady) {
    return (
      <div className="space-y-3">
        <label className="text-sm text-gray-400">캡쳐 사진 업로드</label>
        <label className="cursor-pointer flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.06] backdrop-blur-sm px-5 py-8 text-center transition hover:border-[#00FF00]/60 hover:bg-white/[0.09]">
          <Camera className="h-10 w-10 text-[#00FF00]" />
          <div>
            <p className="text-sm font-semibold text-white">캡쳐본을 업로드하면 상품 정보를 추출합니다.</p>
            <p className="mt-1 text-xs text-gray-400">브랜드명, 상품명, 카테고리, URL, 이미지, 사이즈표를 자동 분석합니다.</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={form.handleCaptureUpload} />
        </label>
        {form.isAutofillingFromImage ? <div className="text-xs text-[#1ED760]">캡쳐 이미지 AI 분석 중...</div> : null}
        {form.isAnalyzingTable ? <div className="text-xs text-orange-400">사이즈표 추출 중...</div> : null}
        {form.autoFillError ? <div className="text-xs text-red-400">{form.autoFillError}</div> : null}
      </div>
    );
  }

  return <AddProductForm form={form} />;
}

export function AddProductModal({ form }: AddProductModalProps) {
  if (!form.isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={form.closeModal} />
      <div className="ui-add-product-modal bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] backdrop-blur-2xl rounded-3xl w-full max-w-lg shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col max-h-[90vh] border border-white/10">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 sticky top-0 z-10 text-white backdrop-blur-sm">
          <h3 className="text-lg font-bold" style={{ color: '#00FF00' }}>상품 추가</h3>
          <button onClick={form.closeModal} className="p-2 hover:bg-white/[0.1] rounded-full transition text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto text-white space-y-4">
          <ModalBody form={form} />
        </div>
        <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-sm flex justify-end gap-3 sticky bottom-0">
          <button onClick={form.closeModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] hover:text-white transition">취소</button>
          <button onClick={form.handleSubmitProduct} disabled={!form.isFormValid} className={`px-5 py-2.5 rounded-xl text-sm font-bold text-black transition flex items-center gap-2 ${!form.isFormValid ? 'bg-gray-700 cursor-not-allowed text-gray-500' : 'hover:bg-orange-400'}`} style={!form.isFormValid ? {} : { backgroundColor: '#F97316' }}>
            {form.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {form.isSaving ? '제출 중...' : '상품 등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
