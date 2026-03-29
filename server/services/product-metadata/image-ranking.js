import {
  PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK,
  PRODUCT_METADATA_GEMINI_IMAGE_RERANK_LIMIT,
  PRODUCT_METADATA_GEMINI_IMAGE_SCAN_LIMIT,
  PRODUCT_METADATA_MAX_GEMINI_IMAGE_TRIES,
  PRODUCT_METADATA_MAX_IMAGE_BYTES,
  PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO,
  PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES,
  PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT,
  PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH,
} from "../../config/env.js";
import {
  addImageResolutionVariants,
  buildProductImageRankingSeed,
  isLikelyProductImageUrl,
  isModelLikeProductImageCandidate,
  isStrongProductOnlyProductImageCandidate,
  scoreProductImageCandidate,
  shouldSkipGeminiImageRerank,
  sortProductImageCandidates,
} from "./images.js";
import { pickFirstNonEmpty, uniqValues } from "./shared.js";

const PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN =
  /(?:look|model|wear|coordi|campaign|editorial|style|outfit|fitview|snap)/i;
const PRODUCT_IMAGE_SELECTION_LIMIT = Math.max(
  8,
  Number(process.env.PRODUCT_METADATA_PRODUCT_IMAGE_SELECTION_LIMIT) || 24
);
const PRODUCT_IMAGE_VALIDATION_LIMIT = Math.max(
  4,
  Math.min(
    PRODUCT_IMAGE_SELECTION_LIMIT,
    Number(process.env.PRODUCT_METADATA_PRODUCT_IMAGE_VALIDATION_LIMIT) || 8
  )
);

export function createProductImageRankingService({
  assessProductImageWithGemini,
  downloadImageAsBase64Payload,
  selectTopUsableImageUrls,
}) {
  const rerankProductImageCandidatesByModelVisibility = async (
    candidateUrls,
    { brand = "", name = "" } = {}
  ) => {
    const normalizedCandidates = uniqValues(candidateUrls);
    if (!PRODUCT_METADATA_ENABLE_GEMINI_IMAGE_RERANK) return normalizedCandidates;
    if (normalizedCandidates.length <= 1) return normalizedCandidates;

    const limit = Math.max(
      1,
      Math.min(
        Math.max(
          Number(PRODUCT_METADATA_GEMINI_IMAGE_RERANK_LIMIT) || 6,
          Number(PRODUCT_METADATA_GEMINI_IMAGE_SCAN_LIMIT) || 12
        ),
        Number(PRODUCT_METADATA_MAX_GEMINI_IMAGE_TRIES) || 10,
        normalizedCandidates.length
      )
    );

    const assessed = [];
    for (const candidate of normalizedCandidates.slice(0, limit)) {
      let payload = null;
      try {
        payload = await downloadImageAsBase64Payload(candidate, {
          minBytes: Math.max(1024, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES / 2),
          maxBytes: PRODUCT_METADATA_MAX_IMAGE_BYTES,
          minWidth: Math.max(120, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH / 2),
          minHeight: Math.max(120, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT / 2),
          maxAspectRatio: Math.max(2.8, PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO || 3.2),
          includeBase64: true,
        });
      } catch {
        payload = null;
      }
      if (!payload?.base64) continue;

      const assessment = await assessProductImageWithGemini({
        imageBase64: payload.base64,
        mimeType: payload.mimeType || "image/jpeg",
        brand,
        name,
      });
      if (!assessment) continue;

      let score = Number(assessment.productOnlyScore) || 0;
      const pathLower = (() => {
        try {
          return String(new URL(candidate).pathname || "").toLowerCase();
        } catch {
          return "";
        }
      })();
      if (/\/web\/product\/big\//i.test(pathLower)) score += 10;
      else if (/\/web\/product\/medium\//i.test(pathLower)) score += 7;
      else if (/\/goods_img\//i.test(pathLower)) score += 6;
      else if (/\/prd_img\//i.test(pathLower)) score += 2;
      if (/\/web\/product\/small\//i.test(pathLower)) score -= 6;
      if (/\/web\/product\/extra\//i.test(pathLower)) score -= 14;
      if (PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN.test(pathLower)) score -= 28;
      if (isStrongProductOnlyProductImageCandidate(candidate, `${brand} ${name}`)) score += 12;

      if (assessment.hasVisiblePerson) {
        if (assessment.personArea === "large") score -= 70;
        else if (assessment.personArea === "medium") score -= 50;
        else if (assessment.personArea === "small") score -= 30;
        else score -= 24;
      } else {
        score += 24;
      }
      score += Math.round((Number(assessment.frontViewScore) || 0) * 0.5);

      assessed.push({
        url: candidate,
        score,
        hasVisiblePerson: assessment.hasVisiblePerson,
        frontViewScore: assessment.frontViewScore,
      });
    }

    if (assessed.length === 0) return normalizedCandidates;
    const assessedByUrl = new Map(assessed.map((entry) => [entry.url, entry]));
    const hasPersonFreeCandidate = assessed.some((entry) => !entry.hasVisiblePerson);
    const assessedForSorting = hasPersonFreeCandidate
      ? assessed.filter((entry) => !entry.hasVisiblePerson)
      : assessed;

    const sortedAssessedUrls = assessedForSorting
      .slice()
      .sort((left, right) => {
        if (hasPersonFreeCandidate && left.hasVisiblePerson !== right.hasVisiblePerson) {
          return left.hasVisiblePerson ? 1 : -1;
        }
        if (right.score !== left.score) return right.score - left.score;
        if ((right.frontViewScore || 0) !== (left.frontViewScore || 0)) {
          return (right.frontViewScore || 0) - (left.frontViewScore || 0);
        }
        return normalizedCandidates.indexOf(left.url) - normalizedCandidates.indexOf(right.url);
      })
      .map((entry) => entry.url);

    const unresolvedCandidates = normalizedCandidates.filter((url) => !assessedByUrl.has(url));
    const filteredUnresolvedCandidates = hasPersonFreeCandidate
      ? unresolvedCandidates.filter((url) => {
          try {
            const pathname = String(new URL(url).pathname || "").toLowerCase();
            return !PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN.test(pathname);
          } catch {
            return true;
          }
        })
      : unresolvedCandidates;
    const deferredModelCandidates = hasPersonFreeCandidate
      ? unresolvedCandidates.filter((url) => {
          try {
            const pathname = String(new URL(url).pathname || "").toLowerCase();
            return PRODUCT_IMAGE_MODEL_LIKE_PATH_PATTERN.test(pathname);
          } catch {
            return false;
          }
        })
      : [];

    return uniqValues([
      ...sortedAssessedUrls,
      ...filteredUnresolvedCandidates,
      ...deferredModelCandidates,
    ]);
  };

  const prioritizeProductImageCandidates = async ({
    primaryImage = null,
    candidates = [],
    brand = "",
    name = "",
    sourceBonusByUrl = null,
    fastMode = false,
  }) => {
    const metadataHint = `${brand || ""} ${name || ""}`.trim();
    const mergedProductImageCandidates = sortProductImageCandidates(
      addImageResolutionVariants([
        primaryImage?.sourceUrl || "",
        ...(Array.isArray(candidates) ? candidates : []),
      ]).filter((candidate) => isLikelyProductImageUrl(candidate)),
      metadataHint,
      sourceBonusByUrl
    );
    const coreProductPathPattern = /(?:\/web\/product\/|\/goods_img\/|\/prd_img\/)/i;
    const likelyProductImageCandidates = mergedProductImageCandidates.filter(
      (candidate) => scoreProductImageCandidate(candidate, metadataHint) >= 0
    );
    const coreLikelyCandidates = likelyProductImageCandidates.filter((candidate) =>
      coreProductPathPattern.test(String(candidate || ""))
    );
    const baseLikelyCandidates =
      coreLikelyCandidates.length > 0 ? coreLikelyCandidates : likelyProductImageCandidates;
    const mergedCoreCandidates = mergedProductImageCandidates.filter((candidate) =>
      coreProductPathPattern.test(String(candidate || ""))
    );
    const baseMergedCandidates =
      coreLikelyCandidates.length > 0 ? mergedCoreCandidates : mergedProductImageCandidates;

    const isExtraProductPath = (candidate) => /\/web\/product\/extra\//i.test(String(candidate || ""));
    const isSmallProductPath = (candidate) => /\/web\/product\/small\//i.test(String(candidate || ""));

    const mergedNonExtraCandidates = baseMergedCandidates.filter(
      (candidate) => !isExtraProductPath(candidate)
    );
    const nonExtraLikelyCandidates = baseLikelyCandidates.filter(
      (candidate) => !isExtraProductPath(candidate)
    );
    const primaryLikelyCandidates = nonExtraLikelyCandidates.filter(
      (candidate) => !isSmallProductPath(candidate)
    );
    const smallLikelyCandidates = nonExtraLikelyCandidates.filter((candidate) =>
      isSmallProductPath(candidate)
    );
    const extraLikelyCandidates = baseLikelyCandidates.filter((candidate) =>
      isExtraProductPath(candidate)
    );
    const fallbackLikelyCandidates = baseLikelyCandidates;
    const fallbackMergedCandidates =
      mergedNonExtraCandidates.length > 0 ? mergedNonExtraCandidates : baseMergedCandidates;

    const prioritizedCandidates = uniqValues([
      ...primaryLikelyCandidates,
      ...smallLikelyCandidates,
      ...extraLikelyCandidates,
      ...fallbackLikelyCandidates,
      ...fallbackMergedCandidates,
    ]);
    const validationLimit = fastMode
      ? Math.max(2, Math.min(3, PRODUCT_IMAGE_VALIDATION_LIMIT))
      : PRODUCT_IMAGE_VALIDATION_LIMIT;
    const validationProbeLimit = fastMode
      ? Math.max(4, validationLimit * 2)
      : Math.max(12, validationLimit * 2);
    const validatedPrimary = await selectTopUsableImageUrls(prioritizedCandidates, {
      excludedCandidates: [primaryImage?.sourceUrl || ""],
      excludedContentHashes: [primaryImage?.contentHash || ""],
      limit: validationLimit,
      maxProbeCount: validationProbeLimit,
      minBytes: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES,
      maxBytes: PRODUCT_METADATA_MAX_IMAGE_BYTES,
      minWidth: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH,
      minHeight: PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT,
      maxAspectRatio: Math.min(PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO || 3.2, 2.8),
    });
    const validatedSecondary =
      validatedPrimary.urls.length >= validationLimit
        ? { urls: [], contentHashes: [] }
        : await selectTopUsableImageUrls(prioritizedCandidates, {
            excludedCandidates: [primaryImage?.sourceUrl || "", ...validatedPrimary.urls],
            excludedContentHashes: [
              primaryImage?.contentHash || "",
              ...validatedPrimary.contentHashes,
            ],
            limit: Math.max(1, validationLimit - validatedPrimary.urls.length),
            maxProbeCount: validationProbeLimit,
            minBytes: Math.max(1024, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_BYTES / 2),
            maxBytes: PRODUCT_METADATA_MAX_IMAGE_BYTES,
            minWidth: Math.max(120, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_WIDTH / 2),
            minHeight: Math.max(120, PRODUCT_METADATA_MIN_PRODUCT_IMAGE_HEIGHT / 2),
            maxAspectRatio: Math.max(2.8, PRODUCT_METADATA_MAX_PRODUCT_IMAGE_ASPECT_RATIO || 3.2),
          });
    const validatedProductImageCandidates = uniqValues([
      ...validatedPrimary.urls,
      ...validatedSecondary.urls,
    ]);
    const heuristicCandidatePool = uniqValues([
      primaryImage?.sourceUrl || "",
      ...validatedProductImageCandidates,
      ...prioritizedCandidates,
    ]).filter(Boolean);
    const candidateSeedForRanking = fastMode
      ? heuristicCandidatePool.slice(0, Math.max(validationLimit, 6))
      : buildProductImageRankingSeed(heuristicCandidatePool, metadataHint);
    const rerankedProductImageCandidates = fastMode
      ? candidateSeedForRanking
      : shouldSkipGeminiImageRerank(candidateSeedForRanking, metadataHint)
        ? candidateSeedForRanking
        : await rerankProductImageCandidatesByModelVisibility(candidateSeedForRanking, {
            brand,
            name,
          });
    const combinedProductImageCandidates = uniqValues([
      ...rerankedProductImageCandidates,
      ...validatedProductImageCandidates,
      ...prioritizedCandidates,
    ]);
    const nonModelProductImageCandidates = combinedProductImageCandidates.filter(
      (candidate) => !isModelLikeProductImageCandidate(candidate, metadataHint)
    );
    const modelLikeProductImageCandidates = combinedProductImageCandidates.filter((candidate) =>
      isModelLikeProductImageCandidate(candidate, metadataHint)
    );
    const productImageCandidates = (
      nonModelProductImageCandidates.length > 0
        ? [...nonModelProductImageCandidates, ...modelLikeProductImageCandidates]
        : combinedProductImageCandidates
    ).slice(0, PRODUCT_IMAGE_SELECTION_LIMIT);
    const imagePath = pickFirstNonEmpty([...productImageCandidates, primaryImage?.sourceUrl || ""]);

    return {
      imagePath,
      productImageCandidates,
    };
  };

  return {
    prioritizeProductImageCandidates,
    rerankProductImageCandidatesByModelVisibility,
  };
}
