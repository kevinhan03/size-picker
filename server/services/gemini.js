export function createGeminiService({
  assertPublicHttpUrl,
  GEMINI_API_BASE,
  GEMINI_API_KEY,
  normalizeCaptureBoundingBox,
  normalizeCellText,
  normalizeProductCategory,
  PRODUCT_METADATA_FROM_IMAGE_GEMINI_PROMPT,
  PRODUCT_METADATA_FROM_IMAGE_GEMINI_RESPONSE_SCHEMA,
  PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK,
  PRODUCT_IMAGE_GEMINI_MODEL_CANDIDATES,
  PRODUCT_IMAGE_GEMINI_PROMPT,
  PRODUCT_IMAGE_GEMINI_RESPONSE_SCHEMA,
  SIZE_TABLE_GEMINI_MODEL_CANDIDATES,
  SIZE_TABLE_GEMINI_PROMPT_CANDIDATES,
  SIZE_TABLE_GEMINI_RESPONSE_SCHEMA,
  standardizeSizeTable,
  normalizeProductImageGeminiAssessment,
}) {
  const assertGeminiKey = () => {
    if (!GEMINI_API_KEY) {
      const error = new Error("GEMINI_API_KEY is missing in server .env");
      error.statusCode = 500;
      throw error;
    }
  };

  const callGemini = async (model, body) => {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify(body),
      }
    );
    return response;
  };

  const extractSizeTableWithGemini = async ({ imageBase64, mimeType = "image/png" }) => {
    const normalizedBase64 = String(imageBase64 || "").trim();
    const normalizedMimeType = String(mimeType || "image/png").trim();
    if (!normalizedBase64) {
      return { table: null, error: "imageBase64 is required" };
    }

    assertGeminiKey();

    let lastErrorText = "";
    for (const model of SIZE_TABLE_GEMINI_MODEL_CANDIDATES) {
      for (const prompt of SIZE_TABLE_GEMINI_PROMPT_CANDIDATES) {
        const response = await fetch(
          `${GEMINI_API_BASE}/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    { inlineData: { mimeType: normalizedMimeType, data: normalizedBase64 } },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: SIZE_TABLE_GEMINI_RESPONSE_SCHEMA,
              },
            }),
          }
        );

        if (!response.ok) {
          lastErrorText = await response.text();
          continue;
        }

        const payload = await response.json();
        const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
        if (candidates.length === 0) {
          lastErrorText = JSON.stringify(payload?.promptFeedback || payload);
          continue;
        }

        const rawText =
          candidates[0]?.content?.parts?.find((part) => typeof part?.text === "string")?.text || "";
        if (!rawText) {
          lastErrorText = "Gemini returned empty text";
          continue;
        }

        let parsed;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          lastErrorText = `Gemini did not return valid JSON: ${rawText.slice(0, 300)}`;
          continue;
        }

        const normalizedTable = standardizeSizeTable(parsed);
        if (normalizedTable) {
          return { table: normalizedTable, error: "" };
        }

        lastErrorText = "Gemini returned empty size-table data";
      }
    }

    return { table: null, error: lastErrorText || "Gemini size-table request failed" };
  };

  const assessProductImageWithGemini = async ({
    imageBase64,
    mimeType = "image/jpeg",
    brand = "",
    name = "",
  }) => {
    const normalizedBase64 = String(imageBase64 || "").trim();
    const normalizedMimeType = String(mimeType || "image/jpeg").trim();
    if (!normalizedBase64) return null;
    if (!GEMINI_API_KEY) return null;
    if (!PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK) return null;

    const productHint = normalizeCellText(`${brand} ${name}`).trim();
    let lastErrorText = "";

    for (const model of PRODUCT_IMAGE_GEMINI_MODEL_CANDIDATES) {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: productHint
                      ? `${PRODUCT_IMAGE_GEMINI_PROMPT} Product hint: ${productHint}`
                      : PRODUCT_IMAGE_GEMINI_PROMPT,
                  },
                  { inlineData: { mimeType: normalizedMimeType, data: normalizedBase64 } },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: PRODUCT_IMAGE_GEMINI_RESPONSE_SCHEMA,
            },
          }),
        }
      );

      if (!response.ok) {
        lastErrorText = await response.text();
        continue;
      }

      const payload = await response.json();
      const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
      if (candidates.length === 0) {
        lastErrorText = JSON.stringify(payload?.promptFeedback || payload);
        continue;
      }

      const rawText =
        candidates[0]?.content?.parts?.find((part) => typeof part?.text === "string")?.text || "";
      if (!rawText) {
        lastErrorText = "Gemini returned empty image assessment";
        continue;
      }

      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        lastErrorText = `Gemini did not return valid JSON: ${rawText.slice(0, 200)}`;
        continue;
      }

      const normalized = normalizeProductImageGeminiAssessment(parsed);
      if (normalized) return normalized;
      lastErrorText = "Gemini image assessment normalization failed";
    }

    return null;
  };

  const extractProductMetadataFromImageWithGemini = async ({
    imageBase64,
    mimeType = "image/png",
  }) => {
    const normalizedBase64 = String(imageBase64 || "").trim();
    const normalizedMimeType = String(mimeType || "image/png").trim();
    if (!normalizedBase64) {
      return { data: null, error: "imageBase64 is required" };
    }

    assertGeminiKey();

    let lastErrorText = "";
    for (const model of SIZE_TABLE_GEMINI_MODEL_CANDIDATES) {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: PRODUCT_METADATA_FROM_IMAGE_GEMINI_PROMPT },
                  { inlineData: { mimeType: normalizedMimeType, data: normalizedBase64 } },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: PRODUCT_METADATA_FROM_IMAGE_GEMINI_RESPONSE_SCHEMA,
            },
          }),
        }
      );

      if (!response.ok) {
        lastErrorText = await response.text();
        continue;
      }

      const payload = await response.json();
      const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
      if (candidates.length === 0) {
        lastErrorText = JSON.stringify(payload?.promptFeedback || payload);
        continue;
      }

      const rawText =
        candidates[0]?.content?.parts?.find((part) => typeof part?.text === "string")?.text || "";
      if (!rawText) {
        lastErrorText = "Gemini returned empty metadata text";
        continue;
      }

      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        lastErrorText = `Gemini did not return valid JSON: ${rawText.slice(0, 300)}`;
        continue;
      }

      const category = normalizeProductCategory(parsed?.category || "");
      const brand = normalizeCellText(parsed?.brand || "");
      const name = normalizeCellText(parsed?.name || "");
      let url = normalizeCellText(parsed?.url || "");
      let imagePath = normalizeCellText(parsed?.image_path || "");

      try {
        url = url ? assertPublicHttpUrl(url) : "";
      } catch {
        url = "";
      }
      try {
        imagePath = imagePath ? assertPublicHttpUrl(imagePath) : "";
      } catch {
        imagePath = "";
      }

      const parsedTable = parsed?.size_table || parsed?.sizeTable || null;
      const normalizedTable = standardizeSizeTable(parsedTable);
      const productImageBbox = normalizeCaptureBoundingBox(
        parsed?.product_image_bbox || parsed?.productImageBbox || null
      );
      const sizeChartBbox = normalizeCaptureBoundingBox(
        parsed?.size_chart_bbox || parsed?.sizeChartBbox || null
      );

      return {
        data: {
          brand,
          name,
          category,
          url,
          image_path: imagePath,
          product_image_bbox: productImageBbox,
          size_chart_bbox: sizeChartBbox,
          sizeTable: normalizedTable,
        },
        error: "",
      };
    }

    return {
      data: null,
      error: lastErrorText || "Gemini product metadata request failed",
    };
  };

  return {
    assessProductImageWithGemini,
    assertGeminiKey,
    callGemini,
    extractProductMetadataFromImageWithGemini,
    extractSizeTableWithGemini,
  };
}
