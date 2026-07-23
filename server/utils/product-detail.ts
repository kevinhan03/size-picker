import type { Metadata } from "next";
import { SUPABASE_PRODUCTS_TABLE } from "../config/env.js";
import { supabase } from "../lib/supabase.js";
import { normalizeProductRow } from "../utils/product.js";

export function parseNumericId(param: string): string {
  const match = param.match(/^(\d+)/);
  return match ? match[1] : param;
}

export async function fetchProduct(idParam: string) {
  if (!supabase) return null;
  const id = parseNumericId(idParam);
  const { data, error } = await supabase
    .from(SUPABASE_PRODUCTS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeProductRow(data);
}

export function resolveImageUrl(imagePath: string): string {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET || "product-assets").trim();
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${imagePath}`;
}

export function isPrimaryColumnHeader(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "사이즈" || normalized === "호수" || /^size$/i.test(normalized);
}

function objectParticle(value: string): "을" | "를" {
  const lastCharacter = value.trim().at(-1);
  if (!lastCharacter) return "을";

  const codePoint = lastCharacter.charCodeAt(0);
  if (codePoint < 0xac00 || codePoint > 0xd7a3) return "를";
  return (codePoint - 0xac00) % 28 === 0 ? "를" : "을";
}

export function buildProductMetadata(product: Awaited<ReturnType<typeof fetchProduct>>): Metadata {
  if (!product) {
    return {
      title: "상품을 찾을 수 없습니다 | DIGBOX",
    };
  }

  const imageUrl = resolveImageUrl(product.imagePath || product.image || "");
  const description = `${product.brand} ${product.name}${objectParticle(product.name)} DIGBOX에 저장하고, 나만의 취향을 쌓아가세요.`;
  const canonicalPath = `/product/${product.slug ? `${product.id}-${product.slug}` : product.id}`;

  return {
    title: `${product.brand} ${product.name} 사이즈표 | DIGBOX`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${product.brand} ${product.name}`,
      description,
      url: canonicalPath,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.brand} ${product.name} 사이즈표`,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}
