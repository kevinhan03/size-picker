import { PRODUCT_METADATA_MAX_IMAGE_BYTES, SUPABASE_PRODUCTS_TABLE, SUPABASE_STORAGE_BUCKET } from "../config/env.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { isStoredProductImagePath } from "./product-image-storage.js";
import { classifyProductCategory } from "./product-category-classification";
import { normalizeSizeTableForCategory, parseSizeTable } from "../utils/size-table.js";

const markFailed = async (productId: string) => {
  const { error } = await supabase!
    .from(SUPABASE_PRODUCTS_TABLE)
    .update({ category: null, sub_category: null, category_analysis_status: "failed" })
    .eq("id", productId)
    .eq("category_analysis_status", "pending")
    .eq("category_reviewed", false);
  if (error) console.error("[product-category-analysis] failed to mark product", { productId, error: error.message });
};

export async function analyzeStoredProductCategory(productId: string): Promise<{ ok: boolean }> {
  assertSupabaseConfig();
  const { data: product, error } = await supabase!
    .from(SUPABASE_PRODUCTS_TABLE)
    .select("id,brand,name,image_path,size_table,product_metadata")
    .eq("id", productId)
    .maybeSingle();
  if (error || !product || !isStoredProductImagePath(product.image_path)) {
    await markFailed(productId);
    return { ok: false };
  }

  try {
    const { data: image, error: downloadError } = await supabase!.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .download(product.image_path);
    if (downloadError || !image || image.size <= 0 || image.size > PRODUCT_METADATA_MAX_IMAGE_BYTES) {
      await markFailed(productId);
      return { ok: false };
    }

    const classification = await classifyProductCategory({
      brand: String(product.brand || ""),
      name: String(product.name || ""),
      sizeTable: product.size_table ?? null,
      productMetadata: product.product_metadata ?? null,
      image: {
        base64: Buffer.from(await image.arrayBuffer()).toString("base64"),
        mimeType: image.type || "image/jpeg",
      },
    });
    if (!classification) {
      await markFailed(productId);
      return { ok: false };
    }

    const { error: updateError } = await supabase!
      .from(SUPABASE_PRODUCTS_TABLE)
      .update({
        category: classification.category,
        sub_category: classification.subCategory,
        normalized_size_table: classification.category === "Bottom"
          ? normalizeSizeTableForCategory(classification.category, parseSizeTable(product.size_table))
          : null,
        category_analysis_status: "completed",
      })
      .eq("id", productId)
      .eq("category_analysis_status", "pending")
      .eq("category_reviewed", false);
    if (updateError) throw updateError;
    return { ok: true };
  } catch (error) {
    console.error("[product-category-analysis] failed", { productId, error: error instanceof Error ? error.message : String(error) });
    await markFailed(productId);
    return { ok: false };
  }
}
