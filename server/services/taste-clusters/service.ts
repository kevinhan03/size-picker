import type { Product, StyleAxes } from "../../../src/types";
import type { AgentPlan } from "../../../src/types/fashion-agent";
import { supabase } from "../../lib/supabase.js";
import { getTasteSummary } from "../taste-analysis";
import {
  buildClusters,
  fingerprint,
  inputs,
  VERSION,
  type Cluster,
} from "./cluster";
import { compareTaste } from "./shadow";

type Source = "digbox" | "closet";
function db() {
  if (!supabase) throw new Error("database_unavailable");
  return supabase;
}
function check(error: unknown) {
  if (error) throw error;
}
export async function observe(
  userId: string,
  source: Source,
  products: Product[]
) {
  const hash = fingerprint(products);
  // Atomic conflict handling prevents concurrent chat requests resetting quiet time.
  const result = await db().rpc("observe_user_taste_cluster", {
    target_user: userId,
    target_source: source,
    target_fingerprint: hash,
  });
  check(result.error);
  return hash;
}
export async function recordShadow(
  userId: string,
  plan: AgentPlan,
  collection: Product[],
  candidates: Product[],
  baselineIds: string[],
  evaluationRunId?: string
) {
  if (process.env.FASHION_AGENT_CLUSTER_SHADOW !== "true" && !evaluationRunId)
    return;
  try {
    const hash = await observe(userId, plan.source, collection);
    const model = await db()
      .from("user_taste_cluster_models")
      .select("id,result")
      .eq("user_id", userId)
      .eq("source", plan.source)
      .eq("fingerprint", hash)
      .eq("algorithm_version", VERSION)
      .eq("accepted", true)
      .maybeSingle();
    check(model.error);
    if (!model.data) return;
    const points = inputs(collection);
    const mean = Object.fromEntries(
      Object.keys(points[0].axes).map((key) => [
        key,
        points.reduce((sum, p) => sum + p.axes[key as keyof StyleAxes], 0) /
          points.length,
      ])
    ) as StyleAxes;
    const comparison = compareTaste(
      (model.data.result as { clusters: Cluster[] }).clusters,
      candidates,
      plan,
      baselineIds,
      mean
    );
    const saved = await db()
      .from("user_taste_cluster_evaluations")
      .insert({
        user_id: userId,
        model_id: model.data.id,
        plan: {
          ...plan,
          ...(evaluationRunId ? { evaluationRunId } : {}),
          comparisonKind: "same-pool-taste-only",
          meanIds: comparison.meanIds,
          scores: comparison.scores,
          candidateIds: candidates.map((p) => p.id),
        },
        selected_cluster: comparison.selectedCluster,
        baseline_ids: comparison.baselineIds,
        shadow_ids: comparison.shadowIds,
        overlap: comparison.overlap,
      });
    check(saved.error);
  } catch {
    console.warn("[taste-clusters] shadow diagnostic unavailable");
  }
}

/** Used only by the private human-study route; it never enables cluster ranking in production. */
export async function ensureAcceptedCluster(userId: string, source: Source) {
  const { products } = await getTasteSummary(userId, source);
  const hash = await observe(userId, source, products);
  const existing = await db()
    .from("user_taste_cluster_models")
    .select("id,result")
    .eq("user_id", userId)
    .eq("source", source)
    .eq("fingerprint", hash)
    .eq("algorithm_version", VERSION)
    .eq("accepted", true)
    .maybeSingle();
  check(existing.error);
  if (existing.data)
    return {
      model: existing.data,
      reason: null,
      count: inputs(products).length,
    };
  const result = buildClusters(products);
  const saved = await db()
    .from("user_taste_cluster_models")
    .upsert(
      {
        user_id: userId,
        source,
        fingerprint: hash,
        algorithm_version: VERSION,
        accepted: result.accepted,
        result,
      },
      { onConflict: "user_id,source,fingerprint,algorithm_version" }
    )
    .select("id,result")
    .maybeSingle();
  check(saved.error);
  return {
    model: saved.data && result.accepted ? saved.data : null,
    reason: result.reason,
    count: result.count,
  };
}

export async function processClusterQueue() {
  const startedAt = Date.now();
  // Registered by personalized requests; least-recently checked first avoids starvation.
  const pending = await db()
    .from("user_taste_cluster_state")
    .select("*")
    .order("checked_at")
    .limit(100);
  check(pending.error);
  let built = 0,
    rejected = 0,
    deferred = 0,
    failed = 0;
  let scanned = 0;
  for (const state of pending.data || []) {
    if (Date.now() - startedAt > 20000) break;
    scanned++;
    try {
      const now = Date.now();
      const touched = await db()
        .from("user_taste_cluster_state")
        .update({ checked_at: new Date(now).toISOString() })
        .eq("user_id", state.user_id)
        .eq("source", state.source);
      check(touched.error);
      const { products } = await getTasteSummary(
        state.user_id,
        state.source as Source
      );
      const hash = await observe(
        state.user_id,
        state.source as Source,
        products
      );
      if (
        hash !== state.fingerprint ||
        now - Date.parse(state.observed_at) < 6 * 3600000 ||
        (state.processed_at &&
          (Date.parse(state.processed_at) >= Date.parse(state.observed_at) ||
            now - Date.parse(state.processed_at) < 24 * 3600000))
      ) {
        deferred++;
        continue;
      }
      const result = buildClusters(products);
      const saved = await db().from("user_taste_cluster_models").upsert(
        {
          user_id: state.user_id,
          source: state.source,
          fingerprint: hash,
          algorithm_version: VERSION,
          accepted: result.accepted,
          result,
        },
        {
          onConflict: "user_id,source,fingerprint,algorithm_version",
          ignoreDuplicates: true,
        }
      );
      check(saved.error);
      const done = await db()
        .from("user_taste_cluster_state")
        .update({ processed_at: new Date(now).toISOString() })
        .eq("user_id", state.user_id)
        .eq("source", state.source)
        .eq("fingerprint", hash);
      check(done.error);
      if (result.accepted) built++;
      else rejected++;
    } catch {
      failed++;
    }
  }
  return {
    scanned,
    built,
    rejected,
    deferred,
    failed,
  };
}
