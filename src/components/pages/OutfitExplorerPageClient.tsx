"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

type Comment = {
  id: string;
  post_id: string;
  body: string;
  created_at: string;
};
type Post = {
  id: string;
  imageUrl: string;
  createdAt: string;
  uploaderName: string;
  comments: Comment[];
};

async function readResponse(response: Response) {
  const payload = await response.json();
  if (!response.ok || !payload?.ok)
    throw new Error(payload?.error || "요청을 처리하지 못했습니다.");
  return payload;
}

export function OutfitExplorerPageClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [submittingPostId, setSubmittingPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await readResponse(
        await fetch("/api/outfit-explorer", { credentials: "include" })
      );
      setPosts(payload.data.posts);
      setCanManage(Boolean(payload.data.canManage));
      setError(null);
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "코디 탐색 데이터를 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (file: File) => {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.set("intent", "upload");
      form.set("image", file);
      await readResponse(
        await fetch("/api/outfit-explorer", {
          method: "POST",
          credentials: "include",
          body: form,
        })
      );
      await load();
    } catch (uploadError: unknown) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "사진을 올리지 못했습니다."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addComment = async (postId: string) => {
    const body = (commentDrafts[postId] ?? "").trim();
    if (!body) return;
    setSubmittingPostId(postId);
    try {
      const form = new FormData();
      form.set("intent", "comment");
      form.set("postId", postId);
      form.set("body", body);
      const payload = await readResponse(
        await fetch("/api/outfit-explorer", {
          method: "POST",
          credentials: "include",
          body: form,
        })
      );
      const comment = payload.data?.comment as Comment | undefined;
      if (comment) {
        setPosts((current) =>
          current.map((post) =>
            post.id === postId
              ? { ...post, comments: [...post.comments, comment] }
              : post
          )
        );
        setSelectedPost((current) =>
          current?.id === postId
            ? { ...current, comments: [...current.comments, comment] }
            : current
        );
      }
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    } catch (commentError: unknown) {
      setError(
        commentError instanceof Error
          ? commentError.message
          : "코멘트를 저장하지 못했습니다."
      );
    } finally {
      setSubmittingPostId(null);
    }
  };

  const replacePhoto = async (file: File) => {
    if (!selectedPost) return;
    setIsReplacing(true);
    try {
      const form = new FormData();
      form.set("intent", "replace");
      form.set("postId", selectedPost.id);
      form.set("image", file);
      await readResponse(
        await fetch("/api/outfit-explorer", {
          method: "POST",
          credentials: "include",
          body: form,
        })
      );
      setSelectedPost(null);
      await load();
    } catch (replaceError: unknown) {
      setError(
        replaceError instanceof Error
          ? replaceError.message
          : "사진을 수정하지 못했습니다."
      );
    } finally {
      setIsReplacing(false);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  };

  const deletePhoto = async () => {
    if (!selectedPost || !window.confirm("이 사진과 모든 코멘트를 삭제할까요?"))
      return;
    setIsDeleting(true);
    try {
      await readResponse(
        await fetch("/api/outfit-explorer", {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: selectedPost.id }),
        })
      );
      setSelectedPost(null);
      await load();
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "사진을 삭제하지 못했습니다."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[calc(6rem+env(safe-area-inset-top))]">
      <div className="relative mx-auto w-full max-w-[112rem]">
        <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <button
            type="button"
            disabled={isUploading}
            aria-label={isUploading ? "사진 업로드 중" : "사진 추가"}
            title={isUploading ? "사진 업로드 중" : "사진 추가"}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-black shadow-[0_8px_20px_rgba(249,115,22,0.24)] transition hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-wait disabled:opacity-60"
          >
            {isUploading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            )}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            aria-label="새로고침"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center text-sm font-semibold text-gray-400">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            불러오는 중…
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-20 text-center">
            <ImagePlus className="mx-auto h-7 w-7 text-orange-400" />
            <p className="mt-4 font-bold text-white">
              첫 코디 사진을 올려보세요
            </p>
            <p className="mt-2 text-sm text-gray-400">
              사진마다 코멘트를 남길 수 있어요.
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-4 md:columns-3 lg:columns-5">
            {posts.map((post) => (
              <article
                key={post.id}
                className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-[#111114] shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
              >
                <button
                  type="button"
                  onClick={() => setSelectedPost(post)}
                  className="group block w-full cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Signed Supabase Storage URLs are generated at request time. */}
                  <img
                    src={post.imageUrl}
                    alt={`${post.uploaderName}님의 코디 참고 사진`}
                    className="h-auto w-full bg-white/[0.03] transition duration-200 group-hover:scale-[1.015]"
                  />
                </button>
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold text-gray-500">
                    <MessageCircle className="h-3.5 w-3.5" />
                    메모 {post.comments.length}개
                  </div>
                  <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                    {post.comments.map((comment) => (
                      <p
                        key={comment.id}
                        className="rounded-lg bg-white/[0.055] px-3 py-2 text-sm leading-relaxed text-gray-200"
                      >
                        {comment.body}
                      </p>
                    ))}
                  </div>
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void addComment(post.id);
                    }}
                  >
                    <input
                      value={commentDrafts[post.id] ?? ""}
                      maxLength={1000}
                      onChange={(event) =>
                        setCommentDrafts((current) => ({
                          ...current,
                          [post.id]: event.target.value,
                        }))
                      }
                      placeholder="코멘트 남기기"
                      className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-orange-400/70"
                    />
                    <button
                      type="submit"
                      disabled={
                        submittingPostId === post.id ||
                        !(commentDrafts[post.id] ?? "").trim()
                      }
                      className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-40"
                    >
                      저장
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedPost && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="코디 사진 상세"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative max-h-full w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#111114] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Signed Supabase Storage URLs are generated at request time. */}
            <img
              src={selectedPost.imageUrl}
              alt={`${selectedPost.uploaderName}님의 코디 참고 사진`}
              className="max-h-[78vh] w-full object-contain"
            />
            <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-sm font-bold text-white">
              <UserRound className="h-4 w-4 text-orange-400" />
              {selectedPost.uploaderName}
              {canManage && (
                <div className="ml-auto flex items-center gap-2">
                  <input
                    ref={replaceInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void replacePhoto(file);
                    }}
                  />
                  <button
                    type="button"
                    disabled={isReplacing || isDeleting}
                    onClick={() => replaceInputRef.current?.click()}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.08] px-2.5 text-xs font-bold transition hover:bg-white/[0.14] disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {isReplacing ? "수정 중" : "사진 수정"}
                  </button>
                  <button
                    type="button"
                    disabled={isReplacing || isDeleting}
                    onClick={() => void deletePhoto()}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500/15 px-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isDeleting ? "삭제 중" : "삭제"}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label="사진 상세 닫기"
              onClick={() => setSelectedPost(null)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
