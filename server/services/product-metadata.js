export function createProductMetadataService({
  addImageResolutionVariants,
  alignAndValidateSizeTableByOptionLabels,
  assertPublicHttpUrl,
  buildProductSearchQueries,
  collectTextBlocksFromJsonData,
  downloadImageAsBase64Payload,
  extractBrandFromDescription,
  extractHtmlTitle,
  extractImageCandidatesFromHtml,
  extractImageCandidatesFromJsonData,
  extractJsonObjectsFromApplicationScripts,
  extractMetaContent,
  extractMusinsaPageData,
  extractNextDataPayload,
  extractProductImageCandidatesFromHtml,
  extractProductJsonLd,
  extractProductMetadataFromImageWithGemini,
  extractProductNameFromTitle,
  extractSearchResultUrls,
  extractSizeChartPageCandidatesFromHtml,
  extractSizeChartPageCandidatesFromJsonData,
  extractSizeTableFromImageCandidates: extractSizeTableFromImageCandidatesViaDeps,
  extractSizeTableFromPage,
  extractSizeTableWithGemini,
  extractZaraMetadataFromInditexApi,
  fetchWithTimeout,
  inferProductCategory,
  IS_VERCEL,
  isKreamProductUrl,
  isLikelyProductImageUrl,
  isLikelySizeChartImageUrl,
  isZaraProductUrl,
  launchMetadataBrowser,
  normalizeBrandName,
  normalizeCellText,
  normalizePreferredStoreUrl,
  normalizeProductCategory,
  normalizeUrlCandidate,
  pickFirstNonEmpty,
  prioritizeProductImageCandidates,
  PRODUCT_METADATA_BROWSER_TIMEOUT_MS,
  PRODUCT_METADATA_MAX_IMAGE_BYTES,
  PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO,
  PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES,
  PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT,
  PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH,
  PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS,
  PRODUCT_METADATA_SEARCH_RESULT_LIMIT,
  PRODUCT_METADATA_URL_FAST_MODE,
  scoreProductPageSearchCandidate,
  selectFirstImagePayload,
  SIZE_HINT_PATTERN,
  sortProductImageCandidates,
  sortSizeChartImageCandidates,
  toWwwHostUrl,
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
        uniqValues(
          (Array.isArray(domData?.images) ? domData.images : []).filter((value) =>
            isLikelySizeChartImageUrl(value)
          )
        )
      )
    );
    const sizeChartPageCandidates = uniqValues(
      (Array.isArray(domData?.links) ? domData.links : []).filter((value) =>
        SIZE_HINT_PATTERN.test(String(value || ""))
      )
    );

    return {
      sizeTable: sizeTable || null,
      sizeChartImageCandidates,
      sizeChartPageCandidates,
      title: normalizeCellText(domData?.title || ""),
    };
  };

  const extractProductMetadataFromUrlWithBrowser = async (rawUrl) => {
    const safeUrl = assertPublicHttpUrl(rawUrl);
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
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);

      const html = await page.content();
      const finalPageUrl = assertPublicHttpUrl(page.url() || safeUrl);
      await page.close();

      const extracted = extractProductMetadataFromHtml({
        html,
        pageUrl: finalPageUrl,
      });

      const productImageDownloadOptions = {
        minBytes: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES,
        minWidth: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH,
        minHeight: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT,
        maxAspectRatio: PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO,
      };

      let productImage = await selectFirstImagePayload(
        extracted.productImageCandidates,
        [],
        productImageDownloadOptions
      );
      if (!productImage) {
        productImage = await selectFirstImagePayload(extracted.productImageCandidates);
      }

      const { imagePath, productImageCandidates } = await prioritizeProductImageCandidates({
        primaryImage: productImage,
        candidates: extracted.productImageCandidates || [],
        brand: extracted.brand || "",
        name: extracted.name || "",
        fastMode: PRODUCT_METADATA_URL_FAST_MODE,
      });

      const hasAnyData = Boolean(
        extracted.brand ||
          extracted.name ||
          extracted.category ||
          productImage ||
          productImageCandidates.length > 0
      );
      if (!hasAnyData) {
        const emptyError = new Error("could not extract product metadata from browser-rendered url");
        emptyError.statusCode = 502;
        throw emptyError;
      }

      return {
        url: finalPageUrl,
        brand: extracted.brand || "",
        name: extracted.name || "",
        category: normalizeProductCategory(extracted.category || ""),
        image_path: imagePath || "",
        productImage: productImage || null,
        productImageCandidates,
      };
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

  const fetchSizeMetadataFromLinkedPageWithBrowser = async (linkedPageUrl) => {
    let safeUrl = "";
    try {
      safeUrl = assertPublicHttpUrl(linkedPageUrl);
    } catch {
      return {
        sizeTable: null,
        sizeChartImageCandidates: [],
        sizeChartPageCandidates: [],
        title: "",
      };
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

      const sizeTriggers = page.locator(
        "button, a, summary, [role='button'], [aria-expanded], [data-tab], [data-toggle]"
      );
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
      return {
        sizeTable: null,
        sizeChartImageCandidates: [],
        sizeChartPageCandidates: [],
        title: "",
      };
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

  const searchProductPageCandidates = async ({ brand = "", name = "", category = "" }) => {
    const queries = buildProductSearchQueries({ brand, name, category }).slice(0, 3);
    const collected = [];

    for (const query of queries) {
      const searchUrls = [
        `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
        `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      ];
      for (const searchUrl of searchUrls) {
        let html = "";
        try {
          const response = await fetchWithTimeout(
            searchUrl,
            {
              method: "GET",
              redirect: "follow",
              headers: {
                "user-agent": "Mozilla/5.0",
                accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
              },
            },
            PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS
          );
          if (!response.ok) continue;
          const contentType = String(response.headers.get("content-type") || "").toLowerCase();
          if (!contentType.includes("text/html")) continue;
          html = await response.text();
        } catch {
          html = "";
        }
        if (!html) continue;

        const resultUrls = extractSearchResultUrls(html, searchUrl)
          .filter((candidate) => scoreProductPageSearchCandidate(candidate, { brand, name }) >= 0)
          .sort(
            (left, right) =>
              scoreProductPageSearchCandidate(right, { brand, name }) -
              scoreProductPageSearchCandidate(left, { brand, name })
          );
        collected.push(...resultUrls);
        if (collected.length >= PRODUCT_METADATA_SEARCH_RESULT_LIMIT) {
          return uniqValues(collected).slice(0, PRODUCT_METADATA_SEARCH_RESULT_LIMIT);
        }
      }
    }

    return uniqValues(collected).slice(0, PRODUCT_METADATA_SEARCH_RESULT_LIMIT);
  };

  const fetchSizeMetadataFromLinkedPage = async (linkedPageUrl) => {
    let safeUrl = "";
    try {
      safeUrl = assertPublicHttpUrl(linkedPageUrl);
    } catch {
      return {
        sizeTable: null,
        sizeChartImageCandidates: [],
        sizeChartPageCandidates: [],
      };
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
      if (!response.ok) {
        return {
          sizeTable: null,
          sizeChartImageCandidates: [],
          sizeChartPageCandidates: [],
        };
      }

      const contentType = String(response.headers.get("content-type") || "")
        .split(";")[0]
        .trim()
        .toLowerCase();
      const finalUrl = assertPublicHttpUrl(response.url || safeUrl);
      if (contentType.startsWith("image/")) {
        return {
          sizeTable: null,
          sizeChartImageCandidates: [finalUrl],
          sizeChartPageCandidates: [],
        };
      }
      if (!contentType.includes("text/html")) {
        return {
          sizeTable: null,
          sizeChartImageCandidates: [],
          sizeChartPageCandidates: [],
        };
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
      const jsonImageData = extractImageCandidatesFromJsonData({
        jsonData: combinedJsonData,
        pageUrl: finalUrl,
      });
      const sizeChartImageCandidates = sortSizeChartImageCandidates(
        addImageResolutionVariants([
          ...(jsonImageData.sizeChartCandidates || []),
          ...extractImageCandidatesFromHtml({
            html,
            pageUrl: finalUrl,
            priorityPattern: /(?:size|\uC0AC\uC774\uC988|\uCE58\uC218|measurement|chart|guide|spec|cm)/i,
          }),
        ])
      ).filter((candidate) => isLikelySizeChartImageUrl(candidate));
      const sizeChartPageCandidates = uniqValues([
        ...extractSizeChartPageCandidatesFromJsonData({
          jsonData: combinedJsonData,
          pageUrl: finalUrl,
        }),
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

  const extractProductMetadataFromHtml = ({ html, pageUrl }) => {
    const title = extractHtmlTitle(html);
    const ogTitle = extractMetaContent(html, "og:title", "property");
    const description = extractMetaContent(html, "description", "name");
    const ogImage = normalizeUrlCandidate(pageUrl, extractMetaContent(html, "og:image", "property"));
    const twitterImage = normalizeUrlCandidate(pageUrl, extractMetaContent(html, "twitter:image", "name"));
    const schemaProduct = extractProductJsonLd(html);
    const nextDataPayload = extractNextDataPayload(html);
    const appJsonObjects = extractJsonObjectsFromApplicationScripts(html);
    const musinsaData = extractMusinsaPageData(nextDataPayload);
    const combinedJsonData = [nextDataPayload, ...appJsonObjects].filter(Boolean);
    const jsonImageData = extractImageCandidatesFromJsonData({ jsonData: combinedJsonData, pageUrl });

    const storeBrandFromTitle = normalizeBrandName(String(title || "").split("|").slice(1).join("|"));
    const brand = pickFirstNonEmpty([
      musinsaData?.brand,
      schemaProduct?.brand,
      extractBrandFromDescription(description),
      storeBrandFromTitle,
    ]);

    const schemaName = normalizeCellText(schemaProduct?.name || "");
    const fallbackTitle = pickFirstNonEmpty([ogTitle, title]);
    const name = pickFirstNonEmpty([
      musinsaData?.name,
      schemaName,
      extractProductNameFromTitle(fallbackTitle, brand),
    ]);
    const category = inferProductCategory(
      schemaProduct?.category,
      schemaProduct?.type,
      musinsaData?.category,
      title,
      ogTitle,
      description,
      name
    );

    const candidateGroups = [
      {
        bonus: 15,
        candidates: (musinsaData?.imageCandidates || []).map((candidate) =>
          normalizeUrlCandidate(pageUrl, candidate)
        ),
      },
      {
        bonus: 12,
        candidates: (schemaProduct?.images || []).map((candidate) =>
          normalizeUrlCandidate(pageUrl, candidate)
        ),
      },
      { bonus: 10, candidates: [ogImage, twitterImage] },
      {
        bonus: 8,
        candidates: extractProductImageCandidatesFromHtml({
          html,
          pageUrl,
        }),
      },
      { bonus: 6, candidates: jsonImageData?.productCandidates || [] },
      {
        bonus: 4,
        candidates: extractImageCandidatesFromHtml({
          html,
          pageUrl,
          priorityPattern: /(product|goods|detail|prd|item|big|large)/i,
        }),
      },
    ];

    const sourceBonusByUrl = new Map();
    const rawProductImageCandidates = [];
    for (const group of candidateGroups) {
      for (const candidate of uniqValues(group?.candidates || [])) {
        const normalizedCandidate = normalizeCellText(candidate);
        if (!normalizedCandidate) continue;
        rawProductImageCandidates.push(normalizedCandidate);
        const prevBonus = Number(sourceBonusByUrl.get(normalizedCandidate) || 0);
        if (group.bonus > prevBonus) {
          sourceBonusByUrl.set(normalizedCandidate, Number(group.bonus) || 0);
        }
      }
    }

    const productImageCandidates = sortProductImageCandidates(
      rawProductImageCandidates.filter((candidate) => isLikelyProductImageUrl(candidate)),
      `${brand} ${name}`,
      sourceBonusByUrl
    );

    return {
      brand,
      name,
      category,
      productImageCandidates,
    };
  };

  const extractProductMetadataFromUrl = async (rawUrl) => {
    let pageUrl = "";
    try {
      pageUrl = assertPublicHttpUrl(rawUrl);
    } catch (error) {
      const normalizedError = new Error(error?.message || "invalid url");
      normalizedError.statusCode = Number(error?.statusCode) || 400;
      throw normalizedError;
    }

    const preferredPageUrl = normalizePreferredStoreUrl(pageUrl);
    const pageUrlCandidates = uniqValues([
      preferredPageUrl,
      pageUrl,
      toWwwHostUrl(preferredPageUrl),
      toWwwHostUrl(pageUrl),
    ]);

    let pageResponse = null;
    let effectiveRequestedPageUrl = preferredPageUrl || pageUrl;
    let lastFetchDetail = "";

    for (const candidatePageUrl of pageUrlCandidates) {
      if (!candidatePageUrl) continue;
      try {
        const response = await fetchWithTimeout(candidatePageUrl, {
          method: "GET",
          redirect: "follow",
          headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "cache-control": "no-cache",
            pragma: "no-cache",
          },
        });

        if (!response.ok) {
          lastFetchDetail = `${response.status} ${response.statusText}`;
          continue;
        }

        const responseContentType = String(response.headers.get("content-type") || "").toLowerCase();
        if (!responseContentType.includes("text/html")) {
          lastFetchDetail = `non-html response: ${responseContentType || "unknown content-type"}`;
          continue;
        }

        pageResponse = response;
        effectiveRequestedPageUrl = candidatePageUrl;
        break;
      } catch (error) {
        lastFetchDetail = error?.message || "request failed";
      }
    }

    if (!pageResponse) {
      if (!IS_VERCEL && isKreamProductUrl(pageUrl)) {
        return await extractProductMetadataFromUrlWithBrowser(pageUrl);
      }
      const fetchError = new Error("failed to fetch product page");
      fetchError.statusCode = 502;
      fetchError.detail = lastFetchDetail || "unknown error";
      throw fetchError;
    }

    const html = await pageResponse.text();
    const finalPageUrl = assertPublicHttpUrl(pageResponse.url || effectiveRequestedPageUrl);
    const extracted = extractProductMetadataFromHtml({
      html,
      pageUrl: finalPageUrl,
    });

    const productImageDownloadOptions = {
      minBytes: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES,
      minWidth: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH,
      minHeight: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT,
      maxAspectRatio: PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO,
    };

    let productImage = await selectFirstImagePayload(
      extracted.productImageCandidates,
      [],
      productImageDownloadOptions
    );
    if (!productImage) {
      productImage = await selectFirstImagePayload(extracted.productImageCandidates);
    }

    const { imagePath, productImageCandidates } = await prioritizeProductImageCandidates({
      primaryImage: productImage,
      candidates: extracted.productImageCandidates || [],
      brand: extracted.brand || "",
      name: extracted.name || "",
      fastMode: PRODUCT_METADATA_URL_FAST_MODE,
    });

    const hasAnyData = Boolean(
      extracted.brand ||
        extracted.name ||
        extracted.category ||
        productImage ||
        productImageCandidates.length > 0
    );
    if (!hasAnyData) {
      if (!IS_VERCEL && isKreamProductUrl(finalPageUrl)) {
        return await extractProductMetadataFromUrlWithBrowser(finalPageUrl);
      }
      if (isZaraProductUrl(finalPageUrl)) {
        const zaraData = await extractZaraMetadataFromInditexApi(finalPageUrl);
        if (zaraData) return zaraData;
      }
      const emptyError = new Error("could not extract product metadata from url");
      emptyError.statusCode = 502;
      throw emptyError;
    }

    return {
      url: finalPageUrl,
      brand: extracted.brand || "",
      name: extracted.name || "",
      category: normalizeProductCategory(extracted.category || ""),
      image_path: imagePath || "",
      productImage: productImage || null,
      productImageCandidates,
    };
  };

  const scoreResolvedProductMetadata = (metadata, { brand = "", name = "" } = {}) => {
    if (!metadata) return -1_000;
    const hintTokens = uniqValues(
      `${normalizeCellText(brand)} ${normalizeCellText(name)}`
        .toLowerCase()
        .split(/\s+/)
        .filter((value) => value.length >= 2)
    );
    const metadataText = `${metadata.brand || ""} ${metadata.name || ""} ${metadata.url || ""}`.toLowerCase();
    let score = 0;
    if (metadata.image_path) score += 15;
    if (metadata.productImageCandidates?.length) score += 8;
    if (metadata.brand) score += 4;
    if (metadata.name) score += 8;
    for (const token of hintTokens) {
      if (metadataText.includes(token)) score += 2;
    }
    return score;
  };

  const resolveProductMetadataFromHints = async ({
    brand = "",
    name = "",
    category = "",
    preferredUrl = "",
  }) => {
    const candidateUrls = uniqValues([
      preferredUrl,
      ...(await searchProductPageCandidates({ brand, name, category })),
    ]).filter(Boolean);

    let bestMetadata = null;
    let bestScore = -1_000;
    for (const candidateUrl of candidateUrls) {
      let metadata = null;
      try {
        metadata = await extractProductMetadataFromUrl(candidateUrl);
      } catch {
        metadata = null;
      }
      if (!metadata) continue;
      const score = scoreResolvedProductMetadata(metadata, { brand, name });
      if (score > bestScore) {
        bestScore = score;
        bestMetadata = metadata;
      }
      if (score >= 24) break;
    }

    return {
      metadata: bestMetadata,
      candidateUrls,
    };
  };

  return {
    extractProductMetadataFromUrl,
    extractProductMetadataFromUrlWithBrowser,
    extractSizeTableFromImageCandidates:
      extractSizeTableFromImageCandidatesViaDeps || extractSizeTableFromImageCandidates,
    fetchLinkedSizeMetadataDeep,
    resolveProductMetadataFromHints,
  };
}
