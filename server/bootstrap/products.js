import {
  SUBMISSIONS_STORAGE_PREFIX,
  SUPABASE_PRODUCTS_TABLE,
  SUPABASE_STORAGE_BUCKET,
} from "../config/env.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { createProductService } from "../services/products.js";
import { parseSizeTable } from "../utils/size-table.js";

export function createProductStack() {
  return createProductService({
    assertSupabaseConfig,
    parseSizeTable,
    SUBMISSIONS_STORAGE_PREFIX,
    supabase,
    SUPABASE_PRODUCTS_TABLE,
    SUPABASE_STORAGE_BUCKET,
  });
}
