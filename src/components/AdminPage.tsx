import { useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { Ruler, Upload } from 'lucide-react';
import { ProgressiveImage } from './ProgressiveImage';

interface SizeTable {
  headers: string[];
  rows: string[][];
}

interface Product {
  id: string;
  brand: string;
  name: string;
  category: string;
  url: string;
  image: string;
  thumbnailImage?: string;
  sizeTable: SizeTable | null;
}

interface AdminEditForm {
  brand: string;
  name: string;
  category: string;
  url: string;
}

interface BrandRule {
  matchType: 'domain' | 'url' | 'brand' | 'brand_contains';
  matchValue: string;
  canonicalBrand: string;
}

interface BrandBackfillChange {
  id: string;
  name: string;
  previousBrand: string;
  canonicalBrand: string;
  updated: boolean;
  error: string;
}

interface BrandBackfillResult {
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  changes: BrandBackfillChange[];
}

interface AdminPageProps {
  isAdminAuthenticated: boolean;
  isAdminCheckingSession: boolean;
  adminPassword: string;
  adminAuthError: string | null;
  isAdminAuthSubmitting: boolean;
  productsError: string | null;
  adminActionError: string | null;
  allProducts: Product[];
  editingProductId: string | null;
  adminEditForm: AdminEditForm;
  adminImagePreview: string;
  adminSizeChartImage: string | null;
  isAdminAnalyzingTable: boolean;
  adminExtractedTable: SizeTable | null;
  isAdminActionLoading: boolean;
  brandRules: BrandRule[];
  isBrandRulesLoading: boolean;
  isBrandRulesSaving: boolean;
  isBrandBackfillRunning: boolean;
  brandBackfillResult: BrandBackfillResult | null;
  onLogout: () => void;
  onLogin: () => void;
  onBrandRulesReload: () => void;
  onBrandRulesSave: () => void;
  onBrandRulesBackfill: () => void;
  onBrandRulesChange: (updater: (prev: BrandRule[]) => BrandRule[]) => void;
  onPasswordChange: (value: string) => void;
  onPasswordKeyDown: (key: string) => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>, type: 'product' | 'chart') => void;
  onUpdateProduct: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  onStartEdit: (product: Product) => void;
  onCancelEdit: () => void;
  onEditFormChange: (updater: (prev: AdminEditForm) => AdminEditForm) => void;
  onExtractedTableChange: (table: SizeTable) => void;
  onImageLoadError: (event: SyntheticEvent<HTMLImageElement>) => void;
}

const CATEGORY_OPTIONS = ['Outer', 'Top', 'Bottom', 'Shoes', 'Acc', '기타'] as const;
const ITEM_LABEL = '항목';

export const AdminPage = ({
  isAdminAuthenticated,
  isAdminCheckingSession,
  adminPassword,
  adminAuthError,
  isAdminAuthSubmitting,
  productsError,
  adminActionError,
  allProducts,
  editingProductId,
  adminEditForm,
  adminImagePreview,
  adminSizeChartImage,
  isAdminAnalyzingTable,
  adminExtractedTable,
  isAdminActionLoading,
  brandRules,
  isBrandRulesLoading,
  isBrandRulesSaving,
  isBrandBackfillRunning,
  brandBackfillResult,
  onLogout,
  onLogin,
  onBrandRulesReload,
  onBrandRulesSave,
  onBrandRulesBackfill,
  onBrandRulesChange,
  onPasswordChange,
  onPasswordKeyDown,
  onFileUpload,
  onUpdateProduct,
  onDeleteProduct,
  onStartEdit,
  onCancelEdit,
  onEditFormChange,
  onExtractedTableChange,
  onImageLoadError,
}: AdminPageProps) => {
  const [editingCell, setEditingCell] = useState<
    { kind: 'header'; col: number } | { kind: 'row'; row: number; col: number } | null
  >(null);

  const updateCell = (value: string) => {
    if (!editingCell || !adminExtractedTable) return;
    if (editingCell.kind === 'header') {
      const headers = [...adminExtractedTable.headers];
      headers[editingCell.col] = value;
      onExtractedTableChange({ ...adminExtractedTable, headers });
    } else {
      const rows = adminExtractedTable.rows.map((row, rowIdx) =>
        rowIdx === editingCell.row
          ? row.map((cell, colIdx) => (colIdx === editingCell.col ? value : cell))
          : row
      );
      onExtractedTableChange({ ...adminExtractedTable, rows });
    }
    setEditingCell(null);
  };

  const renderTableCell = (value: string, row: number, col: number, header = false) => {
    const active =
      editingCell &&
      ((header && editingCell.kind === 'header' && editingCell.col === col) ||
        (!header &&
          editingCell.kind === 'row' &&
          editingCell.row === row &&
          editingCell.col === col));

    if (active) {
      return (
        <input
          autoFocus
          defaultValue={value}
          onBlur={(event) => updateCell(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') updateCell((event.target as HTMLInputElement).value);
            if (event.key === 'Escape') setEditingCell(null);
          }}
          onClick={(event) => event.stopPropagation()}
          className="w-full min-w-[40px] border-b border-orange-400 bg-transparent text-white outline-none"
        />
      );
    }

    return value;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-black/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Ruler className="h-5 w-5 text-orange-500" />
            <h1 className="text-lg font-bold">관리자 상품 관리</h1>
          </div>
          {isAdminAuthenticated ? (
            <button onClick={onLogout} className="rounded-lg px-4 py-2 text-sm hover:bg-gray-800">
              로그아웃
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        {isAdminCheckingSession ? <div className="text-gray-400">관리자 세션 확인 중...</div> : null}

        {!isAdminCheckingSession && !isAdminAuthenticated ? (
          <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="text-xl font-bold">관리자 로그인</h2>
            <input
              type="password"
              value={adminPassword}
              placeholder="관리자 비밀번호"
              onChange={(event) => onPasswordChange(event.target.value)}
              onKeyDown={(event) => onPasswordKeyDown(event.key)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3"
            />
            {adminAuthError ? <p className="text-sm text-red-400">{adminAuthError}</p> : null}
            <button
              onClick={onLogin}
              disabled={isAdminAuthSubmitting}
              className={`w-full rounded-xl px-4 py-3 text-sm font-bold text-black ${
                isAdminAuthSubmitting ? 'bg-gray-600 text-gray-300' : 'bg-orange-500 hover:bg-orange-400'
              }`}
            >
              {isAdminAuthSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </div>
        ) : null}

        {!isAdminCheckingSession && isAdminAuthenticated ? (
          <>
            <section className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">브랜드 표준화 규칙</h2>
                  <p className="text-sm text-gray-400">추출 브랜드명과 기존 상품 브랜드명을 한 이름으로 맞춥니다.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onBrandRulesBackfill}
                    disabled={isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning}
                    className="rounded-lg border border-orange-500/40 px-4 py-2 text-sm text-orange-200 hover:bg-orange-900/30 disabled:cursor-not-allowed disabled:border-gray-800 disabled:bg-gray-800 disabled:text-gray-500"
                  >
                    {isBrandBackfillRunning ? '적용 중...' : '기존 상품 일괄 적용'}
                  </button>
                  <button
                    onClick={onBrandRulesReload}
                    disabled={isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning}
                    className="rounded-lg px-3 py-2 text-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500"
                  >
                    새로고침
                  </button>
                  <button
                    onClick={onBrandRulesSave}
                    disabled={isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-black hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                  >
                    {isBrandRulesSaving ? '저장 중...' : '규칙 저장'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="border-b border-gray-800 bg-gray-950/60 text-gray-300">
                    <tr>
                      <th className="px-3 py-3 text-left">매칭 타입</th>
                      <th className="px-3 py-3 text-left">매칭 값</th>
                      <th className="px-3 py-3 text-left">표준 브랜드명</th>
                      <th className="px-3 py-3 text-left">동작</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandRules.length === 0 ? (
                      <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">등록된 규칙이 없습니다.</td></tr>
                    ) : null}
                    {brandRules.map((rule, index) => (
                      <tr key={`${rule.matchType}-${index}`} className="border-b border-gray-800">
                        <td className="px-3 py-3">
                          <select
                            value={rule.matchType}
                            onChange={(event) => onBrandRulesChange((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, matchType: event.target.value as BrandRule['matchType'] } : item))}
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                          >
                            <option value="domain">domain</option>
                            <option value="url">url</option>
                            <option value="brand">brand</option>
                            <option value="brand_contains">brand_contains</option>
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={rule.matchValue}
                            onChange={(event) => onBrandRulesChange((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, matchValue: event.target.value } : item))}
                            placeholder="afterpray.com / after pray"
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={rule.canonicalBrand}
                            onChange={(event) => onBrandRulesChange((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, canonicalBrand: event.target.value } : item))}
                            placeholder="애프터프레이(afterpray)"
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => onBrandRulesChange((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-900/30">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <div>`domain`은 도메인, `brand`는 정확히 일치, `brand_contains`는 부분 일치, `url`은 URL 포함 문자열 기준입니다.</div>
                <button
                  onClick={() => onBrandRulesChange((prev) => [...prev, { matchType: 'domain', matchValue: '', canonicalBrand: '' }])}
                  className="rounded-lg px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
                >
                  규칙 추가
                </button>
              </div>

              {brandBackfillResult ? (
                <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-sm">
                  <div className="flex flex-wrap gap-3">
                    <span className="text-green-400">업데이트: {brandBackfillResult.updatedCount}</span>
                    <span className="text-gray-400">유지: {brandBackfillResult.skippedCount}</span>
                    <span className="text-red-400">실패: {brandBackfillResult.failedCount}</span>
                  </div>
                  {brandBackfillResult.changes.length > 0 ? (
                    <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-gray-800">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-950/70 text-gray-400"><tr><th className="px-3 py-2 text-left">상품</th><th className="px-3 py-2 text-left">기존 브랜드</th><th className="px-3 py-2 text-left">표준 브랜드</th><th className="px-3 py-2 text-left">결과</th></tr></thead>
                        <tbody>
                          {brandBackfillResult.changes.slice(0, 50).map((change) => (
                            <tr key={change.id} className="border-t border-gray-800">
                              <td className="px-3 py-2">{change.name || change.id}</td>
                              <td className="px-3 py-2 text-gray-400">{change.previousBrand}</td>
                              <td className="px-3 py-2">{change.canonicalBrand}</td>
                              <td className={`px-3 py-2 ${change.updated ? 'text-green-400' : 'text-red-400'}`}>{change.updated ? '적용됨' : change.error || '실패'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <div className="mt-3 text-xs text-gray-500">변경된 상품이 없습니다.</div>}
                </div>
              ) : null}
            </section>

            {productsError ? <div className="rounded-xl border border-orange-500 bg-orange-900/40 px-4 py-3 text-orange-200">{productsError}</div> : null}
            {adminActionError ? <div className="rounded-xl border border-red-500 bg-red-900/40 px-4 py-3 text-red-200">{adminActionError}</div> : null}

            {allProducts.length === 0 ? <div className="py-16 text-center text-gray-500">등록된 상품이 없습니다.</div> : null}
            <div className="space-y-3">
              {allProducts.map((product) => (
                <div key={product.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-700 bg-white p-2">
                      <ProgressiveImage src={product.image} thumbnailSrc={product.thumbnailImage} alt={product.name} className="max-h-full max-w-full object-contain" onError={onImageLoadError} />
                    </div>
                    <div className="min-w-0 flex-1">
                      {editingProductId === product.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <input value={adminEditForm.brand} onChange={(event) => onEditFormChange((prev) => ({ ...prev, brand: event.target.value }))} placeholder="브랜드명" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2" />
                            <input value={adminEditForm.name} onChange={(event) => onEditFormChange((prev) => ({ ...prev, name: event.target.value }))} placeholder="상품명" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2" />
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <select value={adminEditForm.category} onChange={(event) => onEditFormChange((prev) => ({ ...prev, category: event.target.value }))} className={`w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 ${adminEditForm.category ? 'text-white' : 'text-gray-400'}`}>
                              <option value="">카테고리 선택</option>
                              {CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                            <input value={adminEditForm.url} onChange={(event) => onEditFormChange((prev) => ({ ...prev, url: event.target.value }))} placeholder="상품 URL (선택)" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2" />
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="space-y-2"><p className="text-xs text-gray-400">상품 이미지 교체</p><div className="flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-700 bg-gray-800">{adminImagePreview ? <img src={adminImagePreview} alt="" className="h-full object-contain" /> : <Upload className="h-6 w-6 text-gray-500" />}<input type="file" className="hidden" accept="image/*" onChange={(event) => onFileUpload(event, 'product')} /></div></label>
                            <label className="space-y-2"><p className="text-xs text-gray-400">사이즈표 이미지 분석</p><div className="flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-700 bg-gray-800">{adminSizeChartImage ? <img src={adminSizeChartImage} alt="" className="h-full object-contain" /> : <Upload className="h-6 w-6 text-gray-500" />}<input type="file" className="hidden" accept="image/*" onChange={(event) => onFileUpload(event, 'chart')} /></div></label>
                          </div>
                          {isAdminAnalyzingTable ? <div className="text-xs text-orange-400">사이즈표를 분석하는 중입니다...</div> : null}
                          <div className="overflow-x-auto rounded-lg border border-gray-700">
                            {adminExtractedTable?.headers?.length ? (
                              <table className="w-full text-left text-xs">
                                <thead className="border-b border-gray-700"><tr>{adminExtractedTable.headers.map((header, colIdx) => <th key={colIdx} onClick={() => setEditingCell({ kind: 'header', col: colIdx })} className={`cursor-pointer whitespace-nowrap px-3 py-2 font-semibold hover:bg-gray-800 ${String(header).trim() === ITEM_LABEL ? 'text-gray-200' : 'text-green-400'} ${colIdx === 0 ? 'border-r border-gray-700' : ''}`}>{renderTableCell(header, 0, colIdx, true)}</th>)}</tr></thead>
                                <tbody>{adminExtractedTable.rows.map((row, rowIdx) => <tr key={rowIdx} className="border-b border-gray-800">{row.map((cell, colIdx) => <td key={colIdx} onClick={() => setEditingCell({ kind: 'row', row: rowIdx, col: colIdx })} className={`cursor-pointer whitespace-nowrap px-3 py-2 hover:bg-gray-800 ${colIdx === 0 ? 'border-r border-gray-700 text-gray-200' : 'text-gray-400'}`}>{renderTableCell(cell, rowIdx, colIdx)}</td>)}</tr>)}</tbody>
                              </table>
                            ) : <div className="px-3 py-4 text-xs text-gray-500">추출된 사이즈표가 없습니다.</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => onUpdateProduct(product.id)} disabled={isAdminActionLoading || isAdminAnalyzingTable} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-black hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-400">저장</button>
                            <button onClick={onCancelEdit} className="rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">취소</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-orange-500">{product.brand}</p>
                            <p className="text-base font-semibold">{product.name}</p>
                            <p className="mt-1 text-sm text-gray-400">{product.category}</p>
                            <p className="mt-1 break-all text-sm text-gray-500">{product.url && product.url !== '#' ? product.url : 'URL 없음'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => onStartEdit(product)} className="rounded-lg px-3 py-2 text-sm text-gray-200 hover:bg-gray-800">수정</button>
                            <button onClick={() => onDeleteProduct(product.id)} disabled={isAdminActionLoading} className="rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-900/30 disabled:bg-gray-800 disabled:text-gray-500">삭제</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};
