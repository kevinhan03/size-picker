export function createLinkedSizeMetadataService({
  IS_VERCEL,
  PRODUCT_METADATA_BROWSER_TIMEOUT_MS,
  PRODUCT_METADATA_MAX_IMAGE_BYTES,
  SIZE_HINT_PATTERN,
  addImageResolutionVariants,
  alignAndValidateSizeTableByOptionLabels,
  assertPublicHttpUrl,
  collectTextBlocksFromJsonData,
  downloadImageAsBase64Payload,
  extractImageCandidatesFromHtml,
  extractImageCandidatesFromJsonData,
  extractJsonObjectsFromApplicationScripts,
  extractNextDataPayload,
  extractSizeChartPageCandidatesFromHtml,
  extractSizeChartPageCandidatesFromJsonData,
  extractSizeTableFromPage,
  extractSizeTableWithGemini,
  fetchWithTimeout,
  isLikelySizeChartImageUrl,
  launchMetadataBrowser,
  normalizeCellText,
  normalizeUrlCandidate,
  sortSizeChartImageCandidates,
  uniqValues,
}) {
  const extractSizeMetadataFromBrowserDom = async (page) => {
    const domData = await page.evaluate(() => {
      const textBlocks = [];
      const images = [];
      const links = [];
      const seenText = new Set();
      const seenImage = new Set();
      const seenLink = new Set();

      const pushText = (value) => {
        const normalized = String(value || "").replace(/\s+/g, " ").trim();
        if (!normalized || normalized.length < 8 || seenText.has(normalized)) return;
        seenText.add(normalized);
        textBlocks.push(normalized);
      };

      for (const el of Array.from(document.querySelectorAll("table, dl, ul, ol, section, article, div"))) {
        const text = String(el.textContent || "").replace(/\s+/g, " ").trim();
        if (!text) continue;
        const lower = text.toLowerCase();
        if (
          lower.includes("size") ||
          lower.includes("chart") ||
          lower.includes("guide") ||
          lower.includes("measurement") ||
          lower.includes("cm") ||
          lower.includes("사이즈") ||
          lower.includes("치수")
        ) {
          pushText(text);
        }
      }

      for (const img of Array.from(document.images)) {
        const src = String(img.currentSrc || img.src || "").trim();
        if (!src || seenImage.has(src)) continue;
        seenImage.add(src);
        images.push(src);
      }

      for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
        const href = String(anchor.href || "").trim();
        if (!href || seenLink.has(href)) continue;
        seenLink.add(href);
        links.push(href);
      }

      return {
        html: document.documentElement?.outerHTML || "",
        textBlocks,
        images,
        links,
        title: document.title || "",
      };
    });

    const sizeTable = extractSizeTableFromPage({
      html: domData?.html || "",
      textBlocks: Array.isArray(domData?.textBlocks) ? domData.textBlocks : [],
      jsonData: null,
    });
    const sizeChartImageCandidates = sortSizeChartImageCandidates(
      addImageResolutionVariants(
        uniqValues((Array.isArray(domData?.images) ? domData.images : []).filter((value) => isLikelySizeChartImageUrl(value)))
      )
    );
    const sizeChartPageCandidates = uniqValues(
      (Array.isArray(domData?.links) ? domData.links : []).filter((value) => SIZE_HINT_PATTERN.test(String(value || "")))
    );

    return {
      sizeTable: sizeTable || null,
      sizeChartImageCandidates,
      sizeChartPageCandidates,
      title: normalizeCellText(domData?.title || ""),
    };
  };

  const fetchSizeMetadataFromLinkedPageWithBrowser = async (linkedPageUrl) => {
    let safeUrl = "";
    try {
      safeUrl = assertPublicHttpUrl(linkedPageUrl);
    } catch {
      return { sizeTable: null, sizeChartImageCandidates: [], sizeChartPageCandidates: [], title: "" };
    }

    let browser = null;
    try {
      browser = await launchMetadataBrowser();
      const page = await browser.newPage({
        viewport: { width: 1440, height: 2200 },
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      });
      page.setDefaultTimeout(PRODUCT_METADATA_BROWSER_TIMEOUT_MS);
      await page.goto(safeUrl, {
        waitUntil: "domcontentloaded",
        timeout: PRODUCT_METADATA_BROWSER_TIMEOUT_MS,
      });
      await page.waitForTimeout(800);

      const sizeTriggers = page.locator("button, a, summary, [role='button'], [aria-expanded], [data-tab], [data-toggle]");
      const triggerCount = Math.min(await sizeTriggers.count(), 40);
      for (let index = 0; index < triggerCount; index += 1) {
        const handle = sizeTriggers.nth(index);
        let text = "";
        try {
          text = String(await handle.innerText({ timeout: 500 })).replace(/\s+/g, " ").trim();
        } catch {
          text = "";
        }
        if (!SIZE_HINT_PATTERN.test(text)) continue;
        try {
          await handle.click({ timeout: 1000 });
          await page.waitForTimeout(500);
        } catch {
          // no-op
        }
      }

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      const metadata = await extractSizeMetadataFromBrowserDom(page);
      await page.close();
      return metadata;
    } catch {
      return { sizeTable: null, sizeChartImageCandidates: [], sizeChartPageCandidates: [], title: "" };
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch {
          // no-op
        }
      }
    }
  };

  const fetchSizeMetadataFromLinkedPage = async (linkedPageUrl) => {
    let safeUrl = "";
    try {
      safeUrl = assertPublicHttpUrl(linkedPageUrl);
    } catch {
      return { sizeTable: null, sizeChartImageCandidates: [], sizeChartPageCandidates: [] };
    }

    try {
      const response = await fetchWithTimeout(safeUrl, {
        method: "GET",
        redirect: "follow",
        headers: {
          "user-agent": "Mozilla/5.0",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
          "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });
      if (!response.ok) return { sizeTable: null, sizeChartImageCandidates: [], sizeChartPageCandidates: [] };

      const contentType = String(response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      const finalUrl = assertPublicHttpUrl(response.url || safeUrl);
      if (contentType.startsWith("image/")) {
        return { sizeTable: null, sizeChartImageCandidates: [finalUrl], sizeChartPageCandidates: [] };
      }
      if (!contentType.includes("text/html")) {
        return { sizeTable: null, sizeChartImageCandidates: [], sizeChartPageCandidates: [] };
      }

      const html = await response.text();
      const nextDataPayload = extractNextDataPayload(html);
      const appJsonObjects = extractJsonObjectsFromApplicationScripts(html);
      const combinedJsonData = [nextDataPayload, ...appJsonObjects].filter(Boolean);
      const jsonTextBlocks = collectTextBlocksFromJsonData(combinedJsonData);
      const sizeTable = extractSizeTableFromPage({
        html,
        textBlocks: jsonTextBlocks,
        jsonData: combinedJsonData,
      });
      const jsonImageData = extractImageCandidatesFromJsonData({ jsonData: combinedJsonData, pageUrl: finalUrl });
      const sizeChartImageCandidates = sortSizeChartImageCandidates(
        addImageResolutionVariants([
          ...(jsonImageData.sizeChartCandidates || []),
          ...extractImageCandidatesFromHtml({
            html,
            pageUrl: finalUrl,
            priorityPattern: /(?:size|사이즈|치수|measurement|chart|guide|spec|cm)/i,
          }),
        ])
      ).filter((candidate) => isLikelySizeChartImageUrl(candidate));
      const sizeChartPageCandidates = uniqValues([
        ...extractSizeChartPageCandidatesFromJsonData({ jsonData: combinedJsonData, pageUrl: finalUrl }),
        ...extractSizeChartPageCandidatesFromHtml({ html, pageUrl: finalUrl }),
      ]);
      const browserMetadata =
        sizeTable || IS_VERCEL ? null : await fetchSizeMetadataFromLinkedPageWithBrowser(finalUrl);

      return {
        sizeTable:
          sizeTable ||
          alignAndValidateSizeTableByOptionLabels(browserMetadata?.sizeTable, []) ||
          browserMetadata?.sizeTable ||
          null,
        sizeChartImageCandidates: uniqValues([
          ...sizeChartImageCandidates,
          ...(browserMetadata?.sizeChartImageCandidates || []),
        ]),
        sizeChartPageCandidates: uniqValues([
          ...sizeChartPageCandidates,
          ...(browserMetadata?.sizeChartPageCandidates || []),
        ]),
      };
    } catch {
      if (IS_VERCEL) {
        return { sizeTable: null, sizeChartImageCandidates: [], sizeChartPageCandidates: [] };
      }
      return await fetchSizeMetadataFromLinkedPageWithBrowser(safeUrl);
    }
  };

  const fetchLinkedSizeMetadataDeep = async (initialUrl, { maxDepth = 2, maxPages = 4 } = {}) => {
    const queue = [{ url: initialUrl, depth: 0 }];
    const visited = new Set();
    let bestTable = null;
    const sizeChartImageCandidates = [];
    const visitedPages = [];

    while (queue.length > 0 && visited.size < Math.max(1, Number(maxPages) || 1)) {
      const current = queue.shift();
      const currentUrl = normalizeCellText(current?.url || "");
      const currentDepth = Math.max(0, Number(current?.depth) || 0);
      if (!currentUrl || visited.has(currentUrl)) continue;
      visited.add(currentUrl);
      visitedPages.push(currentUrl);

      const metadata = await fetchSizeMetadataFromLinkedPage(currentUrl);
      if (!bestTable && metadata?.sizeTable) {
        bestTable = alignAndValidateSizeTableByOptionLabels(metadata.sizeTable, []) || metadata.sizeTable;
      }
      sizeChartImageCandidates.push(...(metadata?.sizeChartImageCandidates || []));

      if (currentDepth >= Math.max(0, Number(maxDepth) || 0)) continue;
      for (const nextUrl of uniqValues(metadata?.sizeChartPageCandidates || [])) {
        if (!nextUrl || visited.has(nextUrl)) continue;
        queue.push({ url: nextUrl, depth: currentDepth + 1 });
      }
    }

    return {
      sizeTable: bestTable || null,
      sizeChartImageCandidates: uniqValues(sizeChartImageCandidates),
      visitedPages,
    };
  };

  const extractSizeTableFromImageCandidates = async (imageCandidates, { limit = 3 } = {}) => {
    const normalizedCandidates = uniqValues(imageCandidates).filter(Boolean);
    for (const candidate of normalizedCandidates.slice(0, Math.max(1, Number(limit) || 1))) {
      let payload = null;
      try {
        payload = await downloadImageAsBase64Payload(candidate, {
          minBytes: 1024,
          maxBytes: PRODUCT_METADATA_MAX_IMAGE_BYTES,
          minWidth: 160,
          minHeight: 160,
          maxAspectRatio: 6,
          includeBase64: true,
        });
      } catch {
        payload = null;
      }
      if (!payload?.base64) continue;

      const tableResult = await extractSizeTableWithGemini({
        imageBase64: payload.base64,
        mimeType: payload.mimeType || "image/png",
      });
      const validatedTable = alignAndValidateSizeTableByOptionLabels(tableResult.table, []) || null;
      if (validatedTable) {
        return {
          table: validatedTable,
          sourceUrl: payload.sourceUrl || candidate,
        };
      }
    }

    return {
      table: null,
      sourceUrl: "",
    };
  };

  return {
    extractSizeMetadataFromBrowserDom,
    fetchSizeMetadataFromLinkedPageWithBrowser,
    fetchSizeMetadataFromLinkedPage,
    fetchLinkedSizeMetadataDeep,
    extractSizeTableFromImageCandidates,
  };
}
