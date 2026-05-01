import type { AddProductFormData, SizeConversionRow, SizeGender } from "../types";

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

export const SIZE_REGION_OPTIONS = [
  { key: "kr", label: "Korea" },
  { key: "jp", label: "Japan" },
  { key: "us", label: "US" },
  { key: "eu", label: "EU" },
  { key: "uk", label: "UK" },
] as const;

export const CLOTHING_SIZE_ROWS_BY_GENDER: Record<SizeGender, SizeConversionRow[]> = {
  men: [
    { label: "XS", kr: "85", jp: "XS", us: "34", eu: "44", uk: "34" },
    { label: "S", kr: "90", jp: "S", us: "36-38", eu: "46-48", uk: "36-38" },
    { label: "M", kr: "95", jp: "M", us: "40", eu: "50", uk: "40" },
    { label: "L", kr: "100", jp: "L", us: "42", eu: "52", uk: "42" },
    { label: "XL", kr: "105", jp: "XL", us: "44", eu: "54", uk: "44" },
    { label: "XXL", kr: "110", jp: "XXL", us: "46", eu: "56", uk: "46" },
    { label: "3XL", kr: "115", jp: "3XL", us: "48", eu: "58", uk: "48" },
  ],
  women: [
    { label: "XXS", kr: "60", jp: "XXS", us: "0", eu: "30", uk: "2" },
    { label: "XS", kr: "65", jp: "XS", us: "0-2", eu: "32-34", uk: "4-6" },
    { label: "S", kr: "70", jp: "S", us: "4-6", eu: "36-38", uk: "8-10" },
    { label: "M", kr: "75", jp: "M", us: "8-10", eu: "40-42", uk: "12-14" },
    { label: "L", kr: "80", jp: "L", us: "12-14", eu: "44-46", uk: "16-18" },
    { label: "XL", kr: "85", jp: "XL", us: "16-18", eu: "48-50", uk: "20-22" },
    { label: "XXL", kr: "90", jp: "XXL", us: "20-22", eu: "52-54", uk: "24-26" },
  ],
};

export const SHOE_SIZE_ROWS_BY_GENDER: Record<SizeGender, SizeConversionRow[]> = {
  men: [
    { label: "230", kr: "230", jp: "23.0", us: "4", eu: "36", uk: "3.5" },
    { label: "235", kr: "235", jp: "23.5", us: "4.5", eu: "36.5", uk: "4" },
    { label: "240", kr: "240", jp: "24.0", us: "5.5", eu: "38", uk: "5" },
    { label: "245", kr: "245", jp: "24.5", us: "6.5", eu: "39", uk: "6" },
    { label: "250", kr: "250", jp: "25.0", us: "7", eu: "40", uk: "6" },
    { label: "255", kr: "255", jp: "25.5", us: "7.5", eu: "40.5", uk: "6.5" },
    { label: "260", kr: "260", jp: "26.0", us: "8", eu: "41", uk: "7" },
    { label: "265", kr: "265", jp: "26.5", us: "8.5", eu: "42", uk: "7.5" },
    { label: "270", kr: "270", jp: "27.0", us: "9", eu: "42.5", uk: "8" },
    { label: "275", kr: "275", jp: "27.5", us: "9.5", eu: "43", uk: "8.5" },
    { label: "280", kr: "280", jp: "28.0", us: "10", eu: "44", uk: "9" },
    { label: "285", kr: "285", jp: "28.5", us: "10.5", eu: "44.5", uk: "9.5" },
    { label: "290", kr: "290", jp: "29.0", us: "11", eu: "45", uk: "10" },
  ],
  women: [
    { label: "220", kr: "220", jp: "22.0", us: "5", eu: "35.5", uk: "2.5" },
    { label: "225", kr: "225", jp: "22.5", us: "5.5", eu: "36", uk: "3" },
    { label: "230", kr: "230", jp: "23.0", us: "6", eu: "36.5", uk: "3.5" },
    { label: "235", kr: "235", jp: "23.5", us: "6.5", eu: "37.5", uk: "4" },
    { label: "240", kr: "240", jp: "24.0", us: "7", eu: "38", uk: "4.5" },
    { label: "245", kr: "245", jp: "24.5", us: "7.5", eu: "38.5", uk: "5" },
    { label: "250", kr: "250", jp: "25.0", us: "8", eu: "39", uk: "5.5" },
    { label: "255", kr: "255", jp: "25.5", us: "8.5", eu: "40", uk: "6" },
    { label: "260", kr: "260", jp: "26.0", us: "9", eu: "40.5", uk: "6.5" },
    { label: "265", kr: "265", jp: "26.5", us: "9.5", eu: "41", uk: "7" },
    { label: "270", kr: "270", jp: "27.0", us: "10", eu: "42", uk: "7.5" },
    { label: "275", kr: "275", jp: "27.5", us: "10.5", eu: "42.5", uk: "8" },
    { label: "280", kr: "280", jp: "28.0", us: "11", eu: "43", uk: "8.5" },
  ],
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
