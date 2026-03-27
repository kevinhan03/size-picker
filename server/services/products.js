export function createProductService({
  assertSupabaseConfig,
  parseSizeTable,
  SUBMISSIONS_STORAGE_PREFIX,
  supabase,
  SUPABASE_PRODUCTS_TABLE,
  SUPABASE_STORAGE_BUCKET,
}) {
  const DUPLICATE_PRODUCT_ERROR_MESSAGE = "이미 등록된 상품입니다.";

  const isDuplicateConstraintError = (error) => {
    const code = String(error?.code || "").trim();
    const message = String(error?.message || "").toLowerCase();
    const details = String(error?.details || "").toLowerCase();
    return (
      code === "23505" ||
      message.includes("duplicate key value") ||
      message.includes("unique constraint") ||
      message.includes("products_unique_key") ||
      details.includes("already exists")
    );
  };

  const toProductWriteErrorResponse = (error, fallbackMessage) => {
    if (isDuplicateConstraintError(error)) {
      return {
        statusCode: 409,
        message: DUPLICATE_PRODUCT_ERROR_MESSAGE,
      };
    }

    return {
      statusCode: Number(error?.statusCode) || Number(error?.status) || 500,
      message: error?.message || fallbackMessage,
    };
  };

const fetchProductsRows = async () => {
    assertSupabaseConfig();
    const { data, error } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message || "failed to fetch products");
    return Array.isArray(data) ? data : [];
  };

  const normalizeStoragePath = (value) => {
    const path = String(value || "").trim();
    return path || null;
  };

  const isSubmissionStoragePath = (path) =>
    Boolean(path) &&
    path.startsWith(SUBMISSIONS_STORAGE_PREFIX) &&
    !path.includes("..") &&
    !path.startsWith("http://") &&
    !path.startsWith("https://");

  const removeOldProductImageIfUnused = async ({ oldPath, updatedProductId }) => {
    const normalizedOldPath = normalizeStoragePath(oldPath);
    if (!normalizedOldPath || !isSubmissionStoragePath(normalizedOldPath)) return;

    const { count, error: referenceCountError } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("image_path", normalizedOldPath)
      .neq("id", updatedProductId);

    if (referenceCountError) {
      console.error("[admin] failed to check image reference count", {
        path: normalizedOldPath,
        error: referenceCountError.message,
      });
      return;
    }
    if ((count || 0) > 0) return;

    const { error: removeError } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .remove([normalizedOldPath]);

    if (removeError) {
      console.error("[admin] failed to remove old image from storage", {
        path: normalizedOldPath,
        error: removeError.message,
      });
    }
  };

  const insertProductRow = async ({
    brand,
    name,
    category,
    url,
    imagePath,
    sizeTable,
    createdAt,
  }) => {
    assertSupabaseConfig();
    const { data, error } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .insert({
        brand,
        name,
        category,
        url,
        image_path: String(imagePath || "").trim() || null,
        size_table: sizeTable,
        created_at: createdAt,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  };

  return {
    fetchProductsRows,
    insertProductRow,
    normalizeStoragePath,
    removeOldProductImageIfUnused,
    toProductWriteErrorResponse,
  };
}
