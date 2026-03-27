import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, SyntheticEvent } from 'react';
import {
  ArrowRight,
  Camera,
  Check,
  Globe,
  LayoutGrid,
  Loader2,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import { AdminPage } from './components/AdminPage';
import { CategoryDropdown } from './components/CategoryDropdown';
import { LoginPage } from './components/LoginPage';
import { ProgressiveImage } from './components/ProgressiveImage';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SizeConverterView } from './components/SizeConverterView';
import { useProductForm } from './hooks/useProductForm';
import type {
  Product,
  AdminEditForm,
  SizeRecommendation,
  SizeTable,
  ViewMode,
  SizeCategory,
  SizeGender,
  SizeRegionKey,
} from './types';
import {
  CATEGORY_OPTIONS,
  CLOTHING_SIZE_ROWS_BY_GENDER,
  SHOE_SIZE_ROWS_BY_GENDER,
  ITEM_LABEL,
} from './constants';
import { supabase } from './lib/supabase';
import {
  readFileAsDataUrl,
  resizeImage,
} from './utils/image';
import {
  normalizeCellText,
  normalizeSizeLookupValue,
  computeSizeRecommendations,
  findConvertedSize,
} from './utils/sizeTable';
import {
  normalizeComparableProductUrl,
  generateFallbackResult,
} from './utils/product';
import {
  searchProducts,
  uploadSubmissionImage,
  extractSizeTableFromImage,
} from './api';




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
  const [isAdminCheckingSession, setIsAdminCheckingSession] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [isAdminAuthSubmitting, setIsAdminAuthSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [adminEditForm, setAdminEditForm] = useState<AdminEditForm>({
    brand: '',
    name: '',
    category: '',
    url: '',
  });
  const [adminImagePath, setAdminImagePath] = useState<string | null>(null);
  const [adminImagePreview, setAdminImagePreview] = useState<string>('');
  const [adminProductPhotoFile, setAdminProductPhotoFile] = useState<File | null>(null);
  const [adminSizeChartImage, setAdminSizeChartImage] = useState<string | null>(null);
  const [adminExtractedTable, setAdminExtractedTable] = useState<SizeTable | null>(null);
  const [isAdminAnalyzingTable, setIsAdminAnalyzingTable] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [isAdminActionLoading, setIsAdminActionLoading] = useState(false);

  const [activeResultRowIndex, setActiveResultRowIndex] = useState<number | null>(null);
  const [activeConverterRowIndex, setActiveConverterRowIndex] = useState<number | null>(null);
  const [activeGridDetailRowIndex, setActiveGridDetailRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);
  const [authUser, setAuthUser] = useState<{ id?: string; email?: string; user_metadata?: Record<string, unknown> } | null>(null);
  const [dbUsername, setDbUsername] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [pendingUsername, setPendingUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [googleSignupComplete, setGoogleSignupComplete] = useState(false);

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

  const checkAndSetUser = async (user: { id?: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
    setAuthUser(user);
    if (!user || !supabase) { setDbUsername(null); return; }
    const { data } = await supabase.from('users').select('id, username').eq('id', user.id).maybeSingle();
    if (!data) {
      const intent = localStorage.getItem('google_oauth_intent');
      localStorage.removeItem('google_oauth_intent');
      if (intent === 'login') {
        void supabase.auth.signOut();
        setAuthUser(null);
        setGoogleAuthError('가입되지 않은 구글 계정입니다. 회원가입 탭에서 구글로 가입해 주세요.');
        setViewMode('login');
      } else {
        setNeedsUsername(true);
      }
    } else {
      setDbUsername(data.username as string);
    }
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      void checkAndSetUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void checkAndSetUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

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

  useEffect(() => {
    if (!isAdminPage) return;

    let isActive = true;
    setIsAdminCheckingSession(true);
    void (async () => {
      try {
        const response = await fetch('/api/admin/session', { credentials: 'include' });
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || '관리자 세션 확인 실패');
        }
        if (!isActive) return;
        setIsAdminAuthenticated(Boolean(payload?.data?.authenticated));
        setAdminAuthError(null);
      } catch (sessionError: unknown) {
        if (!isActive) return;
        const message = sessionError instanceof Error ? sessionError.message : '관리자 세션 확인 실패';
        setAdminAuthError(message);
        setIsAdminAuthenticated(false);
      } finally {
        if (isActive) setIsAdminCheckingSession(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isAdminPage]);

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

  const handleImageLoadError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.style.display = 'none';
  };

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      setAdminAuthError('관리자 비밀번호를 입력하세요.');
      return;
    }

    setIsAdminAuthSubmitting(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: adminPassword }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || '관리자 로그인 실패');
      }
      setIsAdminAuthenticated(true);
      setAdminPassword('');
      setAdminAuthError(null);
    } catch (loginError: unknown) {
      const message = loginError instanceof Error ? loginError.message : '관리자 로그인 실패';
      setAdminAuthError(message);
      setIsAdminAuthenticated(false);
    } finally {
      setIsAdminAuthSubmitting(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setIsAdminAuthenticated(false);
      setEditingProductId(null);
      setAdminPassword('');
    }
  };

  const startProductEdit = (product: Product) => {
    setEditingProductId(product.id);
    setAdminEditForm({
      brand: product.brand,
      name: product.name,
      category: product.category === 'Uncategorized' ? '' : product.category,
      url: product.url === '#' ? '' : product.url,
    });
    setAdminImagePath(product.imagePath ?? null);
    setAdminImagePreview(product.image);
    setAdminProductPhotoFile(null);
    setAdminSizeChartImage(null);
    setAdminExtractedTable(product.sizeTable ?? null);
    setAdminActionError(null);
  };

  const handleAdminFileUpload = (event: ChangeEvent<HTMLInputElement>, type: 'product' | 'chart') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'product') {
      void (async () => {
        const dataUrl = await readFileAsDataUrl(file);
        setAdminProductPhotoFile(file);
        setAdminImagePreview(dataUrl);
      })();
      return;
    }

    void (async () => {
      const dataUrl = await readFileAsDataUrl(file);
      const optimizedDataUrl = await resizeImage(dataUrl, 1600);
      const optimizedBase64 = optimizedDataUrl.split(',')[1] || '';
      setAdminSizeChartImage(optimizedDataUrl);
      setIsAdminAnalyzingTable(true);
      try {
        const tableData = await extractSizeTableFromImage(optimizedBase64, 'image/png');
        setAdminExtractedTable(tableData);
      } catch (extractError: unknown) {
        const message = extractError instanceof Error ? extractError.message : 'Size table extraction failed.';
        setAdminActionError(`사이즈표 재분석 실패: ${message}`);
      } finally {
        setIsAdminAnalyzingTable(false);
      }
    })();
  };

  const handleAdminUpdateProduct = async (id: string) => {
    if (!adminEditForm.brand.trim() || !adminEditForm.name.trim()) {
      setAdminActionError('브랜드명과 상품명은 비워둘 수 없습니다.');
      return;
    }

    setIsAdminActionLoading(true);
    try {
      let nextImagePath = adminImagePath;
      if (adminProductPhotoFile) {
        nextImagePath = await uploadSubmissionImage(adminProductPhotoFile);
        setAdminImagePath(nextImagePath);
      }

      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          brand: adminEditForm.brand.trim(),
          name: adminEditForm.name.trim(),
          category: adminEditForm.category || null,
          url: adminEditForm.url || null,
          imagePath: nextImagePath,
          sizeTable: adminExtractedTable,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || '상품 수정 실패');
      }
      setEditingProductId(null);
      setAdminProductPhotoFile(null);
      setAdminSizeChartImage(null);
      setRetryTrigger((prev) => prev + 1);
      setAdminActionError(null);
    } catch (updateError: unknown) {
      const message = updateError instanceof Error ? updateError.message : '상품 수정 실패';
      setAdminActionError(message);
    } finally {
      setIsAdminActionLoading(false);
    }
  };

  const handleAdminDeleteProduct = async (id: string) => {
    if (!window.confirm('이 상품을 삭제하시겠습니까?')) return;

    setIsAdminActionLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || '상품 삭제 실패');
      }
      if (selectedGridProduct?.id === id) setSelectedGridProduct(null);
      setRetryTrigger((prev) => prev + 1);
      setAdminActionError(null);
    } catch (deleteError: unknown) {
      const message = deleteError instanceof Error ? deleteError.message : '상품 삭제 실패';
      setAdminActionError(message);
    } finally {
      setIsAdminActionLoading(false);
    }
  };

  const renderProductImageSection = () => (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">상품 이미지</label>
      <label className="cursor-pointer w-full h-28 bg-white/[0.06] border-2 border-dashed border-white/15 rounded-xl flex items-center justify-center overflow-hidden hover:bg-white/[0.09] hover:border-white/25 transition backdrop-blur-sm">
        {form.formData.productImage ? <img src={form.formData.productImage} className="h-full object-contain" onError={form.handleThumbnailLoadError} /> : <Camera className="w-8 h-8 text-gray-500" />}
        <input type="file" className="hidden" accept="image/*" onChange={(e) => form.handleFileUpload(e, 'product')} />
      </label>
      {form.autofilledProductImageCandidates.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>후보 {form.autofilledProductImageCandidates.length}장</span>
            <span>왼쪽 카드가 현재 추천 순위입니다.</span>
          </div>
          <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-1">
            {form.autofilledProductImageCandidates.map((candidateUrl, index) => {
              const isActive = candidateUrl === form.autofilledProductImageUrl;
              return (
                <button
                  key={candidateUrl}
                  type="button"
                  onClick={() => form.handleSelectAutofilledProductImage(candidateUrl)}
                  className={`relative h-16 rounded-lg border overflow-hidden ${isActive ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-700 hover:border-gray-500'}`}
                  title={candidateUrl}
                >
                  <img src={candidateUrl} className="w-full h-full object-cover" onError={form.handleThumbnailLoadError} />
                  <span className={`absolute left-1 top-1 rounded px-1 py-0.5 text-[10px] font-semibold ${index === 0 ? 'bg-orange-500 text-black' : 'bg-black/70 text-white'}`}>
                    {index === 0 ? '추천' : index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {form.isProcessingImage ? <div className="text-xs text-orange-400">이미지 처리 중...</div> : null}
      {form.productImageNotice ? <div className="text-xs text-amber-300">{form.productImageNotice}</div> : null}
      {form.isPreviewOnlyProductImage ? (
        <div className="text-xs text-amber-300">현재 이미지는 미리보기 전용이라 저장용 상품 이미지를 직접 올려야 합니다.</div>
      ) : null}
    </div>
  );

  const commitTableCell = (value: string) => {
    const cell = form.tableEditingCell;
    if (!cell) return;
    form.setFormData((prev) => {
      if (!prev.extractedTable) return prev;
      if (cell.kind === 'header') {
        const headers = [...prev.extractedTable.headers];
        headers[cell.colIdx] = value;
        return { ...prev, extractedTable: { ...prev.extractedTable, headers } };
      }
      const rows = prev.extractedTable.rows.map((row, ri) =>
        ri === cell.rowIdx
          ? row.map((c, ci) => (ci === cell.colIdx ? value : c))
          : row
      );
      return { ...prev, extractedTable: { ...prev.extractedTable, rows } };
    });
    form.setTableEditingCell(null);
  };

  const renderSizeTableSection = () => (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">사이즈표 이미지</label>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="cursor-pointer w-full sm:w-2/3 h-28 bg-white/[0.06] border-2 border-dashed border-white/15 rounded-xl flex items-center justify-center shrink-0 overflow-hidden hover:bg-white/[0.09] hover:border-white/25 transition backdrop-blur-sm relative">
          {!form.formData.sizeChartImage ? (
            <Upload className="w-8 h-8 text-gray-500" />
          ) : (
            <img src={form.formData.sizeChartImage} className="h-full object-contain" />
          )}
          {form.isAnalyzingTable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-xs text-orange-400">사이즈표 추출 중...</span>
            </div>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={(e) => form.handleFileUpload(e, 'chart')} />
        </label>
        {form.addProductMode !== 'capture' ? (
          <p className="text-xs text-gray-400 leading-relaxed">사이즈표 사진을 올리면<br />자동으로 표를 추출합니다.</p>
        ) : (
          <p className="text-xs text-gray-400 leading-relaxed">캡쳐본에서 추출한 사이즈표를 확인하세요.<br />필요하면 다시 캡쳐해서 재업로드할 수 있습니다.</p>
        )}
      </div>
      {!form.formData.extractedTable && form.formData.sizeChartImage && !form.isAnalyzingTable ? (
        <div className="text-xs text-amber-300">사이즈표 이미지는 있지만 검증된 표 추출은 아직 완료되지 않았습니다.</div>
      ) : null}
      {form.formData.extractedTable && !form.isAnalyzingTable ? (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-white/10">
            <span className="text-[10px] text-gray-400">추출된 사이즈표 — 셀을 클릭하면 수정할 수 있습니다</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              {form.formData.extractedTable.headers.length > 0 ? (
                <thead className="border-b border-white/10">
                  <tr>
                    {form.formData.extractedTable.headers.map((header, colIdx) => (
                      <th
                        key={colIdx}
                        onClick={() => form.setTableEditingCell({ kind: 'header', colIdx })}
                        className={`px-2 py-1.5 font-semibold whitespace-nowrap cursor-pointer hover:bg-white/[0.06] transition ${normalizeCellText(header) === ITEM_LABEL ? 'text-gray-200' : 'text-green-400'} ${colIdx === 0 ? 'border-r border-white/10' : ''}`}
                      >
                        {form.tableEditingCell?.kind === 'header' && form.tableEditingCell.colIdx === colIdx ? (
                          <input
                            autoFocus
                            defaultValue={header}
                            onBlur={(e) => commitTableCell(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitTableCell((e.target as HTMLInputElement).value);
                              if (e.key === 'Escape') form.setTableEditingCell(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent border-b border-orange-400 outline-none w-full min-w-[40px] text-white"
                          />
                        ) : header}
                      </th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {form.formData.extractedTable.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-white/[0.06]">
                    {row.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        onClick={() => form.setTableEditingCell({ kind: 'row', rowIdx, colIdx })}
                        className={`px-2 py-1.5 whitespace-nowrap cursor-pointer hover:bg-white/[0.06] transition ${colIdx === 0 ? 'text-gray-300 border-r border-white/10' : 'text-gray-400'}`}
                      >
                        {form.tableEditingCell?.kind === 'row' && form.tableEditingCell.rowIdx === rowIdx && form.tableEditingCell.colIdx === colIdx ? (
                          <input
                            autoFocus
                            defaultValue={cell}
                            onBlur={(e) => commitTableCell(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitTableCell((e.target as HTMLInputElement).value);
                              if (e.key === 'Escape') form.setTableEditingCell(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent border-b border-orange-400 outline-none w-full min-w-[40px] text-white"
                          />
                        ) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {form.addProductMode === 'capture' ? (
        <label className="cursor-pointer w-full h-20 bg-white/[0.06] border border-dashed border-white/15 rounded-xl flex items-center justify-center overflow-hidden hover:border-white/25 hover:bg-white/[0.09] transition backdrop-blur-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Camera className="w-4 h-4" />
            <span className="text-xs">캡쳐본 다시 업로드</span>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={form.handleCaptureUpload} />
        </label>
      ) : null}
      {form.isAutofillingFromImage ? <div className="text-xs text-[#1ED760]">캡쳐 이미지 AI 분석 중...</div> : null}
    </div>
  );

  const renderAddProductForm = () => (
    <>
      <input className="w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition" placeholder="브랜드명" value={form.formData.brand} onChange={(e) => form.setFormData({ ...form.formData, brand: e.target.value })} />
      <input className="w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition" placeholder="상품명" value={form.formData.name} onChange={(e) => form.setFormData({ ...form.formData, name: e.target.value })} />
      <select
        className={`w-full px-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl backdrop-blur-sm focus:outline-none focus:border-orange-500 transition [&>option]:bg-gray-900 [&>option]:text-white ${form.formData.category ? 'text-white' : 'text-gray-400'}`}
        value={form.formData.category}
        onChange={(e) => form.setFormData({ ...form.formData, category: e.target.value })}
      >
        <option value="">카테고리</option>
        {CATEGORY_OPTIONS.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
      <div className="space-y-2">
        <div className="relative">
          <Globe className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
          <input
            className="w-full pl-10 pr-4 py-3 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder:text-white backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.1] transition"
            placeholder="공식 URL (선택)"
            value={form.formData.url}
            onChange={(e) => {
              form.setFormData({ ...form.formData, url: e.target.value });
              form.setAutoFillError(null);
            }}
          />
        </div>
        {form.addProductMode === 'url' ? (
          <button
            onClick={() => void form.handleAutoFillFromUrl()}
            disabled={form.isAutofillingFromUrl || !form.formData.url.trim() || form.isSaving}
            className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold border transition flex items-center justify-center gap-2 ${
              (form.isAutofillingFromUrl || !form.formData.url.trim() || form.isSaving)
                ? 'border-white/10 text-gray-500 bg-white/[0.04] cursor-not-allowed'
                : 'border-orange-500/60 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20'
            }`}
          >
            {form.isAutofillingFromUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {form.isAutofillingFromUrl ? 'URL 분석 중...' : 'URL로 자동 입력'}
          </button>
        ) : null}
        {form.autoFillError ? <p className="text-xs text-red-400">{form.autoFillError}</p> : null}
      </div>
      {form.addProductMode === 'url' ? (
        <section className="space-y-2 rounded-2xl border border-[#1ED760]/40 bg-[#121212] p-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#1ED760]">AI 추출 이미지 미리보기</label>
            {form.isAutofillingFromUrl ? <span className="text-xs text-[#1ED760]">Gemini 분석 중...</span> : null}
          </div>
          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-700 bg-gray-900/70 flex items-center justify-center">
            {!form.aiPreviewImageSrc && !form.isAutofillingFromUrl ? (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Camera className="w-6 h-6" />
                <span className="text-xs">URL 자동 입력 후 대표 이미지가 표시됩니다.</span>
              </div>
            ) : null}
            {form.aiPreviewImageSrc ? (
              <img
                src={form.aiPreviewImageSrc}
                className={`h-full max-w-full object-contain transition-opacity duration-200 ${form.isAiPreviewLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={form.handleAiPreviewLoad}
                onError={form.handleAiPreviewError}
                alt="AI extracted product preview"
              />
            ) : null}
            {(form.isAutofillingFromUrl || form.isAiPreviewLoading) ? (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
            ) : null}
          </div>
          {form.didFallbackAiPreviewImage ? (
            <p className="text-xs text-amber-300">이미지를 불러오지 못해 기본 이미지로 대체했습니다.</p>
          ) : null}
        </section>
      ) : null}
      {renderProductImageSection()}
      {renderSizeTableSection()}
    </>
  );

  const renderAddProductModalBody = () => {
    if (form.addProductMode === 'menu') {
      return (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => form.setAddProductMode('url')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-5 py-5 text-left transition hover:border-orange-500/60 hover:bg-white/[0.1]"
          >
            <div>
              <p className="text-sm font-semibold text-white sm:text-base">공식홈페이지 URL 업로드해서 추가</p>
            </div>
            <Globe className="h-5 w-5 text-orange-400" />
          </button>
          <button
            type="button"
            onClick={() => form.setAddProductMode('manual')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-5 py-5 text-left transition hover:border-white/20 hover:bg-white/[0.1]"
          >
            <div>
              <p className="text-sm font-semibold text-white sm:text-base">직접 추가</p>
            </div>
            <Plus className="h-5 w-5 text-gray-300" />
          </button>
        </div>
      );
    }

    if (form.addProductMode === 'capture' && !form.isCaptureReviewReady) {
      return (
        <div className="space-y-3">
          <label className="text-sm text-gray-400">캡쳐 사진 업로드</label>
          <label className="cursor-pointer flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.06] backdrop-blur-sm px-5 py-8 text-center transition hover:border-[#00FF00]/60 hover:bg-white/[0.09]">
            <Camera className="h-10 w-10 text-[#00FF00]" />
            <div>
              <p className="text-sm font-semibold text-white">캡쳐본을 업로드하면 상품 정보를 추출합니다.</p>
              <p className="mt-1 text-xs text-gray-400">브랜드명, 상품명, 카테고리, URL, 이미지, 사이즈표를 자동 분석합니다.</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={form.handleCaptureUpload} />
          </label>
          {form.isAutofillingFromImage ? <div className="text-xs text-[#1ED760]">캡쳐 이미지 AI 분석 중...</div> : null}
          {form.isAnalyzingTable ? <div className="text-xs text-orange-400">사이즈표 추출 중...</div> : null}
          {form.autoFillError ? <div className="text-xs text-red-400">{form.autoFillError}</div> : null}
        </div>
      );
    }

    return renderAddProductForm();
  };

  if (isAdminPage) {
    return (
      <AdminPage
        isAdminAuthenticated={isAdminAuthenticated}
        isAdminCheckingSession={isAdminCheckingSession}
        adminPassword={adminPassword}
        adminAuthError={adminAuthError}
        isAdminAuthSubmitting={isAdminAuthSubmitting}
        productsError={productsError}
        adminActionError={adminActionError}
        allProducts={allProducts}
        editingProductId={editingProductId}
        adminEditForm={adminEditForm}
        adminImagePreview={adminImagePreview}
        adminSizeChartImage={adminSizeChartImage}
        isAdminAnalyzingTable={isAdminAnalyzingTable}
        adminExtractedTable={adminExtractedTable}
        isAdminActionLoading={isAdminActionLoading}
        onLogout={() => void handleAdminLogout()}
        onLogin={() => void handleAdminLogin()}
        onPasswordChange={setAdminPassword}
        onPasswordKeyDown={(key) => { if (key === 'Enter') void handleAdminLogin(); }}
        onFileUpload={handleAdminFileUpload}
        onUpdateProduct={(id) => void handleAdminUpdateProduct(id)}
        onDeleteProduct={(id) => void handleAdminDeleteProduct(id)}
        onStartEdit={startProductEdit}
        onCancelEdit={() => { setEditingProductId(null); setAdminActionError(null); setAdminProductPhotoFile(null); setAdminSizeChartImage(null); }}
        onEditFormChange={setAdminEditForm}
        onExtractedTableChange={setAdminExtractedTable}
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
            {authUser && (
              <span
                className="text-gray-500 text-xs font-medium cursor-pointer hover:text-gray-300 transition"
                onClick={() => navigateToView('mypage')}
              >
                | {String(dbUsername ?? authUser.email?.split('@')[0] ?? '')}
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
            {!authUser && (
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
            googleAuthError={googleAuthError}
            onClearGoogleAuthError={() => setGoogleAuthError(null)}
          />
        )}

        {needsUsername && supabase && (() => {
          const submitUsername = async () => {
            const trimmed = pendingUsername.trim();
            if (!trimmed) { setUsernameError('이름을 입력하세요.'); return; }
            setIsSubmittingUsername(true);
            setUsernameError(null);
            const { data: { user: currentUser } } = await supabase!.auth.getUser();
            if (!currentUser) {
              await supabase!.auth.signOut();
              setNeedsUsername(false);
              setUsernameError(null);
              setIsSubmittingUsername(false);
              navigateToView('login');
              return;
            }
            const { data: existing } = await supabase!.from('users').select('username').eq('username', trimmed).maybeSingle();
            if (existing) { setUsernameError('이미 사용중인 이름입니다.'); setIsSubmittingUsername(false); return; }
            const { error: insertError } = await supabase!.from('users').insert({ id: currentUser.id, username: trimmed });
            if (insertError) { console.error('users insert error:', insertError); setUsernameError('오류가 발생했습니다. 다시 시도해주세요.'); setIsSubmittingUsername(false); return; }
            setNeedsUsername(false);
            setDbUsername(trimmed);
            setPendingUsername('');
            setGoogleSignupComplete(true);
          };
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.6)] max-w-sm w-full mx-4">
                <h2 className="text-white font-bold text-lg mb-1">닉네임을 설정해주세요</h2>
                <p className="text-gray-500 text-sm mb-6">구글 회원가입 마지막 단계입니다.</p>
                <input
                  type="text"
                  value={pendingUsername}
                  onChange={(e) => setPendingUsername(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void submitUsername(); }}
                  placeholder="사용할 이름을 입력하세요"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 placeholder:text-sm focus:outline-none focus:border-orange-500 transition mb-3"
                  autoFocus
                />
                {usernameError && (
                  <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2 mb-3">
                    {usernameError}
                  </p>
                )}
                <button
                  disabled={isSubmittingUsername}
                  onClick={() => void submitUsername()}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition ${isSubmittingUsername ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400 text-black'}`}
                >
                  {isSubmittingUsername ? '저장 중...' : '완료'}
                </button>
              </div>
            </div>
          );
        })()}

        {googleSignupComplete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.6)] max-w-sm w-full mx-4 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-white font-bold text-lg mb-2">회원가입이 완료됐습니다!</h2>
              <p className="text-gray-400 text-sm mb-6">이제 구글 계정으로 로그인할 수 있어요.</p>
              <button
                onClick={() => { setGoogleSignupComplete(false); navigateToView('search'); }}
                className="w-full py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-black transition"
              >
                시작하기
              </button>
            </div>
          </div>
        )}

        {viewMode === 'mypage' && authUser && (
          <div className="w-full max-w-md mx-auto mt-16 px-4">
            <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <h2 className="text-white font-bold text-lg mb-1">마이페이지</h2>
              <p className="text-gray-500 text-sm mb-8">
                {String(dbUsername ?? authUser.email?.split('@')[0] ?? '')}
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
          <div className="w-full max-w-7xl">
            <div className="mb-6 flex flex-col gap-4">
              <h2 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold text-white">
                <LayoutGrid className="w-7 h-7 text-orange-500" />
                {'\uC804\uCCB4 \uC0C1\uD488 \uBCF4\uAE30'}
              </h2>
              <div className="h-6 sm:h-8" />
              <div className="fixed left-1/2 top-[5.6rem] z-30 flex w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 justify-end sm:top-[8.3rem]">
                <div className="flex w-full max-w-[11.5rem] flex-col-reverse items-end justify-end gap-2 sm:ml-auto sm:w-fit sm:max-w-none sm:flex-row sm:items-center sm:gap-3">
                  <CategoryDropdown
                    options={CATEGORY_OPTIONS}
                    value={gridCategoryFilter}
                    counts={gridCategoryCounts}
                    onChange={setGridCategoryFilter}
                    totalLabel="Total"
                    ariaLabel={'\uC0C1\uD488 \uCE74\uD14C\uACE0\uB9AC \uD544\uD130'}
                    className="relative w-[5.6rem] shrink-0 sm:w-28"
                  />
                  <label className="relative block w-[7.2rem] sm:w-40">
                    <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] h-3 w-3 -translate-y-1/2 text-gray-400 sm:left-4 sm:h-4 sm:w-4" />
                    <input
                      type="text"
                      value={gridSearchQuery}
                      onChange={(event) => setGridSearchQuery(event.target.value)}
                      placeholder={'\uC0C1\uD488 \uAC80\uC0C9'}
                      aria-label={'\uC804\uCCB4 \uC0C1\uD488 \uAC80\uC0C9'}
                      className="h-[1.7rem] w-full rounded-[20px] border-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.88),rgba(28,28,28,0.72))] pl-8 pr-3 text-[0.7rem] font-medium text-white placeholder:text-gray-400 shadow-[0_16px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl focus:outline-none sm:h-8 sm:pl-10 sm:pr-4 sm:text-xs"
                    />
                  </label>
                </div>
              </div>
            </div>
            {allProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-500">{'\uB4F1\uB85D\uB41C \uC0C1\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.'}</div>
            ) : filteredGridProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-500">{'\uAC80\uC0C9 \uC870\uAC74\uC5D0 \uB9DE\uB294 \uC0C1\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.'}</div>
            ) : (
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                {filteredGridProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      setSelectedGridProduct(product);
                    }}
                    className="ui-product-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(0,0,0,0.3)]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_32%,transparent_68%,rgba(255,255,255,0.1))]" />
                    <div className="relative mx-1.5 mb-0 mt-1.5 flex h-44 items-center justify-center overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(17,24,39,0.72),rgba(0,0,0,0.46))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:m-3 sm:h-48 sm:rounded-[22px] sm:p-4">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_28%)]" />
                      <ProgressiveImage
                        src={product.image}
                        thumbnailSrc={product.thumbnailImage}
                        alt={product.name}
                        className="relative z-[1] max-h-full max-w-full rounded-[10px] object-contain"
                        onError={handleImageLoadError}
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-center bg-black/10 px-4 pb-4 pt-3 text-center sm:px-5 sm:pb-5 sm:pt-4">
                      <div className="mb-2 w-full pl-[5%] text-left text-xs font-bold uppercase tracking-wide text-orange-500">{product.brand}</div>
                      <h3 className="mb-1 w-full pl-[5%] text-left text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
                      <div className="pt-2 text-sm text-gray-300">{product.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      {form.isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={form.closeModal} />
          <div className="ui-add-product-modal bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] backdrop-blur-2xl rounded-3xl w-full max-w-lg shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col max-h-[90vh] border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 sticky top-0 z-10 text-white backdrop-blur-sm">
              <h3 className="text-lg font-bold" style={{ color: '#00FF00' }}>상품 추가</h3>
              <button onClick={() => form.closeModal()} className="p-2 hover:bg-white/[0.1] rounded-full transition text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto text-white space-y-4">
              {renderAddProductModalBody()}
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-sm flex justify-end gap-3 sticky bottom-0">
              <button onClick={() => form.closeModal()} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] hover:text-white transition">취소</button>
              <button onClick={form.handleSubmitProduct} disabled={!form.isFormValid} className={`px-5 py-2.5 rounded-xl text-sm font-bold text-black transition flex items-center gap-2 ${!form.isFormValid ? 'bg-gray-700 cursor-not-allowed text-gray-500' : 'hover:bg-orange-400'}`} style={!form.isFormValid ? {} : { backgroundColor: '#F97316' }}>
                {form.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {form.isSaving ? '제출 중...' : '상품 등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}

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
