import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { STYLE_PROTOTYPE_CENTERS } from "@/constants/styleAnalysis";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { verifyAdminRequest } from "../../../../server/utils/admin-request.js";

const AXIS_KEYS = [
  "formality", "refinement", "technicality", "historical_orientation",
  "visual_boldness", "affective_softness", "unconventionality", "sensuality",
] as const;
const WOMENS_STYLE_KEYS = new Set(["lovely", "glam_sexy"]);
const CANDIDATES_PER_STYLE = 12;

type StyleKey = (typeof STYLE_PROTOTYPE_CENTERS)[number]["key"];
type Axes = Record<(typeof AXIS_KEYS)[number], number>;

function normalizedAxes(value: unknown): Axes | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const axes = {} as Axes;
  for (const key of AXIS_KEYS) {
    const raw = (value as Record<string, unknown>)[key];
    const score = Number(raw && typeof raw === "object" ? (raw as { score?: unknown }).score : raw);
    if (!Number.isInteger(score) || score < 1 || score > 7) return null;
    axes[key] = score;
  }
  return axes;
}

function distance(left: Axes, right: Axes) {
  return Math.sqrt(AXIS_KEYS.reduce((total, key) => total + (left[key] - right[key]) ** 2, 0));
}

function eligibleKeys(row: { target_gender?: string | null; human_target_gender?: string | null }) {
  const gender = String(row.human_target_gender || row.target_gender || "").trim().toLowerCase();
  return gender === "womenswear"
    ? STYLE_PROTOTYPE_CENTERS.map((center) => center.key)
    : STYLE_PROTOTYPE_CENTERS.map((center) => center.key).filter((key) => !WOMENS_STYLE_KEYS.has(key));
}

export async function GET(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  try {
    assertSupabaseConfig();
    const [productsResult, samplesResult] = await Promise.all([
      supabase!
        .from("products")
        .select("id,brand,name,category,image_path,slug,style_axes,human_style_axes,style_axes_reviewed_at,target_gender,human_target_gender")
        .not("style_axes", "is", null),
      supabase!.from("style_center_samples").select("style_key,product_id,decision,decided_at"),
    ]);
    if (productsResult.error) throw productsResult.error;
    if (samplesResult.error) throw samplesResult.error;

    const decisions = new Map((samplesResult.data || []).map((sample) => [
      `${sample.style_key}:${sample.product_id}`,
      sample,
    ]));
    const candidates = new Map<StyleKey, Array<Record<string, unknown>>>();
    for (const center of STYLE_PROTOTYPE_CENTERS) candidates.set(center.key, []);

    for (const row of productsResult.data || []) {
      const human = normalizedAxes(row.human_style_axes);
      const ai = normalizedAxes(row.style_axes);
      const axes = human && row.style_axes_reviewed_at ? human : ai;
      if (!axes) continue;
      const ranked = STYLE_PROTOTYPE_CENTERS
        .filter((center) => eligibleKeys(row).includes(center.key))
        .map((center) => ({ key: center.key, distance: distance(axes, center.axes as Axes) }))
        .sort((left, right) => left.distance - right.distance);
      const primary = ranked[0];
      const runnerUp = ranked[1];
      if (!primary) continue;
      candidates.get(primary.key)?.push({
        id: String(row.id), brand: row.brand || "", name: row.name || "", category: row.category || "",
        imagePath: row.image_path || null, slug: row.slug || null, axes,
        distance: Number(primary.distance.toFixed(2)),
        margin: Number(((runnerUp?.distance ?? primary.distance) - primary.distance).toFixed(2)),
        source: human && row.style_axes_reviewed_at ? "human" : "ai",
        decision: decisions.get(`${primary.key}:${row.id}`)?.decision || null,
      });
    }

    const centers = STYLE_PROTOTYPE_CENTERS.map((center) => {
      const all = (candidates.get(center.key) || []).sort((left, right) =>
        Number(left.distance) - Number(right.distance) || String(left.id).localeCompare(String(right.id))
      );
      const accepted = all.filter((item) => item.decision === "accepted");
      const axes = accepted.length
        ? Object.fromEntries(AXIS_KEYS.map((key) => [
          key,
          Number((accepted.reduce((sum, item) => sum + Number((item.axes as Axes)[key]), 0) / accepted.length).toFixed(2)),
        ]))
        : null;
      return {
        key: center.key, label: center.label, candidateCount: all.length,
        acceptedCount: accepted.length, proposedAxes: axes, candidates: all.slice(0, CANDIDATES_PER_STYLE),
      };
    });
    return NextResponse.json({ ok: true, data: { centers } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "style center candidates error") }, { status: getErrorStatusCode(error) });
  }
}

export async function PUT(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;
  try {
    const body = await request.json();
    const styleKey = String(body?.styleKey || "");
    const productId = Number(body?.productId);
    const decision = body?.decision === "accepted" || body?.decision === "rejected" ? body.decision : null;
    if (!STYLE_PROTOTYPE_CENTERS.some((center) => center.key === styleKey) || !Number.isSafeInteger(productId) || !decision) {
      return NextResponse.json({ ok: false, error: "valid styleKey, productId, and decision are required" }, { status: 400 });
    }
    assertSupabaseConfig();
    const { error } = await supabase!.from("style_center_samples").upsert({
      style_key: styleKey, product_id: productId, decision, decided_at: new Date().toISOString(), decided_by: "admin",
    }, { onConflict: "style_key,product_id" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error, "style center sample update error") }, { status: getErrorStatusCode(error) });
  }
}
