import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  supabase,
  assertSupabaseConfig,
} from "../../../../server/lib/supabase.js";
import { SUPABASE_STORAGE_BUCKET } from "../../../../server/config/env.js";
import {
  getRegisteredRequestUser,
  hasValidMutationOrigin,
} from "../../../../server/auth/request-user";
import {
  avatarMime,
  AVATAR_MAX_BYTES,
  ownedAvatar,
} from "../../../../server/utils/avatar";

const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

async function mutate(request: Request, remove: boolean) {
  if (!hasValidMutationOrigin(request))
    return reply({ ok: false, error: "invalid origin" }, 403);
  const user = await getRegisteredRequestUser(request);
  if (!user)
    return reply({ ok: false, error: "registered account required" }, 401);
  assertSupabaseConfig();
  const db = supabase!;
  const storage = db.storage.from(SUPABASE_STORAGE_BUCKET);
  let path: string | null = null;
  let committed = false;
  try {
    const { data: previous, error: readError } = await db
      .from("users")
      .select("avatar_path")
      .eq("id", user.id)
      .single();
    if (readError) throw readError;
    if (!remove) {
      if (
        Number(request.headers.get("content-length")) >
        AVATAR_MAX_BYTES + 65536
      )
        return reply({ ok: false, error: "Image must be under 3 MB." }, 413);
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || !file.size || file.size > AVATAR_MAX_BYTES)
        return reply({ ok: false, error: "Image must be under 3 MB." }, 400);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = avatarMime(bytes);
      if (!mime || mime !== file.type)
        return reply(
          { ok: false, error: "Use a JPEG, PNG or WebP image." },
          400
        );
      path = `avatars/${user.id}/${crypto.randomUUID()}.${mime === "image/jpeg" ? "jpg" : mime.split("/")[1]}`;
      const { error } = await storage.upload(path, bytes, {
        contentType: mime,
        upsert: false,
      });
      if (error) throw error;
    }
    // Compare-and-set avoids deleting another request's current avatar.
    let update = db
      .from("users")
      .update({ avatar_path: path })
      .eq("id", user.id);
    update = previous.avatar_path
      ? update.eq("avatar_path", previous.avatar_path)
      : update.is("avatar_path", null);
    const { data: updated, error } = await update.select("id").maybeSingle();
    if (error || !updated)
      throw error || new Error("Profile changed. Please retry.");
    committed = true;
    revalidateTag("public-digbox", { expire: 0 });
    if (ownedAvatar(previous.avatar_path, user.id)) {
      const { error: cleanupError } = await storage.remove([
        previous.avatar_path,
      ]);
      if (cleanupError)
        console.error("Avatar cleanup failed", cleanupError.message);
    }
    return reply({
      ok: true,
      data: {
        avatarUrl: path ? storage.getPublicUrl(path).data.publicUrl : null,
      },
    });
  } catch {
    if (path && !committed) await storage.remove([path]);
    return reply(
      { ok: false, error: "Could not update profile photo. Please retry." },
      500
    );
  }
}

export const POST = (request: Request) => mutate(request, false);
export const DELETE = (request: Request) => mutate(request, true);
