import { NextRequest, NextResponse } from "next/server";
import {
  getRegisteredRequestUser,
  hasValidMutationOrigin,
} from "../../../server/auth/request-user";
import {
  assertSupabaseConfig,
  supabase,
} from "../../../server/lib/supabase.js";

const BUCKET = "outfit-explorer";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type PostRow = {
  id: string;
  image_path: string;
  created_at: string;
  user_id: string | null;
  uploader_name: string | null;
};
type CommentRow = {
  id: string;
  post_id: string;
  body: string;
  created_at: string;
};

function isValidImage(file: FormDataEntryValue | null): file is File {
  return (
    file instanceof File &&
    file.size > 0 &&
    file.size <= MAX_IMAGE_BYTES &&
    IMAGE_EXTENSIONS.has(file.type)
  );
}

function imagePathFor(file: File) {
  const extension = IMAGE_EXTENSIONS.get(file.type) ?? "jpg";
  return `${crypto.randomUUID()}.${extension}`;
}

function json(payload: unknown, init?: ResponseInit) {
  const response = NextResponse.json(payload, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: NextRequest) {
  try {
    assertSupabaseConfig();
    const account = await getRegisteredRequestUser(request);
    const canManage = account?.appUsername === "Kevin_Han";

    const [
      { data: posts, error: postsError },
      { data: comments, error: commentsError },
    ] = await Promise.all([
      supabase!
        .from("outfit_explorer_posts")
        .select("id, image_path, created_at, user_id, uploader_name")
        .order("created_at", { ascending: false }),
      supabase!
        .from("outfit_explorer_comments")
        .select("id, post_id, body, created_at")
        .order("created_at", { ascending: true }),
    ]);
    if (postsError) throw postsError;
    if (commentsError) throw commentsError;

    const postRows = (posts ?? []) as PostRow[];
    const signedUrls = await Promise.all(
      postRows.map(async (post) => {
        const { data, error } = await supabase!.storage
          .from(BUCKET)
          .createSignedUrl(post.image_path, 60 * 60);
        if (error || !data?.signedUrl)
          throw error ?? new Error("이미지 URL을 만들지 못했습니다.");
        return [post.id, data.signedUrl] as const;
      })
    );
    const commentsByPost = new Map<string, CommentRow[]>();
    for (const comment of (comments ?? []) as CommentRow[]) {
      commentsByPost.set(comment.post_id, [
        ...(commentsByPost.get(comment.post_id) ?? []),
        comment,
      ]);
    }

    return json({
      ok: true,
      data: {
        posts: postRows.map((post) => ({
          id: post.id,
          imageUrl: new Map(signedUrls).get(post.id),
          createdAt: post.created_at,
          uploaderName: post.uploader_name || "익명",
          comments: commentsByPost.get(post.id) ?? [],
        })),
        canManage,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "코디 탐색 데이터를 불러오지 못했습니다.";
    return json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasValidMutationOrigin(request))
    return json(
      { ok: false, error: "허용되지 않은 요청 출처입니다." },
      { status: 403 }
    );
  const account = await getRegisteredRequestUser(request);
  if (!account)
    return json(
      { ok: false, error: "로그인한 계정만 작성할 수 있습니다." },
      { status: 401 }
    );

  try {
    assertSupabaseConfig();

    const form = await request.formData();
    const intent = String(form.get("intent") ?? "");

    if (intent === "comment") {
      const postId = String(form.get("postId") ?? "").trim();
      const body = String(form.get("body") ?? "").trim();
      if (!postId || !body || body.length > 1000) {
        return json(
          { ok: false, error: "코멘트는 1~1000자로 입력해 주세요." },
          { status: 400 }
        );
      }
      const { data: comment, error } = await supabase!
        .from("outfit_explorer_comments")
        .insert({ post_id: postId, body })
        .select("id, post_id, body, created_at")
        .single();
      if (error) throw error;
      return json({ ok: true, data: { comment } }, { status: 201 });
    }

    if (intent === "upload") {
      const file = form.get("image");
      if (!isValidImage(file)) {
        return json(
          {
            ok: false,
            error: "10MB 이하의 JPG, PNG 또는 WebP 이미지만 올릴 수 있습니다.",
          },
          { status: 400 }
        );
      }
      const path = imagePathFor(file);
      const { error: uploadError } = await supabase!.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase!
        .from("outfit_explorer_posts")
        .insert({
          image_path: path,
          user_id: account.id,
          uploader_name: account.appUsername || null,
        });
      if (insertError) {
        await supabase!.storage.from(BUCKET).remove([path]);
        throw insertError;
      }
      return json({ ok: true }, { status: 201 });
    }

    if (intent === "replace") {
      if (account.appUsername !== "Kevin_Han") {
        return json(
          { ok: false, error: "Kevin_Han 계정만 사진을 수정할 수 있습니다." },
          { status: 403 }
        );
      }
      const postId = String(form.get("postId") ?? "").trim();
      const file = form.get("image");
      if (!postId || !isValidImage(file)) {
        return json(
          {
            ok: false,
            error: "10MB 이하의 JPG, PNG 또는 WebP 이미지를 선택해 주세요.",
          },
          { status: 400 }
        );
      }
      const { data: post, error: postError } = await supabase!
        .from("outfit_explorer_posts")
        .select("image_path")
        .eq("id", postId)
        .maybeSingle();
      if (postError) throw postError;
      if (!post)
        return json(
          { ok: false, error: "사진을 찾을 수 없습니다." },
          { status: 404 }
        );

      const newPath = imagePathFor(file);
      const { error: uploadError } = await supabase!.storage
        .from(BUCKET)
        .upload(newPath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: updateError } = await supabase!
        .from("outfit_explorer_posts")
        .update({ image_path: newPath })
        .eq("id", postId);
      if (updateError) {
        await supabase!.storage.from(BUCKET).remove([newPath]);
        throw updateError;
      }
      await supabase!.storage.from(BUCKET).remove([post.image_path]);
      return json({ ok: true });
    }

    return json(
      { ok: false, error: "알 수 없는 요청입니다." },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "저장하지 못했습니다.";
    return json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasValidMutationOrigin(request))
    return json(
      { ok: false, error: "허용되지 않은 요청 출처입니다." },
      { status: 403 }
    );
  const account = await getRegisteredRequestUser(request);
  if (!account || account.appUsername !== "Kevin_Han") {
    return json(
      { ok: false, error: "Kevin_Han 계정만 사진을 삭제할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    assertSupabaseConfig();
    const payload = await request.json();
    const postId = String(payload?.postId ?? "").trim();
    if (!postId)
      return json(
        { ok: false, error: "삭제할 사진을 찾을 수 없습니다." },
        { status: 400 }
      );

    const { data: post, error: postError } = await supabase!
      .from("outfit_explorer_posts")
      .select("image_path")
      .eq("id", postId)
      .maybeSingle();
    if (postError) throw postError;
    if (!post)
      return json(
        { ok: false, error: "사진을 찾을 수 없습니다." },
        { status: 404 }
      );

    const { error: deleteError } = await supabase!
      .from("outfit_explorer_posts")
      .delete()
      .eq("id", postId);
    if (deleteError) throw deleteError;
    await supabase!.storage.from(BUCKET).remove([post.image_path]);
    return json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "사진을 삭제하지 못했습니다.";
    return json({ ok: false, error: message }, { status: 500 });
  }
}
