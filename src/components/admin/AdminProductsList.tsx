import { ProgressiveImage } from '../ProgressiveImage';
import { AdminProductEditor } from './AdminProductEditor';
import type { AdminEditForm, Product, SizeTable } from '../../types';
import type { ChangeEvent, SyntheticEvent } from 'react';

type TableEditingCell =
  | { kind: 'header'; colIdx: number }
  | { kind: 'row'; rowIdx: number; colIdx: number }
  | null;

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
  onStartEdit,
  onUpdateProduct,
  setTableEditingCell,
  tableEditingCell,
}: AdminProductsListProps) {
  if (allProducts.length === 0) {
    return <div className="text-center py-16 text-gray-500">등록된 상품이 없습니다.</div>;
  }

  return (
    <div className="space-y-3">
      {allProducts.map((product) => (
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
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
