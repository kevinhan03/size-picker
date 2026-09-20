import { NextResponse } from "next/server";
import {
  MAX_SOCIAL_SOURCE_IMAGE_BYTES,
  normalizeSocialImage,
} from "../../../../server/services/social-images";
import { mutationAccount } from "../../../../server/services/social-http";
import { SocialError } from "../../../../server/services/social-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await mutationAccount(request);
    if (
      Number(request.headers.get("content-length")) >
      MAX_SOCIAL_SOURCE_IMAGE_BYTES + 65536
    )
      throw new SocialError("invalid_image");
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || !file.size || file.size > MAX_SOCIAL_SOURCE_IMAGE_BYTES)
      throw new SocialError("invalid_image");
    const normalized = await normalizeSocialImage(
      Buffer.from(await file.arrayBuffer()),
      MAX_SOCIAL_SOURCE_IMAGE_BYTES
    );
    return new NextResponse(new Uint8Array(normalized.bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "image/webp",
      },
    });
  } catch (error) {
    if (!(error instanceof SocialError))
      console.error("Social image preparation failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof SocialError ? error.code : "server_error" },
      {
        status: error instanceof SocialError ? error.status : 500,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }
}
