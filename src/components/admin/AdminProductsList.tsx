import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Search, Sparkles, XCircle } from 'lucide-react';
import { ProgressiveImage } from '../ProgressiveImage';
import { AdminProductEditor } from './AdminProductEditor';
import { ProductStyleReviewPanel, type StyleAttributeOption } from './ProductStyleReviewPanel';
import type { AdminEditForm, Product, ProductStyleReviewInput, SizeTable } from '../../types';
import type { ChangeEvent, SyntheticEvent } from 'react';

type TableEditingCell =
  | { kind: 'header'; colIdx: number }
  | { kind: 'row'; rowIdx: number; colIdx: number }
  | null;

type AiTagFilter = 'all' | 'tagged' | 'untagged' | 'failed';
type ReviewFilter = 'all' | 'unapproved' | 'approved' | 'rejected';

const hasAiTags = (product: Product) => Boolean(product.styleTags && typeof product.styleTags === 'object');
const isApprovedReview = (product: Product) =>
  product.tagReviewStatus === 'approved' || product.tagReviewStatus === 'edited';
const isRejectedReview = (product: Product) => product.tagReviewStatus === 'rejected';
const isUnapprovedReview = (product: Product) => hasAiTags(product) && !isApprovedReview(product) && !isRejectedReview(product);

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
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [customAttributeOptions, setCustomAttributeOptions] = useState<StyleAttributeOption[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/style-attribute-options', { credentials: 'include' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data?.options)) return;
        if (!isMounted) return;
        setCustomAttributeOptions(payload.data.options.map((option: { attribute_key?: unknown; value?: unknown }) => ({
          attributeKey: String(option.attribute_key ?? ''),
          value: String(option.value ?? ''),
        })).filter((option: StyleAttributeOption) => option.attributeKey && option.value));
      })
      .catch(() => undefined);
    return () => { isMounted = false; };
  }, []);

  const addAttributeOption = async (option: StyleAttributeOption) => {
    const response = await fetch('/api/admin/style-attribute-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ attributeKey: option.attributeKey, value: option.value }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok || !payload?.data?.option) {
      throw new Error(payload?.error || '속성 선택지 저장에 실패했습니다.');
    }
    const saved = {
      attributeKey: String(payload.data.option.attribute_key ?? ''),
      value: String(payload.data.option.value ?? ''),
    } as StyleAttributeOption;
    setCustomAttributeOptions((previous) =>
      previous.some((item) => item.attributeKey === saved.attributeKey && item.value === saved.value)
        ? previous
        : [...previous, saved]
    );
  };

  const aiTaggedCount = allProducts.filter(hasAiTags).length;
  const aiUntaggedCount = allProducts.filter((product) => !hasAiTags(product) && product.taggingStatus !== 'failed').length;
  const failedTaggingCount = allProducts.filter((product) => product.taggingStatus === 'failed').length;
  const unapprovedReviewCount = allProducts.filter(isUnapprovedReview).length;
  const approvedReviewCount = allProducts.filter(isApprovedReview).length;
  const rejectedReviewCount = allProducts.filter(isRejectedReview).length;

  const filteredProducts = allProducts.filter((p) => {
    const productHasAiTags = hasAiTags(p);
    if (aiTagFilter === 'tagged' && !productHasAiTags) return false;
    if (aiTagFilter === 'untagged' && (productHasAiTags || p.taggingStatus === 'failed')) return false;
    if (aiTagFilter === 'failed' && p.taggingStatus !== 'failed') return false;
    if (aiTagFilter === 'tagged' && reviewFilter === 'unapproved' && !isUnapprovedReview(p)) return false;
    if (aiTagFilter === 'tagged' && reviewFilter === 'approved' && !isApprovedReview(p)) return false;
    if (aiTagFilter === 'tagged' && reviewFilter === 'rejected' && !isRejectedReview(p)) return false;

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
      <section className="border-b border-gray-800 pb-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-300">Tagging Operations</p>
            <p className="mt-1 text-sm text-gray-500">태깅 상태와 사람 검수 진행 상황을 관리합니다.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAiTagFilter('all');
              setReviewFilter('all');
            }}
            className={`shrink-0 text-xs transition ${aiTagFilter === 'all' ? 'text-orange-300' : 'text-gray-500 hover:text-gray-300'}`}
          >
            전체 보기 {allProducts.length}개
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([
            ['tagged', 'AI 태그 있음', aiTaggedCount, Sparkles, 'text-orange-300'],
            ['untagged', 'AI 태그 없음', aiUntaggedCount, Clock3, 'text-gray-300'],
            ['tagged', '검수 대기', unapprovedReviewCount, Clock3, 'text-amber-300', 'unapproved'],
            ['failed', '태깅 실패', failedTaggingCount, AlertTriangle, 'text-red-300'],
          ] as const).map(([scope, label, count, Icon, color, nextReviewFilter]) => {
            const isActive = aiTagFilter === scope && (nextReviewFilter ? reviewFilter === nextReviewFilter : scope !== 'tagged' || reviewFilter === 'all');
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setAiTagFilter(scope);
                  setReviewFilter(nextReviewFilter || 'all');
                }}
                className={`min-w-0 rounded-lg border px-3 py-2.5 text-left transition ${
                  isActive ? 'border-orange-500 bg-orange-500/15' : 'border-gray-800 bg-gray-900/70 hover:border-gray-700'
                }`}
              >
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${color}`}><Icon className="h-3.5 w-3.5" />{label}</span>
                <span className="mt-1 block text-lg font-bold text-white">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {aiTagFilter === 'tagged' ? (
        <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-3">
          {([
            ['all', `전체 ${aiTaggedCount}`, Sparkles],
            ['unapproved', `미승인 ${unapprovedReviewCount}`, Clock3],
            ['approved', `승인 완료 ${approvedReviewCount}`, CheckCircle2],
            ['rejected', `반려 ${rejectedReviewCount}`, XCircle],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setReviewFilter(value)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                reviewFilter === value
                  ? 'border-orange-500 bg-orange-500/15 text-orange-200'
                  : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>
      ) : null}
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
          {searchQuery || aiTagFilter !== 'all' || reviewFilter !== 'all'
            ? `${filteredProducts.length} / ${allProducts.length}개`
            : `총 ${allProducts.length}개`}
          {aiTagFilter !== 'all' ? ` · ${aiTagFilter === 'tagged' ? 'AI 태그 있음' : aiTagFilter === 'untagged' ? 'AI 태그 없음' : '태깅 실패'} 필터` : ''}
          {aiTagFilter === 'tagged' && reviewFilter !== 'all' ? ` · ${reviewFilter === 'unapproved' ? '미승인' : reviewFilter === 'approved' ? '승인 완료' : '반려'} 검수 필터` : ''}
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
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                          product.taggingStatus === 'failed'
                            ? 'border-red-500/40 bg-red-500/10 text-red-200'
                            : hasAiTags(product)
                              ? 'border-orange-500/30 bg-orange-500/10 text-orange-200'
                              : 'border-gray-700 bg-gray-800 text-gray-400'
                        }`}>
                          {product.taggingStatus === 'failed' ? '태깅 실패' : hasAiTags(product) ? 'AI 태그 있음' : 'AI 태그 없음'}
                        </span>
                        {hasAiTags(product) ? <span className="rounded-md border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{isApprovedReview(product) ? '승인 완료' : isRejectedReview(product) ? '반려' : '미승인'}</span> : null}
                      </div>
                      {product.taggingStatus === 'failed' && product.taggingError ? <p className="mt-2 flex items-start gap-1.5 rounded-md border border-red-500/20 bg-red-500/[0.06] px-2.5 py-2 text-xs leading-5 text-red-200"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{product.taggingError}</p> : null}
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
                    customAttributeOptions={customAttributeOptions}
                    isSaving={isAdminActionLoading}
                    onAddAttributeOption={addAttributeOption}
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
