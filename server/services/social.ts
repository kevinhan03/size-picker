import { supabase, assertSupabaseConfig } from "../lib/supabase.js";
import { SUPABASE_STORAGE_BUCKET } from "../config/env.js";
import type {
  PostDetail,
  PostImage,
  PostSummary,
  SocialProfileSummary,
} from "../../src/types/social";
import {
  decodeCursor,
  SocialError,
  uuid,
  validatePost,
} from "./social-validation";
import type { RegisteredRequestUser } from "../auth/request-user";

export const SOCIAL_BUCKET = "outfit-explorer";
export function socialDb() {
  assertSupabaseConfig();
  return supabase!;
}
export function check(error: { message: string } | null) {
  if (!error) return;
  const known: Record<string, number> = {
    forbidden: 403,
    unauthorized: 401,
    not_found: 404,
    conflict: 409,
    not_in_closet: 400,
    invalid_input: 400,
    invalid_upload: 400,
  };
  const code = Object.keys(known).find((k) => error.message.includes(k));
  if (code) throw new SocialError(code, known[code]);
  console.error("Social database request failed", error.message);
  throw new SocialError("server_error", 500);
}
function publicImage(path: string | null | undefined) {
  return path
    ? socialDb().storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path).data
        .publicUrl
    : null;
}
export async function profiles(ids: string[], viewer: string | null) {
  const db = socialDb();
  if (!ids.length) return new Map<string, SocialProfileSummary>();
  const [people, follows] = await Promise.all([
    db.from("users").select("id,username,avatar_path").in("id", ids),
    viewer
      ? db
          .from("social_follows")
          .select("following_id")
          .eq("follower_id", viewer)
          .in("following_id", ids)
      : Promise.resolve({ data: [], error: null }),
  ]);
  check(people.error);
  check(follows.error);
  const following = new Set((follows.data || []).map((f) => f.following_id));
  return new Map<string, SocialProfileSummary>(
    (people.data || []).map((p) => [
      p.id,
      {
        id: p.id,
        username: p.username,
        avatarUrl: publicImage(p.avatar_path),
        isFollowing: following.has(p.id),
        isSelf: p.id === viewer,
      },
    ])
  );
}

export async function searchProfiles(query: string, viewer: string | null) {
  const term = query.trim().slice(0, 20);
  if (!term) return { users: [] };
  const literalTerm = term.replace(/[\\%_]/g, "\\$&");
  const result = await socialDb()
    .from("users")
    .select("id")
    .ilike("username", `${literalTerm}%`)
    .order("username")
    .limit(6);
  check(result.error);
  const people = await profiles(
    (result.data || []).map((person) => String(person.id)),
    viewer
  );
  return {
    users: (result.data || []).flatMap(
      (person) => people.get(String(person.id)) || []
    ),
  };
}

export async function readPosts(
  ids: string[],
  account: RegisteredRequestUser | null,
  detail = false
): Promise<PostDetail[]> {
  if (!ids.length) return [];
  const db = socialDb();
  let imageQuery = db
    .from("outfit_explorer_images")
    .select("id,post_id,image_path,position,width,height")
    .in("post_id", ids)
    .order("position");
  if (!detail) imageQuery = imageQuery.eq("position", 0);
  const [posts, images, stats] = await Promise.all([
    db
      .from("outfit_explorer_posts")
      .select("id,user_id,uploader_name,caption,created_at,updated_at")
      .in("id", ids)
      .eq("status", "published"),
    imageQuery,
    db.rpc("social_post_stats", { ids, viewer: account?.id || null }),
  ]);
  check(posts.error);
  check(images.error);
  check(stats.error);
  const imageRows = images.data || [];
  const [authors, tags, urls] = await Promise.all([
    profiles(
      [
        ...new Set((posts.data || []).map((p) => p.user_id).filter(Boolean)),
      ] as string[],
      account?.id || null
    ),
    detail && imageRows.length
      ? db
          .from("outfit_explorer_tags")
          .select("id,image_id,product_id,x,y,snapshot")
          .in(
            "image_id",
            imageRows.map((i) => i.id)
          )
      : Promise.resolve({ data: [], error: null }),
    imageRows.length
      ? db.storage.from(SOCIAL_BUCKET).createSignedUrls(
          imageRows.map((i) => i.image_path),
          3600
        )
      : Promise.resolve({ data: [], error: null }),
  ]);
  check(tags.error);
  check(urls.error);
  const signed = new Map((urls.data || []).map((u) => [u.path, u.signedUrl]));
  const imageMap = new Map<string, PostImage[]>();
  for (const i of imageRows) {
    const value: PostImage = {
      id: i.id,
      url: signed.get(i.image_path) || "",
      width: i.width,
      height: i.height,
      tags: (tags.data || [])
        .filter((t) => t.image_id === i.id)
        .map((t) => ({
          id: t.id,
          productId: t.product_id == null ? null : String(t.product_id),
          x: t.x,
          y: t.y,
          product: {
            name: t.snapshot.name,
            brand: t.snapshot.brand,
            image: publicImage(t.snapshot.imagePath),
          },
        })),
    };
    imageMap.set(i.post_id, [...(imageMap.get(i.post_id) || []), value]);
  }
  type Stats = {
    post_id: string;
    likes: number;
    liked: boolean;
    saved: boolean;
    image_count: number;
  };
  const statMap = new Map(
    ((stats.data || []) as Stats[]).map((s) => [s.post_id, s])
  );
  const postMap = new Map((posts.data || []).map((p) => [p.id, p]));
  return ids.flatMap((id) => {
    const p = postMap.get(id);
    const media = imageMap.get(id);
    const stat = statMap.get(id);
    if (!p || !media?.length) return [];
    const author = authors.get(p.user_id) || null;
    return [
      {
        id: p.id,
        caption: p.caption,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        author,
        uploaderName: author?.username || p.uploader_name || "—",
        cover: {
          id: media[0].id,
          url: media[0].url,
          width: media[0].width,
          height: media[0].height,
        },
        imageCount: Number(stat?.image_count || 1),
        likeCount: Number(stat?.likes || 0),
        isLiked: !!stat?.liked,
        isSaved: !!stat?.saved,
        canManage:
          !!account &&
          (account.id === p.user_id || account.appUsername === "Kevin_Han"),
        images: media,
      },
    ];
  });
}
export async function feed(
  url: URL,
  account: RegisteredRequestUser | null,
  saved = false
) {
  const db = socialDb();
  const cursor = decodeCursor(url.searchParams.get("cursor"));
  const mode = saved
    ? "saved"
    : url.searchParams.get("feed") === "following"
      ? "following"
      : "all";
  if (mode !== "all" && !account) throw new SocialError("unauthorized", 401);
  let author: string | null = null;
  const username = url.searchParams.get("author");
  if (username) {
    const result = await db
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    check(result.error);
    if (!result.data) return { posts: [], nextCursor: null };
    author = result.data.id;
  }
  const result = await db.rpc("social_feed_ids", {
    viewer: account?.id || null,
    mode,
    author,
    before_at: cursor?.at || null,
    before_id: cursor?.id || null,
  });
  check(result.error);
  const rows = (result.data || []) as { id: string; sort_at: string }[];
  const page = rows.slice(0, 24);
  const last = page.at(-1);
  const posts: PostSummary[] = (
    await readPosts(
      page.map((p) => p.id),
      account
    )
  ).map((entry) => {
    const { images, ...post } = entry;
    void images;
    return post;
  });
  return {
    posts,
    nextCursor:
      rows.length > 24 && last
        ? Buffer.from(
            JSON.stringify({ at: last.sort_at, id: last.id })
          ).toString("base64url")
        : null,
  };
}
export async function publish(
  input: unknown,
  account: RegisteredRequestUser,
  editing: boolean
) {
  // The default boundary is one photo. Existing albums may keep their photos,
  // but editing cannot turn a single-photo post into a new album.
  const payload = validatePost(input, editing ? 10 : 1);
  const db = socialDb();
  const existingIds = new Set<string>();
  if (editing) {
    const existing = await db.from("outfit_explorer_images")
      .select("id").eq("post_id", payload.id);
    check(existing.error);
    existing.data?.forEach((image) => existingIds.add(image.id));
    if (payload.images.length > Math.max(1, existing.data?.length ?? 0))
      throw new SocialError("invalid_input");
  }
  const uploadIds = payload.images.flatMap((image) =>
    image.replacementUploadId ? [image.replacementUploadId] : !existingIds.has(image.id) ? [image.id] : []
  );
  if (uploadIds.length) {
    const uploads = await db.from("social_uploads")
      .select("id,width,height").eq("user_id", account.id).in("id", uploadIds);
    check(uploads.error);
    if (uploads.data?.length !== uploadIds.length || uploads.data.some((image) =>
      !image.width || !image.height || image.width * 4 !== image.height * 3
    )) throw new SocialError("invalid_image");
  }
  const result = await socialDb().rpc("social_publish_post", {
    actor: account.id,
    payload,
    editing,
  });
  check(result.error);
  return { id: result.data as string };
}
export async function requirePost(
  id: string,
  account: RegisteredRequestUser | null,
  owner = false
) {
  uuid(id);
  const result = await socialDb()
    .from("outfit_explorer_posts")
    .select("id,user_id")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  check(result.error);
  if (!result.data) throw new SocialError("not_found", 404);
  if (
    owner &&
    (!account ||
      (result.data.user_id !== account.id &&
        account.appUsername !== "Kevin_Han"))
  )
    throw new SocialError("forbidden", 403);
  return result.data;
}
export async function deletePost(id: string, account: RegisteredRequestUser) {
  const db = socialDb();
  await requirePost(id, account, true);
  const images = await db
    .from("outfit_explorer_images")
    .select("image_path")
    .eq("post_id", id);
  check(images.error);
  const paths = (images.data || []).map((image) => image.image_path);
  const result = await db.from("outfit_explorer_posts").delete().eq("id", id);
  check(result.error);

  // The database trigger has already queued every path. Remove the objects now
  // for immediate cleanup; leave queued failures for the scheduled retry.
  if (!paths.length) return { deleted: true, storageCleanupPending: false };
  try {
    const removed = await db.storage.from(SOCIAL_BUCKET).remove(paths);
    if (removed.error) throw removed.error;
    const done = await db.from("social_file_cleanup").delete().in("path", paths);
    if (done.error) throw done.error;
    return { deleted: true, storageCleanupPending: false };
  } catch (error) {
    console.error("Post image cleanup will retry", error);
    return { deleted: true, storageCleanupPending: true };
  }
}
export async function relation(
  id: string,
  account: RegisteredRequestUser,
  kind: "like" | "save",
  active: boolean
) {
  await requirePost(id, account);
  const table = kind === "like" ? "social_likes" : "social_saves";
  const result = active
    ? await socialDb()
        .from(table)
        .upsert(
          { user_id: account.id, post_id: id },
          { onConflict: "user_id,post_id", ignoreDuplicates: true }
        )
    : await socialDb()
        .from(table)
        .delete()
        .eq("user_id", account.id)
        .eq("post_id", id);
  check(result.error);
  return { active };
}
export async function profileSummary(username: string, viewer: string | null) {
  const db = socialDb();
  const person = await db
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  check(person.error);
  if (!person.data) throw new SocialError("not_found", 404);
  const id = person.data.id;
  const [people, posts, followers, following] = await Promise.all([
    profiles([id], viewer),
    db
      .from("outfit_explorer_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id)
      .eq("status", "published"),
    db
      .from("social_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", id),
    db
      .from("social_follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", id),
  ]);
  check(posts.error);
  check(followers.error);
  check(following.error);
  return {
    ...people.get(id)!,
    postCount: posts.count || 0,
    followerCount: followers.count || 0,
    followingCount: following.count || 0,
  };
}
export async function followUser(id: string, viewer: string, active: boolean) {
  uuid(id);
  if (id === viewer) throw new SocialError("invalid_input");
  const db = socialDb();
  const target = await db.from("users").select("id").eq("id", id).maybeSingle();
  check(target.error);
  if (!target.data) throw new SocialError("not_found", 404);
  const result = active
    ? await db
        .from("social_follows")
        .upsert(
          { follower_id: viewer, following_id: id },
          { ignoreDuplicates: true, onConflict: "follower_id,following_id" }
        )
    : await db
        .from("social_follows")
        .delete()
        .eq("follower_id", viewer)
        .eq("following_id", id);
  check(result.error);
  return { active };
}
export async function followList(
  id: string,
  kind: "followers" | "following",
  viewer: string | null,
  url: URL
) {
  uuid(id);
  const cursor = decodeCursor(url.searchParams.get("cursor"));
  const who = kind === "followers" ? "follower_id" : "following_id";
  const target = kind === "followers" ? "following_id" : "follower_id";
  let query = socialDb()
    .from("social_follows")
    .select("follower_id,following_id,created_at")
    .eq(target, id)
    .order("created_at", { ascending: false })
    .order(who, { ascending: false })
    .limit(25);
  if (cursor)
    query = query.or(
      `created_at.lt.${cursor.at},and(created_at.eq.${cursor.at},${who}.lt.${cursor.id})`
    );
  const result = await query;
  check(result.error);
  const rows = result.data || [];
  const page = rows.slice(0, 24);
  const people = await profiles(
    page.map((r) => r[who]),
    viewer
  );
  const last = page.at(-1);
  return {
    users: page.flatMap((r) => people.get(r[who]) || []),
    nextCursor:
      rows.length > 24 && last
        ? Buffer.from(
            JSON.stringify({ at: last.created_at, id: last[who] })
          ).toString("base64url")
        : null,
  };
}
