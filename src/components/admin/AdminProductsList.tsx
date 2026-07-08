import { useState } from 'react';
import { Search } from 'lucide-react';
import { ProgressiveImage } from '../ProgressiveImage';
import { AdminProductEditor } from './AdminProductEditor';
import { ProductStyleReviewPanel } from './ProductStyleReviewPanel';
import type { AdminEditForm, Product, ProductStyleReviewInput, SizeTable } from '../../types';
import type { ChangeEvent, SyntheticEvent } from 'react';

type TableEditingCell =
  | { kind: 'header'; colIdx: number }
  | { kind: 'row'; rowIdx: number; colIdx: number }
  | null;

type AiTagFilter = 'all' | 'tagged' | 'untagged';

interface AdminProductsListProps {
  adminEditForm: AdminEditForm;
  adminExtractedTable: SizeTable | null;
  adminImagePreview: string;
  adminSizeChartImage: string | null;
  allProducts: Product[];
  editingProductId: string | null;
  isAdminActionLoading: boolean;
  isAdminAnalyzingTable: boolean;
  onCancelEdit: () => void;
  onDeleteProduct: (id: string) => void;
  onEditFormChange: (updater: (prev: AdminEditForm) => AdminEditForm) => void;
  onExtractedTableChange: (table: SizeTable) => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>, type: 'product' | 'chart') => void;
  onImageLoadError: (event: SyntheticEvent<HTMLImageElement>) => void;
  onSaveStyleReview: (id: string, review: ProductStyleReviewInput) => void;
  onStartEdit: (product: Product) => void;
  onUpdateProduct: (id: string) => void;
  setTableEditingCell: (cell: TableEditingCell) => void;
  tableEditingCell: TableEditingCell;
}

export function AdminProductsList({
  adminEditForm,
  adminExtractedTable,
  adminImagePreview,
  adminSizeChartImage,
  allProducts,
  editingProductId,
  isAdminActionLoading,
  isAdminAnalyzingTable,
  onCancelEdit,
  onDeleteProduct,
  onEditFormChange,
  onExtractedTableChange,
  onFileUpload,
  onImageLoadError,
  onSaveStyleReview,
  onStartEdit,
  onUpdateProduct,
  setTableEditingCell,
  tableEditingCell,
}: AdminProductsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiTagFilter, setAiTagFilter] = useState<AiTagFilter>('all');

  const aiTaggedCount = allProducts.filter((product) => Boolean(product.styleTags)).length;
  const aiUntaggedCount = allProducts.length - aiTaggedCount;

  const filteredProducts = allProducts.filter((p) => {
    const hasAiTags = Boolean(p.styleTags);
    if (aiTagFilter === 'tagged' && !hasAiTags) return false;
    if (aiTagFilter === 'untagged' && hasAiTags) return false;

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.brand.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
    }
    return true;
  });

  if (allProducts.length === 0) {
    return <div className="text-center py-16 text-gray-500">등록된 상품이 없습니다.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {([
          ['all', '전체', allProducts.length],
          ['tagged', 'AI 태그 있음', aiTaggedCount],
          ['untagged', 'AI 태그 없음', aiUntaggedCount],
        ] as [AiTagFilter, string, number][]).map(([value, label, count]) => {
          const isActive = aiTagFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setAiTagFilter(value)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                isActive
                  ? 'border-orange-500 bg-orange-500/15 text-white'
                  : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              <span className="block text-xs font-semibold">{label}</span>
              <span className="mt-0.5 block text-lg font-bold">{count}</span>
            </button>
          );
        })}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="브랜드, 상품명, 카테고리로 검색..."
          className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
          >
            ✕
          </button>
        )}
      </div>
      {filteredProducts.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">검색 결과가 없습니다.</div>
      ) : (
        <div className="text-xs text-gray-500 px-1">
          {searchQuery || aiTagFilter !== 'all'
            ? `${filteredProducts.length} / ${allProducts.length}개`
            : `총 ${allProducts.length}개`}
          {aiTagFilter !== 'all' ? ` · ${aiTagFilter === 'tagged' ? 'AI 태그 있음' : 'AI 태그 없음'} 필터` : ''}
        </div>
      )}
      {filteredProducts.map((product) => (
        <div key={product.id} className="ui-product-card bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="relative w-20 h-20 bg-white rounded-xl p-2 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
              <ProgressiveImage
                src={product.image}
                thumbnailSrc={product.thumbnailImage}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
                onError={onImageLoadError}
              />
            </div>
            <div className="flex-1 min-w-0">
              {editingProductId === product.id ? (
                <AdminProductEditor
                  adminEditForm={adminEditForm}
                  adminExtractedTable={adminExtractedTable}
                  adminImagePreview={adminImagePreview}
                  adminSizeChartImage={adminSizeChartImage}
                  isAdminActionLoading={isAdminActionLoading}
                  isAdminAnalyzingTable={isAdminAnalyzingTable}
                  onCancelEdit={onCancelEdit}
                  onEditFormChange={onEditFormChange}
                  onExtractedTableChange={onExtractedTableChange}
                  onFileUpload={onFileUpload}
                  onUpdateProduct={() => onUpdateProduct(product.id)}
                  setTableEditingCell={setTableEditingCell}
                  tableEditingCell={tableEditingCell}
                />
              ) : (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-orange-500 uppercase tracking-wide">{product.brand}</p>
                      <p className="text-base font-semibold text-white">{product.name}</p>
                      <p className="text-sm text-gray-400 mt-1">{product.category}</p>
                      <p className="text-sm text-gray-500 mt-1 break-all">
                        {product.url || 'URL 없음'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onStartEdit(product)}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-800"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => onDeleteProduct(product.id)}
                        disabled={isAdminActionLoading}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          isAdminActionLoading
                            ? 'text-gray-500 bg-gray-800 cursor-not-allowed'
                            : 'text-red-300 hover:bg-red-900/30'
                        }`}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <ProductStyleReviewPanel
                    isSaving={isAdminActionLoading}
                    onSave={onSaveStyleReview}
                    product={product}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
