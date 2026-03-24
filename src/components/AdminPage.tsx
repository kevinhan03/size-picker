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
  onLogout: () => void;
  onLogin: () => void;
  onPasswordChange: (value: string) => void;
  onPasswordKeyDown: (key: string) => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>, type: 'product' | 'chart') => void;
  onUpdateProduct: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  onStartEdit: (product: Product) => void;
  onCancelEdit: () => void;
  onEditFormChange: (updater: (prev: AdminEditForm) => AdminEditForm) => void;
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
  onLogout,
  onLogin,
  onPasswordChange,
  onPasswordKeyDown,
  onFileUpload,
  onUpdateProduct,
  onDeleteProduct,
  onStartEdit,
  onCancelEdit,
  onEditFormChange,
  onImageLoadError,
}: AdminPageProps) => {
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
                                      {adminExtractedTable.headers.map((header, idx) => (
                                        <th
                                          key={idx}
                                          className={`px-3 py-2 font-semibold whitespace-nowrap ${normalizeCellText(header) === ITEM_LABEL ? 'text-gray-200' : 'text-green-400'} ${idx === 0 ? 'border-r border-gray-700' : ''}`}
                                        >
                                          {header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {adminExtractedTable.rows.map((row, rowIdx) => (
                                      <tr key={rowIdx} className="border-b border-gray-800">
                                        {row.map((cell, cellIdx) => (
                                          <td key={cellIdx} className={`px-3 py-2 text-gray-200 whitespace-nowrap ${cellIdx === 0 ? 'border-r border-gray-700' : ''}`}>{cell}</td>
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
