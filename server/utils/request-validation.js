const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_INLINE_IMAGE_BYTES = 8 * 1024 * 1024;

export const getBearerTokenFromRequest = (request) =>
  String(request?.headers?.get?.("authorization") || "")
    .replace(/^Bearer\s+/i, "")
    .trim();

export const makeHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const normalizeImageMimeType = (value) => {
  const normalized = String(value || "image/png").split(";")[0].trim().toLowerCase();
  if (normalized === "image/jpg") return "image/jpeg";
  return normalized;
};

export const validateInlineImageInput = ({
  imageBase64,
  mimeType = "image/png",
  maxBytes = MAX_INLINE_IMAGE_BYTES,
}) => {
  const normalizedBase64 = String(imageBase64 || "").trim();
  const normalizedMimeType = normalizeImageMimeType(mimeType);

  if (!normalizedBase64) throw makeHttpError("imageBase64 is required", 400);
  if (!ALLOWED_IMAGE_MIME_TYPES.has(normalizedMimeType)) {
    throw makeHttpError("unsupported image type", 400);
  }
  if (!/^[A-Za-z0-9+/=\s_-]+$/.test(normalizedBase64)) {
    throw makeHttpError("imageBase64 is invalid", 400);
  }

  const estimatedBytes = Math.floor((normalizedBase64.replace(/\s/g, "").length * 3) / 4);
  if (estimatedBytes > maxBytes) {
    throw makeHttpError("image is too large", 413);
  }

  return {
    imageBase64: normalizedBase64,
    mimeType: normalizedMimeType,
  };
};

