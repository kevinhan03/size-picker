import { useEffect, useMemo, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import {
  Check,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { AddProductModal } from './components/AddProductModal';
import { AdminPage } from './components/AdminPage';
import { AppHeader } from './components/AppHeader';
import { GoogleSignupCompleteModal } from './components/GoogleSignupCompleteModal';
import { GridView } from './components/GridView';
import { LoginPage } from './components/LoginPage';
import { NeedsUsernameModal } from './components/NeedsUsernameModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SizeConverterView } from './components/SizeConverterView';
import { DuplicateProductModal } from './components/modals/DuplicateProductModal';
import { MyPageView } from './components/views/MyPageView';
import { SearchView } from './components/views/SearchView';
import { supabase } from './lib/supabase';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAuth } from './hooks/useAuth';
import { useGridState } from './hooks/useGridState';
import { useProductForm } from './hooks/useProductForm';
import { useProducts } from './hooks/useProducts';
import { useProductSearch } from './hooks/useProductSearch';
import { useSizeConverterState } from './hooks/useSizeConverterState';
import type { Product, SizeRecommendation, ViewMode } from './types';
import { computeSizeRecommendations, normalizeSizeLookupValue } from './utils/sizeTable';
import { normalizeComparableProductUrl } from './utils/product';

const smoothScrollTo = (container: HTMLElement, targetY: number, duration = 520) => {
  const start = container.scrollTop;
  const distance = targetY - start;
  if (Math.abs(distance) < 2) return;
  const startTime = performance.now();
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    container.scrollTop = start + distance * easeInOutCubic(progress);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const isAdminPage = typeof window !== 'undefined' && window.location.pathname === '/admin';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedGridProduct, setSelectedGridProduct] = useState<Product | null>(null);
  const [activeResultRowIndex, setActiveResultRowIndex] = useState<number | null>(null);
  const [activeGridDetailRowIndex, setActiveGridDetailRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);

  const gridDetailRecommendationsRef = useRef<HTMLDivElement>(null);
  const gridDetailModalRef = useRef<HTMLDivElement>(null);
  const searchResultModalRef = useRef<HTMLDivElement>(null);
  const searchResultRecommendationsRef = useRef<HTMLDivElement>(null);
  const resetSearchRef = useRef<() => void>(() => undefined);

  function navigateToView(nextView: ViewMode) {
    setViewMode(nextView);
    setSelectedGridProduct(null);
    setActiveResultRowIndex(null);
    setActiveGridDetailRowIndex(null);
    setIsDetailImageZoomed(false);
    resetSearchRef.current();
  }

  const productsState = useProducts();
  const allProducts = useMemo(() => [...productsState.products], [productsState.products]);

  const grid = useGridState(allProducts);
  const converter = useSizeConverterState();
  const {
    activeConverterRowIndex,
    convertedSize,
    setActiveConverterRowIndex,
    setSizeCategory,
    setSizeGender,
    setSizeRegion,
    setSizeValue,
    sizeCategory,
    sizeGender,
    sizeOptions,
    sizeRegion,
    sizeRows,
    sizeValue,
  } = converter;

  const search = useProductSearch({
    allProducts,
    onSearchSettled: () => productsState.setProductsError(null),
  });

  useEffect(() => {
    resetSearchRef.current = search.resetSearch;
  }, [search.resetSearch]);

  const admin = useAdminAuth({
    isAdminPage,
    onProductMutated: productsState.retryProductsLoad,
    onProductDeleted: (id) => {
      if (selectedGridProduct?.id === id) setSelectedGridProduct(null);
    },
  });
  const auth = useAuth({ onNavigateToLogin: () => navigateToView('login') });

  const productUrlSet = useMemo(
    () =>
      new Set(
        allProducts
          .map((product) => normalizeComparableProductUrl(product.url))
          .filter(Boolean)
      ),
    [allProducts]
  );

  const sizeRecommendations = useMemo<SizeRecommendation[]>(() => {
    if (activeGridDetailRowIndex === null || !selectedGridProduct) return [];
    return computeSizeRecommendations(selectedGridProduct, activeGridDetailRowIndex, allProducts);
  }, [activeGridDetailRowIndex, allProducts, selectedGridProduct]);

  const searchResultRecommendations = useMemo<SizeRecommendation[]>(() => {
    if (activeResultRowIndex === null || !search.result) return [];
    return computeSizeRecommendations(search.result, activeResultRowIndex, allProducts);
  }, [activeResultRowIndex, allProducts, search.result]);

  const visibleSelectedGridProduct = useMemo(() => {
    if (!selectedGridProduct) return null;
    return grid.filteredGridProducts.some((product) => product.id === selectedGridProduct.id)
      ? selectedGridProduct
      : null;
  }, [grid.filteredGridProducts, selectedGridProduct]);

  const zoomedDetailProduct = visibleSelectedGridProduct ?? search.result;

  const handleProductSubmitSuccess = () => {
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 1000);
    productsState.retryProductsLoad();
    productsState.setProductsError(null);
  };

  const form = useProductForm({
    productUrlSet,
    onSubmitSuccess: handleProductSubmitSuccess,
  });

  useEffect(() => {
    if (!convertedSize) {
      setActiveConverterRowIndex(null);
      return;
    }

    const nextIndex = sizeRows.findIndex((row) => row.label === convertedSize.label);
    setActiveConverterRowIndex(nextIndex >= 0 ? nextIndex : null);
  }, [convertedSize, setActiveConverterRowIndex, sizeRows]);

  useEffect(() => {
    if (sizeOptions.length === 0) {
      setSizeValue('');
      return;
    }

    const hasCurrentValue = sizeOptions.some(
      (option) => normalizeSizeLookupValue(option) === normalizeSizeLookupValue(sizeValue)
    );
    if (!hasCurrentValue) {
      setSizeValue(sizeOptions[0]);
    }
  }, [setSizeValue, sizeOptions, sizeValue]);

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = 'none';
  };

  const handleSearchSubmit = (product: Product | null = null) => {
    setActiveResultRowIndex(null);
    setIsDetailImageZoomed(false);
    search.handleSearch(product);
  };

  const handleSearchResultClose = () => {
    setActiveResultRowIndex(null);
    setIsDetailImageZoomed(false);
    search.setResult(null);
  };

  const handleSearchRecommendationClick = (product: Product) => {
    setActiveResultRowIndex(null);
    setIsDetailImageZoomed(false);
    search.setResult(product);
  };

  const handleGridProductSelect = (product: Product | null) => {
    setActiveGridDetailRowIndex(null);
    setIsDetailImageZoomed(false);
    setSelectedGridProduct(product);
  };

  if (isAdminPage) {
    return (
      <AdminPage
        isAdminAuthenticated={admin.isAdminAuthenticated}
        isAdminCheckingSession={admin.isAdminCheckingSession}
        adminPassword={admin.adminPassword}
        adminAuthError={admin.adminAuthError}
        isAdminAuthSubmitting={admin.isAdminAuthSubmitting}
        productsError={productsState.productsError}
        adminActionError={admin.adminActionError}
        allProducts={allProducts}
        editingProductId={admin.editingProductId}
        adminEditForm={admin.adminEditForm}
        adminImagePreview={admin.adminImagePreview}
        adminSizeChartImage={admin.adminSizeChartImage}
        isAdminAnalyzingTable={admin.isAdminAnalyzingTable}
        adminExtractedTable={admin.adminExtractedTable}
        isAdminActionLoading={admin.isAdminActionLoading}
        onLogout={() => void admin.handleAdminLogout()}
        onLogin={() => void admin.handleAdminLogin()}
        onPasswordChange={admin.setAdminPassword}
        onPasswordKeyDown={(key) => {
          if (key === 'Enter') void admin.handleAdminLogin();
        }}
        onFileUpload={admin.handleAdminFileUpload}
        onUpdateProduct={(id) => void admin.handleAdminUpdateProduct(id)}
        onDeleteProduct={(id) => void admin.handleAdminDeleteProduct(id)}
        onStartEdit={admin.startProductEdit}
        onCancelEdit={admin.cancelEdit}
        onEditFormChange={admin.setAdminEditForm}
        onExtractedTableChange={admin.setAdminExtractedTable}
        onImageLoadError={handleImageLoadError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white">
      <AppHeader
        viewMode={viewMode}
        authUser={auth.authUser}
        dbUsername={auth.dbUsername}
        onLogoClick={() => navigateToView('search')}
        onMypageClick={() => navigateToView('mypage')}
        onConverterClick={() => navigateToView('converter')}
        onGridClick={() => navigateToView('grid')}
        onAddProductClick={form.openModal}
        onLoginClick={() => navigateToView('login')}
      />

      <main
        className={`${viewMode === 'converter' ? 'pt-20 sm:pt-24' : 'pt-[var(--app-main-pt)]'} pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex flex-col items-center min-h-screen`}
      >
        {productsState.productsError && (
          <div className="w-full max-w-4xl mb-6 bg-orange-900/50 border border-orange-500 text-orange-200 px-6 py-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
              <span className="font-medium text-sm md:text-base">{productsState.productsError}</span>
            </div>
            <button
              onClick={productsState.retryProductsLoad}
              className="flex items-center gap-2 px-4 py-2 bg-orange-800 hover:bg-orange-700 rounded-lg text-sm font-bold transition whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" /> {'\uC624\uB958 \uBC1C\uC0DD \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4'}
            </button>
          </div>
        )}

        {viewMode === 'login' && supabase && (
          <LoginPage
            supabase={supabase}
            onSuccess={() => navigateToView('search')}
            googleAuthError={auth.googleAuthError}
            onClearGoogleAuthError={() => auth.setGoogleAuthError(null)}
          />
        )}

        {auth.needsUsername && supabase && (
          <NeedsUsernameModal
            pendingUsername={auth.pendingUsername}
            onUsernameChange={auth.setPendingUsername}
            onSubmit={() => void auth.submitUsername(() => {})}
            usernameError={auth.usernameError}
            isSubmitting={auth.isSubmittingUsername}
          />
        )}

        {auth.googleSignupComplete && (
          <GoogleSignupCompleteModal
            onStart={() => {
              auth.setGoogleSignupComplete(false);
              navigateToView('search');
            }}
          />
        )}

        {viewMode === 'mypage' && auth.authUser && (
          <MyPageView
            username={String(auth.dbUsername ?? auth.authUser.email?.split('@')[0] ?? '')}
            onLogout={() => {
              void supabase?.auth.signOut();
              navigateToView('search');
            }}
          />
        )}

        {viewMode === 'search' && (
          <SearchView
            error={search.error}
            isLoading={search.isLoading}
            onClearQuery={search.clearQuery}
            onImageLoadError={handleImageLoadError}
            onKeyDown={search.handleKeyDown}
            onQueryChange={search.setQuery}
            onSearch={() => handleSearchSubmit()}
            onSuggestionSelect={(product) => handleSearchSubmit(product)}
            onSuggestionVisibilityChange={search.setShowSuggestions}
            query={search.query}
            resultVisible={Boolean(search.result)}
            searchContainerRef={search.searchContainerRef}
            shouldHideSearchHero={search.shouldHideSearchHero}
            showSuggestions={search.showSuggestions}
            suggestions={search.suggestions}
          />
        )}

        {viewMode === 'converter' && (
          <SizeConverterView
            sizeCategory={sizeCategory}
            setSizeCategory={setSizeCategory}
            sizeGender={sizeGender}
            setSizeGender={setSizeGender}
            sizeRegion={sizeRegion}
            setSizeRegion={setSizeRegion}
            sizeValue={sizeValue}
            setSizeValue={setSizeValue}
            sizeRows={sizeRows}
            sizeOptions={sizeOptions}
            convertedSize={convertedSize}
            activeConverterRowIndex={activeConverterRowIndex}
            setActiveConverterRowIndex={setActiveConverterRowIndex}
          />
        )}

        {viewMode === 'grid' && (
          <GridView
            allProducts={allProducts}
            filteredGridProducts={grid.filteredGridProducts}
            gridCategoryCounts={grid.gridCategoryCounts}
            gridCategoryFilter={grid.gridCategoryFilter}
            setGridCategoryFilter={grid.setGridCategoryFilter}
            gridSearchQuery={grid.gridSearchQuery}
            setGridSearchQuery={grid.setGridSearchQuery}
            onProductClick={(product) => handleGridProductSelect(product)}
            onImageError={handleImageLoadError}
          />
        )}
      </main>

      <AddProductModal form={form} />

      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
          <div className="w-36 h-36 bg-black/85 backdrop-blur-md border border-green-400/80 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,197,94,0.25)]">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-sm font-bold tracking-wide text-green-400">COMPLETE</h3>
          </div>
        </div>
      )}

      {form.showDuplicateProductModal && (
        <DuplicateProductModal onClose={() => form.setShowDuplicateProductModal(false)} />
      )}

      {viewMode === 'grid' && visibleSelectedGridProduct && (
        <ProductDetailModal
          product={visibleSelectedGridProduct}
          activeRowIndex={activeGridDetailRowIndex}
          onClose={() => handleGridProductSelect(null)}
          onRowClick={(rowIndex) => setActiveGridDetailRowIndex(rowIndex)}
          recommendations={sizeRecommendations}
          onRecommendationClick={(product) => {
            handleGridProductSelect(product);
          }}
          onZoomImage={() => setIsDetailImageZoomed(true)}
          onImageError={handleImageLoadError}
          modalRef={gridDetailModalRef}
          recommendationsRef={gridDetailRecommendationsRef}
          smoothScrollTo={smoothScrollTo}
        />
      )}

      {search.result && (
        <ProductDetailModal
          product={search.result}
          activeRowIndex={activeResultRowIndex}
          onClose={handleSearchResultClose}
          onRowClick={(rowIndex) => setActiveResultRowIndex(rowIndex)}
          recommendations={searchResultRecommendations}
          onRecommendationClick={handleSearchRecommendationClick}
          onZoomImage={() => setIsDetailImageZoomed(true)}
          onImageError={handleImageLoadError}
          modalRef={searchResultModalRef}
          recommendationsRef={searchResultRecommendationsRef}
          smoothScrollTo={smoothScrollTo}
        />
      )}

      {isDetailImageZoomed && zoomedDetailProduct && (
        <div
          className="fixed inset-0 z-[75] bg-black/90 backdrop-blur-sm p-4 flex items-center justify-center cursor-pointer"
          onClick={() => setIsDetailImageZoomed(false)}
          onTouchStart={() => setIsDetailImageZoomed(false)}
        >
          <div className="h-[63vh] w-full max-w-6xl flex items-center justify-center">
            <img
              src={zoomedDetailProduct.image}
              alt={zoomedDetailProduct.name}
              className="max-w-full max-h-full object-contain cursor-pointer"
              style={{ borderRadius: '20px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
