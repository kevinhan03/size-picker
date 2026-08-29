import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { normalizeBrandName, refreshBrandRulesCache } from "../../../server/utils/brand-rules.js";
import {
  fetchProductsRows,
  generateProductSlug,
  insertProductRow,
  normalizeProductRow,
  toProductWriteErrorResponse,
} from "../../../server/utils/product.js";
import { parseSizeTable } from "../../../server/utils/size-table.js";
import { getRegisteredRequestUser, hasValidMutationOrigin } from "../../../server/auth/request-user";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";
import { embedProductImageById } from "../../../server/services/image-embedding.js";
import { tagProductStyleById } from "../../../server/services/style-tagging.js";
import { scoreProductForActiveStyleClusters } from "../../../server/services/style-cluster-scoring.js";
import { DIG_MATCH_PRODUCTS_CACHE_TAG } from "../../../server/services/dig-match-products.js";
import { invalidatePublicProductCaches } from "../../../server/services/catalog-cache";
import { getRequestLocale } from "../../../server/utils/locale";
import { isProductCategory } from "@/constants";
import { analyzeStoredProductCategory } from "../../../server/services/stored-product-category-analysis";

interface RegisteredUser {
  id: string;
  email?: string;
  appUsername: string;
}

const METADATA_LIST_FIELDS = [
  "materials",
  "fit_silhouette",
  "design_details",
  "functional_features",
  "color",
  "pattern_texture",
  "target_gender_evidence",
  "care",
] as const;

const sanitizeCategoryDetails = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const detailType = sanitizeMetadataText(raw.detail_type, 40);
  const rawAttributes = raw.attributes;
  if (!detailType || !rawAttributes || typeof rawAttributes !== "object" || Array.isArray(rawAttributes)) return {};
  const attributes = Object.fromEntries(
    Object.entries(rawAttributes as Record<string, unknown>)
      .map(([key, values]) => [
        sanitizeMetadataText(key, 60),
        Array.isArray(values)
          ? values.map((item) => sanitizeMetadataText(item, 300)).filter(Boolean).slice(0, 8)
          : [],
      ])
      .filter(([key, values]) => key && values.length > 0)
  );
  return Object.keys(attributes).length ? { detail_type: detailType, attributes } : {};
};

const sanitizeMetadataText = (value: unknown, maxLength = 500) => String(value || "").trim().slice(0, maxLength);

const normalizeProductMetadata = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  return {
    metadata_source: "product_page",
    product_summary: sanitizeMetadataText(raw.product_summary),
    category_details: sanitizeCategoryDetails(raw.category_details),
    ...Object.fromEntries(
      METADATA_LIST_FIELDS.map((field) => [
        field,
        Array.isArray(raw[field])
          ? raw[field].map((item) => sanitizeMetadataText(item, 300)).filter(Boolean).slice(0, 8)
          : [],
      ])
    ),
  };
};

export async function GET(request: Request) {
  try {
    await refreshBrandRulesCache();
    const requestedUrl = String(new URL(request.url).searchParams.get("url") || "").trim();
    if (requestedUrl && requestedUrl !== "#") {
      assertSupabaseConfig();
      const { data, error } = await supabase!
        .from("products")
        .select("id")
        .eq("url", requestedUrl)
        .limit(1);
      if (error) throw error;
      return NextResponse.json({ ok: true, data: { exists: Boolean(data?.length) } });
    }
    const rows = await fetchProductsRows();
    const products = rows
      .map((row: unknown) => normalizeProductRow(row))
      .filter((product: unknown) => product !== null);

    return NextResponse.json({
      ok: true,
      data: { products },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "products fetch error"),
      },
      { status: getErrorStatusCode(error) }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    const user = await getRegisteredRequestUser(request) as RegisteredUser | null;
    if (!user) {
      return NextResponse.json({ ok: false, error: "registered account required" }, { status: 401 });
    }

    assertSupabaseConfig();
    const registeredBy = String(user.appUsername || "").trim() || null;

    const body = await request.json();
    const url = String(body?.url || "#").trim();
    await refreshBrandRulesCache();
    const brand = normalizeBrandName(String(body?.brand || "").trim());
    const name = String(body?.name || "").trim();
    const category = String(body?.category || "").trim();
    const imagePath = String(body?.image_path ?? body?.imagePath ?? "").trim();
    const image = String(body?.image || "").trim();
    const sizeTable = parseSizeTable(body?.sizeTable ?? null);
    const normalizedSizeTable = null;
    const productMetadata = normalizeProductMetadata(body?.productMetadata);
    const isInstagram = false;
    const createdAt = new Date().toISOString();

    if (!brand || !name || !isProductCategory(category)) {
      return NextResponse.json(
        {
          ok: false,
          error: "brand, name, and category are required",
        },
        { status: 400 }
      );
    }

    if (url && url !== "#") {
      const { data: existingProduct, error: duplicateCheckError } = await supabase!
        .from("products")
        .select("id")
        .eq("url", url)
        .limit(1);
      if (duplicateCheckError) throw duplicateCheckError;
      if (existingProduct?.length) {
        return NextResponse.json({ ok: false, error: "이미 등록된 상품입니다" }, { status: 409 });
      }
    }

    const slug = await generateProductSlug(brand, name);
    const insertedRow = await insertProductRow({
      brand,
      name,
      category,
      subCategory: null,
      url,
      image,
      imagePath,
      sizeTable,
      normalizedSizeTable,
      isInstagram,
      createdAt,
      slug,
      registeredBy,
      productMetadata,
      categoryAnalysisStatus: "pending",
    });
    const product = normalizeProductRow(insertedRow);

    after(async () => {
      const productId = String(insertedRow?.id || "").trim();
      if (!productId) return;
      await Promise.all([
        (async () => {
          const categoryResult = await analyzeStoredProductCategory(productId);
          if (!categoryResult.ok) {
            console.error("[product-category-analysis] async subcategory analysis did not complete", { productId });
            revalidateTag(DIG_MATCH_PRODUCTS_CACHE_TAG, "max");
            invalidatePublicProductCaches(productId);
            return;
          }
          try {
            const styleResult = await tagProductStyleById(productId);
            if (styleResult.ok && !styleResult.skipped) revalidateTag(DIG_MATCH_PRODUCTS_CACHE_TAG, "max");
            if (!styleResult.ok) {
              console.error("[style-tagging] async product tagging did not complete", { productId, result: styleResult });
            }
            await scoreProductForActiveStyleClusters(productId);
          } catch (error) {
            console.error("[style-tagging] async product tagging failed", {
              productId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
          invalidatePublicProductCaches(productId);
        })(),
        (async () => {
          const result = await embedProductImageById(productId);
          if (!result.ok && !result.skipped) {
            console.error("[image-embedding] async product embedding did not complete", { productId, result });
          }
          await scoreProductForActiveStyleClusters(productId);
        })(),
      ]);
    });

    revalidateTag(DIG_MATCH_PRODUCTS_CACHE_TAG, "max");
    invalidatePublicProductCaches(String(insertedRow?.id || ""));
    return NextResponse.json(
      {
        ok: true,
        data: { product },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const { statusCode, message } = toProductWriteErrorResponse(error, "product insert error", await getRequestLocale());
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: statusCode }
    );
  }
}
