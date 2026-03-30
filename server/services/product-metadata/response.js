export function createProductMetadataResponseService({
  normalizeProductCategory,
  pickFirstNonEmpty,
  uniqValues,
}) {
  const buildResolvedProductMetadata = ({
    url,
    extracted,
    productImage,
    imagePath,
    productImageCandidates,
  }) => ({
    url,
    brand: extracted.brand || "",
    name: extracted.name || "",
    category: normalizeProductCategory(extracted.category || ""),
    image_path: imagePath || "",
    productImage: productImage || null,
    productImageCandidates: uniqValues(productImageCandidates || []),
  });

  const hasAnyResolvedProductMetadata = ({ extracted, productImage, productImageCandidates }) =>
    Boolean(
      extracted?.brand ||
        extracted?.name ||
        extracted?.category ||
        productImage ||
        (productImageCandidates || []).length > 0
    );

  const scoreResolvedProductMetadata = (metadata, { brand = "", name = "" } = {}) => {
    if (!metadata) return -1_000;
    const hintTokens = uniqValues(
      `${brand} ${name}`
        .trim()
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

  return {
    buildResolvedProductMetadata,
    hasAnyResolvedProductMetadata,
    scoreResolvedProductMetadata,
    pickFirstNonEmpty,
  };
}
