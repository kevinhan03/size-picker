import type { AddProductFormData } from "../types";
export {
  ACCESSORY_CATEGORY_OPTIONS,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  CATEGORY_OPTION_BY_LOWER,
  getCategoryLabel,
  getSubcategoryFilterOptions,
  getSubcategories,
  isAccessoryCategory,
  isProductCategory,
  isValidSubcategory,
  PRODUCT_CATEGORIES,
  suggestProductCategory,
} from "./productCategories";
export { PRODUCT_CATEGORY_REGISTRY } from "./productCategoryRegistry.js";

export const MAX_PRODUCT_IMAGE_CANDIDATES = 24;
export const DUPLICATE_PRODUCT_MESSAGE = "이미 등록된 상품입니다.";

export const SUPABASE_URL = String(
  process.env.NEXT_PUBLIC_SUPABASE_URL || ""
).trim();
export const SUPABASE_ANON_KEY = String(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
).trim();
export const STORAGE_BUCKET = "product-assets";
export const STORAGE_PREFIX = "submissions/";
export const DEFAULT_PRODUCT_PLACEHOLDER = "/images/default-product.svg";

export const TOTAL_LENGTH_LABEL = "총장";
export const ITEM_LABEL = "항목";
export const SIZE_COLUMN_LABEL = "사이즈";
export const MEASUREMENT_LABEL_HINT_PATTERN =
  /(?:총장|기장|어깨|가슴|소매|허리|힙|허벅지|밑위|밑단|인심|length|shoulder|chest|sleeve|waist|hip|thigh|rise|hem|inseam|pit|bust|body|width)/i;
export const TOTAL_LENGTH_ALIAS_KEYS = [
  "총장",
  "전체길이",
  "전체장",
  "기장",
  "totallength",
  "length",
  "total",
] as const;
export const MEASUREMENT_ALIAS_MAP: Record<string, string> = {
  총장: TOTAL_LENGTH_LABEL,
  전체길이: TOTAL_LENGTH_LABEL,
  전체장: TOTAL_LENGTH_LABEL,
  기장: TOTAL_LENGTH_LABEL,
  상의총장: TOTAL_LENGTH_LABEL,
  하의총장: TOTAL_LENGTH_LABEL,
  바지총장: TOTAL_LENGTH_LABEL,
  하의길이: TOTAL_LENGTH_LABEL,
  바지길이: TOTAL_LENGTH_LABEL,
  팬츠길이: TOTAL_LENGTH_LABEL,
  총기장: TOTAL_LENGTH_LABEL,
  총길이: TOTAL_LENGTH_LABEL,
  outseam: TOTAL_LENGTH_LABEL,
  leglength: TOTAL_LENGTH_LABEL,
  length: TOTAL_LENGTH_LABEL,
  total: TOTAL_LENGTH_LABEL,
  소매: "소매",
  소매길이: "소매",
  소매기장: "소매",
  소매장: "소매",
  팔길이: "소매",
  팔장: "소매",
  sleeve: "소매",
  sleevelength: "소매",
  어깨: "어깨",
  어깨너비: "어깨",
  어깨넓이: "어깨",
  어깨폭: "어깨",
  어깨단면: "어깨",
  shoulder: "어깨",
  shoulderwidth: "어깨",
  가슴: "가슴",
  가슴단면: "가슴",
  가슴너비: "가슴",
  가슴폭: "가슴",
  몸통단면: "가슴",
  품: "가슴",
  chest: "가슴",
  bust: "가슴",
  chestwidth: "가슴",
  body: "가슴",
  허리: "허리",
  허리단면: "허리",
  허리너비: "허리",
  허리폭: "허리",
  waist: "허리",
  waistwidth: "허리",
  힙: "힙",
  엉덩이: "힙",
  엉덩이단면: "힙",
  힙단면: "힙",
  엉덩이너비: "힙",
  힙너비: "힙",
  hip: "힙",
  허벅지: "허벅지",
  허벅지단면: "허벅지",
  허벅지너비: "허벅지",
  thigh: "허벅지",
  밑위: "밑위",
  앞밑위: "밑위",
  밑위길이: "밑위",
  frontrise: "밑위",
  backrise: "뒷밑위",
  rearrise: "뒷밑위",
  rise: "밑위",
  밑단: "밑단",
  밑단단면: "밑단",
  밑단너비: "밑단",
  밑단폭: "밑단",
  하단너비: "밑단",
  hem: "밑단",
  legopening: "밑단",
  인심: "인심",
  안쪽다리길이: "인심",
  안쪽허벅지길이: "인심",
  insideleg: "인심",
  inseam: "인심",
};

export const EMPTY_FORM_DATA: AddProductFormData = {
  brand: "",
  name: "",
  category: "",
  url: "",
  productImage: null,
  sizeChartImage: null,
  extractedTable: null,
  rawExtractedTable: null,
};
