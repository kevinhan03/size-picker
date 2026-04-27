import { createLinkedSizeMetadataService } from "./product-metadata/linked-size-metadata.js";
import { createProductMetadataResponseService } from "./product-metadata/response.js";
import { createProductMetadataSearchResolver } from "./product-metadata/search-resolver.js";

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
  const response = createProductMetadataResponseService({
    normalizeProductCategory,
    pickFirstNonEmpty,
    uniqValues,
  });

  const linkedSizeMetadata = createLinkedSizeMetadataService({
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
  });

  const searchResolver = createProductMetadataSearchResolver({
    PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS,
    PRODUCT_METADATA_SEARCH_RESULT_LIMIT,
    assertPublicHttpUrl,
    buildProductSearchQueries,
    extractSearchResultUrls,
    fetchWithTimeout,
    scoreProductPageSearchCandidate,
    uniqValues,
  });

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
    const rawBrand = response.pickFirstNonEmpty([
      musinsaData?.brand,
      schemaProduct?.brand,
      extractBrandFromDescription(description),
      storeBrandFromTitle,
    ]);
    const brand = normalizeBrandName(rawBrand);

    const schemaName = normalizeCellText(schemaProduct?.name || "");
    const fallbackTitle = response.pickFirstNonEmpty([ogTitle, title]);
    const name = response.pickFirstNonEmpty([
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

      if (!response.hasAnyResolvedProductMetadata({ extracted, productImage, productImageCandidates })) {
        const emptyError = new Error("could not extract product metadata from browser-rendered url");
        emptyError.statusCode = 502;
        throw emptyError;
      }

      return response.buildResolvedProductMetadata({
        url: finalPageUrl,
        extracted,
        productImage,
        imagePath,
        productImageCandidates,
      });
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

    if (!response.hasAnyResolvedProductMetadata({ extracted, productImage, productImageCandidates })) {
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

    return response.buildResolvedProductMetadata({
      url: finalPageUrl,
      extracted,
      productImage,
      imagePath,
      productImageCandidates,
    });
  };

  const resolveProductMetadataFromHints = async ({
    brand = "",
    name = "",
    category = "",
    preferredUrl = "",
  }) => {
    const candidateUrls = uniqValues([
      preferredUrl,
      ...(await searchResolver.searchProductPageCandidates({ brand, name, category })),
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
      const score = response.scoreResolvedProductMetadata(metadata, { brand, name });
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
      extractSizeTableFromImageCandidatesViaDeps || linkedSizeMetadata.extractSizeTableFromImageCandidates,
    fetchLinkedSizeMetadataDeep: linkedSizeMetadata.fetchLinkedSizeMetadataDeep,
    resolveProductMetadataFromHints,
  };
}
