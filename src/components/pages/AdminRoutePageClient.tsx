"use client";

import { useCallback, useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { AdminPage } from "../AdminPage";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { fetchAllProducts } from "../../api";
import type { Product } from "../../types";

export function AdminRoutePageClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);
  const loadProducts = useCallback(async () => {
    try {
      setProducts(await fetchAllProducts());
      setProductsError(null);
    } catch (error: unknown) {
      setProductsError(error instanceof Error ? error.message : "상품 목록을 불러오지 못했습니다.");
    }
  }, []);
  const admin = useAdminAuth({
    isAdminPage: true,
    onProductMutated: () => void loadProducts(),
    onProductDeleted: (id) => setProducts((current) => current.filter((product) => product.id !== id)),
  });
  const featuredProducts = useMemo(
    () => products.filter((product) => product.isInstagram).sort((left, right) => (left.instagramOrder ?? Number.MAX_SAFE_INTEGER) - (right.instagramOrder ?? Number.MAX_SAFE_INTEGER)),
    [products],
  );

  useEffect(() => {
    if (admin.isAdminAuthenticated) void loadProducts();
    else setProducts([]);
  }, [admin.isAdminAuthenticated, loadProducts]);

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = "none";
  };

  return (
    <AdminPage
      isAdminAuthenticated={admin.isAdminAuthenticated}
      isAdminCheckingSession={admin.isAdminCheckingSession}
      adminPassword={admin.adminPassword}
      adminAuthError={admin.adminAuthError}
      isAdminAuthSubmitting={admin.isAdminAuthSubmitting}
      productsError={productsError}
      adminActionError={admin.adminActionError}
      allProducts={products}
      featuredProducts={featuredProducts}
      editingProductId={admin.editingProductId}
      adminEditForm={admin.adminEditForm}
      adminImagePreview={admin.adminImagePreview}
      adminSizeChartImage={admin.adminSizeChartImage}
      isAdminAnalyzingTable={admin.isAdminAnalyzingTable}
      adminExtractedTable={admin.adminExtractedTable}
      isAdminActionLoading={admin.isAdminActionLoading}
      brandRules={admin.brandRules}
      isBrandRulesLoading={admin.isBrandRulesLoading}
      isBrandRulesSaving={admin.isBrandRulesSaving}
      isBrandBackfillRunning={admin.isBrandBackfillRunning}
      hasUnsavedBrandRules={admin.hasUnsavedBrandRules}
      brandBackfillResult={admin.brandBackfillResult}
      isInstagramLoading={admin.isInstagramLoading}
      onLogout={() => void admin.handleAdminLogout()}
      onLogin={() => void admin.handleAdminLogin()}
      onBrandRulesReload={() => void admin.loadBrandRules()}
      onBrandRulesSave={() => void admin.handleBrandRulesSave()}
      onBrandRulesBackfill={() => void admin.handleBrandRulesBackfill()}
      onBrandRulesChange={admin.setBrandRules}
      onPasswordChange={admin.setAdminPassword}
      onPasswordKeyDown={(key) => {
        if (key === "Enter") void admin.handleAdminLogin();
      }}
      onFileUpload={admin.handleAdminFileUpload}
      onUpdateProduct={(id) => void admin.handleAdminUpdateProduct(id)}
      onApproveProductCategory={(id) => void admin.handleApproveProductCategory(id)}
      onDeleteProduct={(id) => void admin.handleAdminDeleteProduct(id)}
      onStartEdit={admin.startProductEdit}
      onCancelEdit={admin.cancelEdit}
      onEditFormChange={admin.setAdminEditForm}
      onExtractedTableChange={admin.setAdminExtractedTable}
      onInstagramPublish={(id) => void admin.handleInstagramPublish(id)}
      onInstagramUnpublish={(id) => void admin.handleInstagramUnpublish(id)}
      onInstagramMove={(id, direction) => void admin.handleInstagramMove(featuredProducts, id, direction)}
      instagramProfileUrl={admin.instagramProfileUrl}
      onInstagramProfileUrlChange={admin.setInstagramProfileUrl}
      digboxUrl={admin.digboxUrl}
      onDigboxUrlChange={admin.setDigboxUrl}
      featuredHeading={admin.featuredHeading}
      onFeaturedHeadingChange={admin.setFeaturedHeading}
      onInstagramProfileUrlSave={() => void admin.handleInstagramProfileUrlSave()}
      onImageLoadError={handleImageLoadError}
      onSaveStyleReview={(id, review) => void admin.handleSaveProductStyleReview(id, review)}
    />
  );
}
