"use client";
/* eslint-disable @next/next/no-img-element -- Signed post media preserves original proportions. */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Bookmark, Heart, UserRound } from "lucide-react";
import type { PostPage, PostSummary } from "../../types/social";
import {
  socialFetch,
  socialRevision,
  changed,
  useSocialAuth,
  useSocialVersion,
} from "./client";
import { socialError, useSocialMessages } from "./messages";
import { SocialFeedLoadingCards } from "./SocialFeedLoadingSkeleton";
import "./social.css";
const feedCache = new Map<
  string,
  { data: PostPage; scroll: number; expires: number; revision: number }
>();
export function PostFeed({
  author,
  saved = false,
  following = false,
  action,
  emptyContent,
  photoOnly = false,
}: {
  author?: string;
  saved?: boolean;
  following?: boolean;
  action?: ReactNode;
  emptyContent?: ReactNode;
  photoOnly?: boolean;
}) {
  const c = useSocialMessages();
  const auth = useSocialAuth();
  const version = useSocialVersion();
  const endpoint = saved
    ? "/api/saved-posts"
    : `/api/outfit-explorer?${new URLSearchParams({ ...(author ? { author } : {}), ...(following ? { feed: "following" } : {}) })}`;
  const key = `${auth.userId || "guest"}:${endpoint}`;
  const [data, setData] = useState<PostPage>({ posts: [], nextCursor: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const lastRevision = useRef(socialRevision());
  const sentinel = useRef<HTMLDivElement>(null);
  const load = useCallback(
    async (cursor?: string, fresh = false) => {
      if (lock.current) return;
      lock.current = true;
      const gen = generation.current;
      setLoading(true);
      try {
        const result = await socialFetch<PostPage>(
          endpoint +
            (cursor
              ? `${endpoint.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}`
              : ""),
          fresh ? { cache: "no-store" } : undefined
        );
        if (gen !== generation.current) return;
        setData((previous) => {
          const next = cursor
            ? {
                posts: [
                  ...previous.posts,
                  ...result.posts.filter(
                    (p) => !previous.posts.some((q) => q.id === p.id)
                  ),
                ],
                nextCursor: result.nextCursor,
              }
            : result;
          feedCache.set(key, {
            data: next,
            scroll: 0,
            expires: Date.now() + 5 * 60000,
            revision: socialRevision(),
          });
          return next;
        });
        setError(null);
      } catch (e) {
        if (gen === generation.current) setError(e);
      } finally {
        if (gen === generation.current) {
          setLoading(false);
          lock.current = false;
        }
      }
    },
    [endpoint, key]
  );
  useEffect(() => {
    generation.current++;
    lock.current = false;
    setError(null);
    const cached = feedCache.get(key);
    if (
      cached &&
      cached.expires > Date.now() &&
      cached.revision === socialRevision()
    ) {
      setData(cached.data);
      setLoading(false);
      requestAnimationFrame(() => window.scrollTo(0, cached.scroll));
    } else {
      setData({ posts: [], nextCursor: null });
      void load();
    }
    const currentGeneration = generation;
    return () => {
      currentGeneration.current++;
      lock.current = false;
    };
  }, [key, load]);
  useEffect(() => {
    if (lastRevision.current !== version) {
      lastRevision.current = version;
      feedCache.clear();
      generation.current++;
      lock.current = false;
      void load(undefined, true);
    }
  }, [version, load]);
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !data.nextCursor || loading || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void load(data.nextCursor!);
      },
      { rootMargin: "300px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [data.nextCursor, loading, error, load]);
  function remember() {
    feedCache.set(key, {
      data,
      scroll: window.scrollY,
      expires: Date.now() + 5 * 60000,
      revision: socialRevision(),
    });
  }
  return (
    <>
      {!loading && !error && data.posts.length > 0 && action ? (
        <div className="social-feed-toolbar">{action}</div>
      ) : null}
      <div className="social-grid">
        {data.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onOpen={remember}
            hideCaption={!author && !saved}
            showQuickActions={!author && !saved}
            photoOnly={photoOnly}
          />
        ))}
        {loading && data.posts.length === 0 && (
          <SocialFeedLoadingCards photoOnly={photoOnly} />
        )}
      </div>
      {!loading && !error && data.posts.length === 0 && (
        <div className="social-empty">
          {emptyContent ?? (saved ? c.emptySaved : following ? c.emptyFollow : c.empty)}
        </div>
      )}
      {error ? (
        <div className="social-error" role="alert">
          {socialError(error, c)}{" "}
          <button
            className="social-button"
            onClick={() => void load(data.nextCursor || undefined)}
          >
            {c.retry}
          </button>
        </div>
      ) : null}
      <div ref={sentinel} className="social-load">
        {loading ? (
          <span className="social-muted" role="status">
            {c.loading}
          </span>
        ) : data.nextCursor ? (
          <button
            className="social-button"
            onClick={() => void load(data.nextCursor!)}
          >
            {c.more}
          </button>
        ) : null}
      </div>
    </>
  );
}
export function PostCard({
  post,
  onOpen,
  hideCaption = false,
  showQuickActions = false,
  photoOnly = false,
}: {
  post: PostSummary;
  onOpen?: () => void;
  hideCaption?: boolean;
  showQuickActions?: boolean;
  photoOnly?: boolean;
}) {
  const c = useSocialMessages();
  const auth = useSocialAuth();
  const lock = useRef(false);
  const [busy, setBusy] = useState<"like" | "save" | null>(null);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isSaved, setIsSaved] = useState(post.isSaved);

  useEffect(() => {
    setIsLiked(post.isLiked);
    setIsSaved(post.isSaved);
  }, [post.id, post.isLiked, post.isSaved]);

  async function toggle(kind: "like" | "save") {
    if (lock.current || !auth.ensure()) return;
    const wasActive = kind === "like" ? isLiked : isSaved;
    const setActive = kind === "like" ? setIsLiked : setIsSaved;
    lock.current = true;
    setBusy(kind);
    setActive(!wasActive);
    try {
      await socialFetch(`/api/outfit-explorer/${post.id}/${kind}`, {
        method: wasActive ? "DELETE" : "PUT",
      });
      changed();
    } catch {
      setActive(wasActive);
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }

  return (
    <article className="social-card">
      <Link
        href={`/outfit-explorer/${post.id}`}
        onClick={onOpen}
        className="social-photo-link"
      >
        <img
          src={post.cover.url}
          alt={post.caption || `${post.uploaderName} · ${c.posts}`}
          width={post.cover.width || undefined}
          height={post.cover.height || undefined}
          loading="lazy"
        />
      </Link>
      {!photoOnly && <div className="social-card-meta">
        <div className="social-card-header">
          {post.author ? (
            <Link
              className="social-card-author"
              href={`/${encodeURIComponent(post.author.username)}`}
              onClick={onOpen}
            >
              {post.author.avatarUrl ? (
                <img
                  className="social-avatar"
                  src={post.author.avatarUrl}
                  alt=""
                />
              ) : (
                <span className="social-avatar">
                  <UserRound size={14} />
                </span>
              )}
              {post.author.username}
            </Link>
          ) : (
            <span className="social-card-author">{post.uploaderName}</span>
          )}
          {showQuickActions && (
            <div className="social-card-quick-actions">
              <button
                type="button"
                className={`social-card-quick-action ${isLiked ? "social-active" : ""}`}
                aria-label={isLiked ? c.unlike : c.like}
                aria-pressed={isLiked}
                disabled={busy !== null}
                onClick={() => void toggle("like")}
              >
                <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                className={`social-card-quick-action ${isSaved ? "social-active" : ""}`}
                aria-label={isSaved ? c.unsave : c.save}
                aria-pressed={isSaved}
                disabled={busy !== null}
                onClick={() => void toggle("save")}
              >
                <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
              </button>
            </div>
          )}
        </div>
        {!hideCaption && post.caption && (
          <p className="social-card-caption">{post.caption}</p>
        )}
      </div>}
    </article>
  );
}
