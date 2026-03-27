import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, SyntheticEvent } from 'react';
import {
  ArrowRight,
  Check,
  Globe,
  LayoutGrid,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { AddProductModal } from './components/AddProductModal';
import { AdminPage } from './components/AdminPage';
import { GoogleSignupCompleteModal } from './components/GoogleSignupCompleteModal';
import { GridView } from './components/GridView';
import { NeedsUsernameModal } from './components/NeedsUsernameModal';
import { LoginPage } from './components/LoginPage';
import { ProgressiveImage } from './components/ProgressiveImage';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SizeConverterView } from './components/SizeConverterView';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAuth } from './hooks/useAuth';
import { useProductForm } from './hooks/useProductForm';
import type {
  Product,
  SizeRecommendation,
  ViewMode,
  SizeCategory,
  SizeGender,
  SizeRegionKey,
} from './types';
import {
  CATEGORY_OPTIONS,
  CLOTHING_SIZE_ROWS_BY_GENDER,
  SHOE_SIZE_ROWS_BY_GENDER,
} from './constants';
import { supabase } from './lib/supabase';
import {
  normalizeSizeLookupValue,
  computeSizeRecommendations,
  findConvertedSize,
} from './utils/sizeTable';
import {
  normalizeComparableProductUrl,
  generateFallbackResult,
} from './utils/product';
import { searchProducts } from './api';




export default function App() {
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname === '/admin';
  const [productsError, setProductsError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [gridCategoryFilter, setGridCategoryFilter] = useState<string>('');
  const [gridSearchQuery, setGridSearchQuery] = useState('');

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading] = useState(false);
  const [result, setResult] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [sizeCategory, setSizeCategory] = useState<SizeCategory>('clothing');
  const [sizeGender, setSizeGender] = useState<SizeGender>('men');
  const [sizeRegion, setSizeRegion] = useState<SizeRegionKey>('us');
  const [sizeValue, setSizeValue] = useState('S');
  const [selectedGridProduct, setSelectedGridProduct] = useState<Product | null>(null);
  const admin = useAdminAuth({
    isAdminPage,
    onProductMutated: () => setRetryTrigger((prev) => prev + 1),
    onProductDeleted: (id) => { if (selectedGridProduct?.id === id) setSelectedGridProduct(null); },
  });

  const [activeResultRowIndex, setActiveResultRowIndex] = useState<number | null>(null);
  const [activeConverterRowIndex, setActiveConverterRowIndex] = useState<number | null>(null);
  const [activeGridDetailRowIndex, setActiveGridDetailRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isSelectionRef = useRef(false);
  const gridDetailRecommendationsRef = useRef<HTMLDivElement>(null);
  const gridDetailModalRef = useRef<HTMLDivElement>(null);
  const searchResultModalRef = useRef<HTMLDivElement>(null);
  const searchResultRecommendationsRef = useRef<HTMLDivElement>(null);

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

  const allProducts = useMemo(() => [...products], [products]);
  const sizeRecommendations = useMemo<SizeRecommendation[]>(() => {
    if (activeGridDetailRowIndex === null || !selectedGridProduct) return [];
    return computeSizeRecommendations(selectedGridProduct, activeGridDetailRowIndex, allProducts);
  }, [selectedGridProduct, activeGridDetailRowIndex, allProducts]);
  const searchResultRecommendations = useMemo<SizeRecommendation[]>(() => {
    if (activeResultRowIndex === null || !result) return [];
    return computeSizeRecommendations(result, activeResultRowIndex, allProducts);
  }, [result, activeResultRowIndex, allProducts]);
  const gridCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Total: allProducts.length };
    for (const category of CATEGORY_OPTIONS) {
      counts[category] = 0;
    }

    for (const product of allProducts) {
      if (product.category in counts) {
        counts[product.category] += 1;
      }
    }

    return counts;
  }, [allProducts]);
  const filteredGridProducts = useMemo(() => {
    const normalizedGridSearchQuery = gridSearchQuery.trim().toLowerCase();

    return allProducts.filter((product) => {
      if (gridCategoryFilter && product.category !== gridCategoryFilter) {
        return false;
      }

      if (!normalizedGridSearchQuery) {
        return true;
      }

      const searchableText = [product.brand, product.name, product.category, product.url]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedGridSearchQuery);
    });
  }, [allProducts, gridCategoryFilter, gridSearchQuery]);
  const sizeRows = useMemo(() => {
    if (sizeCategory === 'shoes') return SHOE_SIZE_ROWS_BY_GENDER[sizeGender];
    return CLOTHING_SIZE_ROWS_BY_GENDER[sizeGender];
  }, [sizeCategory, sizeGender]);
  const sizeOptions = useMemo(
    () => sizeRows.map((row) => row[sizeRegion]).filter(Boolean),
    [sizeRegion, sizeRows]
  );
  const convertedSize = useMemo(
    () => findConvertedSize(sizeRows, sizeRegion, sizeValue),
    [sizeRegion, sizeRows, sizeValue]
  );
  const zoomedDetailProduct = selectedGridProduct ?? result;
  const productUrlSet = useMemo(
    () =>
      new Set(
        allProducts
          .map((product) => normalizeComparableProductUrl(product.url))
          .filter(Boolean)
      ),
    [allProducts]
  );
  const shouldHideSearchHero = viewMode === 'search' && Boolean(result) && !isLoading;

  const form = useProductForm({
    productUrlSet,
    onSubmitSuccess: () => {
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 1000);
      setRetryTrigger((prev) => prev + 1);
      setProductsError(null);
    },
  });

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const loaded = await searchProducts('');
        if (!isActive) return;
        setProducts(loaded);
        setProductsError(null);
      } catch (loadError: unknown) {
        if (!isActive) return;
        const message = loadError instanceof Error ? loadError.message : '상품 데이터를 불러오는 중 오류가 발생했습니다.';
        setProductsError(message);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [retryTrigger]);

  useEffect(() => {
    if (isSelectionRef.current) {
      isSelectionRef.current = false;
      return;
    }
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const filtered = allProducts.filter((item) =>
      `${item.brand} ${item.name}`.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered);
    setShowSuggestions(true);
  }, [allProducts, query]);

  useEffect(() => {
    setActiveResultRowIndex(null);
  }, [result?.id]);

  useEffect(() => {
    setActiveGridDetailRowIndex(null);
  }, [selectedGridProduct?.id]);

  useEffect(() => {
    if (!convertedSize) {
      setActiveConverterRowIndex(null);
      return;
    }

    const nextIndex = sizeRows.findIndex((row) => row.label === convertedSize.label);
    setActiveConverterRowIndex(nextIndex >= 0 ? nextIndex : null);
  }, [convertedSize, sizeRows]);

  useEffect(() => {
    setIsDetailImageZoomed(false);
  }, [selectedGridProduct?.id, result?.id]);

  useEffect(() => {
    if (!selectedGridProduct) return;
    const isVisible = filteredGridProducts.some((product) => product.id === selectedGridProduct.id);
    if (!isVisible) {
      setSelectedGridProduct(null);
    }
  }, [filteredGridProducts, selectedGridProduct]);

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
  }, [sizeCategory, sizeOptions, sizeRegion, sizeValue]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSearch = (searchItem: Product | null = null) => {
    const term = searchItem ? searchItem.name : query;
    if (!term) return;
    setViewMode('search');
    setResult(null);
    setError(null);
    setShowSuggestions(false);

    const keyword = term.toLowerCase();
    const found =
      searchItem ||
      allProducts.find((item) => `${item.brand} ${item.name}`.toLowerCase().includes(keyword)) ||
      generateFallbackResult(term);
    setResult(found);
    setQuery('');
    setProductsError(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') void handleSearch();
  };

  const navigateToView = (nextView: ViewMode) => {
    setViewMode(nextView);
    setResult(null);
    setQuery('');
    setError(null);
    setShowSuggestions(false);
    setSelectedGridProduct(null);
  };

  const auth = useAuth({ onNavigateToLogin: () => navigateToView('login') });

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = 'none';
  };

  if (isAdminPage) {
    return (
      <AdminPage
        isAdminAuthenticated={admin.isAdminAuthenticated}
        isAdminCheckingSession={admin.isAdminCheckingSession}
        adminPassword={admin.adminPassword}
        adminAuthError={admin.adminAuthError}
        isAdminAuthSubmitting={admin.isAdminAuthSubmitting}
        productsError={productsError}
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
        onPasswordKeyDown={(key) => { if (key === 'Enter') void admin.handleAdminLogin(); }}
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
      <header className="fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateToView('search')}>
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/favicon-simple.svg" alt="DIGDA logo" className="w-7 h-7 object-contain" />
              </div>
              <span className="font-bold text-xl tracking-tight text-orange-500">DIGDA</span>
            </div>
            {auth.authUser && (
              <span
                className="text-gray-500 text-xs font-medium cursor-pointer hover:text-gray-300 transition"
                onClick={() => navigateToView('mypage')}
              >
                | {String(auth.dbUsername ?? auth.authUser.email?.split('@')[0] ?? '')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateToView('converter')}
              className={`p-1.5 rounded-lg transition border backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${
                viewMode === 'converter'
                  ? 'bg-orange-500 text-black border-orange-500'
                  : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] border-white/20 text-gray-200 hover:border-orange-500/60 hover:text-orange-400'
              }`}
              title="해외사이즈 변환기"
            >
              <Globe className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateToView('grid')}
              className="p-1.5 text-gray-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] backdrop-blur-xl border border-white/20 hover:text-orange-400 hover:border-orange-500/60 transition rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
              title="전체 목록 보기"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={form.openModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition backdrop-blur-xl border border-[#00FF00]/40 bg-[linear-gradient(180deg,rgba(0,255,0,0.22),rgba(0,255,0,0.09))] text-[#00FF00] hover:border-[#00FF00]/70 hover:bg-[linear-gradient(180deg,rgba(0,255,0,0.32),rgba(0,255,0,0.15))] shadow-[0_4px_16px_rgba(0,255,0,0.15)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">상품 추가</span>
            </button>
            {!auth.authUser && (
              <button
                onClick={() => navigateToView('login')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition backdrop-blur-xl border shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${
                  viewMode === 'login'
                    ? 'bg-orange-500 text-black border-orange-500'
                    : 'border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] text-gray-200 hover:border-orange-500/60 hover:text-orange-400'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">로그인</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`${viewMode === 'converter' ? 'pt-20 sm:pt-24' : 'pt-[var(--app-main-pt)]'} pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex flex-col items-center min-h-screen`}>
        {productsError && (
          <div className="w-full max-w-4xl mb-6 bg-orange-900/50 border border-orange-500 text-orange-200 px-6 py-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
              <span className="font-medium text-sm md:text-base">{productsError}</span>
            </div>
            <button onClick={() => setRetryTrigger((prev) => prev + 1)} className="flex items-center gap-2 px-4 py-2 bg-orange-800 hover:bg-orange-700 rounded-lg text-sm font-bold transition whitespace-nowrap">
              <RefreshCw className="w-4 h-4" /> 데이터 다시 불러오기
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
            onStart={() => { auth.setGoogleSignupComplete(false); navigateToView('search'); }}
          />
        )}

        {viewMode === 'mypage' && auth.authUser && (
          <div className="w-full max-w-md mx-auto mt-16 px-4">
            <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <h2 className="text-white font-bold text-lg mb-1">마이페이지</h2>
              <p className="text-gray-500 text-sm mb-8">
                {String(auth.dbUsername ?? auth.authUser.email?.split('@')[0] ?? '')}
              </p>
              <button
                onClick={() => { void supabase?.auth.signOut(); navigateToView('search'); }}
                className="w-full py-3 rounded-xl text-sm font-bold transition border border-red-500/40 bg-[linear-gradient(180deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))] text-red-400 hover:bg-[linear-gradient(180deg,rgba(239,68,68,0.25),rgba(239,68,68,0.1))] hover:border-red-500/70"
              >
                로그아웃
              </button>
            </div>
          </div>
        )}

        {viewMode === 'search' && (
          <div
            className={`w-full max-w-2xl text-center overflow-hidden transition-all duration-500 ease-out ${
              shouldHideSearchHero
                ? 'max-h-0 mb-0 opacity-0 -translate-y-4 pointer-events-none'
                : 'max-h-96 mb-5 opacity-100 translate-y-0'
            }`}
            aria-hidden={shouldHideSearchHero}
          >
            <h1 className="mt-[var(--hero-title-mt)] mb-[var(--hero-title-mb)] text-[length:var(--hero-title-size)] font-extrabold leading-tight tracking-tight">
              <span className="block text-white">모든 옷의 사이즈표</span>
              <span className="block text-orange-500">한 번에 검색하세요</span>
            </h1>
            <p className="mt-8 text-[length:var(--hero-subtitle-size)] text-white">
              <span className="block">공식 홈페이지와 사용자들이 공유한 데이터를 통해</span>
              <span className="block">가장 정확한 사이즈 정보를 제공합니다.</span>
            </p>
          </div>
        )}

        {viewMode === 'search' && (
          <>
            <div className={`w-full max-w-2xl relative transition-all duration-500 ${result || isLoading ? 'mt-0' : 'mt-4'}`} ref={searchContainerRef}>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_30%,transparent_72%,rgba(255,255,255,0.08))]" />
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className={`w-6 h-6 transition-colors ${showSuggestions ? 'text-orange-500' : 'text-gray-500'}`} />
                </div>
                <input type="text" className="w-full pl-14 pr-14 py-[var(--search-input-py)] bg-gray-900 border-2 border-gray-800 rounded-2xl shadow-xl text-[length:var(--search-input-font-size)] text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" placeholder="브랜드명 혹은 상품명" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} onFocus={() => { if (query) setShowSuggestions(true); }} />
                {query && <button onClick={() => { setQuery(''); setSuggestions([]); }} className="absolute inset-y-0 right-14 pr-2 flex items-center text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>}
                <button onClick={() => { void handleSearch(); }} className="absolute inset-y-2 right-2 rounded-xl bg-orange-500 px-3 text-black hover:bg-orange-400 transition-colors shadow-lg" style={{ boxShadow: 'var(--ui-depth-shadow)' }}><ArrowRight className="w-5 h-5" /></button>
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 z-20 max-h-96 overflow-y-auto overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] shadow-[0_20px_48px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                  {suggestions.length > 0 ? (
                    <ul>
                      {suggestions.map((item) => (
                        <li key={item.id} onClick={() => { isSelectionRef.current = true; setQuery(item.name); void handleSearch(item); }} className="flex items-center gap-4 px-5 py-4 cursor-pointer border-b border-white/10 transition-colors hover:bg-white/[0.08] last:border-0">
                          <div className="w-10 h-10 rounded-md flex-shrink-0 overflow-hidden bg-white/10"><ProgressiveImage src={item.image} thumbnailSrc={item.thumbnailImage} alt={item.name} className="w-full h-full object-cover" onError={handleImageLoadError} /></div>
                          <div><div className="font-medium text-white">{item.name}</div><div className="text-sm text-gray-400">{item.brand} · {item.category}</div></div>
                        </li>
                      ))}
                    </ul>
                  ) : <div className="p-4 text-center text-gray-500 text-sm">검색어와 일치하는 추천 상품이 없습니다.</div>}
                </div>
              )}
            </div>

            {isLoading && <div className="mt-10 text-gray-300">검색 중...</div>}
            {error && !isLoading && <div className="mt-6 text-red-300">{error}</div>}

          </>
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
            filteredGridProducts={filteredGridProducts}
            gridCategoryCounts={gridCategoryCounts}
            gridCategoryFilter={gridCategoryFilter}
            setGridCategoryFilter={setGridCategoryFilter}
            gridSearchQuery={gridSearchQuery}
            setGridSearchQuery={setGridSearchQuery}
            onProductClick={setSelectedGridProduct}
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
        <div className="fixed inset-0 z-[72] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => form.setShowDuplicateProductModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-3xl border border-red-500/40 bg-gray-950 px-6 py-7 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">이미 등록된 상품입니다</h3>
            <button
              type="button"
              onClick={() => form.setShowDuplicateProductModal(false)}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-orange-400 transition"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {viewMode === 'grid' && selectedGridProduct && (
        <ProductDetailModal
          product={selectedGridProduct}
          activeRowIndex={activeGridDetailRowIndex}
          onClose={() => setSelectedGridProduct(null)}
          onRowClick={(rowIndex) => setActiveGridDetailRowIndex(rowIndex)}
          recommendations={sizeRecommendations}
          onRecommendationClick={(product) => { setSelectedGridProduct(product); setActiveGridDetailRowIndex(null); }}
          onZoomImage={() => setIsDetailImageZoomed(true)}
          onImageError={handleImageLoadError}
          modalRef={gridDetailModalRef}
          recommendationsRef={gridDetailRecommendationsRef}
          smoothScrollTo={smoothScrollTo}
        />
      )}

      {result && (
        <ProductDetailModal
          product={result}
          activeRowIndex={activeResultRowIndex}
          onClose={() => setResult(null)}
          onRowClick={(rowIndex) => setActiveResultRowIndex(rowIndex)}
          recommendations={searchResultRecommendations}
          onRecommendationClick={(product) => { setResult(product); setActiveResultRowIndex(null); }}
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
