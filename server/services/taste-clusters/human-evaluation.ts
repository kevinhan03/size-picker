import type { AgentProduct } from "../../../src/types/fashion-agent";
import { SUPABASE_PRODUCTS_TABLE } from "../../config/env.js";
import { supabase } from "../../lib/supabase.js";
import { RECOMMENDATION_COLUMNS, normalizeProductCard } from "../catalog";
import { runEngine } from "../fashion-agent/engine";
import { ensureAcceptedCluster } from "./service";
import { evaluationQuestions, type EvaluationQuestion } from "./questions";

function database() {
  if (!supabase) throw new Error("database_unavailable");
  return supabase;
}
function fail(error: unknown) {
  if (error) throw error;
}
const cards = async (ids: string[]): Promise<AgentProduct[]> => {
  if (!ids.length) return [];
  const { data, error } = await database()
    .from(SUPABASE_PRODUCTS_TABLE)
    .select(RECOMMENDATION_COLUMNS)
    .in("id", ids);
  fail(error);
  const byId = new Map(
    (data || []).map((row) => [
      String((row as unknown as { id: unknown }).id),
      normalizeProductCard(row),
    ])
  );
  return ids.flatMap((id) => {
    const card = byId.get(id);
    return card
      ? [
          {
            ...card,
            tasteScore: null,
            reasons: ["클러스터 중심과의 스타일 유사도를 기준으로 선택했어요."],
          },
        ]
      : [];
  });
};
const clusterIntro = (description: string | undefined) =>
  description
    ? `이 결과는 선택된 취향 갈래(${description})와 가까운 상품을 우선했어요.`
    : "이 결과는 현재 선택된 취향 갈래와 가까운 상품을 우선했어요.";
export type HumanEvaluationRun = {
  id: string;
  questionId: string;
  question: string;
  optionA: { label: "A"; products: AgentProduct[]; explanation: string };
  optionB: { label: "B"; products: AgentProduct[]; explanation: string };
  completedAt: string | null;
};
function toPublic(row: Record<string, unknown>): HumanEvaluationRun {
  const aCluster = Boolean(row.option_a_is_cluster);
  const production = row.production_products as AgentProduct[];
  const cluster = row.cluster_products as AgentProduct[];
  const plan = row.plan as { clusterExplanation?: string };
  return {
    id: String(row.id),
    questionId: String(row.question_id),
    question: String(row.question),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    optionA: {
      label: "A",
      products: aCluster ? cluster : production,
      explanation: aCluster
        ? String(plan.clusterExplanation || "")
        : "DIGBOX의 현재 평균 취향 유사도와 검색 조건을 함께 반영했어요.",
    },
    optionB: {
      label: "B",
      products: aCluster ? production : cluster,
      explanation: aCluster
        ? "DIGBOX의 현재 평균 취향 유사도와 검색 조건을 함께 반영했어요."
        : String(plan.clusterExplanation || ""),
    },
  };
}
export async function createHumanEvaluation(
  userId: string,
  question: EvaluationQuestion
) {
  const cluster = await ensureAcceptedCluster(userId, "digbox");
  if (!cluster.model)
    return {
      status: "not_eligible" as const,
      reason: cluster.reason,
      count: cluster.count,
    };
  const model = cluster.model;
  const existing = await database()
    .from("user_taste_cluster_evaluation_runs")
    .select("*")
    .eq("user_id", userId)
    .eq("model_id", model.id)
    .eq("question_id", question.id)
    .maybeSingle();
  fail(existing.error);
  if (existing.data?.production_products?.length)
    return { status: "ready" as const, run: toPublic(existing.data) };
  const inserted = await database()
    .from("user_taste_cluster_evaluation_runs")
    .upsert(
      {
        user_id: userId,
        model_id: model.id,
        source: "digbox",
        question_id: question.id,
        question: question.question,
        plan: question.plan,
        production_products: [],
        cluster_products: [],
        option_a_is_cluster: Math.random() < 0.5,
      },
      { onConflict: "user_id,question_id,model_id" }
    )
    .select("*")
    .single();
  fail(inserted.error);
  const reply = await runEngine(
    userId,
    question.plan,
    [],
    "ko",
    inserted.data.id
  );
  const diagnostic = await database()
    .from("user_taste_cluster_evaluations")
    .select("selected_cluster,shadow_ids")
    .eq("user_id", userId)
    .contains("plan", { evaluationRunId: inserted.data.id })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  fail(diagnostic.error);
  if (!diagnostic.data) throw new Error("cluster_comparison_unavailable");
  const modelResult = model.result as {
    clusters: Array<{ description: string }>;
  };
  const clusterProducts = await cards(diagnostic.data.shadow_ids as string[]);
  const updated = await database()
    .from("user_taste_cluster_evaluation_runs")
    .update({
      production_products: reply.products.slice(0, 5),
      cluster_products: clusterProducts,
      plan: {
        ...question.plan,
        clusterExplanation: clusterIntro(
          modelResult.clusters[diagnostic.data.selected_cluster ?? 0]
            ?.description
        ),
      },
    })
    .eq("id", inserted.data.id)
    .select("*")
    .single();
  fail(updated.error);
  return { status: "ready" as const, run: toPublic(updated.data) };
}
export async function getEvaluationProgress(userId: string) {
  const { data, error } = await database()
    .from("user_taste_cluster_evaluation_runs")
    .select("id,question_id,completed_at,option_a_is_cluster")
    .eq("user_id", userId);
  fail(error);
  const completed = new Set(
    (data || []).filter((row) => row.completed_at).map((row) => row.question_id)
  );
  const completedRuns = (data || []).filter((row) => row.completed_at);
  const ratingRows = completedRuns.length
    ? await database()
        .from("user_taste_cluster_evaluation_ratings")
        .select(
          "run_id,preferred_option,taste_score_a,taste_score_b,explanation_score_a,explanation_score_b,condition_score_a,condition_score_b"
        )
        .eq("user_id", userId)
        .in(
          "run_id",
          completedRuns.map((row) => row.id)
        )
    : { data: [], error: null };
  fail(ratingRows.error);
  const runs = new Map(completedRuns.map((row) => [row.id, row]));
  const totals = {
    cluster: { taste: 0, explanation: 0, condition: 0, preferred: 0 },
    production: { taste: 0, explanation: 0, condition: 0, preferred: 0 },
    count: 0,
  };
  for (const rating of ratingRows.data || []) {
    const run = runs.get(rating.run_id);
    if (!run) continue;
    const clusterA = run.option_a_is_cluster;
    const cluster = clusterA
      ? {
          taste: rating.taste_score_a,
          explanation: rating.explanation_score_a,
          condition: rating.condition_score_a,
        }
      : {
          taste: rating.taste_score_b,
          explanation: rating.explanation_score_b,
          condition: rating.condition_score_b,
        };
    const production = clusterA
      ? {
          taste: rating.taste_score_b,
          explanation: rating.explanation_score_b,
          condition: rating.condition_score_b,
        }
      : {
          taste: rating.taste_score_a,
          explanation: rating.explanation_score_a,
          condition: rating.condition_score_a,
        };
    totals.cluster.taste += cluster.taste;
    totals.cluster.explanation += cluster.explanation;
    totals.cluster.condition += cluster.condition;
    totals.production.taste += production.taste;
    totals.production.explanation += production.explanation;
    totals.production.condition += production.condition;
    if (
      (rating.preferred_option === "a" && clusterA) ||
      (rating.preferred_option === "b" && !clusterA)
    )
      totals.cluster.preferred++;
    if (
      (rating.preferred_option === "a" && !clusterA) ||
      (rating.preferred_option === "b" && clusterA)
    )
      totals.production.preferred++;
    totals.count++;
  }
  const average = (value: number) =>
    totals.count ? Math.round((value / totals.count) * 100) / 100 : null;
  return {
    total: evaluationQuestions.length,
    completed: completed.size,
    next:
      evaluationQuestions.find((question) => !completed.has(question.id)) ||
      null,
    summary: totals.count
      ? {
          count: totals.count,
          cluster: {
            taste: average(totals.cluster.taste),
            explanation: average(totals.cluster.explanation),
            condition: average(totals.cluster.condition),
            preferred: Math.round(
              (totals.cluster.preferred / totals.count) * 100
            ),
          },
          production: {
            taste: average(totals.production.taste),
            explanation: average(totals.production.explanation),
            condition: average(totals.production.condition),
            preferred: Math.round(
              (totals.production.preferred / totals.count) * 100
            ),
          },
        }
      : null,
  };
}
export async function rateHumanEvaluation(
  userId: string,
  runId: string,
  rating: Record<string, unknown>
) {
  const validOption = (value: unknown) =>
    value === "a" || value === "b" || value === "tie";
  const score = (value: unknown) =>
    Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
  if (
    !validOption(rating.preferredOption) ||
    ![
      rating.tasteScoreA,
      rating.tasteScoreB,
      rating.explanationScoreA,
      rating.explanationScoreB,
      rating.conditionScoreA,
      rating.conditionScoreB,
    ].every(score)
  )
    throw new Error("invalid_rating");
  const run = await database()
    .from("user_taste_cluster_evaluation_runs")
    .select("id")
    .eq("id", runId)
    .eq("user_id", userId)
    .maybeSingle();
  fail(run.error);
  if (!run.data) throw new Error("run_not_found");
  const saved = await database()
    .from("user_taste_cluster_evaluation_ratings")
    .upsert(
      {
        run_id: runId,
        user_id: userId,
        preferred_option: rating.preferredOption,
        taste_score_a: rating.tasteScoreA,
        taste_score_b: rating.tasteScoreB,
        explanation_score_a: rating.explanationScoreA,
        explanation_score_b: rating.explanationScoreB,
        condition_score_a: rating.conditionScoreA,
        condition_score_b: rating.conditionScoreB,
        note:
          typeof rating.note === "string"
            ? rating.note.trim().slice(0, 1000) || null
            : null,
      },
      { onConflict: "run_id,user_id" }
    );
  fail(saved.error);
  const done = await database()
    .from("user_taste_cluster_evaluation_runs")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", runId)
    .eq("user_id", userId);
  fail(done.error);
}
