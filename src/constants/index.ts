import type { AddProductFormData } from "../types";

export const MAX_PRODUCT_IMAGE_CANDIDATES = 24;
export const DUPLICATE_PRODUCT_MESSAGE = "이미 등록된 상품입니다.";

export const SUPABASE_URL = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
export const SUPABASE_ANON_KEY = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
export const STORAGE_BUCKET = "product-assets";
export const STORAGE_PREFIX = "submissions/";
export const DEFAULT_PRODUCT_PLACEHOLDER = "/images/default-product.svg";

export const CATEGORY_OPTIONS = ["Outer", "Top", "Bottom", "Shoes", "Acc"] as const;
export const CATEGORY_OPTION_BY_LOWER: Record<string, (typeof CATEGORY_OPTIONS)[number]> = {
  outer: "Outer",
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  acc: "Acc",
};

export const TOTAL_LENGTH_LABEL = "총장";
export const ITEM_LABEL = "항목";
export const SIZE_COLUMN_LABEL = "사이즈";
export const MEASUREMENT_LABEL_HINT_PATTERN =
  /(?:총장|기장|어깨|가슴|소매|허리|힙|허벅지|밑위|밑단|인심|length|shoulder|chest|sleeve|waist|hip|thigh|rise|hem|inseam|pit|bust|body|width)/i;
export const TOTAL_LENGTH_ALIAS_KEYS = ["총장", "전체길이", "전체장", "기장", "totallength", "length", "total"] as const;
export const MEASUREMENT_ALIAS_MAP: Record<string, string> = {
  총장: TOTAL_LENGTH_LABEL,
  전체길이: TOTAL_LENGTH_LABEL,
  전체장: TOTAL_LENGTH_LABEL,
  기장: TOTAL_LENGTH_LABEL,
  상의총장: TOTAL_LENGTH_LABEL,
  하의총장: TOTAL_LENGTH_LABEL,
  바지총장: TOTAL_LENGTH_LABEL,
  length: TOTAL_LENGTH_LABEL,
  total: TOTAL_LENGTH_LABEL,
  소매: "소매",
  소매길이: "소매",
  소매기장: "소매",
  팔장: "소매",
  sleeve: "소매",
  어깨: "어깨",
  어깨너비: "어깨",
  어깨넓이: "어깨",
  shoulder: "어깨",
  가슴: "가슴",
  가슴단면: "가슴",
  품: "가슴",
  chest: "가슴",
  bust: "가슴",
  허리: "허리",
  허리단면: "허리",
  waist: "허리",
  힙: "힙",
  엉덩이: "힙",
  hip: "힙",
  허벅지: "허벅지",
  허벅지단면: "허벅지",
  thigh: "허벅지",
  밑위: "밑위",
  rise: "밑위",
  밑단: "밑단",
  밑단단면: "밑단",
  hem: "밑단",
  인심: "인심",
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
