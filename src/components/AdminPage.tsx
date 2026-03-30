import { useState } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import { Ruler } from "lucide-react";
import { AdminLoginPanel } from "./admin/AdminLoginPanel";
import { BrandRulesPanel } from "./admin/BrandRulesPanel";
import { AdminProductsList } from "./admin/AdminProductsList";
import type { AdminEditForm, BrandBackfillResult, BrandRule, Product, SizeTable } from "../types";

type TableEditingCell =
  | { kind: "header"; colIdx: number }
  | { kind: "row"; rowIdx: number; colIdx: number }
  | null;

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
  onFileUpload: (event: ChangeEvent<HTMLInputElement>, type: "product" | "chart") => void;
  onUpdateProduct: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  onStartEdit: (product: Product) => void;
  onCancelEdit: () => void;
  onEditFormChange: (updater: (prev: AdminEditForm) => AdminEditForm) => void;
  onExtractedTableChange: (table: SizeTable) => void;
  onImageLoadError: (event: SyntheticEvent<HTMLImageElement>) => void;
}

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
  const [tableEditingCell, setTableEditingCell] = useState<TableEditingCell>(null);

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
          <>
            <BrandRulesPanel
              brandRules={brandRules}
              brandBackfillResult={brandBackfillResult}
              isBrandRulesLoading={isBrandRulesLoading}
              isBrandRulesSaving={isBrandRulesSaving}
              isBrandBackfillRunning={isBrandBackfillRunning}
              onReload={onBrandRulesReload}
              onSave={onBrandRulesSave}
              onBackfill={onBrandRulesBackfill}
              onChange={onBrandRulesChange}
            />

            {productsError ? (
              <div className="rounded-xl border border-orange-500 bg-orange-900/40 px-4 py-3 text-orange-200">
                {productsError}
              </div>
            ) : null}
            {adminActionError ? (
              <div className="rounded-xl border border-red-500 bg-red-900/40 px-4 py-3 text-red-200">
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
          </>
        ) : null}
      </main>
    </div>
  );
};
