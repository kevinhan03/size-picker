import { createHash } from "node:crypto";
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
import { normalizeCellText } from "../../utils/size-table.js";
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

const readPngDimensions = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 24) return null;
  const signature = buffer.subarray(0, 8);
  if (!signature.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
};

const readJpegDimensions = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    if (offset + 4 > buffer.length) break;
    const length = buffer.readUInt16BE(offset + 2);
    if (!Number.isFinite(length) || length < 2) break;
    const isSofMarker =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSofMarker && offset + 9 < buffer.length) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      if (width > 0 && height > 0) return { width, height };
    }
    offset += 2 + length;
  }
  return null;
};

const readWebpDimensions = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 30) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;
    if (!Number.isFinite(chunkSize) || chunkSize < 0) break;
    if (chunkDataOffset + chunkSize > buffer.length) break;
    if (chunkType === "VP8X" && chunkSize >= 10) {
      const width = 1 + buffer.readUIntLE(chunkDataOffset + 4, 3);
      const height = 1 + buffer.readUIntLE(chunkDataOffset + 7, 3);
      if (width > 0 && height > 0) return { width, height };
    }
    if (chunkType === "VP8 " && chunkSize >= 10) {
      const frameTagOffset = chunkDataOffset;
      const startCodeOffset = frameTagOffset + 3;
      if (
        startCodeOffset + 5 < buffer.length &&
        buffer[startCodeOffset] === 0x9d &&
        buffer[startCodeOffset + 1] === 0x01 &&
        buffer[startCodeOffset + 2] === 0x2a
      ) {
        const width = buffer.readUInt16LE(startCodeOffset + 3) & 0x3fff;
        const height = buffer.readUInt16LE(startCodeOffset + 5) & 0x3fff;
        if (width > 0 && height > 0) return { width, height };
      }
    }
    if (chunkType === "VP8L" && chunkSize >= 5) {
      const b0 = buffer[chunkDataOffset + 1];
      const b1 = buffer[chunkDataOffset + 2];
      const b2 = buffer[chunkDataOffset + 3];
      const b3 = buffer[chunkDataOffset + 4];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      if (width > 0 && height > 0) return { width, height };
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  return null;
};

const getImageDimensions = (buffer, mimeType) => {
  const normalizedMimeType = String(mimeType || "").toLowerCase();
  if (normalizedMimeType === "image/png") return readPngDimensions(buffer);
  if (normalizedMimeType === "image/jpeg" || normalizedMimeType === "image/jpg") return readJpegDimensions(buffer);
  if (normalizedMimeType === "image/webp") return readWebpDimensions(buffer);
  return readPngDimensions(buffer) || readJpegDimensions(buffer) || readWebpDimensions(buffer);
};

export function createImageDownloadService({
  assessProductImageWithGemini,
  assertPublicHttpUrl,
  fetchWithTimeout,
  GEMINI_API_KEY,
}) {
  const downloadImageAsBase64Payload = async (imageUrl, {
    minBytes = 1,
    maxBytes = PRODUCT_METADATA_MAX_IMAGE_BYTES,
    minWidth = 0,
    minHeight = 0,
    maxAspectRatio = 0,
    includeBase64 = true,
  } = {}) => {
    let safeImageUrl = "";
    try {
      safeImageUrl = assertPublicHttpUrl(imageUrl);
    } catch {
      return null;
    }
    const response = await fetchWithTimeout(safeImageUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0",
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });
    if (!response.ok) return null;
    const contentType = String(response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!contentType.startsWith("image/")) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < Math.max(1, Number(minBytes) || 1)) return null;
    if (buffer.length > Math.max(1, Number(maxBytes) || PRODUCT_METADATA_MAX_IMAGE_BYTES)) return null;
    const dimensions = getImageDimensions(buffer, contentType);
    const normalizedMinWidth = Math.max(0, Number(minWidth) || 0);
    const normalizedMinHeight = Math.max(0, Number(minHeight) || 0);
    const normalizedMaxAspectRatio = Math.max(0, Number(maxAspectRatio) || 0);
    if (normalizedMinWidth > 0 || normalizedMinHeight > 0 || normalizedMaxAspectRatio > 0) {
      if (!dimensions || !dimensions.width || !dimensions.height) return null;
      if (normalizedMinWidth > 0 && dimensions.width < normalizedMinWidth) return null;
      if (normalizedMinHeight > 0 && dimensions.height < normalizedMinHeight) return null;
      if (normalizedMaxAspectRatio > 0) {
        const aspectRatio = Math.max(
          dimensions.width / Math.max(1, dimensions.height),
          dimensions.height / Math.max(1, dimensions.width)
        );
        if (aspectRatio > normalizedMaxAspectRatio) return null;
      }
    }
    return {
      sourceUrl: safeImageUrl,
      mimeType: contentType,
      base64: includeBase64 ? buffer.toString("base64") : null,
      byteLength: buffer.length,
      width: dimensions?.width || null,
      height: dimensions?.height || null,
      contentHash: createHash("sha1").update(buffer).digest("hex"),
    };
  };

  const selectTopUsableImageUrls = async (candidates, {
    excludedCandidates = [],
    excludedContentHashes = [],
    limit = 4,
    maxProbeCount = 16,
    minBytes = 1,
    maxBytes = PRODUCT_METADATA_MAX_IMAGE_BYTES,
    minWidth = 0,
    minHeight = 0,
    maxAspectRatio = 0,
  } = {}) => {
    const selected = [];
    const excluded = new Set(uniqValues(excludedCandidates));
    const seenContentHashes = new Set(
      uniqValues(excludedContentHashes).map((value) => normalizeCellText(value).toLowerCase()).filter(Boolean)
    );
    const selectedContentHashes = new Set();
    let probed = 0;
    for (const candidate of uniqValues(candidates)) {
      if (!candidate || excluded.has(candidate)) continue;
      if (selected.length >= Math.max(1, Number(limit) || 1)) break;
      if (probed >= Math.max(1, Number(maxProbeCount) || 1)) break;
      probed += 1;
      const payload = await downloadImageAsBase64Payload(candidate, {
        minBytes,
        maxBytes,
        minWidth,
        minHeight,
        maxAspectRatio,
        includeBase64: false,
      });
      if (!payload?.sourceUrl) continue;
      const contentHash = normalizeCellText(payload.contentHash || "").toLowerCase();
      if (contentHash && seenContentHashes.has(contentHash)) continue;
      if (contentHash) {
        seenContentHashes.add(contentHash);
        selectedContentHashes.add(contentHash);
      }
      selected.push(payload.sourceUrl);
    }
    return { urls: selected, contentHashes: [...selectedContentHashes] };
  };

  const selectFirstImagePayload = async (candidates, excludedCandidates = [], options = {}) => {
    const excluded = new Set(uniqValues(excludedCandidates));
    for (const candidate of uniqValues(candidates)) {
      if (!candidate || excluded.has(candidate)) continue;
      const payload = await downloadImageAsBase64Payload(candidate, options);
      if (payload) return payload;
    }
    return null;
  };

  return {
    downloadImageAsBase64Payload,
    selectFirstImagePayload,
    selectTopUsableImageUrls,
  };
}
