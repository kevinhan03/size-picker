import type { Product, StyleTagName } from "../types";
import { cosineSimilarity, getEffectiveStyleTags, normalizeStyleTags, selectTopTags, TAGS } from "./tasteGraph";

export interface BrandCluster {
  id: string;
  brand: string;
  displayName: string;
  products: Product[];
  count: number;
  topTags: Array<{ tag: StyleTagName; score: number }>;
  tagVector: number[];
}

export interface BrandClusterLink {
  source: string;
  target: string;
  similarity: number;
}

function tagDistribution(vector: number[]) {
  const total = vector.reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
  return vector.map((value) => Math.max(0, value) / total);
}

function brandAffinity(left: BrandCluster, right: BrandCluster) {
  const cosine = cosineSimilarity(left.tagVector, right.tagVector) || 0;
  const leftDistribution = tagDistribution(left.tagVector);
  const rightDistribution = tagDistribution(right.tagVector);
  const distance = Math.sqrt(leftDistribution.reduce((sum, value, index) => sum + (value - rightDistribution[index]) ** 2, 0));
  const distributionSimilarity = Math.max(0, 1 - distance / Math.sqrt(2));
  const strongestSharedTag = Math.max(...leftDistribution.map((value, index) => Math.min(value, rightDistribution[index])));
  const sampleReliability = Math.min(1, 0.62 + Math.min(left.count, right.count) * 0.13);

  return (cosine * 0.56 + distributionSimilarity * 0.29 + strongestSharedTag * 0.15) * sampleReliability;
}

const normalizeBrand = (product: Product) => String(product.brand || "").trim() || "브랜드 미상";

const englishBrandName = (brand: string) => {
  const matches = brand.match(/[A-Za-z0-9][A-Za-z0-9&.'-]*(?:\s+[A-Za-z0-9&.'-]+)*/g);
  return matches?.sort((left, right) => right.length - left.length)[0]?.trim() || brand;
};

export function buildBrandClusters(products: Product[]) {
  const byBrand = new Map<string, Product[]>();
  for (const product of products) {
    const brand = normalizeBrand(product);
    byBrand.set(brand, [...(byBrand.get(brand) || []), product]);
  }

  const clusters: BrandCluster[] = [...byBrand.entries()]
    .map(([brand, items]) => {
      const totals = Object.fromEntries(TAGS.map((tag) => [tag, 0])) as Record<StyleTagName, number>;
      for (const product of items) {
        const tags = normalizeStyleTags(getEffectiveStyleTags(product).tags);
        for (const tag of TAGS) totals[tag] += Number(tags[tag] || 0);
      }
      const tagVector = TAGS.map((tag) => totals[tag] / Math.max(items.length, 1));
      return {
        id: `brand:${brand.toLocaleLowerCase().replace(/\s+/g, "-")}`,
        brand,
        displayName: englishBrandName(brand),
        products: items,
        count: items.length,
        topTags: selectTopTags(Object.fromEntries(TAGS.map((tag, index) => [tag, tagVector[index]])), 3, { enforceSecondThreshold: false })
          .map(([tag, score]) => ({ tag, score })),
        tagVector,
      };
    })
    .sort((left, right) => right.count - left.count || left.brand.localeCompare(right.brand, "ko"));

  const nearestNeighbors = new Map<string, Array<{ other: BrandCluster; similarity: number }>>();
  for (const cluster of clusters) {
    const candidates = clusters
      .filter((other) => other.id !== cluster.id)
      .map((other) => ({ other, similarity: brandAffinity(cluster, other) }))
      .filter((entry) => entry.similarity >= 0.64)
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, 2);
    nearestNeighbors.set(cluster.id, candidates);
  }

  const links = new Map<string, BrandClusterLink>();
  for (const cluster of clusters) {
    for (const { other, similarity } of nearestNeighbors.get(cluster.id) || []) {
      const [source, target] = cluster.id < other.id ? [cluster.id, other.id] : [other.id, cluster.id];
      const key = `${source}|${target}`;
      const previous = links.get(key);
      if (!previous || previous.similarity < similarity) links.set(key, { source, target, similarity });
    }
  }

  return { clusters, links: [...links.values()] };
}
