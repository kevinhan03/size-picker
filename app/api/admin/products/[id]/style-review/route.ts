import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { SUPABASE_PRODUCTS_TABLE } from "../../../../../../server/config/env.js";
import { assertSupabaseConfig, supabase } from "../../../../../../server/lib/supabase.js";
import { verifyAdminRequest } from "../../../../../../server/utils/admin-request.js";

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
] as const;

const STYLE_TAG_SET = new Set<string>(STYLE_TAGS);
const REVIEW_STATUSES = new Set(["needs_review", "approved", "edited", "rejected"]);
const LEGACY_STYLE_TAG_MAP: Record<string, typeof STYLE_TAGS[number]> = {
  "캐주얼": "casual",
  "미니멀": "minimal",
  "스트릿": "street",
  "클래식": "classic",
  "빈티지": "vintage",
  "레트로": "vintage",
  "로맨틱": "lovely_romantic",
  "스포티": "sporty",
  "워크웨어": "workwear_gorpcore",
};

type StyleTags = Record<string, number>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeStyleTags = (value: unknown): StyleTags | null => {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) {
    throw new Error("humanStyleTags must be an object");
  }

  const normalizedInput = STYLE_TAGS.reduce<StyleTags>((acc, tag) => {
    acc[tag] = 0;
    return acc;
  }, {});

  for (const [key, rawScore] of Object.entries(value)) {
    const normalizedKey = STYLE_TAG_SET.has(key) ? key : LEGACY_STYLE_TAG_MAP[key];
    if (!normalizedKey) continue;
    if (typeof rawScore === "boolean") {
      throw new Error(`humanStyleTags.${key} must be numeric`);
    }
    const numericScore = Number(rawScore);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 1) {
      throw new Error(`humanStyleTags.${key} must be between 0.0 and 1.0`);
    }
    normalizedInput[normalizedKey] = Math.max(normalizedInput[normalizedKey], numericScore);
  }

  const keys = Object.keys(normalizedInput);
  const missing = STYLE_TAGS.filter((tag) => !keys.includes(tag));
  const extra = Object.keys(value).filter((key) => !STYLE_TAG_SET.has(key) && !LEGACY_STYLE_TAG_MAP[key]);
  if (missing.length > 0) {
    throw new Error(`humanStyleTags is missing tag(s): ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    throw new Error(`humanStyleTags contains unexpected tag(s): ${extra.join(", ")}`);
  }

  return STYLE_TAGS.reduce<StyleTags>((acc, tag) => {
    const score = normalizedInput[tag];
    if (typeof score === "boolean") {
      throw new Error(`humanStyleTags.${tag} must be numeric`);
    }
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 1) {
      throw new Error(`humanStyleTags.${tag} must be between 0.0 and 1.0`);
    }
    acc[tag] = numericScore;
    return acc;
  }, {});
};

const normalizeJsonObject = (value: unknown, fieldName: string): Record<string, unknown> | null => {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be an object`);
  }
  return value;
};

const normalizeReviewStatus = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const status = String(value || "").trim();
  if (!REVIEW_STATUSES.has(status)) {
    throw new Error(`tagReviewStatus must be one of: ${[...REVIEW_STATUSES].join(", ")}`);
  }
  return status;
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
    return NextResponse.json({ ok: false, error: "product id is required" }, { status: 400 });
  }

  try {
    assertSupabaseConfig();
    const { data, error } = await supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .select(
        "id,brand,name,style_tags,style_attributes,style_tags_evidence,style_tags_confidence,tagging_status,tagging_error,human_style_tags,human_style_attributes,human_style_tags_evidence,tag_review_status,tag_review_note,reviewed_by,reviewed_at"
      )
      .eq("id", productId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });

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
    return NextResponse.json({ ok: false, error: "product id is required" }, { status: 400 });
  }

  try {
    assertSupabaseConfig();
    const rawBody = await request.json();
    const body = isRecord(rawBody) ? rawBody : {};
    const status = normalizeReviewStatus(body?.tagReviewStatus);
    const humanStyleTags = normalizeStyleTags(body?.humanStyleTags);
    const humanStyleAttributes = normalizeJsonObject(body?.humanStyleAttributes, "humanStyleAttributes");
    const humanStyleTagsEvidence = normalizeJsonObject(body?.humanStyleTagsEvidence, "humanStyleTagsEvidence");
    const note =
      "tagReviewNote" in body
        ? String(body?.tagReviewNote || "").trim().slice(0, 2000)
        : undefined;

    const payload: Record<string, unknown> = {};

    if (status) payload.tag_review_status = status;
    if (humanStyleTags) payload.human_style_tags = humanStyleTags;
    if (humanStyleAttributes) payload.human_style_attributes = humanStyleAttributes;
    if (humanStyleTagsEvidence) payload.human_style_tags_evidence = humanStyleTagsEvidence;
    if (note !== undefined) payload.tag_review_note = note || null;

    if (status === "approved" && !humanStyleTags) {
      const { data: existingProduct, error: existingProductError } = await supabase!
        .from(SUPABASE_PRODUCTS_TABLE)
        .select(
          "style_tags,style_attributes,style_tags_evidence,human_style_tags,human_style_attributes,human_style_tags_evidence"
        )
        .eq("id", productId)
        .maybeSingle();

      if (existingProductError) throw existingProductError;
      if (!existingProduct) {
        return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });
      }
      payload.human_style_tags = existingProduct.human_style_tags
        ? normalizeStyleTags(existingProduct.human_style_tags)
        : normalizeStyleTags(existingProduct.style_tags);
      payload.human_style_attributes = existingProduct.human_style_attributes
        ? normalizeJsonObject(existingProduct.human_style_attributes, "human_style_attributes")
        : normalizeJsonObject(existingProduct.style_attributes, "style_attributes");
      payload.human_style_tags_evidence = existingProduct.human_style_tags_evidence
        ? normalizeJsonObject(existingProduct.human_style_tags_evidence, "human_style_tags_evidence")
        : normalizeJsonObject(existingProduct.style_tags_evidence, "style_tags_evidence");
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { ok: false, error: "at least one review field is required" },
        { status: 400 }
      );
    }

    if (status && status !== "needs_review") {
      payload.reviewed_at = new Date().toISOString();
      payload.reviewed_by = "admin";
    }

    const { data, error } = await supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .update(payload)
      .eq("id", productId)
      .select(
        "id,brand,name,style_tags,style_attributes,style_tags_evidence,human_style_tags,human_style_attributes,human_style_tags_evidence,tag_review_status,tag_review_note,reviewed_by,reviewed_at"
      )
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ ok: false, error: "product not found" }, { status: 404 });

    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, data: { product: data } });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "style review update error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
