import type { PostInput } from "../../src/types/social";

export class SocialError extends Error {
  constructor(
    public code: string,
    public status = 400
  ) {
    super(code);
  }
}
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function uuid(value: string) {
  if (!UUID.test(value)) throw new SocialError("invalid_input");
  return value;
}
export function validatePost(value: unknown, maxImages = 1): PostInput {
  if (!value || typeof value !== "object")
    throw new SocialError("invalid_input");
  const p = value as PostInput;
  uuid(p.id);
  if (
    typeof p.caption !== "string" ||
    p.caption.length > 2200 ||
    !Array.isArray(p.images) ||
    p.images.length < 1 ||
    p.images.length > maxImages
  )
    throw new SocialError("invalid_input");
  if (new Set(p.images.map((i) => i.id)).size !== p.images.length)
    throw new SocialError("invalid_input");
  for (const i of p.images) {
    uuid(i.id);
    if (i.replacementUploadId) uuid(i.replacementUploadId);
    if (!Array.isArray(i.tags) || i.tags.length > 10)
      throw new SocialError("invalid_input");
    for (const t of i.tags) {
      if (t.existingTagId) uuid(t.existingTagId);
      if (
        (!t.productId && !t.existingTagId) ||
        (t.productId && !/^\d+$/.test(t.productId)) ||
        !Number.isFinite(t.x) ||
        !Number.isFinite(t.y) ||
        t.x < 0 ||
        t.x > 1 ||
        t.y < 0 ||
        t.y > 1
      )
        throw new SocialError("invalid_input");
    }
  }
  if (p.updatedAt && !Number.isFinite(Date.parse(p.updatedAt)))
    throw new SocialError("invalid_input");
  return p;
}
export function decodeCursor(
  value: string | null
): { at: string; id: string } | null {
  if (!value) return null;
  try {
    const result = JSON.parse(Buffer.from(value, "base64url").toString());
    uuid(result.id);
    if (
      typeof result.at !== "string" ||
      !/^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|[+-]\d\d:\d\d)$/.test(result.at) ||
      !Number.isFinite(Date.parse(result.at))
    )
      throw new Error();
    return result;
  } catch {
    throw new SocialError("invalid_input");
  }
}
