import { createSocialThumbnail, normalizeSocialImage } from "../../../../server/services/social-images";
import { socialThumbnailPath } from "../../../../server/services/social-image-paths";
import {
  check,
  SOCIAL_BUCKET,
  socialDb,
} from "../../../../server/services/social";
import {
  mutationAccount,
  socialResponse,
} from "../../../../server/services/social-http";
import {
  SocialError,
  uuid,
} from "../../../../server/services/social-validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return socialResponse(async () => {
    const account = await mutationAccount(request);
    if (Number(request.headers.get("content-length")) > 3 * 1024 * 1024 + 65536)
      throw new SocialError("invalid_image");
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || file.size > 3 * 1024 * 1024)
      throw new SocialError("invalid_image");
    const normalized = await normalizeSocialImage(
      Buffer.from(await file.arrayBuffer())
    );
    const db = socialDb();
    const id = crypto.randomUUID();
    const path = `${account.id}/${id}.display.webp`;
    const count = await db
      .from("social_uploads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", account.id)
      .eq("used", false)
      .gte("created_at", new Date(Date.now() - 86400000).toISOString());
    check(count.error);
    if ((count.count || 0) >= 100) throw new SocialError("upload_limit", 429);
    // Register before writing the object so even interrupted uploads are reclaimed.
    const insert = await db
      .from("social_uploads")
      .insert({
        id,
        user_id: account.id,
        path,
        width: normalized.width,
        height: normalized.height,
      });
    check(insert.error);
    const upload = await db.storage
      .from(SOCIAL_BUCKET)
      .upload(path, normalized.bytes, {
        contentType: "image/webp",
        upsert: false,
      });
    check(upload.error);
    const thumbnail = await createSocialThumbnail(normalized.bytes);
    const thumbnailUpload = await db.storage.from(SOCIAL_BUCKET).upload(
      socialThumbnailPath(path), thumbnail, { contentType: "image/webp", upsert: false },
    );
    check(thumbnailUpload.error);
    return { id, width: normalized.width, height: normalized.height };
  }, 201);
}
export async function DELETE(request: Request) {
  return socialResponse(async () => {
    const account = await mutationAccount(request);
    const { id } = await request.json();
    uuid(id);
    const result = await socialDb().rpc("social_discard_upload", {
      actor: account.id,
      upload_id: id,
    });
    check(result.error);
    return { deleted: true };
  });
}
