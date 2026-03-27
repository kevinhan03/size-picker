export function registerMetadataRoutes(app, {
  extractProductMetadataFromUrl,
  normalizeProductCategory,
}) {
  app.post("/api/product-metadata", async (req, res) => {
    const rawUrl = String(req.body?.url || "").trim();

    try {
      const metadata = await extractProductMetadataFromUrl(rawUrl);

      return res.json({
        ok: true,
        data: {
          url: metadata.url || "",
          brand: metadata.brand || "",
          name: metadata.name || "",
          category: normalizeProductCategory(metadata.category || ""),
          image_path: metadata.image_path || "",
          productImage: metadata.productImage || null,
          productImageCandidates: Array.isArray(metadata.productImageCandidates)
            ? metadata.productImageCandidates
            : [],
        },
      });
    } catch (error) {
      const statusCode = Number(error?.statusCode) || 500;
      return res.status(statusCode).json({
        ok: false,
        error: error?.message || "product metadata extraction error",
      });
    }
  });
}
