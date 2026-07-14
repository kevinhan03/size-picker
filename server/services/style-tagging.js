import {
  GEMINI_API_KEY,
  SUPABASE_PRODUCTS_TABLE,
  SUPABASE_STORAGE_BUCKET,
  SUPABASE_URL,
} from "../config/env.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { assertGeminiKey, callGemini } from "../bootstrap/gemini.js";

const MODEL_NAME = "gemini-3.1-flash-lite";
const REQUEST_TIMEOUT_MS = 18000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const STYLE_TAGS = [
  "casual",
  "minimal",
  "street",
  "classic",
  "vintage",
  "lovely_romantic",
  "sporty",
  "workwear_gorpcore",
  "chic_modern",
  "glam_sexy",
];

const STYLE_TAG_SCHEMA = {
  type: "object",
  properties: Object.fromEntries(STYLE_TAGS.map((tag) => [tag, { type: "number" }])),
  required: STYLE_TAGS,
};

const STYLE_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    style_tags: STYLE_TAG_SCHEMA,
    style_attributes: {
      type: "object",
      properties: {
        fit: { type: "string" },
        silhouette: { type: "string" },
        material: { type: "string" },
        color: { type: "string" },
        wash_texture: { type: "string" },
        formality: { type: "string" },
        utility_level: { type: "string" },
        sportiness: { type: "string" },
        decoration_level: { type: "string" },
        era_signal: { type: "string" },
        details: { type: "array", items: { type: "string" } },
      },
      required: [
        "fit",
        "silhouette",
        "material",
        "color",
        "wash_texture",
        "details",
        "formality",
        "utility_level",
        "sportiness",
        "decoration_level",
        "era_signal",
      ],
    },
    evidence: {
      type: "object",
      properties: Object.fromEntries(STYLE_TAGS.map((tag) => [tag, { type: "array", items: { type: "string" } }])),
    },
    confidence: { type: "number" },
  },
  required: ["style_tags", "style_attributes", "evidence", "confidence"],
};

const PROMPT = `당신은 패션 상품 이미지를 분석해서 스타일을 태깅하는 전문가입니다.

상품 이미지와 브랜드/상품명/상세 텍스트를 참고해 아래 10개 스타일 태그 각각에 대해 0.0~1.0 점수를 매기세요.
태그: casual, minimal, street, classic, vintage, lovely_romantic, sporty, workwear_gorpcore, chic_modern, glam_sexy

기준:
- casual: 일상적이고 편안한 데일리 스타일
- minimal: 장식이 적고 절제된 형태, 차분한 컬러, 깨끗한 실루엣
- street: 도시적 유스컬처, 오버핏, 그래픽, 트렌디한 무드
- classic: 전통적이고 단정한 정제감, 테일러링/셔츠/코트 같은 오래 가는 코드
- vintage: 워싱, 페이드, 낡은 질감, 과거 시대감
- lovely_romantic: 리본, 레이스, 프릴, 플로럴, 부드럽고 사랑스러운 장식성
- sporty: 운동복/액티브웨어/경기복에서 온 기능성과 활동성
- workwear_gorpcore: 작업복/아웃도어/장비감, 큰 포켓, 지퍼, 스트랩, 러기드함
- chic_modern: 도시적이고 세련된 긴장감, 모노톤, 샤프한 구조
- glam_sexy: 몸선/노출/광택/파티/나이트아웃 무드

중요 규칙:
1. 먼저 fit, silhouette, material, color, wash_texture, details, formality, utility_level, sportiness, decoration_level, era_signal을 분석하세요.
2. material은 이미지와 텍스트를 함께 보고 반드시 추론하세요. 정말 판단 불가일 때만 unknown.
3. 단순 기본 아이템이라는 이유만으로 casual/minimal을 높게 주지 마세요.
4. 0.75 이상은 주된 스타일, 0.45~0.75는 보조 스타일, 0.30 이하는 그래프 연결 제외 수준입니다.
5. 0.75 이상 태그는 보통 1~2개만 허용하세요. 매우 명확할 때만 3개.
6. 브랜드 인지도, 가격대, 성별로 판단하지 마세요.
7. JSON만 반환하세요.`;

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function productImageUrl(imagePath) {
  const normalized = String(imagePath || "").trim();
  if (!normalized) return "";
  if (isHttpUrl(normalized)) return normalized;
  return `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(SUPABASE_STORAGE_BUCKET)}/${normalized.replace(/^\/+/, "")}`;
}

function textCandidates(productMetadata) {
  if (!productMetadata || typeof productMetadata !== "object" || Array.isArray(productMetadata)) return [];
  const candidates = productMetadata.tagging_text_candidates || productMetadata.raw_text_candidates || [];
  return Array.isArray(candidates)
    ? candidates.map((value) => String(value || "").trim()).filter(Boolean).slice(0, 10)
    : [];
}

function imageCandidates(product, maxImages = 4) {
  const candidates = [product.image_path];
  const metadata = product.product_metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    candidates.push(...(Array.isArray(metadata.tagging_image_urls) ? metadata.tagging_image_urls : []));
    candidates.push(...(Array.isArray(metadata.image_candidates) ? metadata.image_candidates : []));
  }
  return [...new Set(candidates.map((value) => String(value || "").trim()).filter(Boolean))].slice(0, maxImages);
}

async function fetchImageInlineData(imagePath) {
  const url = productImageUrl(imagePath);
  if (!url) throw new Error("image url is empty");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
        "User-Agent": "digbox-style-tagging/1.0",
      },
    });
    if (!response.ok) throw new Error(`image download failed ${response.status}`);
    const contentType = String(response.headers.get("content-type") || "image/jpeg").split(";")[0] || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength) throw new Error("image download returned empty body");
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) throw new Error("image is too large for tagging");
    return {
      inlineData: {
        mimeType: contentType,
        data: Buffer.from(arrayBuffer).toString("base64"),
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractResponseText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  return candidates[0]?.content?.parts?.find((part) => typeof part?.text === "string")?.text || "";
}

function normalizeStyleTags(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("style_tags must be an object");
  }
  return Object.fromEntries(STYLE_TAGS.map((tag) => {
    const score = Number(value[tag]);
    if (!Number.isFinite(score)) throw new Error(`style_tags.${tag} must be numeric`);
    return [tag, Math.max(0, Math.min(1, score))];
  }));
}

function normalizeStringList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 5)
    : [];
}

function normalizeEvidence(value) {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(STYLE_TAGS.map((tag) => [tag, normalizeStringList(record[tag])]));
}

function normalizeStyleAnalysis(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("style analysis must be an object");
  }
  const confidence = Number(value.confidence);
  return {
    style_tags: normalizeStyleTags(value.style_tags),
    style_attributes:
      value.style_attributes && typeof value.style_attributes === "object" && !Array.isArray(value.style_attributes)
        ? value.style_attributes
        : {},
    style_tags_evidence: normalizeEvidence(value.evidence),
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
  };
}

async function analyzeProductStyle(product) {
  assertGeminiKey();
  const images = [];
  const failures = [];
  for (const imagePath of imageCandidates(product)) {
    try {
      images.push(await fetchImageInlineData(imagePath));
    } catch (error) {
      failures.push(`${imagePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (images.length >= 4) break;
  }
  if (!images.length) throw new Error(failures.join("; ") || "no usable product image");

  const metadataText = textCandidates(product.product_metadata).map((text) => `- ${text}`).join("\n") || "없음";
  const prompt = `${PROMPT}

[상품 정보]
카테고리: ${String(product.category || "").trim()}
브랜드: ${String(product.brand || "").trim()}
상품명: ${String(product.name || "").trim()}
상품 상세 후보 텍스트:
${metadataText}`;

  const response = await callGemini(MODEL_NAME, {
    contents: [{ parts: [{ text: prompt }, ...images] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: STYLE_ANALYSIS_SCHEMA,
    },
  });
  if (!response.ok) throw new Error((await response.text()).slice(0, 1000) || "Gemini style tagging failed");
  const payload = await response.json();
  const text = extractResponseText(payload);
  if (!text) throw new Error("Gemini returned empty style tagging response");
  return normalizeStyleAnalysis(JSON.parse(text));
}

export async function tagProductStyleById(productId, { force = false } = {}) {
  if (!GEMINI_API_KEY) return { ok: false, skipped: true, reason: "missing GEMINI_API_KEY" };
  assertSupabaseConfig();
  const id = String(productId || "").trim();
  if (!id) throw new Error("product id is required");

  const { data: product, error } = await supabase
    .from(SUPABASE_PRODUCTS_TABLE)
    .select("id,brand,name,category,image_path,style_tags,product_metadata")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!product) return { ok: false, skipped: true, reason: "product not found" };
  if (product.style_tags && !force) return { ok: true, skipped: true, reason: "already tagged" };

  try {
    await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .update({ tagging_status: "tagging", tagging_error: null })
      .eq("id", id);
    const analysis = await analyzeProductStyle(product);
    const { error: updateError } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .update({
        style_tags: analysis.style_tags,
        style_attributes: analysis.style_attributes,
        style_tags_evidence: analysis.style_tags_evidence,
        style_tags_confidence: analysis.confidence,
        tagging_status: "tagged",
        tagging_error: null,
        tagged_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateError) throw updateError;
    return { ok: true, skipped: false };
  } catch (taggingError) {
    await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .update({
        tagging_status: "failed",
        tagging_error: taggingError instanceof Error ? taggingError.message.slice(0, 1000) : String(taggingError).slice(0, 1000),
      })
      .eq("id", id);
    throw taggingError;
  }
}
