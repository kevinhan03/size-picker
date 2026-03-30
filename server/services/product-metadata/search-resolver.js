export function createProductMetadataSearchResolver({
  PRODUCT_METADATA_SEARCH_FETCH_TIMEOUT_MS,
  PRODUCT_METADATA_SEARCH_RESULT_LIMIT,
  assertPublicHttpUrl,
  buildProductSearchQueries,
  extractSearchResultUrls,
  fetchWithTimeout,
  scoreProductPageSearchCandidate,
  uniqValues,
}) {
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
          .filter((candidate) => {
            try {
              assertPublicHttpUrl(candidate);
              return scoreProductPageSearchCandidate(candidate, { brand, name }) >= 0;
            } catch {
              return false;
            }
          })
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

  return {
    searchProductPageCandidates,
  };
}
