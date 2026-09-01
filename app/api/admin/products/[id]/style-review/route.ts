import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../../../server/config/env.js";
import {
  assertSupabaseConfig,
  supabase,
} from "../../../../../../server/lib/supabase.js";
import { verifyAdminRequest } from "../../../../../../server/utils/admin-request.js";
import { DIG_MATCH_PRODUCTS_CACHE_TAG } from "../../../../../../server/services/dig-match-products.js";
import { invalidatePublicProductCaches } from "../../../../../../server/services/catalog-cache";
import {
  fieldsForCategory,
  isCoreTasteCategory,
  STYLE_AXIS_FIELDS,
} from "@/constants/styleAnalysis";
import { isProductCategory, isValidSubcategory } from "@/constants";

const TARGET_GENDERS = new Set(["menswear", "womenswear", "unisex", "unknown"]);
const STYLE_AXIS_KEYS = STYLE_AXIS_FIELDS.map((field) => field.key);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeJsonObject = (
  value: unknown,
  fieldName: string
): Record<string, unknown> | null => {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be an object`);
  }
  return value;
};

const normalizeStyleAttributes = (
  value: unknown,
  fieldName: string,
  category: string
): Record<string, unknown> | null => {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be an object`);
  }

  if (!isCoreTasteCategory(category)) return {};
  const fields = fieldsForCategory(category);
  const allowedKeys = new Set(fields.map((field) => field.key));
  for (const key of Object.keys(value))
    if (!allowedKeys.has(key))
      throw new Error(`${fieldName}.${key} is not valid for this category`);
  const normalized: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = value[field.key];
    if (field.multiple) {
      if (raw === null || raw === undefined) {
        normalized[field.key] = [];
        continue;
      }
      if (!Array.isArray(raw) || raw.length > field.max)
        throw new Error(
          `${fieldName}.${field.key} must contain at most ${field.max} values`
        );
      const values = [
        ...new Set(
          raw
            .map((item) =>
              String(item ?? "")
                .trim()
                .toLowerCase()
            )
            .filter(Boolean)
        ),
      ];
      if (
        values.some(
          (item) =>
            !field.options.some(
              (option: { value: string }) => option.value === item
            )
        )
      )
        throw new Error(`${fieldName}.${field.key} contains an invalid value`);
      normalized[field.key] = values;
    } else {
      if (raw === null || raw === undefined || raw === "") {
        normalized[field.key] = null;
        continue;
      }
      const item = String(raw).trim().toLowerCase();
      if (
        !field.options.some(
          (option: { value: string }) => option.value === item
        )
      )
        throw new Error(`${fieldName}.${field.key} contains an invalid value`);
      normalized[field.key] = item;
    }
  }

  return normalized;
};

const normalizeStyleAxes = (
  value: unknown,
  fieldName: string
): Record<string, number> | null => {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) throw new Error(`${fieldName} must be an object`);
  const keys = Object.keys(value);
  if (
    keys.some((key) => !STYLE_AXIS_KEYS.includes(key)) ||
    STYLE_AXIS_KEYS.some((key) => !(key in value))
  ) {
    throw new Error(
      `${fieldName} must contain exactly the configured style axes`
    );
  }
  return Object.fromEntries(
    STYLE_AXIS_KEYS.map((key) => {
      const numeric = Number(value[key]);
      if (!Number.isInteger(numeric) || numeric < 1 || numeric > 7)
        throw new Error(
          `${fieldName}.${key} must be an integer between 1 and 7`
        );
      return [key, numeric];
    })
  );
};

const mergeStoredStyleAxes = (
  human: unknown,
  ai: unknown
): Record<string, number> | null => {
  const humanRecord = isRecord(human) ? human : {};
  const aiRecord = isRecord(ai) ? ai : {};
  if (!Object.keys(humanRecord).length && !Object.keys(aiRecord).length)
    return null;
  return Object.fromEntries(
    STYLE_AXIS_KEYS.map((key) => {
      const candidate = Number(humanRecord[key] ?? aiRecord[key]);
      return [
        key,
        Number.isInteger(candidate) && candidate >= 1 && candidate <= 7
          ? candidate
          : 4,
      ];
    })
  );
};

const normalizeTargetGender = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  const targetGender = String(value || "").trim();
  if (!TARGET_GENDERS.has(targetGender)) {
    throw new Error(
      `targetGender must be one of: ${[...TARGET_GENDERS].join(", ")}`
    );
  }
  return targetGender;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  const { id } = await context.params;
  const productId = String(id || "").trim();
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "product id is required" },
      { status: 400 }
    );
  }

  try {
    assertSupabaseConfig();
    const { data, error } = await supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .select(
        "id,brand,name,category,sub_category,style_attributes,style_axes,style_axis_analysis_status,style_axis_analysis_error,style_axis_analyzed_at,style_axis_review_required,facts_reviewed_at,facts_reviewed_by,style_axes_reviewed_at,style_axes_reviewed_by,target_gender,human_target_gender,target_gender_reviewed_by,target_gender_reviewed_at,human_style_attributes,human_style_axes"
      )
      .eq("id", productId)
      .maybeSingle();

    if (error) throw error;
    if (!data)
      return NextResponse.json(
        { ok: false, error: "product not found" },
        { status: 404 }
      );

    return NextResponse.json({ ok: true, data: { product: data } });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "style review fetch error") },
      { status: getErrorStatusCode(error) }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  const { id } = await context.params;
  const productId = String(id || "").trim();
  if (!productId) {
    return NextResponse.json(
      { ok: false, error: "product id is required" },
      { status: 400 }
    );
  }

  try {
    assertSupabaseConfig();
    const rawBody = await request.json();
    const body = isRecord(rawBody) ? rawBody : {};
    const approveFacts = body?.approveFacts === true;
    const approveStyleAxes = body?.approveStyleAxes === true;
    const targetGender = normalizeTargetGender(body?.targetGender);
    const categoryProvided = "category" in body;
    const category = categoryProvided
      ? String(body.category || "").trim()
      : null;
    if (categoryProvided && category && !isProductCategory(category))
      throw new Error("invalid category");
    let existingCategory = categoryProvided ? category || "" : "";
    if (!categoryProvided) {
      const { data: existingProduct, error: existingProductError } =
        await supabase!
          .from(SUPABASE_PRODUCTS_TABLE)
          .select("category")
          .eq("id", productId)
          .maybeSingle();
      if (existingProductError) throw existingProductError;
      if (!existingProduct)
        return NextResponse.json(
          { ok: false, error: "product not found" },
          { status: 404 }
        );
      existingCategory = String(existingProduct.category || "").trim();
    }
    const subCategoryProvided = "subCategory" in body;
    const subCategory = subCategoryProvided
      ? String(body.subCategory || "").trim()
      : null;
    if (
      subCategory &&
      (!existingCategory || !isValidSubcategory(existingCategory, subCategory))
    )
      throw new Error("invalid subCategory for category");
    const humanStyleAttributes = normalizeStyleAttributes(
      body?.humanStyleAttributes,
      "humanStyleAttributes",
      existingCategory
    );
    const humanStyleAxes = normalizeStyleAxes(
      body?.humanStyleAxes,
      "humanStyleAxes"
    );
    const payload: Record<string, unknown> = {};

    if (humanStyleAttributes)
      payload.human_style_attributes = humanStyleAttributes;
    if (humanStyleAxes) {
      payload.human_style_axes = humanStyleAxes;
    }
    if (approveFacts) {
      payload.facts_reviewed_at = new Date().toISOString();
      payload.facts_reviewed_by = "admin";
    }
    if (approveStyleAxes) {
      payload.style_axes_reviewed_at = new Date().toISOString();
      payload.style_axes_reviewed_by = "admin";
      payload.style_axis_review_required = false;
    }
    if (targetGender !== undefined) {
      payload.human_target_gender = targetGender;
      payload.target_gender_reviewed_by = "admin";
      payload.target_gender_reviewed_at = new Date().toISOString();
    }
    if (categoryProvided) {
      payload.category = category || "Uncategorized";
      payload.sub_category = subCategory || null;
      payload.category_analysis_status = "completed";
      payload.category_reviewed = true;
    } else if (subCategoryProvided) {
      payload.sub_category = subCategory || null;
      payload.category_reviewed = true;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { ok: false, error: "at least one review field is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .update(payload)
      .eq("id", productId)
      .select(
        "id,brand,name,category,sub_category,category_reviewed,category_analysis_status,style_attributes,style_axes,style_axis_analysis_status,style_axis_analysis_error,style_axis_analyzed_at,style_axis_review_required,facts_reviewed_at,facts_reviewed_by,style_axes_reviewed_at,style_axes_reviewed_by,target_gender,human_target_gender,target_gender_reviewed_by,target_gender_reviewed_at,human_style_attributes,human_style_axes"
      )
      .maybeSingle();

    if (error) throw error;
    if (!data)
      return NextResponse.json(
        { ok: false, error: "product not found" },
        { status: 404 }
      );

    revalidateTag(DIG_MATCH_PRODUCTS_CACHE_TAG, "max");
    invalidatePublicProductCaches(productId);
    return NextResponse.json({ ok: true, data: { product: data } });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "style review update error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
