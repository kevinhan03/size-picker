import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, SyntheticEvent } from 'react';
import {
  ArrowRight,
  Camera,
  Check,
  ExternalLink,
  Globe,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface SizeTable {
  headers: string[];
  rows: string[][];
}

interface Product {
  id: string;
  brand: string;
  name: string;
  category: string;
  url: string;
  image: string;
  thumbnailImage?: string;
  imagePath?: string | null;
  sizeTable: SizeTable | null;
  createdAt?: string;
}

interface ProductRow {
  id: string | number;
  brand: string;
  name: string;
  category?: string | null;
  url?: string | null;
  size_table?: unknown;
  created_at?: string | null;
  image_path?: string | null;
}

interface SubmitProductForm {
  brand: string;
  name: string;
  category?: string | null;
  url?: string | null;
  sizeTable?: SizeTable | null;
  productPhoto: File;
}

interface FormData {
  brand: string;
  name: string;
  category: string;
  url: string;
  productImage: string | null;
  sizeChartImage: string | null;
  extractedTable: SizeTable | null;
}

interface AdminEditForm {
  brand: string;
  name: string;
  category: string;
  url: string;
}

interface ProgressiveImageProps {
  src: string;
  thumbnailSrc?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
}

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
// (C) bucket명을 product-assets로 고정
const STORAGE_BUCKET = 'product-assets';
const STORAGE_PREFIX = 'submissions/';
const CATEGORY_OPTIONS = ['Outer', 'Top', 'Bottom', 'Shoes', 'Acc'] as const;

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const assertSupabaseClient = () => {
  if (!supabase) {
    throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing');
  }
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const getFileExtension = (file: File): string => {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName) return fromName;
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return mimeMap[file.type] || 'bin';
};

const dataUrlToFile = (dataUrl: string, fallbackName: string): File => {
  const [meta, base64] = dataUrl.split(',');
  const mimeType = (meta.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream');
  const binary = atob(base64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const extension = mimeType.split('/')[1] || 'bin';
  return new File([bytes], `${fallbackName}.${extension}`, { type: mimeType });
};

const resizeImage = (base64Str: string, maxWidth = 300): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });

const ProgressiveImage = ({
  src,
  thumbnailSrc,
  alt,
  className,
  loading = 'lazy',
  onError,
}: ProgressiveImageProps) => {
  const displaySrc = thumbnailSrc || src;

  return (
    <img
      src={displaySrc || src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={onError}
    />
  );
};

const TOTAL_LENGTH_LABEL = '\uCD1D\uC7A5';
const ITEM_LABEL = '\uD56D\uBAA9';
const TOTAL_LENGTH_ALIAS_KEYS = ['총장', '전체길이', '전체장', '기장', 'totallength', 'length', 'total'] as const;
const MEASUREMENT_ALIAS_MAP: Record<string, string> = {
  "\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  "\uC804\uCCB4\uAE38\uC774": TOTAL_LENGTH_LABEL,
  "\uC804\uCCB4\uC7A5": TOTAL_LENGTH_LABEL,
  "\uAE30\uC7A5": TOTAL_LENGTH_LABEL,
  "\uC0C1\uC758\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  "\uD558\uC758\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  "\uBC14\uC9C0\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  length: TOTAL_LENGTH_LABEL,
  total: TOTAL_LENGTH_LABEL,
  "\uC18C\uB9E4": "\uC18C\uB9E4",
  "\uC18C\uB9E4\uAE38\uC774": "\uC18C\uB9E4",
  "\uD654\uC7A5": "\uC18C\uB9E4",
  sleeve: "\uC18C\uB9E4",
  "\uC5B4\uAE68": "\uC5B4\uAE68",
  "\uC5B4\uAE68\uB108\uBE44": "\uC5B4\uAE68",
  "\uC5B4\uAE68\uB113\uC774": "\uC5B4\uAE68",
  shoulder: "\uC5B4\uAE68",
  "\uAC00\uC2B4": "\uAC00\uC2B4",
  "\uAC00\uC2B4\uB2E8\uBA74": "\uAC00\uC2B4",
  "\uD488": "\uAC00\uC2B4",
  chest: "\uAC00\uC2B4",
  bust: "\uAC00\uC2B4",
  "\uD5C8\uB9AC": "\uD5C8\uB9AC",
  "\uD5C8\uB9AC\uB2E8\uBA74": "\uD5C8\uB9AC",
  waist: "\uD5C8\uB9AC",
  "\uC5C9\uB369\uC774": "\uC5C9\uB369\uC774",
  "\uD799": "\uC5C9\uB369\uC774",
  hip: "\uC5C9\uB369\uC774",
  "\uD5C8\uBC85\uC9C0": "\uD5C8\uBC85\uC9C0",
  "\uD5C8\uBC85\uC9C0\uB2E8\uBA74": "\uD5C8\uBC85\uC9C0",
  thigh: "\uD5C8\uBC85\uC9C0",
  "\uBC11\uC704": "\uBC11\uC704",
  rise: "\uBC11\uC704",
  "\uBC11\uB2E8": "\uBC11\uB2E8",
  "\uBC11\uB2E8\uB2E8\uBA74": "\uBC11\uB2E8",
  hem: "\uBC11\uB2E8",
  "\uC778\uC2EC": "\uC778\uC2EC",
  inseam: "\uC778\uC2EC",
};

const normalizeCellText = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();

const normalizeAliasKey = (value: unknown): string =>
  normalizeCellText(value)
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^0-9a-z\u3131-\uD79D]/g, '');

const isTotalLengthAliasKey = (aliasKey: string): boolean =>
  Boolean(aliasKey) &&
  TOTAL_LENGTH_ALIAS_KEYS.some((key) => aliasKey === key || aliasKey.includes(key));

const normalizeMeasurementLabel = (value: unknown): string => {
  const raw = normalizeCellText(value);
  if (!raw) return '';
  const aliasKey = normalizeAliasKey(raw);
  if (isTotalLengthAliasKey(aliasKey)) return TOTAL_LENGTH_LABEL;
  return MEASUREMENT_ALIAS_MAP[aliasKey] || raw;
};

const normalizeSizeLabel = (value: unknown): string => normalizeCellText(value).toUpperCase();

const isLikelySizeLabel = (value: unknown): boolean => {
  const text = normalizeSizeLabel(value);
  if (!text) return false;
  if (/^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE)$/i.test(text)) return true;
  if (/^(0|1|2|3|4|5|6|7|8|9|10|11|12)$/.test(text)) return true;
  if (/^\d{2,4}$/.test(text)) return true;
  if (/^(EU|US|UK|JP|KR)\s*\d{1,3}$/.test(text)) return true;
  return false;
};

const isLikelyMeasurementLabel = (value: unknown): boolean => {
  const normalized = normalizeMeasurementLabel(value);
  return Boolean(normalized) && Object.values(MEASUREMENT_ALIAS_MAP).includes(normalized);
};

const makeRectangularRows = (rows: string[][], width: number): string[][] =>
  rows.map((row) => {
    const normalized = Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : [];
    return [...normalized, ...new Array(Math.max(width - normalized.length, 0)).fill('')].slice(0, width);
  });

const transposeTable = (table: SizeTable): SizeTable => {
  const width = Math.max(table.headers.length, ...table.rows.map((row) => row.length), 0);
  const fullHeaders = [...table.headers, ...new Array(Math.max(width - table.headers.length, 0)).fill('')];
  const fullRows = makeRectangularRows(table.rows, width);
  const matrix = [fullHeaders, ...fullRows];
  if (!matrix.length || !width) return { headers: [], rows: [] };
  const transposed = Array.from({ length: width }, (_, colIdx) =>
    matrix.map((row) => normalizeCellText(row[colIdx]))
  );
  return {
    headers: transposed[0] || [],
    rows: transposed.slice(1),
  };
};

const tableOrientationScore = (table: SizeTable): number => {
  const columnHeaders = table.headers.slice(1);
  const rowHeaders = table.rows.map((row) => row[0] || '');
  const sizeInColumns = columnHeaders.filter((v) => isLikelySizeLabel(v)).length;
  const measurementInRows = rowHeaders.filter((v) => isLikelyMeasurementLabel(v)).length;
  const sizeInRows = rowHeaders.filter((v) => isLikelySizeLabel(v)).length;
  const measurementInColumns = columnHeaders.filter((v) => isLikelyMeasurementLabel(v)).length;
  return sizeInColumns * 3 + measurementInRows * 3 - sizeInRows - measurementInColumns;
};

const sortMeasurementRows = (rows: string[][]): string[][] => {
  const nextRows = [...rows];
  const totalLengthIndex = nextRows.findIndex(
    (row) => normalizeMeasurementLabel(row?.[0] || '') === TOTAL_LENGTH_LABEL
  );
  if (totalLengthIndex <= 0) return nextRows;
  const [totalLengthRow] = nextRows.splice(totalLengthIndex, 1);
  nextRows.unshift(totalLengthRow);
  return nextRows;
};

const prioritizeTotalLengthColumn = (table: SizeTable): SizeTable => {
  const totalLengthIndex = table.headers.findIndex(
    (header, idx) => idx > 0 && normalizeMeasurementLabel(header) === TOTAL_LENGTH_LABEL
  );
  if (totalLengthIndex <= 1) return table;

  const nextHeaders = [...table.headers];
  const [totalLengthHeader] = nextHeaders.splice(totalLengthIndex, 1);
  nextHeaders.splice(1, 0, totalLengthHeader);

  const nextRows = table.rows.map((row) => {
    const nextRow = [...row];
    const [totalLengthValue] = nextRow.splice(totalLengthIndex, 1);
    nextRow.splice(1, 0, totalLengthValue ?? '');
    return nextRow;
  });

  return {
    headers: nextHeaders,
    rows: nextRows,
  };
};

const normalizeSizeTable = (value: unknown): SizeTable | null => {
  if (!value) return null;
  let parsed: unknown = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const record = parsed as Record<string, unknown>;
  const headers = Array.isArray(record.headers) ? record.headers.map((v) => normalizeCellText(v)) : [];
  const rows = Array.isArray(record.rows)
    ? record.rows.map((row) => (Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : []))
    : [];
  if (headers.length === 0 && rows.length === 0) return null;

  const asIs: SizeTable = { headers: [...headers], rows: rows.map((row) => [...row]) };
  const transposed = transposeTable(asIs);
  const selected = tableOrientationScore(transposed) < tableOrientationScore(asIs) ? transposed : asIs;

  const width = Math.max(selected.headers.length, ...selected.rows.map((row) => row.length), 0);
  if (!width) return null;

  const normalizedHeaders = [...selected.headers, ...new Array(width - selected.headers.length).fill('')].slice(0, width);
  normalizedHeaders[0] = ITEM_LABEL;
  for (let idx = 1; idx < normalizedHeaders.length; idx += 1) {
    normalizedHeaders[idx] = normalizeSizeLabel(normalizedHeaders[idx]);
  }

  const normalizedRows = makeRectangularRows(selected.rows, width).map((row) => {
    const nextRow = [...row];
    nextRow[0] = normalizeMeasurementLabel(nextRow[0]);
    return nextRow;
  });

  return prioritizeTotalLengthColumn({
    headers: normalizedHeaders,
    rows: sortMeasurementRows(normalizedRows),
  });
};
// (B) toPublicUrl(path): getPublicUrl
const toPublicUrl = (
  path: string | null | undefined,
  options?: { width?: number; height?: number; quality?: number }
): string => {
  if (!path) return '';
  assertSupabaseClient();
  const result = options
    ? supabase!.storage.from(STORAGE_BUCKET).getPublicUrl(path, {
        transform: {
          width: options.width,
          height: options.height,
          quality: options.quality,
        },
      })
    : supabase!.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return result.data.publicUrl;
};

const normalizeProduct = (row: ProductRow): Product | null => {
  const id = String(row.id ?? '').trim();
  const brand = String(row.brand ?? '').trim();
  const name = String(row.name ?? '').trim();
  if (!id || !brand || !name) return null;
  const imagePath = row.image_path ?? null;
  return {
    id,
    brand,
    name,
    category: String(row.category ?? 'Uncategorized'),
    url: String(row.url ?? '#'),
    image: toPublicUrl(imagePath),
    thumbnailImage: toPublicUrl(imagePath, { width: 320, height: 320, quality: 65 }),
    imagePath,
    sizeTable: normalizeSizeTable(row.size_table),
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
};

// (B) searchProducts(query): products select
const searchProducts = async (query: string): Promise<Product[]> => {
  assertSupabaseClient();
  const keyword = query.trim();
  let request = supabase!
    .from('products')
    .select('id,brand,name,category,url,size_table,created_at,image_path')
    .order('created_at', { ascending: false });
  if (keyword) request = request.or(`brand.ilike.%${keyword}%,name.ilike.%${keyword}%`);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? (data as ProductRow[]) : [];
  return rows
    .map((row) => normalizeProduct(row))
    .filter((product: Product | null): product is Product => product !== null);
};

// (A) uploadSubmissionImage(file: File): returns storage path
const uploadSubmissionImage = async (file: File): Promise<string> => {
  assertSupabaseClient();
  const extension = getFileExtension(file);
  // (C) path를 submissions/<uuid>로 생성
  const path = `${STORAGE_PREFIX}${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase!.storage.from(STORAGE_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error || !data?.path) {
    console.error('[uploadSubmissionImage] upload failed', {
      errorMessage: error?.message,
      error,
      path,
      bucket: STORAGE_BUCKET,
      startsWithSubmissions: path.startsWith(STORAGE_PREFIX),
    });
    throw new Error(error?.message || 'Image upload failed');
  }
  return data.path;
};

// (A) submitProduct(form): product_submissions insert only
const submitProduct = async (form: SubmitProductForm): Promise<void> => {
  assertSupabaseClient();
  const imagePath = await uploadSubmissionImage(form.productPhoto);

  // (C) products에 insert 하던 부분 제거
  // (C) Base64 저장 제거
  // product_submissions에는 사이즈표 이미지 경로를 저장하지 않음
  const payload = {
    brand: form.brand,
    name: form.name,
    category: form.category || null,
    url: form.url || null,
    image_path: imagePath,
    size_table: form.sizeTable ?? null,
    status: 'pending',
  };

  const { error } = await supabase!.from('product_submissions').insert(payload);
  if (error) {
    console.error('[submitProduct] insert failed', error.message, error);
    throw new Error(error.message);
  }
};

const extractSizeTableFromImage = async (base64Image: string, mimeType = 'image/png'): Promise<SizeTable> => {
  const response = await fetch('/api/size-table', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64Image, mimeType }),
  });
  const payload = await response.json();
  if (!response.ok || !payload?.ok || !payload?.data) {
    throw new Error(payload?.error ?? 'Failed to extract size table');
  }
  const normalized = normalizeSizeTable(payload.data);
  if (!normalized) {
    throw new Error('Failed to normalize extracted size table');
  }
  return normalized;
};

const removeBackgroundWithGemini = async (base64Image: string): Promise<string> => {
  const response = await fetch('/api/remove-bg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64Image, mimeType: 'image/png' }),
  });
  const payload = await response.json();
  if (!response.ok || !payload?.ok || !payload?.data?.imageBase64) return base64Image;
  return String(payload.data.imageBase64);
};

const generateFallbackResult = (term: string): Product => ({
  id: Date.now().toString(),
  brand: term.split(' ')[0].toUpperCase() || 'BRAND',
  name: term,
  category: 'Unknown',
  url: `https://www.google.com/search?q=${encodeURIComponent(term)}`,
  image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
  thumbnailImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=60',
  sizeTable: {
    headers: ['정보 없음'],
    rows: [['데이터베이스에 없는 상품입니다.']],
  },
});

export default function App() {
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname === '/admin';
  const [productsError, setProductsError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [viewMode, setViewMode] = useState<'search' | 'grid'>('search');
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

  const [formData, setFormData] = useState<FormData>({
    brand: '',
    name: '',
    category: '',
    url: '',
    productImage: null,
    sizeChartImage: null,
    extractedTable: null,
  });
  const [productPhotoFile, setProductPhotoFile] = useState<File | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isAnalyzingTable, setIsAnalyzingTable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeResultRowIndex, setActiveResultRowIndex] = useState<number | null>(null);
  const [activeGridDetailRowIndex, setActiveGridDetailRowIndex] = useState<number | null>(null);
  const [isDetailImageZoomed, setIsDetailImageZoomed] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isSelectionRef = useRef(false);

  const allProducts = useMemo(() => [...products], [products]);
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
    setIsDetailImageZoomed(false);
  }, [selectedGridProduct?.id]);

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

  const handleSearch = async (searchItem: Product | null = null) => {
    const term = searchItem ? searchItem.name : query;
    if (!term) return;
    setViewMode('search');
    setResult(null);
    setError(null);
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const matchedProducts = await searchProducts(term);
      let found = searchItem || matchedProducts.find((item) => `${item.brand} ${item.name}`.toLowerCase().includes(term.toLowerCase()));
      if (!found) found = generateFallbackResult(term);
      setResult(found);
      setQuery('');
      setProductsError(null);
    } catch (searchError: unknown) {
      const message = searchError instanceof Error ? searchError.message : 'Search failed.';
      setProductsError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') void handleSearch();
  };

  const handleOpenModal = () => {
    setFormData({ brand: '', name: '', category: '', url: '', productImage: null, sizeChartImage: null, extractedTable: null });
    setProductPhotoFile(null);
    setIsModalOpen(true);
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

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>, type: 'product' | 'chart') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'product') {
      void (async () => {
        const dataUrl = await readFileAsDataUrl(file);
        const base64 = dataUrl.split(',')[1] || '';
        setFormData((prev) => ({ ...prev, productImage: dataUrl }));
        setProductPhotoFile(file);
        setIsProcessingImage(true);
        try {
          const processedBase64 = await removeBackgroundWithGemini(base64);
          const processedDataUrl = `data:image/png;base64,${processedBase64}`;
          setFormData((prev) => ({ ...prev, productImage: processedDataUrl }));
          setProductPhotoFile(dataUrlToFile(processedDataUrl, `product-${crypto.randomUUID()}`));
        } catch (bgError) {
          console.error('[handleFileUpload] remove bg failed, using original image', bgError);
          setProductPhotoFile(file);
        } finally {
          setIsProcessingImage(false);
        }
      })();
      return;
    }

    void (async () => {
      const dataUrl = await readFileAsDataUrl(file);
      const optimizedDataUrl = await resizeImage(dataUrl, 1600);
      const optimizedBase64 = optimizedDataUrl.split(',')[1] || '';
      setFormData((prev) => ({ ...prev, sizeChartImage: optimizedDataUrl, extractedTable: null }));
      setIsAnalyzingTable(true);
      try {
        const tableData = await extractSizeTableFromImage(optimizedBase64, 'image/png');
        setFormData((prev) => ({ ...prev, extractedTable: tableData }));
      } catch (extractError: unknown) {
        const message = extractError instanceof Error ? extractError.message : 'Size table extraction failed.';
        alert(`${message} (check /api/size-table server logs)`);
      } finally {
        setIsAnalyzingTable(false);
      }
    })();
  };

  const handleSubmitProduct = async () => {
    if (!productPhotoFile) {
      alert('상품 사진은 필수입니다.');
      return;
    }
    if (!formData.sizeChartImage) {
      alert('사이즈표 이미지는 필수입니다.');
      return;
    }
    setIsSaving(true);
    try {
      await submitProduct({
        brand: formData.brand,
        name: formData.name,
        category: formData.category || null,
        url: formData.url || null,
        sizeTable: formData.extractedTable,
        productPhoto: productPhotoFile,
      });
      setIsModalOpen(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 1000);
      setRetryTrigger((prev) => prev + 1);
      setProductsError(null);
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : 'Submission failed.';
      console.error('[handleSubmitProduct] submit failed', submitError);
      alert(`제출 실패: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid =
    Boolean(formData.brand.trim()) &&
    Boolean(formData.name.trim()) &&
    Boolean(productPhotoFile) &&
    Boolean(formData.sizeChartImage) &&
    !isProcessingImage &&
    !isAnalyzingTable &&
    !isSaving;

  if (isAdminPage) {
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
                onClick={() => void handleAdminLogout()}
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
            <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">관리자 로그인</h2>
              <input
                type="password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                placeholder="관리자 비밀번호"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleAdminLogin();
                }}
              />
              {adminAuthError ? <p className="text-sm text-red-400">{adminAuthError}</p> : null}
              <button
                onClick={() => void handleAdminLogin()}
                disabled={isAdminAuthSubmitting}
                className={`w-full px-4 py-3 rounded-xl text-sm font-bold text-black ${isAdminAuthSubmitting ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400'}`}
              >
                {isAdminAuthSubmitting ? '로그인 중...' : '로그인'}
              </button>
            </div>
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

              {allProducts.length === 0 ? (
                <div className="text-center py-16 text-gray-500">등록된 상품이 없습니다.</div>
              ) : (
                <div className="space-y-3">
                  {allProducts.map((product) => (
                    <div key={product.id} className="ui-product-card bg-gray-900 border border-gray-800 rounded-2xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="w-20 h-20 bg-white rounded-xl p-2 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                          <ProgressiveImage src={product.image} thumbnailSrc={product.thumbnailImage} alt={product.name} className="max-w-full max-h-full object-contain" onError={handleImageLoadError} />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingProductId === product.id ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg" value={adminEditForm.brand} onChange={(e) => setAdminEditForm((prev) => ({ ...prev, brand: e.target.value }))} placeholder="브랜드명" />
                                <input className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg" value={adminEditForm.name} onChange={(e) => setAdminEditForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="상품명" />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <select
                                  className={`w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg ${adminEditForm.category ? 'text-white' : 'text-gray-400'}`}
                                  value={adminEditForm.category}
                                  onChange={(e) => setAdminEditForm((prev) => ({ ...prev, category: e.target.value }))}
                                >
                                  <option value="">카테고리</option>
                                  {CATEGORY_OPTIONS.map((category) => (
                                    <option key={category} value={category}>{category}</option>
                                  ))}
                                </select>
                                <input className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg" value={adminEditForm.url} onChange={(e) => setAdminEditForm((prev) => ({ ...prev, url: e.target.value }))} placeholder="공식 URL (선택)" />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-400">상품 이미지 교체</p>
                                  <label className="cursor-pointer w-full h-28 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                    {adminImagePreview ? <img src={adminImagePreview} className="h-full object-contain" /> : <Upload className="w-6 h-6 text-gray-500" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAdminFileUpload(e, 'product')} />
                                  </label>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-400">사이즈표 이미지 재분석</p>
                                  <label className="cursor-pointer w-full h-28 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                    {adminSizeChartImage ? <img src={adminSizeChartImage} className="h-full object-contain" /> : <Upload className="w-6 h-6 text-gray-500" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAdminFileUpload(e, 'chart')} />
                                  </label>
                                </div>
                              </div>
                              {isAdminAnalyzingTable ? <div className="text-xs text-orange-400">사이즈표 재분석 중...</div> : null}
                              <div className="overflow-x-auto rounded-lg border border-gray-700">
                                {adminExtractedTable?.headers?.length ? (
                                  <table className="w-full text-xs text-left">
                                    <thead className="border-b border-gray-700">
                                      <tr>
                                        {adminExtractedTable.headers.map((header, idx) => (
                                          <th
                                            key={idx}
                                            className={`px-3 py-2 font-semibold whitespace-nowrap ${normalizeCellText(header) === ITEM_LABEL ? 'text-gray-200' : 'text-green-400'} ${idx === 0 ? 'border-r border-gray-700' : ''}`}
                                          >
                                            {header}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {adminExtractedTable.rows.map((row, rowIdx) => (
                                        <tr key={rowIdx} className="border-b border-gray-800">
                                          {row.map((cell, cellIdx) => (
                                            <td key={cellIdx} className={`px-3 py-2 text-gray-200 whitespace-nowrap ${cellIdx === 0 ? 'border-r border-gray-700' : ''}`}>{cell}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="px-3 py-4 text-xs text-gray-500">사이즈표 데이터가 없습니다.</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => void handleAdminUpdateProduct(product.id)} disabled={isAdminActionLoading || isAdminAnalyzingTable} className={`px-4 py-2 rounded-lg text-sm font-bold text-black ${(isAdminActionLoading || isAdminAnalyzingTable) ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400'}`}>저장</button>
                                <button onClick={() => { setEditingProductId(null); setAdminActionError(null); setAdminProductPhotoFile(null); setAdminSizeChartImage(null); }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800">취소</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div>
                                <p className="text-xs font-bold text-orange-500 uppercase tracking-wide">{product.brand}</p>
                                <p className="text-base font-semibold text-white">{product.name}</p>
                                <p className="text-sm text-gray-400 mt-1">{product.category}</p>
                                <p className="text-sm text-gray-500 mt-1 break-all">{product.url && product.url !== '#' ? product.url : 'URL 없음'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => startProductEdit(product)} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-800">수정</button>
                                <button onClick={() => void handleAdminDeleteProduct(product.id)} disabled={isAdminActionLoading} className={`px-3 py-2 rounded-lg text-sm font-medium ${isAdminActionLoading ? 'text-gray-500 bg-gray-800 cursor-not-allowed' : 'text-red-300 hover:bg-red-900/30'}`}>삭제</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white">
      <header className="fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => { setViewMode('search'); setResult(null); setQuery(''); setError(null); }}>
            <span className="font-bold text-xl tracking-tight text-orange-500">Size Picker</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { setViewMode('grid'); setResult(null); setQuery(''); setError(null); setSelectedGridProduct(null); }} className="p-2 text-gray-400 hover:text-orange-500 transition rounded-lg hover:bg-gray-800" title="전체 목록 보기">
              <LayoutGrid className="w-6 h-6" />
            </button>
            <button onClick={handleOpenModal} className="flex items-center gap-2 text-black px-4 py-2 rounded-lg hover:opacity-80 transition shadow-lg text-sm font-bold" style={{ backgroundColor: '#00FF00', boxShadow: 'var(--ui-depth-shadow), 0 0 15px rgba(0,255,0,0.3)' }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">상품 추가</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-[var(--app-main-pt)] pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex flex-col items-center min-h-screen">
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

        {viewMode === 'search' && (
          <div className="w-full max-w-2xl mb-5 text-center">
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
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className={`w-6 h-6 transition-colors ${showSuggestions ? 'text-orange-500' : 'text-gray-500'}`} />
                </div>
                <input type="text" className="w-full pl-14 pr-14 py-[var(--search-input-py)] bg-gray-900 border-2 border-gray-800 rounded-2xl shadow-xl text-[length:var(--search-input-font-size)] text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" placeholder="브랜드명 혹은 상품명" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} onFocus={() => { if (query) setShowSuggestions(true); }} />
                {query && <button onClick={() => { setQuery(''); setSuggestions([]); }} className="absolute inset-y-0 right-14 pr-2 flex items-center text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>}
                <button onClick={() => { void handleSearch(); }} className="absolute inset-y-2 right-2 p-3 bg-orange-500 rounded-xl text-black hover:bg-orange-400 transition-colors shadow-lg" style={{ boxShadow: 'var(--ui-depth-shadow)' }}><ArrowRight className="w-5 h-5" /></button>
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden z-20 max-h-96 overflow-y-auto">
                  {suggestions.length > 0 ? (
                    <ul>
                      {suggestions.map((item) => (
                        <li key={item.id} onClick={() => { isSelectionRef.current = true; setQuery(item.name); void handleSearch(item); }} className="px-5 py-4 cursor-pointer hover:bg-gray-800 transition-colors flex items-center gap-4 border-b border-gray-800 last:border-0">
                          <div className="w-10 h-10 bg-gray-800 rounded-md flex-shrink-0 overflow-hidden"><ProgressiveImage src={item.image} thumbnailSrc={item.thumbnailImage} alt={item.name} className="w-full h-full object-cover" onError={handleImageLoadError} /></div>
                          <div><div className="font-medium text-white">{item.name}</div><div className="text-sm text-gray-500">{item.brand} · {item.category}</div></div>
                        </li>
                      ))}
                    </ul>
                  ) : <div className="p-4 text-center text-gray-500 text-sm">검색어와 일치하는 추천 상품이 없습니다.</div>}
                </div>
              )}
            </div>

            {isLoading && <div className="mt-10 text-gray-300">검색 중...</div>}
            {error && !isLoading && <div className="mt-6 text-red-300">{error}</div>}

            {result && !isLoading && (
              <div className="mt-12 w-full max-w-4xl">
                <div className="ui-product-card bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800">
                  <div className="p-6 md:p-8 border-b border-gray-800 flex flex-col md:flex-row gap-6 md:items-center bg-black/20">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl shadow-sm border border-gray-700 flex-shrink-0 overflow-hidden p-2 flex items-center justify-center"><ProgressiveImage src={result.image} thumbnailSrc={result.thumbnailImage} alt={result.name} className="max-w-full max-h-full object-contain" loading="eager" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-orange-500 mb-1"><span className="px-2 py-0.5 bg-orange-500/10 rounded-md uppercase">{result.brand}</span><span className="text-gray-500">{result.category}</span></div>
                      <h2 className="text-2xl font-bold text-white mb-2">{result.name}</h2>
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-gray-400 hover:text-orange-500 transition-colors">공식 홈페이지 <ExternalLink className="w-3 h-3 ml-1" /></a>
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="overflow-x-auto rounded-xl border border-gray-800">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase border-b border-gray-700"><tr>{result.sizeTable?.headers?.map((h, i) => <th key={i} className={`px-6 py-4 font-bold bg-gray-800 ${i === 0 ? 'border-r border-gray-700' : ''}`} style={{ color: normalizeCellText(h) === ITEM_LABEL ? '#E5E7EB' : '#00FF00' }}>{String(h)}</th>)}</tr></thead>
                        <tbody>
                          {result.sizeTable?.rows?.map((row, rowIdx) => {
                            const isActiveRow = activeResultRowIndex === rowIdx;
                            return (
                              <tr
                                key={rowIdx}
                                onClick={() => setActiveResultRowIndex(rowIdx)}
                                className="group border-b border-gray-800 cursor-pointer transition-transform duration-200 active:scale-95"
                              >
                                {row.map((cell, cellIdx) => (
                                  <td
                                    key={cellIdx}
                                    className={`px-6 py-4 font-medium transition-all duration-200 ${cellIdx === 0 ? 'border-r border-gray-700' : ''} ${
                                      isActiveRow
                                        ? 'bg-gray-100 text-black first:rounded-l-lg last:rounded-r-lg'
                                        : 'bg-gray-900 text-gray-300 group-hover:bg-gray-100 group-hover:text-black group-hover:first:rounded-l-lg group-hover:last:rounded-r-lg'
                                    }`}
                                  >
                                    {String(cell)}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {viewMode === 'grid' && (
          <div className="w-full max-w-7xl">
            <h2 className="mb-6 flex items-center gap-3 text-2xl sm:text-3xl font-bold text-white">
              <LayoutGrid className="w-7 h-7 text-orange-500" />
              전체 상품 보기
            </h2>
            {allProducts.length === 0 ? <div className="text-center py-20 text-gray-500">등록된 상품이 없습니다.</div> : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {allProducts.map((product) => (
                  <div key={product.id} onClick={() => { setSelectedGridProduct(product); }} className="ui-product-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition cursor-pointer group flex flex-col h-full">
                    <div className="h-48 bg-black/20 p-4 flex items-center justify-center overflow-hidden relative"><ProgressiveImage src={product.image} thumbnailSrc={product.thumbnailImage} alt={product.name} className="max-h-full max-w-full object-contain" onError={handleImageLoadError} /></div>
                    <div className="p-5 flex-1 flex flex-col"><div className="text-xs font-bold text-orange-500 mb-1 uppercase tracking-wide">{product.brand}</div><h3 className="text-lg font-bold text-white mb-1 line-clamp-2 leading-tight">{product.name}</h3><div className="text-sm text-gray-500 mt-auto pt-2">{product.category}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="ui-add-product-modal bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900 sticky top-0 z-10 text-white">
              <h3 className="text-lg font-bold" style={{ color: '#00FF00' }}>상품 직접 추가</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto text-white space-y-4">
              <input className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl" placeholder="브랜드명" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
              <input className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl" placeholder="상품명" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <select
                className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl ${formData.category ? 'text-white' : 'text-gray-400'}`}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">카테고리</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <div className="relative">
                <Globe className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                <input className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl" placeholder="공식 URL (선택)" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">상품 사진</label>
                <label className="cursor-pointer w-full h-28 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center">
                  {formData.productImage ? <img src={formData.productImage} className="h-full object-contain" /> : <Camera className="w-8 h-8 text-gray-500" />}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'product')} />
                </label>
                {isProcessingImage && <div className="text-xs text-orange-400">배경 제거 중...</div>}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">사이즈표 이미지</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="cursor-pointer w-full sm:w-1/2 h-28 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {!formData.sizeChartImage ? (
                      <Upload className="w-8 h-8 text-gray-500" />
                    ) : formData.extractedTable && !isAnalyzingTable ? (
                      <div className="w-full h-full overflow-auto p-2">
                        <table className="w-full text-[10px] text-left">
                          {formData.extractedTable.headers.length > 0 ? (
                            <thead className="border-b border-gray-700">
                              <tr>
                                {formData.extractedTable.headers.map((header, idx) => (
                                  <th key={idx} className={`px-2 py-1 font-semibold whitespace-nowrap ${normalizeCellText(header) === ITEM_LABEL ? 'text-gray-200' : 'text-green-400'} ${idx === 0 ? 'border-r border-gray-700' : ''}`}>
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                          ) : null}
                          <tbody>
                            {formData.extractedTable.rows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b border-gray-800">
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className={`px-2 py-1 text-gray-200 whitespace-nowrap ${cellIndex === 0 ? 'border-r border-gray-700' : ''}`}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <img src={formData.sizeChartImage} className="h-full object-contain" />
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'chart')} />
                  </label>
                  <p className="text-xs text-gray-400 leading-relaxed">사이즈표 사진을 올리면<br />자동으로 표를 추출합니다.</p>
                </div>
                {isAnalyzingTable && <div className="text-xs text-orange-400">사이즈표 추출 중...</div>}
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-3 sticky bottom-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition">취소</button>
              <button onClick={handleSubmitProduct} disabled={!isFormValid} className={`px-5 py-2.5 rounded-xl text-sm font-bold text-black transition flex items-center gap-2 ${!isFormValid ? 'bg-gray-700 cursor-not-allowed text-gray-500' : 'hover:bg-orange-400'}`} style={!isFormValid ? {} : { backgroundColor: '#F97316' }}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSaving ? '제출 중...' : '상품 등록하기'}
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
            <h3 className="text-sm font-bold tracking-wide text-green-400">제출 완료</h3>
          </div>
        </div>
      )}

      {viewMode === 'grid' && selectedGridProduct && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedGridProduct(null)} />
          <div className="ui-product-detail-modal relative bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-gray-900/95 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-white">상품 상세</h3>
              <button onClick={() => setSelectedGridProduct(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 md:items-center">
                <button
                  type="button"
                  onClick={() => setIsDetailImageZoomed(true)}
                  className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-[20px] border border-gray-700 p-2 flex items-center justify-center overflow-hidden cursor-zoom-in"
                >
                  <ProgressiveImage src={selectedGridProduct.image} thumbnailSrc={selectedGridProduct.thumbnailImage} alt={selectedGridProduct.name} className="max-w-full max-h-full object-contain" loading="eager" onError={handleImageLoadError} />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-orange-500 mb-2">
                    <span className="px-2 py-0.5 bg-orange-500/10 rounded-md uppercase">{selectedGridProduct.brand}</span>
                    <span className="text-gray-500">{selectedGridProduct.category}</span>
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-2">{selectedGridProduct.name}</h4>
                  <a href={selectedGridProduct.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-gray-400 hover:text-orange-500 transition-colors">
                    공식 홈페이지 <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>

              <div className="mt-8 overflow-x-auto rounded-xl border border-gray-800">
                {selectedGridProduct.sizeTable?.headers?.length ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-sm border-b border-gray-700">
                      <tr>
                        {selectedGridProduct.sizeTable.headers.map((header, index) => (
                          <th key={index} className={`px-6 py-4 bg-gray-800 text-base font-bold uppercase ${index === 0 ? 'border-r border-gray-700' : ''}`} style={{ color: normalizeCellText(header) === ITEM_LABEL ? '#E5E7EB' : '#00FF00' }}>
                            {String(header)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGridProduct.sizeTable.rows.map((row, rowIndex) => {
                        const isActiveRow = activeGridDetailRowIndex === rowIndex;
                        return (
                          <tr
                            key={rowIndex}
                            onClick={() => setActiveGridDetailRowIndex(rowIndex)}
                            className="group border-b border-gray-800 cursor-pointer transition-transform duration-200 active:scale-95"
                          >
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className={`px-6 py-4 font-medium transition-all duration-200 ${cellIndex === 0 ? 'border-r border-gray-700 text-base font-bold' : ''} ${
                                  isActiveRow
                                    ? 'bg-gray-100 text-black first:rounded-l-lg last:rounded-r-lg'
                                    : 'bg-gray-900 text-gray-300 group-hover:bg-gray-100 group-hover:text-black group-hover:first:rounded-l-lg group-hover:last:rounded-r-lg'
                                }`}
                              >
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-400">표시할 사이즈표 데이터가 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isDetailImageZoomed && selectedGridProduct && (
        <div
          className="fixed inset-0 z-[75] bg-black/90 backdrop-blur-sm p-4 flex items-center justify-center cursor-pointer"
          onClick={() => setIsDetailImageZoomed(false)}
          onTouchStart={() => setIsDetailImageZoomed(false)}
        >
          <div className="h-[63vh] w-full max-w-6xl flex items-center justify-center">
            <img
              src={selectedGridProduct.image}
              alt={selectedGridProduct.name}
              className="max-w-full max-h-full object-contain cursor-pointer"
              style={{ borderRadius: '20px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
