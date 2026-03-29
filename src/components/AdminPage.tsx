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
  url: string;
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

const CATEGORY_OPTIONS = ['Outer', 'Top', 'Bottom', 'Shoes', 'Acc', '단종된 상품(빈티지)'] as const;
const ITEM_LABEL = '항목';
const normalizeCellText = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();

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
  const brandRuleTypes: Array<{ value: BrandRule['matchType']; label: string }> = [
    { value: 'domain', label: 'domain' },
    { value: 'url', label: 'url' },
    { value: 'brand', label: 'brand' },
    { value: 'brand_contains', label: 'brand_contains' },
  ];

  const [tableEditingCell, setTableEditingCell] = useState<
    { kind: 'header'; colIdx: number } | { kind: 'row'; rowIdx: number; colIdx: number } | null
  >(null);

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
    <div className="min-h-screen bg-black text-white font-sans">
      <header className="sticky top-0 w-full bg-black/90 backdrop-blur-md border-b border-gray-800 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ruler className="w-5 h-5 text-orange-500" />
            <h1 className="text-lg font-bold text-white">관리자 상품 관리</h1>
          </div>
          {isAdminAuthenticated ? (
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800"
            >
              로그아웃
            </button>
          ) : null}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {isAdminCheckingSession ? (
          <div className="text-gray-400">관리자 세션 확인 중...</div>
        ) : null}

        {!isAdminCheckingSession && !isAdminAuthenticated ? (
          <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">관리자 로그인</h2>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
              placeholder="관리자 비밀번호"
              value={adminPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              onKeyDown={(event) => onPasswordKeyDown(event.key)}
            />
            {adminAuthError ? <p className="text-sm text-red-400">{adminAuthError}</p> : null}
            <button
              onClick={onLogin}
              disabled={isAdminAuthSubmitting}
              className={`w-full px-4 py-3 rounded-xl text-sm font-bold text-black ${isAdminAuthSubmitting ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400'}`}
            >
              {isAdminAuthSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </div>
        ) : null}

        {!isAdminCheckingSession && isAdminAuthenticated ? (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">브랜드 표준화 규칙</h2>
                  <p className="text-sm text-gray-400">
                    저장하면 새 상품 추출과 기존 상품 수정에 바로 적용됩니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onBrandRulesBackfill}
                    disabled={isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'text-orange-200 hover:bg-orange-900/30 border border-orange-500/40'}`}
                  >
                    {isBrandBackfillRunning ? '일괄 적용 중...' : '기존 상품 일괄 적용'}
                  </button>
                  <button
                    onClick={onBrandRulesReload}
                    disabled={isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'text-gray-200 hover:bg-gray-800'}`}
                  >
                    새로고침
                  </button>
                  <button
                    onClick={onBrandRulesSave}
                    disabled={isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning}
                    className={`px-4 py-2 rounded-lg text-sm font-bold text-black ${isBrandRulesLoading || isBrandRulesSaving || isBrandBackfillRunning ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400'}`}
                  >
                    {isBrandRulesSaving ? '저장 중...' : '규칙 저장'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-gray-950/60 border-b border-gray-800 text-gray-300">
                    <tr>
                      <th className="px-3 py-3 text-left">매칭 타입</th>
                      <th className="px-3 py-3 text-left">매칭 값</th>
                      <th className="px-3 py-3 text-left">표준 브랜드명</th>
                      <th className="px-3 py-3 text-left">동작</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandRules.map((rule, index) => (
                      <tr key={`${rule.matchType}-${index}`} className="border-b border-gray-800">
                        <td className="px-3 py-3">
                          <select
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            value={rule.matchType}
                            onChange={(e) =>
                              onBrandRulesChange((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, matchType: e.target.value as BrandRule['matchType'] }
                                    : item
                                )
                              )
                            }
                          >
                            {brandRuleTypes.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            value={rule.matchValue}
                            onChange={(e) =>
                              onBrandRulesChange((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, matchValue: e.target.value } : item
                                )
                              )
                            }
                            placeholder="afterpray.com / after pray / afterpray"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            value={rule.canonicalBrand}
                            onChange={(e) =>
                              onBrandRulesChange((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, canonicalBrand: e.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder="애프터프레이(afterpray)"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() =>
                              onBrandRulesChange((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                            }
                            className="px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-900/30"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                    {brandRules.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                          등록된 브랜드 규칙이 없습니다.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-gray-500">
                  `domain`: 도메인 기준, `brand`: 추출 브랜드명 정확히 일치, `brand_contains`: 부분 일치, `url`: URL 포함 문자열
                </div>
                <button
                  onClick={() =>
                    onBrandRulesChange((prev) => [
                      ...prev,
                      { matchType: 'domain', matchValue: '', canonicalBrand: '' },
                    ])
                  }
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-800"
                >
                  규칙 추가
                </button>
              </div>
              {brandBackfillResult ? (
                <div className="rounded-xl border border-gray-800 bg-black/30 p-4 space-y-3">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="text-green-400">업데이트: {brandBackfillResult.updatedCount}</span>
                    <span className="text-gray-400">유지: {brandBackfillResult.skippedCount}</span>
                    <span className="text-red-400">실패: {brandBackfillResult.failedCount}</span>
                  </div>
                  {brandBackfillResult.changes.length > 0 ? (
                    <div className="max-h-64 overflow-auto rounded-lg border border-gray-800">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-950/70 text-gray-400">
                          <tr>
                            <th className="px-3 py-2 text-left">상품</th>
                            <th className="px-3 py-2 text-left">이전 브랜드</th>
                            <th className="px-3 py-2 text-left">변경 브랜드</th>
                            <th className="px-3 py-2 text-left">상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {brandBackfillResult.changes.slice(0, 50).map((change) => (
                            <tr key={change.id} className="border-t border-gray-800">
                              <td className="px-3 py-2 text-gray-200">{change.name || change.id}</td>
                              <td className="px-3 py-2 text-gray-400">{change.previousBrand}</td>
                              <td className="px-3 py-2 text-white">{change.canonicalBrand}</td>
                              <td className={`px-3 py-2 ${change.updated ? 'text-green-400' : 'text-red-400'}`}>
                                {change.updated ? '완료' : change.error || '실패'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">변경된 기존 상품이 없습니다.</div>
                  )}
                </div>
              ) : null}
            </div>

            {productsError ? (
              <div className="bg-orange-900/40 border border-orange-500 text-orange-200 px-4 py-3 rounded-xl">
                {productsError}
              </div>
            ) : null}
            {adminActionError ? (
              <div className="bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded-xl">
                {adminActionError}
              </div>
            ) : null}

            {allProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-500">등록된 상품이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {allProducts.map((product) => (
                  <div key={product.id} className="ui-product-card bg-gray-900 border border-gray-800 rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="w-20 h-20 bg-white rounded-xl p-2 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                        <ProgressiveImage src={product.image} thumbnailSrc={product.thumbnailImage} alt={product.name} className="max-w-full max-h-full object-contain" onError={onImageLoadError} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingProductId === product.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg" value={adminEditForm.brand} onChange={(e) => onEditFormChange((prev) => ({ ...prev, brand: e.target.value }))} placeholder="브랜드명" />
                              <input className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg" value={adminEditForm.name} onChange={(e) => onEditFormChange((prev) => ({ ...prev, name: e.target.value }))} placeholder="상품명" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <select
                                className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg ${adminEditForm.category ? 'text-white' : 'text-gray-400'}`}
                                value={adminEditForm.category}
                                onChange={(e) => onEditFormChange((prev) => ({ ...prev, category: e.target.value }))}
                              >
                                <option value="">카테고리</option>
                                {CATEGORY_OPTIONS.map((category) => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                              <input className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg" value={adminEditForm.url} onChange={(e) => onEditFormChange((prev) => ({ ...prev, url: e.target.value }))} placeholder="공식 URL (선택)" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <p className="text-xs text-gray-400">상품 이미지 교체</p>
                                <label className="cursor-pointer w-full h-28 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                  {adminImagePreview ? <img src={adminImagePreview} className="h-full object-contain" /> : <Upload className="w-6 h-6 text-gray-500" />}
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileUpload(e, 'product')} />
                                </label>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-400">사이즈표 이미지 재분석</p>
                                <label className="cursor-pointer w-full h-28 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                  {adminSizeChartImage ? <img src={adminSizeChartImage} className="h-full object-contain" /> : <Upload className="w-6 h-6 text-gray-500" />}
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileUpload(e, 'chart')} />
                                </label>
                              </div>
                            </div>
                            {isAdminAnalyzingTable ? <div className="text-xs text-orange-400">사이즈표 재분석 중...</div> : null}
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
                                              onBlur={(e) => commitTableCell(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') commitTableCell((e.target as HTMLInputElement).value);
                                                if (e.key === 'Escape') setTableEditingCell(null);
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                              className="bg-transparent border-b border-orange-400 outline-none w-full min-w-[40px] text-white"
                                            />
                                          ) : header}
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
                                            {tableEditingCell?.kind === 'row' && tableEditingCell.rowIdx === rowIdx && tableEditingCell.colIdx === colIdx ? (
                                              <input
                                                autoFocus
                                                defaultValue={cell}
                                                onBlur={(e) => commitTableCell(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') commitTableCell((e.target as HTMLInputElement).value);
                                                  if (e.key === 'Escape') setTableEditingCell(null);
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
                              ) : (
                                <div className="px-3 py-4 text-xs text-gray-500">사이즈표 데이터가 없습니다.</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => onUpdateProduct(product.id)} disabled={isAdminActionLoading || isAdminAnalyzingTable} className={`px-4 py-2 rounded-lg text-sm font-bold text-black ${(isAdminActionLoading || isAdminAnalyzingTable) ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400'}`}>저장</button>
                              <button onClick={onCancelEdit} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800">취소</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-orange-500 uppercase tracking-wide">{product.brand}</p>
                              <p className="text-base font-semibold text-white">{product.name}</p>
                              <p className="text-sm text-gray-400 mt-1">{product.category}</p>
                              <p className="text-sm text-gray-500 mt-1 break-all">{product.url && product.url !== '#' ? product.url : 'URL 없음'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => onStartEdit(product)} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-800">수정</button>
                              <button onClick={() => onDeleteProduct(product.id)} disabled={isAdminActionLoading} className={`px-3 py-2 rounded-lg text-sm font-medium ${isAdminActionLoading ? 'text-gray-500 bg-gray-800 cursor-not-allowed' : 'text-red-300 hover:bg-red-900/30'}`}>삭제</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};
