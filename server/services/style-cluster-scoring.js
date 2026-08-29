import { SUPABASE_PRODUCTS_TABLE } from "../config/env.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { COMMON_FACT_FIELD_KEYS, CORE_TASTE_CATEGORIES, STYLE_ATTRIBUTE_FIELDS, STYLE_AXIS_FIELDS, STYLE_TAG_NAMES } from "../../src/constants/styleAnalysis.js";

const AXIS_KEYS = STYLE_AXIS_FIELDS.map((field) => field.key);
const DEFAULT_WEIGHTS = { image: 0.65, axes: 0.2, facts: 0.15 };

const vector = (value) => {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  if (typeof value === "string") return value.trim().replace(/^\[/, "").replace(/\]$/, "").split(",").map(Number).filter(Number.isFinite);
  return [];
};
const normalize = (values) => {
  const norm = Math.hypot(...values);
  return norm ? values.map((value) => value / norm) : values.map(() => 0);
};
const effective = (product, human, ai) => ["approved", "edited"].includes(String(product.tag_review_status || "")) && product[human] ? product[human] : product[ai];

function factVocabulary() {
  return COMMON_FACT_FIELD_KEYS.flatMap((key) => {
    const field = STYLE_ATTRIBUTE_FIELDS.find((item) => item.key === key);
    return (field?.options || []).map((option) => `${key}:${option.value}`);
  });
}

const FACT_VOCABULARY = factVocabulary();

export function buildStyleFeature(product, model) {
  if (!CORE_TASTE_CATEGORIES.includes(String(product.category || ""))) return null;
  const image = vector(product.image_embedding);
  const axes = effective(product, "human_style_axes", "style_axes");
  const facts = effective(product, "human_style_attributes", "style_attributes");
  if (!image.length || !axes || typeof axes !== "object") return null;
  const modelAxisKeys = model.feature_config?.axis_keys;
  if (!Array.isArray(modelAxisKeys) || modelAxisKeys.length !== AXIS_KEYS.length || modelAxisKeys.some((key, index) => key !== AXIS_KEYS[index])) return null;
  if (AXIS_KEYS.some((key) => !Number.isInteger(Number(axes[key])) || Number(axes[key]) < 1 || Number(axes[key]) > 7)) return null;
  const components = Array.isArray(model.pca_components) ? model.pca_components : [];
  const mean = vector(model.pca_mean);
  if (!components.length || !mean.length || mean.length !== image.length) return null;
  const reduced = components.map((row) => row.reduce((sum, weight, index) => sum + Number(weight || 0) * (image[index] - mean[index]), 0));
  // A style-only model removes the average visual shape of its product category
  // (for example, the shared "shoe-ness" signal) before combining modalities.
  const categoryMeans = model.feature_config?.category_image_means;
  const categoryMean = categoryMeans && Array.isArray(categoryMeans[product.category])
    ? categoryMeans[product.category].map(Number)
    : null;
  const styleVisual = categoryMean?.length === reduced.length
    ? reduced.map((value, index) => value - categoryMean[index])
    : reduced;
  const axisMeans = model.feature_config?.axis_means;
  const axisScales = model.feature_config?.axis_scales;
  const axisVector = AXIS_KEYS.map((key, index) => {
    const raw = Number(axes[key]);
    if (Array.isArray(axisMeans) && Array.isArray(axisScales) && axisMeans.length === AXIS_KEYS.length && axisScales.length === AXIS_KEYS.length) {
      return (raw - Number(axisMeans[index])) / (Number(axisScales[index]) || 1);
    }
    return (raw - 4) / 3;
  });
  const vocabulary = Array.isArray(model.feature_config?.fact_vocabulary) ? model.feature_config.fact_vocabulary : FACT_VOCABULARY;
  const factVector = vocabulary.map((entry) => {
    const [key, option] = entry.split(":");
    const value = facts && typeof facts === "object" ? facts[key] : null;
    return Array.isArray(value) ? Number(value.includes(option)) : Number(value === option);
  });
  const weights = { ...DEFAULT_WEIGHTS, ...(model.feature_config?.weights || {}) };
  return normalize([
    ...normalize(styleVisual).map((value) => value * Math.sqrt(weights.image)),
    ...(model.feature_config?.axis_transform === "global_zscore" ? axisVector : normalize(axisVector)).map((value) => value * Math.sqrt(weights.axes)),
    ...normalize(factVector).map((value) => value * Math.sqrt(weights.facts)),
  ]);
}

const softmax = (scores) => {
  const largest = Math.max(...scores);
  const exponentials = scores.map((score) => Math.exp(score - largest));
  const total = exponentials.reduce((sum, value) => sum + value, 0) || 1;
  return exponentials.map((value) => value / total);
};

export async function getActiveStyleClusterModel() {
  assertSupabaseConfig();
  const { data, error } = await supabase.from("style_cluster_model_versions").select("*").eq("status", "active").maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: clusters, error: clusterError } = await supabase.from("style_clusters").select("*").eq("model_version_id", data.id).order("ordinal");
  if (clusterError) throw clusterError;
  return { ...data, clusters: clusters || [] };
}

export async function scoreProductForActiveStyleClusters(productId) {
  const id = String(productId || "").trim();
  if (!id) throw new Error("product id is required");
  const model = await getActiveStyleClusterModel();
  if (!model) return { ok: true, skipped: true, reason: "no_active_model" };
  const { data: product, error } = await supabase.from(SUPABASE_PRODUCTS_TABLE)
    .select("id,category,image_embedding,style_axes,human_style_axes,style_attributes,human_style_attributes,tag_review_status")
    .eq("id", id).maybeSingle();
  if (error) throw error;
  if (!product) return { ok: false, skipped: true, reason: "product_not_found" };
  const feature = buildStyleFeature(product, model);
  if (!feature) {
    await supabase.from(SUPABASE_PRODUCTS_TABLE).update({ style_cluster_score_status: "missing_inputs", style_cluster_score_error: "image embedding and a compatible eight-axis style model are required" }).eq("id", id);
    return { ok: true, skipped: true, reason: "missing_inputs" };
  }
  const distances = model.clusters.map((cluster) => {
    const center = vector(cluster.centroid);
    return 1 - center.reduce((sum, value, index) => sum + value * feature[index], 0);
  });
  const probabilities = softmax(distances.map((distance) => -distance / Number(model.temperature || 0.12)));
  const tags = Object.fromEntries(STYLE_TAG_NAMES.map((tag) => [tag, 0]));
  model.clusters.forEach((cluster, index) => { if (cluster.style_tag) tags[cluster.style_tag] += probabilities[index]; });
  const payload = {
    product_id: Number(id), model_version_id: model.id,
    cluster_probabilities: Object.fromEntries(model.clusters.map((cluster, index) => [cluster.ordinal, probabilities[index]])),
    derived_style_tags: tags, nearest_distance: Math.min(...distances), status: "scored", error: null, scored_at: new Date().toISOString(),
  };
  const { error: scoreError } = await supabase.from("product_style_cluster_scores").upsert(payload);
  if (scoreError) throw scoreError;
  await supabase.from(SUPABASE_PRODUCTS_TABLE).update({ style_cluster_score_status: "scored", style_cluster_score_error: null }).eq("id", id);
  return { ok: true, skipped: false, data: payload };
}

export async function applyActiveClusterStyleTags(products) {
  const model = await getActiveStyleClusterModel();
  if (!model || !products?.length) return products;
  const ids = products.map((product) => String(product.id)).filter(Boolean);
  const { data, error } = await supabase.from("product_style_cluster_scores")
    .select("product_id,derived_style_tags,status").eq("model_version_id", model.id).eq("status", "scored").in("product_id", ids);
  if (error) throw error;
  const scores = new Map((data || []).map((row) => [String(row.product_id), row.derived_style_tags]));
  return products.map((product) => scores.has(String(product.id)) ? { ...product, styleTags: scores.get(String(product.id)), clusterStyleTags: scores.get(String(product.id)) } : product);
}
