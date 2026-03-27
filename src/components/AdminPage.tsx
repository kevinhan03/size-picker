import { useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { Ruler } from 'lucide-react';
import type { AdminEditForm, Product, SizeTable } from '../types';
import { AdminLoginPanel } from './admin/AdminLoginPanel';
import { AdminProductsList } from './admin/AdminProductsList';

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
  onExtractedTableChange: (table: SizeTable) => void;
  onImageLoadError: (event: SyntheticEvent<HTMLImageElement>) => void;
}

type TableEditingCell =
  | { kind: 'header'; colIdx: number }
  | { kind: 'row'; rowIdx: number; colIdx: number }
  | null;

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
  onExtractedTableChange,
  onImageLoadError,
}: AdminPageProps) => {
  const [tableEditingCell, setTableEditingCell] = useState<TableEditingCell>(null);

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
          <AdminLoginPanel
            adminAuthError={adminAuthError}
            adminPassword={adminPassword}
            isAdminAuthSubmitting={isAdminAuthSubmitting}
            onLogin={onLogin}
            onPasswordChange={onPasswordChange}
            onPasswordKeyDown={onPasswordKeyDown}
          />
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

            <AdminProductsList
              adminEditForm={adminEditForm}
              adminExtractedTable={adminExtractedTable}
              adminImagePreview={adminImagePreview}
              adminSizeChartImage={adminSizeChartImage}
              allProducts={allProducts}
              editingProductId={editingProductId}
              isAdminActionLoading={isAdminActionLoading}
              isAdminAnalyzingTable={isAdminAnalyzingTable}
              onCancelEdit={onCancelEdit}
              onDeleteProduct={onDeleteProduct}
              onEditFormChange={onEditFormChange}
              onExtractedTableChange={onExtractedTableChange}
              onFileUpload={onFileUpload}
              onImageLoadError={onImageLoadError}
              onStartEdit={onStartEdit}
              onUpdateProduct={onUpdateProduct}
              setTableEditingCell={setTableEditingCell}
              tableEditingCell={tableEditingCell}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
};
