import { useState, useCallback } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import { Camera, ChevronLeft, Package, Ruler, Tag } from "lucide-react";
import { AdminLoginPanel } from "./admin/AdminLoginPanel";
import { BrandRulesPanel } from "./admin/BrandRulesPanel";
import { BrandUnifyPanel } from "./admin/BrandUnifyPanel";
import { AdminProductsList } from "./admin/AdminProductsList";
import { InstagramProductsPanel } from "./admin/InstagramProductsPanel";
import type { AdminEditForm, BrandBackfillResult, BrandRule, Product, SizeTable } from "../types";



type TableEditingCell =
  | { kind: "header"; colIdx: number }
  | { kind: "row"; rowIdx: number; colIdx: number }
  | null;

type AdminSection = "brand-rules" | "products" | "instagram" | null;

interface AdminPageProps {
  isAdminAuthenticated: boolean;
  isAdminCheckingSession: boolean;
  adminPassword: string;
  adminAuthError: string | null;
  isAdminAuthSubmitting: boolean;
  productsError: string | null;
  adminActionError: string | null;
  allProducts: Product[];
  featuredProducts: Product[];
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
  hasUnsavedBrandRules: boolean;
  brandBackfillResult: BrandBackfillResult | null;
  isInstagramLoading: boolean;
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
  onInstagramPublish: (id: string) => void;
  onInstagramUnpublish: (id: string) => void;
  onInstagramMove: (id: string, direction: "up" | "down") => void;
  instagramProfileUrl: string;
  onInstagramProfileUrlChange: (url: string) => void;
  onInstagramProfileUrlSave: () => void;
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
  featuredProducts,
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
  hasUnsavedBrandRules,
  brandBackfillResult,
  isInstagramLoading,
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
  onInstagramPublish,
  onInstagramUnpublish,
  onInstagramMove,
  instagramProfileUrl,
  onInstagramProfileUrlChange,
  onInstagramProfileUrlSave,
  onImageLoadError,
}: AdminPageProps) => {
  const [tableEditingCell, setTableEditingCell] = useState<TableEditingCell>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>(null);
  const [dbBrands, setDbBrands] = useState<string[]>([]);
  const handleBrandsLoaded = useCallback((brands: string[]) => setDbBrands(brands), []);

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
            {/* 홈 — 메뉴 선택 */}
            {activeSection === null && (
              <div className="flex flex-col items-center justify-center gap-5 py-24">
                <p className="mb-4 text-sm font-medium uppercase tracking-widest text-gray-500">관리 메뉴</p>
                <button
                  onClick={() => setActiveSection("brand-rules")}
                  className="flex w-72 items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.06] px-8 py-7 text-left shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.1] hover:shadow-[0_12px_40px_rgba(0,0,0,0.36)] active:scale-[0.98]"
                >
                  <Tag className="h-7 w-7 flex-shrink-0 text-orange-400" />
                  <span className="text-lg font-bold text-white">브랜드 대표명 설정</span>
                </button>
                <button
                  onClick={() => setActiveSection("products")}
                  className="flex w-72 items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.06] px-8 py-7 text-left shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.1] hover:shadow-[0_12px_40px_rgba(0,0,0,0.36)] active:scale-[0.98]"
                >
                  <Package className="h-7 w-7 flex-shrink-0 text-orange-400" />
                  <span className="text-lg font-bold text-white">상품 수정</span>
                </button>
                <button
                  onClick={() => setActiveSection("instagram")}
                  className="flex w-72 items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.06] px-8 py-7 text-left shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/[0.1] hover:shadow-[0_12px_40px_rgba(0,0,0,0.36)] active:scale-[0.98]"
                >
                  <Camera className="h-7 w-7 flex-shrink-0 text-orange-400" />
                  <span className="text-lg font-bold text-white">인스타 상품 등록</span>
                </button>
              </div>
            )}

            {/* 뒤로가기 */}
            {activeSection !== null && (
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                뒤로
              </button>
            )}

            {/* 브랜드 대표명 설정 */}
            {activeSection === "brand-rules" && (
              <>
                <BrandUnifyPanel
                  existingRules={brandRules}
                  onBrandsLoaded={handleBrandsLoaded}
                  onAddRules={(newRules) =>
                    onBrandRulesChange((prev) => {
                      const dedupedNew = newRules.filter(
                        (nr) =>
                          !prev.some(
                            (r) =>
                              r.matchType === nr.matchType &&
                              r.matchValue.toLowerCase() === nr.matchValue.toLowerCase()
                          )
                      );
                      return [...prev, ...dedupedNew];
                    })
                  }
                />
                <BrandRulesPanel
                  brandRules={brandRules}
                  brandBackfillResult={brandBackfillResult}
                  isBrandRulesLoading={isBrandRulesLoading}
                  isBrandRulesSaving={isBrandRulesSaving}
                  isBrandBackfillRunning={isBrandBackfillRunning}
                  hasUnsavedChanges={hasUnsavedBrandRules}
                  dbBrands={dbBrands}
                  onReload={onBrandRulesReload}
                  onSave={onBrandRulesSave}
                  onBackfill={onBrandRulesBackfill}
                  onChange={onBrandRulesChange}
                />
              </>
            )}

            {/* 상품 수정 */}
            {activeSection === "products" && (
              <>
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
            )}

            {/* 인스타 상품 등록 */}
            {activeSection === "instagram" && (
              <>
                {adminActionError ? (
                  <div className="rounded-xl border border-red-500 bg-red-900/40 px-4 py-3 text-red-200">
                    {adminActionError}
                  </div>
                ) : null}
                <InstagramProductsPanel
                  featuredProducts={featuredProducts}
                  allProducts={allProducts}
                  isInstagramLoading={isInstagramLoading}
                  onPublish={onInstagramPublish}
                  onUnpublish={onInstagramUnpublish}
                  onMove={onInstagramMove}
                  instagramProfileUrl={instagramProfileUrl}
                  onInstagramProfileUrlChange={onInstagramProfileUrlChange}
                  onInstagramProfileUrlSave={onInstagramProfileUrlSave}
                />
              </>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
};
