import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Search, Ruler, ArrowRight, Loader2, X, AlertCircle, ExternalLink, Plus, Upload, Image as ImageIcon, Camera, Globe, Check, RefreshCw, ShieldAlert, LayoutGrid } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query as firestoreQuery, orderBy } from 'firebase/firestore';

// --- Types & Interfaces ---

interface SizeTable {
  headers: string[];
  rows: string[][];
}

interface Product {
  id: string; // Firebase ID is string
  brand: string;
  name: string;
  category: string;
  url: string;
  image: string;
  sizeTable: SizeTable | null;
  createdAt?: string;
}

interface FormData {
  brand: string;
  name: string;
  url: string;
  productImage: string | null;
  sizeChartImage: string | null;
  extractedTable: SizeTable | null;
}

// --- Global Config & Helpers ---
const apiKey = (import.meta.env.VITE_GEMINI_API_KEY ?? "").trim();
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const SIZE_TABLE_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-preview-09-2025",
  "gemini-2.0-flash",
];

// Firebase Initialization with User Provided Config
const firebaseConfig = {
  apiKey: "AIzaSyCrca7bnI8e3nH-6KtIcYh3bdQ-uD1cfbc",
  authDomain: "sizepicker-4fe32.firebaseapp.com",
  projectId: "sizepicker-4fe32",
  storageBucket: "sizepicker-4fe32.firebasestorage.app",
  messagingSenderId: "244396131079",
  appId: "1:244396131079:web:5cfa176c1b7990c1083ba2",
  measurementId: "G-NEH2VHSGH6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- Helper Functions ---

const resizeImage = (base64Str: string, maxWidth: number = 300): Promise<string> => {
  return new Promise((resolve) => {
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
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

// --- Gemini API Helpers ---
const listAvailableGeminiModels = async (): Promise<string[]> => {
  if (!apiKey) return [];

  try {
    const res = await fetch(`${GEMINI_API_BASE}/models?key=${apiKey}`);
    if (!res.ok) return [];

    const data = await res.json();
    const models = Array.isArray(data?.models) ? data.models : [];

    return models
      .map((m: { name?: string }) => (m?.name ?? "").split("/").pop() ?? "")
      .filter((name: string) => name.length > 0)
      .sort();
  } catch {
    return [];
  }
};

const extractSizeTableFromImage = async (base64Image: string): Promise<SizeTable> => {
  const prompt = `
    Analyze this image of a clothing size chart. 
    Extract the data into a JSON object with this exact structure:
    {
      "headers": ["Column1Name", "Column2Name", ...],
      "rows": [
        ["Row1Col1", "Row1Col2", ...],
        ["Row2Col1", "Row2Col2", ...]
      ]
    }
    Translate headers to Korean if they are in English (e.g., Chest -> 가슴둘레, Length -> 총장).
    Make sure all cell values are Strings or Numbers, not Objects.
    Return ONLY the raw JSON string, no markdown formatting.
  `;

  try {
    if (!apiKey) {
      throw new Error("Gemini API 키가 설정되지 않았습니다. .env의 VITE_GEMINI_API_KEY를 확인해주세요.");
    }

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/png", data: base64Image } }
        ]
      }]
    };

    let response: Response | null = null;
    const modelErrors: string[] = [];

    for (const model of SIZE_TABLE_MODEL_CANDIDATES) {
      const res = await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        response = res;
        break;
      }

      modelErrors.push(`${model}(${res.status})`);
    }

    if (!response) {
      const availableModels = await listAvailableGeminiModels();
      const availableText = availableModels.length > 0 ? availableModels.join(", ") : "확인 실패";
      throw new Error(`gemini-2.5-flash 사용 불가: ${modelErrors.join(", ")}. 사용 가능한 모델: ${availableText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Improved JSON parsing: find the first '{' and last '}'
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    let cleanText = text;
    if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanText = text.substring(jsonStart, jsonEnd + 1);
    }
    
    return JSON.parse(cleanText) as SizeTable;
  } catch (error) {
    console.error("Error extracting size table:", error);
    throw new Error("사이즈표 분석에 실패했습니다.");
  }
};

const removeBackgroundWithGemini = async (base64Image: string): Promise<string> => {
  const prompt = "Remove the background of this product image. Make the background pure white or transparent. Keep the product center.";
  
  try {
    const response = await fetch(`${GEMINI_API_BASE}/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: base64Image } }
          ]
        }],
        generationConfig: {
            responseModalities: ["IMAGE"]
        }
      })
    });

    const data = await response.json();
    const resultBase64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
    
    if (!resultBase64) throw new Error("이미지 생성 실패");
    return resultBase64;
  } catch (error) {
    console.error("Error removing background:", error);
    return base64Image;
  }
};


// --- Mock Data ---
const MOCK_DATABASE: Product[] = [];

// --- Fallback Data Generator ---
const generateFallbackResult = (term: string): Product => {
  const isShoes = /신발|슈즈|shoes|sneakers|boots|운동화|구두/i.test(term);
  const isPants = /바지|팬츠|pants|jeans|slacks|denim|청바지/i.test(term);
  const guessedBrand = term.split(' ')[0].toUpperCase();
  const dummyImage = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80";

  return {
    id: Date.now().toString(),
    brand: guessedBrand.length > 1 ? guessedBrand : "BRAND",
    name: term,
    category: isShoes ? "Shoes" : (isPants ? "Pants" : "Clothing"),
    url: `https://www.google.com/search?q=${encodeURIComponent(term)}`,
    image: dummyImage,
    sizeTable: {
        headers: ["정보 없음"],
        rows: [["데이터베이스에 없는 상품입니다."]]
    }
  };
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);
  
  const [query, setQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  
  const [viewMode, setViewMode] = useState<'search' | 'grid'>('search');

  const [formData, setFormData] = useState<FormData>({
    brand: "",
    name: "",
    url: "",
    productImage: null,
    sizeChartImage: null,
    extractedTable: null
  });
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [isAnalyzingTable, setIsAnalyzingTable] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isSelectionRef = useRef<boolean>(false);

  // --- Firebase Auth & Data Fetching ---
  const handleRetryLogin = async () => {
    setIsAuthLoading(true);
    try {
      await signInAnonymously(auth);
      setAuthError(null);
    } catch (err: any) {
      console.error("Authentication failed:", err);
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/admin-restricted-operation') {
         setAuthError("Firebase Console에서 익명 로그인이 활성화되지 않았습니다. 설정 후 '다시 시도'를 눌러주세요.");
      } else {
         setAuthError("인증 오류가 발생했습니다: " + err.message);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRetryFirestore = () => {
    setRetryTrigger(prev => prev + 1);
  };

  useEffect(() => {
    handleRetryLogin();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (u) setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const productsRef = collection(db, 'products');
    const q = firestoreQuery(productsRef, orderBy('createdAt', 'desc')); 

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const products = snapshot.docs.map(doc => {
          const data = doc.data();
          let parsedTable = data.sizeTable;
          if (typeof parsedTable === 'string') {
            try {
              parsedTable = JSON.parse(parsedTable);
            } catch (e) {
              console.error("Failed to parse sizeTable JSON", e);
              parsedTable = null;
            }
          }
          
          return {
            id: doc.id,
            ...data,
            sizeTable: parsedTable
          } as Product;
        });
        setFirestoreProducts(products);
        setFirestoreError(null);
      },
      (error) => {
        console.error("Firestore error:", error);
        if (error.code === 'permission-denied') {
            setFirestoreError("Firestore 접근 권한이 없습니다. Firebase Console에서 규칙 수정 후 '데이터 다시 불러오기'를 눌러주세요.");
        } else {
            setFirestoreError("데이터를 불러오는 중 오류가 발생했습니다: " + error.message);
        }
      }
    );

    return () => unsubscribe();
  }, [user, retryTrigger]);

  const allProducts = [...MOCK_DATABASE, ...firestoreProducts];

  // --- Search Logic ---
  useEffect(() => {
    if (isSelectionRef.current) {
      isSelectionRef.current = false;
      return;
    }

    if (query.length > 0) {
      const filtered = allProducts.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.brand.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, firestoreProducts]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (searchItem: Product | null = null) => {
    const searchTerm = searchItem ? searchItem.name : query;
    if (!searchTerm) return;

    setViewMode('search');
    setResult(null);
    setError(null);
    setIsLoading(true);
    setShowSuggestions(false);

    setTimeout(() => {
      let foundItem = searchItem || allProducts.find(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (!foundItem) {
        foundItem = generateFallbackResult(searchTerm);
      }

      if (foundItem) {
        setResult(foundItem);
        setQuery(""); 
      } else {
        setError(`'${searchTerm}'에 대한 사이즈 정보를 찾을 수 없습니다.`);
      }
      setIsLoading(false);
    }, 1500); 
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleShowAllProducts = () => {
    setViewMode('grid');
    setResult(null);
    setQuery("");
    setError(null);
  };

  const handleGoHome = () => {
    setViewMode('search');
    setResult(null);
    setQuery("");
    setError(null);
  }

  // --- Modal & Form Logic ---
  const handleOpenModal = () => {
    setFormData({ brand: "", name: "", url: "", productImage: null, sizeChartImage: null, extractedTable: null });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: 'product' | 'chart') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const resultString = reader.result as string;
      const base64 = resultString.split(',')[1];
      
      if (type === 'product') {
        setFormData(prev => ({ ...prev, productImage: `data:image/png;base64,${base64}` }));
        
        setIsProcessingImage(true);
        const processedBase64 = await removeBackgroundWithGemini(base64);
        setFormData(prev => ({ ...prev, productImage: `data:image/png;base64,${processedBase64}` }));
        setIsProcessingImage(false);
        
      } else if (type === 'chart') {
        setFormData(prev => ({ ...prev, sizeChartImage: `data:image/png;base64,${base64}` }));
        
        setIsAnalyzingTable(true);
        try {
          const tableData = await extractSizeTableFromImage(base64);
          setFormData(prev => ({ ...prev, extractedTable: tableData }));
        } catch (err) {
          alert("사이즈표 인식에 실패했습니다. 다시 시도해주세요.");
        }
        setIsAnalyzingTable(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProduct = async () => {
    if (!user) {
        alert("로그인이 필요합니다. (익명 로그인 실패)");
        return;
    }
    setIsSaving(true);
    try {
      const finalImage = formData.productImage ? await resizeImage(formData.productImage) : "";

      await addDoc(collection(db, 'products'), {
        brand: formData.brand,
        name: formData.name,
        category: "User Uploaded",
        url: formData.url || "#",
        image: finalImage,
        sizeTable: JSON.stringify(formData.extractedTable),
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2500);

    } catch (e: any) {
      console.error(e);
      if (e.code === 'permission-denied') {
        alert("저장 실패: Firestore 규칙 권한 없음");
      } else {
        alert("저장 중 오류가 발생했습니다: " + e.message);
      }
    }
    setIsSaving(false);
  };

  const isFormValid = formData.brand && formData.name && formData.extractedTable && !isProcessingImage;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleGoHome}>
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
              <Ruler className="text-black w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-orange-500">Size Picker</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleShowAllProducts}
              className="p-2 text-gray-400 hover:text-orange-500 transition rounded-lg hover:bg-gray-800"
              title="전체 목록 보기"
            >
              <LayoutGrid className="w-6 h-6" />
            </button>
            <button 
              onClick={handleOpenModal}
              className="flex items-center gap-2 text-black px-4 py-2 rounded-lg hover:opacity-80 transition shadow-lg text-sm font-bold"
              style={{ backgroundColor: '#00FF00', boxShadow: '0 0 15px rgba(0,255,0,0.3)' }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">상품 추가</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-4 flex flex-col items-center min-h-screen">
        
        {/* Error Messages */}
        {authError && (
            <div className="w-full max-w-4xl mb-6 bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <span className="font-medium text-sm md:text-base">{authError}</span>
                </div>
                <button onClick={handleRetryLogin} disabled={isAuthLoading} className="flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm font-bold transition whitespace-nowrap">
                  {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} 다시 시도
                </button>
            </div>
        )}
        {firestoreError && (
            <div className="w-full max-w-4xl mb-6 bg-orange-900/50 border border-orange-500 text-orange-200 px-6 py-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                  <span className="font-medium text-sm md:text-base">{firestoreError}</span>
                </div>
                <button onClick={handleRetryFirestore} className="flex items-center gap-2 px-4 py-2 bg-orange-800 hover:bg-orange-700 rounded-lg text-sm font-bold transition whitespace-nowrap">
                  <RefreshCw className="w-4 h-4" /> 데이터 다시 불러오기
                </button>
            </div>
        )}

        {/* --- VIEW MODE: SEARCH (HOME) --- */}
        {viewMode === 'search' && (
          <>
            {!result && !isLoading && (
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                  모든 옷의 사이즈표,<br/>
                  <span className="text-orange-500">한 번에 검색하세요.</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-xl mx-auto">
                  공식 홈페이지와 사용자들이 공유한 데이터를 통해 <br className="hidden md:block"/>
                  가장 정확한 사이즈 정보를 제공합니다.
                </p>
              </div>
            )}

            {/* Search Bar */}
            <div className={`w-full max-w-2xl relative transition-all duration-500 ${result || isLoading ? 'mt-0' : 'mt-4'}`} ref={searchContainerRef}>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className={`w-6 h-6 transition-colors ${showSuggestions ? 'text-orange-500' : 'text-gray-500'}`} />
                </div>
                <input
                  type="text"
                  className="w-full pl-14 pr-14 py-5 bg-gray-900 border-2 border-gray-800 rounded-2xl shadow-xl text-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  placeholder="브랜드명 혹은 상품명"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if(query) setShowSuggestions(true); }}
                />
                {query && (
                  <button onClick={() => {setQuery(""); setSuggestions([]);}} className="absolute inset-y-0 right-14 pr-2 flex items-center text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => handleSearch()} className="absolute inset-y-2 right-2 p-3 bg-orange-500 rounded-xl text-black hover:bg-orange-400 transition-colors shadow-lg">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden z-20 max-h-96 overflow-y-auto">
                  {suggestions.length > 0 ? (
                    <ul>
                      <li className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-black/20">추천 상품</li>
                      {suggestions.map((item) => (
                        <li 
                          key={item.id}
                          onClick={() => { 
                            isSelectionRef.current = true;
                            setQuery(item.name); 
                            handleSearch(item); 
                          }}
                          className="px-5 py-4 cursor-pointer hover:bg-gray-800 transition-colors flex items-center gap-4 border-b border-gray-800 last:border-0"
                        >
                          <div className="w-10 h-10 bg-gray-800 rounded-md flex-shrink-0 overflow-hidden">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e: any) => {e.target.onerror=null; e.target.style.display='none';}} />
                          </div>
                          <div>
                            <div className="font-medium text-white">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.brand} · {item.category}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      검색어와 일치하는 추천 상품이 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="mt-20 flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-gray-800 border-t-orange-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-bold text-white">검색 엔진 가동 중...</h3>
              </div>
            )}

            {error && !isLoading && (
              <div className="mt-12 p-6 bg-red-900/20 border border-red-900/50 rounded-2xl max-w-lg text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-400 mb-2">결과 없음</h3>
                <p className="text-red-300 mb-4">{error}</p>
              </div>
            )}

            {/* Result View */}
            {result && !isLoading && (
              <div className="mt-12 w-full max-w-4xl">
                <div className="bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800">
                  <div className="p-6 md:p-8 border-b border-gray-800 flex flex-col md:flex-row gap-6 md:items-center bg-black/20">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl shadow-sm border border-gray-700 flex-shrink-0 overflow-hidden p-2 flex items-center justify-center">
                      <img src={result.image} alt={result.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-orange-500 mb-1">
                        <span className="px-2 py-0.5 bg-orange-500/10 rounded-md uppercase">{result.brand}</span>
                        <span className="text-gray-500">{result.category}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">{result.name}</h2>
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-gray-400 hover:text-orange-500 transition-colors">
                        공식 홈페이지 <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>

                  <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                        <Ruler className="w-5 h-5 text-gray-500" />
                        사이즈 가이드
                      </h3>
                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">단위: cm</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-800">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase border-b border-gray-700">
                          <tr>
                            {result.sizeTable?.headers?.map((header, idx) => (
                              <th key={idx} className={`px-6 py-4 font-bold bg-gray-800 ${idx === 0 ? 'sticky left-0 z-10' : ''}`} style={{ color: '#00FF00' }}>{String(header)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.sizeTable?.rows?.map((row, rowIdx) => (
                            <tr key={rowIdx} className="bg-gray-900 border-b border-gray-800 hover:bg-orange-500/5 transition-colors last:border-0">
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className={`px-6 py-4 font-medium ${cellIdx === 0 ? 'text-white sticky left-0 bg-gray-900' : 'text-gray-300'}`}>
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* --- VIEW MODE: GRID (ALL PRODUCTS) --- */}
        {viewMode === 'grid' && (
          <div className="w-full max-w-7xl">
            <h2 className="text-3xl font-bold mb-8 text-center sm:text-left flex items-center gap-3">
              <LayoutGrid className="w-8 h-8 text-orange-500" />
              전체 상품 목록
            </h2>
            
            {allProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                등록된 상품이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allProducts.map((product) => (
                  <div 
                    key={product.id}
                    onClick={() => handleSearch(product)}
                    className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition cursor-pointer group flex flex-col h-full"
                    style={{ transition: 'all 0.3s' }}
                  >
                    <div className="h-48 bg-black/20 p-4 flex items-center justify-center overflow-hidden relative">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e: any) => {e.target.onerror=null; e.target.style.display='none';}} 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="text-xs font-bold text-orange-500 mb-1 uppercase tracking-wide">
                        {product.brand}
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      <div className="text-sm text-gray-500 mt-auto pt-2">
                        {product.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* --- ADD PRODUCT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] border border-gray-800">
            
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900 sticky top-0 z-10 text-white">
              <h3 className="text-lg font-bold" style={{ color: '#00FF00' }}>상품 직접 추가</h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div 
              className="p-6 overflow-y-auto text-white"
            >
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">브랜드명</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    placeholder="예: Stussy"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">상품명</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    placeholder="예: 월드 투어 후드티"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">공식 홈페이지 URL (선택사항)</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                    <input 
                      type="url" 
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="https://..."
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">상품 사진 (누끼 자동 제거)</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer flex-shrink-0 w-24 h-24 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center hover:bg-gray-800 hover:border-orange-500 transition group relative overflow-hidden">
                      {formData.productImage ? (
                        <img src={formData.productImage} className="w-full h-full object-contain p-1" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-500 group-hover:text-orange-500 mb-1" />
                          <span className="text-[10px] text-gray-500 group-hover:text-orange-500">업로드</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'product')} />
                      {isProcessingImage && (
                        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        </div>
                      )}
                    </label>
                    <div className="text-xs text-gray-500 flex-1">
                      상품 사진을 올리면 AI가 자동으로 배경을 제거하고 상품만 남깁니다.
                      {isProcessingImage && <p className="text-orange-500 font-bold mt-1">배경 제거 중... (잠시만 기다려주세요)</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">사이즈표 캡처 (자동 변환)</label>
                  <div className="w-full">
                    <label className="cursor-pointer w-full h-32 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center hover:bg-gray-800 hover:border-orange-500 transition relative overflow-hidden">
                       {formData.sizeChartImage ? (
                          <div className="flex flex-col items-center w-full h-full p-2">
                             <div className="flex items-center gap-2 text-green-500 font-bold mb-2">
                               <ImageIcon className="w-4 h-4" /> 이미지 업로드 완료
                             </div>
                             {isAnalyzingTable ? (
                               <div className="flex flex-col items-center justify-center h-full">
                                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 mb-2" />
                                  <span className="text-xs text-orange-500">표 데이터 추출 중...</span>
                               </div>
                             ) : formData.extractedTable ? (
                               <div className="text-xs text-gray-300 bg-gray-700 p-2 rounded border border-gray-600 w-full text-center">
                                 데이터 추출 성공! ({formData.extractedTable.rows.length}개 사이즈 발견)
                               </div>
                             ) : null}
                          </div>
                       ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-500 mb-2 group-hover:text-orange-500" />
                          <span className="text-sm text-gray-500 group-hover:text-orange-500">사이즈표 스크린샷을 업로드하세요</span>
                        </>
                       )}
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'chart')} />
                    </label>
                  </div>
                </div>

                {formData.extractedTable && (
                   <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 max-h-40 overflow-auto">
                      <p className="text-xs font-bold text-orange-400 mb-2">추출된 데이터 미리보기:</p>
                      <table className="w-full text-[10px] text-left text-gray-300">
                        <thead>
                          <tr>{formData.extractedTable.headers.map((h, i) => <th key={i} className="p-1" style={{ color: '#00FF00' }}>{String(h)}</th>)}</tr>
                        </thead>
                        <tbody>
                          {formData.extractedTable.rows.map((r, i) => (
                             <tr key={i} className="border-t border-gray-700">
                               {r.map((c, j) => <td key={j} className="p-1">{String(c)}</td>)}
                             </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                )}
              </div>

            </div>

            <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-3 sticky bottom-0">
              <button 
                onClick={handleCloseModal}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition"
              >
                취소
              </button>
              <button 
                onClick={handleSubmitProduct}
                disabled={!isFormValid}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-black transition flex items-center gap-2
                  ${!isFormValid 
                    ? 'bg-gray-700 cursor-not-allowed text-gray-500' 
                    : 'hover:scale-105 hover:bg-orange-400'}`}
                style={!isFormValid 
                  ? {} 
                  : { backgroundColor: '#F97316', boxShadow: '0 0 15px rgba(249, 115, 22, 0.3)' }
                }
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSaving ? "저장 중..." : "상품 등록하기"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- SUCCESS MODAL --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
          <div 
            className="bg-black/80 backdrop-blur-md border rounded-2xl p-8 flex flex-col items-center justify-center"
            style={{ borderColor: '#00FF00', boxShadow: '0 0 50px rgba(0,255,0,0.2)' }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0, 255, 0, 0.2)' }}>
              <Check className="w-10 h-10" style={{ color: '#00FF00' }} />
            </div>
            <h3 className="text-2xl font-bold tracking-widest" style={{ color: '#00FF00' }}>COMPLETE</h3>
          </div>
        </div>
      )}
    </div>
  );
}


