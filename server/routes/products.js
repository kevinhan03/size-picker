export function registerProductRoutes(app, {
  fetchProductsRows,
  insertProductRow,
  parseSizeTable,
  productInsertLimiter,
  toProductWriteErrorResponse,
}) {
  app.get("/api/products", async (_req, res) => {
    try {
      const rows = await fetchProductsRows();
      return res.json({
        ok: true,
        data: { products: rows },
      });
    } catch (error) {
      const statusCode = Number(error?.statusCode) || 500;
      return res.status(statusCode).json({
        ok: false,
        error: error?.message || "products fetch error",
      });
    }
  });

  app.post("/api/products", productInsertLimiter, async (req, res) => {
    const brand = String(req.body?.brand || "").trim();
    const name = String(req.body?.name || "").trim();
    const category = String(req.body?.category || "User Uploaded").trim();
    const url = String(req.body?.url || "").trim();
    const imagePath = String(req.body?.image_path ?? req.body?.imagePath ?? "").trim();
    const sizeTable = parseSizeTable(req.body?.sizeTable ?? null);
    const createdAt = String(req.body?.createdAt || new Date().toISOString()).trim();

    if (!brand || !name) {
      return res.status(400).json({
        ok: false,
        error: "brand and name are required",
      });
    }

    try {
      await insertProductRow({
        brand,
        name,
        category,
        url,
        imagePath,
        sizeTable,
        createdAt,
      });

      return res.status(201).json({ ok: true });
    } catch (error) {
      const { statusCode, message } = toProductWriteErrorResponse(error, "product insert error");
      return res.status(statusCode).json({
        ok: false,
        error: message,
      });
    }
  });
}
