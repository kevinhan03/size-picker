import { NextResponse } from "next/server";
import { verifyAdminRequest } from "../../../../server/utils/admin-request.js";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { scoreProductForActiveStyleClusters } from "../../../../server/services/style-cluster-scoring.js";
import { normalizeProductRow } from "../../../../server/utils/product.js";

const TAGS = ["casual", "minimal", "street", "classic", "vintage", "lovely_romantic", "sporty", "workwear_gorpcore", "chic_modern", "glam_sexy"];
type Row = Record<string, any>;

async function fetchAllClusterScores(versionIds: string[]) {
  const rows: Row[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase!.from("product_style_cluster_scores")
      .select("product_id,model_version_id,cluster_probabilities")
      .in("model_version_id", versionIds).eq("status", "scored").range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data || []) as Row[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export async function GET(request: Request) {
  const denied = verifyAdminRequest(request); if (denied) return denied;
  try {
    assertSupabaseConfig();
    const { data: versions, error } = await supabase!.from("style_cluster_model_versions").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const versionIds = ((versions || []) as Row[]).map((version: Row) => version.id);
    const { data: clusters, error: clusterError } = versionIds.length
      ? await supabase!.from("style_clusters").select("*").in("model_version_id", versionIds).order("ordinal")
      : { data: [], error: null };
    if (clusterError) throw clusterError;
    const scoreRows = versionIds.length ? await fetchAllClusterScores(versionIds) : [];
    const productIds = [...new Set((scoreRows as Row[]).map((row: Row) => row.product_id))];
    const { data: products, error: productError } = productIds.length
      ? await supabase!.from("products").select("id,name,brand,category,image_path").in("id", productIds)
      : { data: [], error: null };
    if (productError) throw productError;
    const productById = new Map(((products || []) as Row[]).map((product: Row) => {
      const normalized = normalizeProductRow(product);
      return [String(product.id), { ...product, image: normalized?.thumbnailImage || normalized?.image || "" }];
    }));
    const clusterByVersion = new Map<string, unknown[]>();
    for (const cluster of (clusters || []) as Row[]) clusterByVersion.set(cluster.model_version_id, [...(clusterByVersion.get(cluster.model_version_id) || []), cluster]);
    const shapedVersions = ((versions || []) as Row[]).map((version: Row) => ({ ...version, clusters: ((clusterByVersion.get(version.id) || []) as Row[]).map((cluster: Row) => {
      const representatives = scoreRows
        .filter((row: Row) => row.model_version_id === version.id)
        .map((row: Row) => ({ row, probability: Number(row.cluster_probabilities?.[String(cluster.ordinal)] || 0) }))
        .sort((left: { probability: number }, right: { probability: number }) => right.probability - left.probability).slice(0, 8)
        .map(({ row }: { row: Row }) => productById.get(String(row.product_id))).filter(Boolean);
      return { ...cluster, representatives, category_summary: Object.entries(representatives.reduce((counts: Record<string, number>, product: any) => ({ ...counts, [product.category || "unknown"]: (counts[product.category || "unknown"] || 0) + 1 }), {})) };
    }) }));
    return NextResponse.json({ ok: true, data: { versions: shapedVersions } });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "style cluster read error" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  const denied = verifyAdminRequest(request); if (denied) return denied;
  try {
    const body = await request.json();
    const clusterId = String(body?.clusterId || "").trim();
    const styleTag = String(body?.styleTag || "").trim();
    if (!clusterId || !TAGS.includes(styleTag)) return NextResponse.json({ ok: false, error: "valid clusterId and styleTag are required" }, { status: 400 });
    const { error } = await supabase!.from("style_clusters").update({ style_tag: styleTag }).eq("id", clusterId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "style cluster update error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const denied = verifyAdminRequest(request); if (denied) return denied;
  try {
    const body = await request.json(); const versionId = String(body?.versionId || "").trim();
    if (!versionId) return NextResponse.json({ ok: false, error: "versionId is required" }, { status: 400 });
    const { data: version, error: versionError } = await supabase!.from("style_cluster_model_versions").select("is_operational").eq("id", versionId).maybeSingle();
    if (versionError) throw versionError;
    if (!version?.is_operational) return NextResponse.json({ ok: false, error: "comparison-only models cannot be activated; select the spherical K-Means candidate" }, { status: 400 });
    const { data: clusters, error: clusterError } = await supabase!.from("style_clusters").select("id,style_tag").eq("model_version_id", versionId);
    if (clusterError) throw clusterError;
    if (!clusters?.length || (clusters as Row[]).some((cluster: Row) => !cluster.style_tag)) return NextResponse.json({ ok: false, error: "every cluster needs a style label before activation" }, { status: 400 });
    await supabase!.from("style_cluster_model_versions").update({ status: "archived" }).eq("status", "active");
    const { error: activateError } = await supabase!.from("style_cluster_model_versions").update({ status: "active", activated_at: new Date().toISOString() }).eq("id", versionId);
    if (activateError) throw activateError;
    const { data: products, error: productError } = await supabase!.from("products").select("id").in("category", ["Top", "Bottom", "Outer", "DressSkirt", "Shoes"]);
    if (productError) throw productError;
    const results = await Promise.allSettled(((products || []) as Row[]).map((product: Row) => scoreProductForActiveStyleClusters(product.id)));
    return NextResponse.json({ ok: true, data: { rescored: results.filter((result: PromiseSettledResult<unknown>) => result.status === "fulfilled").length } });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "style cluster activation error" }, { status: 500 }); }
}
