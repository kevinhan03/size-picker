import type { Product, StyleAxes, StyleProfileKey } from "../../../src/types";
import type { AgentPlan } from "../../../src/types/fashion-agent";
import { STYLE_AXIS_FIELDS } from "../../../src/constants/styleAnalysis.js";
import {
  getEffectiveStyleAxes,
  styleProfileVector,
} from "../../../src/utils/styleProfile";
import { supabase } from "../../lib/supabase.js";
import { traceEvent } from "./trace";

const axisKeys = STYLE_AXIS_FIELDS.map((field) => field.key) as Array<
  keyof StyleAxes
>;
type Anchor = {
  id: string;
  relevance: number;
  components: Record<string, number>;
  relativeComponents: Record<string, number>;
  category: string;
};
export type QueryTasteObservation = {
  version: "query-taste-observation-v1";
  specificity: number;
  signalTypes: string[];
  reason: string;
  anchors: Anchor[];
  metrics: {
    validProducts: number;
    top4Mean: number | null;
    top8Mean: number | null;
    localGlobalDistance: number | null;
    top4Dispersion: number | null;
  };
};

const mean = (
  items: Array<{ axes: StyleAxes; weight: number }>
): StyleAxes | null => {
  if (!items.length) return null;
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  if (!total) return null;
  return Object.fromEntries(
    axisKeys.map((key) => [
      key,
      items.reduce((sum, item) => sum + item.axes[key] * item.weight, 0) /
        total,
    ])
  ) as StyleAxes;
};
const distance = (left: StyleAxes, right: StyleAxes) =>
  Math.sqrt(
    axisKeys.reduce((sum, key) => sum + (left[key] - right[key]) ** 2, 0) /
      axisKeys.length
  ) / 6;
const factMatch = (product: Product, plan: AgentPlan) => {
  if (!plan.filters.facts.length) return null;
  const facts =
    (product.factsReviewedAt && product.humanStyleAttributes
      ? product.humanStyleAttributes
      : product.styleAttributes) || {};
  return (
    plan.filters.facts.reduce(
      (sum, { key, value }) =>
        sum +
        (facts[key] === value ||
        (Array.isArray(facts[key]) && facts[key].includes(value))
          ? 1
          : 0),
      0
    ) / plan.filters.facts.length
  );
};
/** Comparable within one user's collection even when raw model scales differ. */
function percentile(values: Array<{ id: string; value: number }>) {
  const result = new Map<string, number>();
  const sorted = [...values].sort(
    (a, b) => a.value - b.value || a.id.localeCompare(b.id)
  );
  for (let start = 0; start < sorted.length;) {
    let end = start + 1;
    while (end < sorted.length && sorted[end].value === sorted[start].value)
      end++;
    const rank = ((start + end - 1) / 2 + 0.5) / sorted.length;
    sorted.slice(start, end).forEach((item) => result.set(item.id, rank));
    start = end;
  }
  return result;
}

/** Observation only: reports possible anchor-set metrics and never changes ranking. */
export function observeQueryTaste(
  products: Product[],
  plan: AgentPlan
): QueryTasteObservation {
  const targets = [
    ...(plan.session?.axisPreferences || []),
    ...plan.filters.axes.map((axis) => ({
      key: axis.key,
      target: (axis.min + axis.max) / 2,
    })),
  ].filter(
    (entry): entry is { key: keyof StyleAxes; target: number } =>
      axisKeys.includes(entry.key as keyof StyleAxes) &&
      Number.isFinite(entry.target)
  );
  const styles = plan.filters.preferredStyles as StyleProfileKey[];
  const signals = [
    targets.length ? "axes" : null,
    styles.length ? "styles" : null,
    plan.filters.facts.length ? "facts" : null,
  ].filter((value): value is string => Boolean(value));
  const valid = products.flatMap((product) => {
    const effective = getEffectiveStyleAxes(product);
    return effective ? [{ product, axes: effective.axes }] : [];
  });
  if (!signals.length || (!targets.length && !styles.length))
    return {
      version: "query-taste-observation-v1",
      specificity: 0,
      signalTypes: signals,
      reason: signals.length ? "condition_only" : "broad_query",
      anchors: [],
      metrics: {
        validProducts: valid.length,
        top4Mean: null,
        top8Mean: null,
        localGlobalDistance: null,
        top4Dispersion: null,
      },
    };
  const weights = {
    axes: targets.length ? 0.55 : 0,
    styles: styles.length ? 0.3 : 0,
    facts: plan.filters.facts.length ? 0.15 : 0,
  };
  const totalWeight = weights.axes + weights.styles + weights.facts;
  const rawAnchors = valid.map(({ product, axes }) => {
    const components: Record<string, number> = {};
    if (targets.length)
      components.axes =
        1 -
        targets.reduce(
          (sum, target) => sum + Math.abs(axes[target.key] - target.target) / 6,
          0
        ) /
          targets.length;
    if (styles.length) {
      const vector = styleProfileVector(product);
      components.styles = vector
        ? styles.reduce((sum, key) => sum + (vector[key] || 0), 0) /
          styles.length
        : 0;
    }
    const facts = factMatch(product, plan);
    if (facts !== null) components.facts = facts;
    return {
      id: product.id,
      components,
      category: product.category,
      axes,
    };
  });
  const componentRanks = Object.fromEntries(
    signals.map((signal) => [
      signal,
      percentile(
        rawAnchors.map((anchor) => ({
          id: anchor.id,
          value: anchor.components[signal] || 0,
        }))
      ),
    ])
  ) as Record<string, Map<string, number>>;
  const anchors = rawAnchors
    .map((anchor) => {
      const relativeComponents = Object.fromEntries(
        signals.map((signal) => [
          signal,
          componentRanks[signal].get(anchor.id) || 0,
        ])
      );
      const relevance =
        Object.entries(weights).reduce(
          (sum, [key, weight]) => sum + (relativeComponents[key] || 0) * weight,
          0
        ) / totalWeight;
      return { ...anchor, relativeComponents, relevance };
    })
    .sort(
      (left, right) =>
        right.relevance - left.relevance || left.id.localeCompare(right.id)
    );
  const top = anchors.slice(0, 12),
    top4 = top.slice(0, 4);
  const global = mean(valid.map(({ axes }) => ({ axes, weight: 1 })));
  const local = mean(
    top4.map((anchor) => ({ axes: anchor.axes, weight: anchor.relevance ** 2 }))
  );
  const top4Center = mean(
    top4.map((anchor) => ({ axes: anchor.axes, weight: 1 }))
  );
  return {
    version: "query-taste-observation-v1",
    specificity: signals.length / 3,
    signalTypes: signals,
    reason: "signals_detected",
    anchors: top.map((anchor) => ({
      id: anchor.id,
      relevance: anchor.relevance,
      components: anchor.components,
      relativeComponents: anchor.relativeComponents,
      category: anchor.category,
    })),
    metrics: {
      validProducts: valid.length,
      top4Mean: top4.length
        ? top4.reduce((sum, anchor) => sum + anchor.relevance, 0) / top4.length
        : null,
      top8Mean: top.length
        ? top.slice(0, 8).reduce((sum, anchor) => sum + anchor.relevance, 0) /
          Math.min(top.length, 8)
        : null,
      localGlobalDistance: local && global ? distance(local, global) : null,
      top4Dispersion:
        top4Center && top4.length
          ? top4.reduce(
              (sum, anchor) => sum + distance(anchor.axes, top4Center),
              0
            ) / top4.length
          : null,
    },
  };
}

export async function recordQueryTasteObservation(
  userId: string,
  plan: AgentPlan,
  products: Product[]
) {
  if (process.env.FASHION_AGENT_QUERY_TASTE_OBSERVATION !== "true" || !supabase)
    return;
  try {
    const observation = observeQueryTaste(products, plan);
    traceEvent("query_taste_observation", observation);
    const safePlan = {
      intent: plan.intent,
      source: plan.source,
      filters: plan.filters,
      personalized: plan.personalized,
      exploration: plan.exploration,
      session: plan.session,
    };
    const { error } = await supabase
      .from("fashion_agent_query_taste_diagnostics")
      .insert({
        user_id: userId,
        source: plan.source,
        plan: safePlan,
        metrics: observation,
      });
    if (error) throw error;
  } catch {
    console.warn("[fashion-agent] query taste observation unavailable");
  }
}
