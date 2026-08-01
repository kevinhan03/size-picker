import type { Product } from "../../src/types";
import { createGraph, type SerializedTasteGraphState, type TasteCollectionSource } from "../../src/utils/tasteGraph";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { normalizeAnalysisProduct } from "./catalog";

export type TasteAnalysisData = { source: TasteCollectionSource; products: Product[]; graph: SerializedTasteGraphState };

export async function getTasteAnalysis(userId: string, source: TasteCollectionSource): Promise<TasteAnalysisData> {
  assertSupabaseConfig();
  const { data: rows, error } = await supabase!.rpc("get_taste_analysis_products", {
    target_user_id: userId,
    collection_source: source,
  });
  if (error) throw error;
  const analysisProducts = ((rows || []) as Array<{ product?: unknown }>)
    .map((row) => normalizeAnalysisProduct(row.product))
    .filter((product): product is Product => Boolean(product));
  const graph = createGraph(analysisProducts);
  const safeProducts = analysisProducts.map((product) => {
    const safeProduct = { ...product };
    delete safeProduct.imageEmbedding;
    return safeProduct;
  });
  const safeGraphProducts = graph.products.map((product) => ({ ...product, embedding: null }));
  const safeById = new Map(safeGraphProducts.map((product) => [product.nodeId, product]));
  const safeNodes = graph.nodes.map((node) => node.product ? { ...node, product: safeById.get(node.product.nodeId) } : { ...node });
  return {
    source,
    products: safeProducts,
    graph: {
      ...graph,
      nodes: safeNodes,
      products: safeGraphProducts,
      productByNodeId: [...safeById.entries()],
      tagItems: [...graph.tagItems.entries()],
    },
  };
}
