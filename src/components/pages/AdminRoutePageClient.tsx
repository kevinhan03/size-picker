"use client";

import type { SyntheticEvent } from "react";
import { AdminPage } from "../AdminPage";
import { useProductsContext } from "../../contexts/ProductsContext";
import { useAdminAuth } from "../../hooks/useAdminAuth";

export function AdminRoutePageClient() {
  const { productsError, products, featuredProducts, retryProductsLoad } = useProductsContext();
  const admin = useAdminAuth({
    isAdminPage: true,
    onProductMutated: () => retryProductsLoad(),
    onProductDeleted: () => {},
  });

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
      onDeleteProduct={(id) => void admin.handleAdminDeleteProduct(id)}
      onStartEdit={admin.startProductEdit}
      onCancelEdit={admin.cancelEdit}
      onEditFormChange={admin.setAdminEditForm}
      onExtractedTableChange={admin.setAdminExtractedTable}
      onInstagramPublish={(id) => void admin.handleInstagramPublish(id)}
      onInstagramUnpublish={(id) => void admin.handleInstagramUnpublish(id)}
      instagramProfileUrl={admin.instagramProfileUrl}
      onInstagramProfileUrlChange={admin.setInstagramProfileUrl}
      onInstagramProfileUrlSave={() => void admin.handleInstagramProfileUrlSave()}
      onImageLoadError={handleImageLoadError}
    />
  );
}
