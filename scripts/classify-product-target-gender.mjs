/**
 * Classifies the retailer-targeted presentation of existing products with Gemini.
 * The model receives product title and concise product-page text only; it must not infer
 * a person's gender from model imagery or treat gender as a style attribute.
 *
 * Usage:
 *   node scripts/classify-product-target-gender.mjs --limit 12
 *   node scripts/classify-product-target-gender.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(fileName) {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator < 0 || line.trim().startsWith("#")) continue;
    const key = line.slice(0, separator).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = line.slice(separator + 1).trim().replace(/^(?:"|')|(?:"|')$/g, "");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const SUPABASE_URL = String(process.env.SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const TABLE = String(process.env.SUPABASE_PRODUCTS_TABLE || "products").trim();
const STORAGE_BUCKET = String(process.env.SUPABASE_STORAGE_BUCKET || "product-assets").trim();
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const { assertGeminiKey, callGemini } = await import("../server/bootstrap/gemini.js");
assertGeminiKey();
const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const limitIndex = process.argv.indexOf("--limit");
const limit = limitIndex >= 0 ? Math.max(0, Number(process.argv[limitIndex + 1] || 0)) : 0;
const force = process.argv.includes("--force");
const includeImages = process.argv.includes("--include-images");
const concurrencyIndex = process.argv.indexOf("--concurrency");
const concurrency = Math.min(4, Math.max(1, Number(concurrencyIndex >= 0 ? process.argv[concurrencyIndex + 1] : 3) || 3));

const schema = {
  type: "object",
  properties: {
    target_gender: { type: "string", enum: ["menswear", "womenswear", "unisex", "unknown"] },
    confidence: { type: "number" },
  },
  required: ["target_gender", "confidence"],
};

function conciseText(product) {
  const metadata = product?.product_metadata && typeof product.product_metadata === "object" ? product.product_metadata : {};
  const candidates = Array.isArray(metadata.tagging_text_candidates) ? metadata.tagging_text_candidates : [];
  return candidates.slice(0, 4).map((value) => String(value || "").trim().slice(0, 1300)).filter(Boolean).join("\n\n");
}

function responseText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  return candidates[0]?.content?.parts?.find((part) => typeof part?.text === "string")?.text || "";
}

function productImageUrl(product) {
  const imagePath = String(product?.image_path || "").trim();
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(STORAGE_BUCKET)}/${imagePath.replace(/^\/+/, "")}`;
}

async function imagePart(product) {
  if (!includeImages) return null;
  const url = productImageUrl(product);
  if (!url) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*" } });
    const contentType = String(response.headers.get("content-type") || "").split(";")[0];
    const data = await response.arrayBuffer();
    if (!response.ok || !contentType.startsWith("image/") || !data.byteLength || data.byteLength > 6 * 1024 * 1024) return null;
    return { inlineData: { mimeType: contentType, data: Buffer.from(data).toString("base64") } };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function classify(product) {
  const prompt = `상품의 판매 타깃 표현을 분류하세요. 이는 사람의 성별이나 스타일 점수가 아니라, 판매 페이지의 상품명/상세 설명/사이즈 표기에 명시된 상품 타깃입니다.

반환값:
- menswear: 남성복/맨즈로 명시되었거나 명확히 판매되는 경우
- womenswear: 여성복/우먼즈로 명시되었거나 명확히 판매되는 경우
- unisex: 유니섹스/남녀공용으로 명시된 경우
- unknown: 의류·액세서리 자체가 어느 표현에도 합리적으로 가까운지 판단할 수 없는 경우

이미지가 제공된 경우에도 모델/인물의 성별을 판단하지 마세요. 대신 제품 자체의 실루엣, 절개/디테일, 치수 표기, 상품명, 판매 페이지 문구를 근거로 일반적인 패션 판매 맥락의 표현을 판단하세요. 유니섹스로 명시되면 unisex를 우선합니다. 단지 브랜드명만으로 결정하지 말고, 의류 자체의 단서가 있으면 가장 가까운 menswear 또는 womenswear를 선택하세요.

카테고리: ${String(product.category || "")}
브랜드: ${String(product.brand || "")}
상품명: ${String(product.name || "")}
상품 상세 텍스트:
${conciseText(product) || "없음"}`;
  const image = await imagePart(product);
  const response = await callGemini("gemini-3.1-flash-lite", {
    contents: [{ parts: [{ text: prompt }, ...(image ? [image] : [])] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: schema },
  });
  if (!response.ok) throw new Error((await response.text()).slice(0, 300) || "Gemini classification failed");
  const parsed = JSON.parse(responseText(await response.json()));
  const targetGender = ["menswear", "womenswear", "unisex", "unknown"].includes(parsed?.target_gender)
    ? parsed.target_gender
    : "unknown";
  return { targetGender, confidence: Math.max(0, Math.min(1, Number(parsed?.confidence) || 0)) };
}

const { data, error } = await client.from(TABLE).select("id,brand,name,category,image_path,product_metadata,target_gender").order("id");
if (error) throw error;
const products = (data || []).filter((product) => force || !product.target_gender || product.target_gender === "unknown");
const target = limit ? products.slice(0, limit) : products;
const counts = { menswear: 0, womenswear: 0, unisex: 0, unknown: 0, failed: 0 };

async function processProduct(product, index) {
  try {
    const { targetGender } = await classify(product);
    counts[targetGender] += 1;
    const { error: updateError } = await client.from(TABLE).update({ target_gender: targetGender }).eq("id", product.id);
    if (updateError) throw updateError;
    console.log(`[${index + 1}/${target.length}] ${product.id}: ${targetGender}`);
  } catch (error) {
    counts.failed += 1;
    console.error(`[${index + 1}/${target.length}] ${product.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 180));
}

for (let start = 0; start < target.length; start += concurrency) {
  await Promise.all(target.slice(start, start + concurrency).map((product, offset) => processProduct(product, start + offset)));
}

console.log(JSON.stringify({ scanned: target.length, includeImages, concurrency, ...counts }, null, 2));
