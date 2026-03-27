import { ADMIN_PASSWORD, SUPABASE_PRODUCTS_TABLE } from "../config/env.js";

export function registerAdminRoutes(app, {
  adminLoginLimiter,
  assertAdminConfig,
  assertSupabaseConfig,
  clearAdminCookie,
  getAdminTokenFromRequest,
  makeAdminCookie,
  makeAdminSessionToken,
  normalizeStoragePath,
  parseSizeTable,
  removeOldProductImageIfUnused,
  requireAdminAuth,
  safeCompare,
  supabase,
  toProductWriteErrorResponse,
  verifyAdminSessionToken,
}) {
  app.get("/api/admin/session", (req, res) => {
    if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
      return res.status(500).json({
        ok: false,
        error: "ADMIN_PASSWORD or ADMIN_SESSION_SECRET is missing in server .env",
      });
    }
    const token = getAdminTokenFromRequest(req);
    const authenticated = verifyAdminSessionToken(token);
    return res.json({
      ok: true,
      data: { authenticated },
    });
  });

  app.post("/api/admin/login", adminLoginLimiter, (req, res) => {
    const password = String(req.body?.password || "");

    try {
      assertAdminConfig();
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error?.message || "admin config missing",
      });
    }

    if (!safeCompare(password, ADMIN_PASSWORD)) {
      return res.status(401).json({
        ok: false,
        error: "invalid admin credentials",
      });
    }

    const token = makeAdminSessionToken();
    res.setHeader("Set-Cookie", makeAdminCookie(token));
    return res.json({ ok: true });
  });

  app.post("/api/admin/logout", (_req, res) => {
    res.setHeader("Set-Cookie", clearAdminCookie());
    return res.json({ ok: true });
  });

  app.patch("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
    const id = String(req.params?.id || "").trim();
    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "product id is required",
      });
    }

    const payload = {};
    if ("brand" in (req.body || {})) payload.brand = String(req.body?.brand || "").trim();
    if ("name" in (req.body || {})) payload.name = String(req.body?.name || "").trim();
    if ("category" in (req.body || {})) {
      const category = String(req.body?.category || "").trim();
      payload.category = category || null;
    }
    if ("url" in (req.body || {})) {
      const url = String(req.body?.url || "").trim();
      payload.url = url || null;
    }
    if ("imagePath" in (req.body || {})) {
      const imagePath = String(req.body?.imagePath || "").trim();
      payload.image_path = imagePath || null;
    }
    if ("sizeTable" in (req.body || {})) payload.size_table = parseSizeTable(req.body?.sizeTable ?? null);

    const payloadKeys = Object.keys(payload);
    if (payloadKeys.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "at least one updatable field is required",
      });
    }
    if ("brand" in payload && !payload.brand) {
      return res.status(400).json({
        ok: false,
        error: "brand cannot be empty",
      });
    }
    if ("name" in payload && !payload.name) {
      return res.status(400).json({
        ok: false,
        error: "name cannot be empty",
      });
    }

    try {
      assertSupabaseConfig();
      const hasImagePathInPayload = Object.prototype.hasOwnProperty.call(payload, "image_path");
      let previousImagePath = null;
      if (hasImagePathInPayload) {
        const { data: existingProduct, error: existingProductError } = await supabase
          .from(SUPABASE_PRODUCTS_TABLE)
          .select("id,image_path")
          .eq("id", id)
          .maybeSingle();

        if (existingProductError) throw existingProductError;
        if (!existingProduct) {
          return res.status(404).json({
            ok: false,
            error: "product not found",
          });
        }
        previousImagePath = normalizeStoragePath(existingProduct.image_path);
      }

      const { data, error } = await supabase
        .from(SUPABASE_PRODUCTS_TABLE)
        .update(payload)
        .eq("id", id)
        .select("id,brand,name,category,url,size_table,created_at,image_path")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({
          ok: false,
          error: "product not found",
        });
      }

      const currentImagePath = normalizeStoragePath(data.image_path);
      if (hasImagePathInPayload && previousImagePath && previousImagePath !== currentImagePath) {
        await removeOldProductImageIfUnused({
          oldPath: previousImagePath,
          updatedProductId: String(data.id || id),
        });
      }

      return res.json({
        ok: true,
        data: { product: data },
      });
    } catch (error) {
      const { statusCode, message } = toProductWriteErrorResponse(error, "product update error");
      return res.status(statusCode).json({
        ok: false,
        error: message,
      });
    }
  });

  app.delete("/api/admin/products/:id", requireAdminAuth, async (req, res) => {
    const id = String(req.params?.id || "").trim();
    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "product id is required",
      });
    }

    try {
      assertSupabaseConfig();
      const { data, error } = await supabase
        .from(SUPABASE_PRODUCTS_TABLE)
        .delete()
        .eq("id", id)
        .select("id,image_path");

      if (error) throw error;
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(404).json({
          ok: false,
          error: "product not found",
        });
      }

      const deletedProduct = data[0];
      await removeOldProductImageIfUnused({
        oldPath: deletedProduct?.image_path,
        updatedProductId: id,
      });

      return res.json({
        ok: true,
        data: { id },
      });
    } catch (error) {
      const { statusCode, message } = toProductWriteErrorResponse(error, "product delete error");
      return res.status(statusCode).json({
        ok: false,
        error: message,
      });
    }
  });
}
