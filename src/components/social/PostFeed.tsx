"use client";
/* eslint-disable @next/next/no-img-element -- Signed post media preserves original proportions. */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { UserRound } from "lucide-react";
import type { PostPage, PostSummary } from "../../types/social";
import {
  socialFetch,
  socialRevision,
  useSocialAuth,
  useSocialVersion,
} from "./client";
import { socialError, useSocialMessages } from "./messages";
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
}: {
  author?: string;
  saved?: boolean;
  following?: boolean;
  action?: ReactNode;
  emptyContent?: ReactNode;
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
    async (cursor?: string) => {
      if (lock.current) return;
      lock.current = true;
      const gen = generation.current;
      setLoading(true);
      try {
        const result = await socialFetch<PostPage>(
          endpoint +
            (cursor
              ? `${endpoint.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}`
              : "")
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
      void load();
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
          <PostCard key={post.id} post={post} onOpen={remember} />
        ))}
        {loading &&
          data.posts.length === 0 &&
          Array.from({ length: 6 }, (_, i) => (
            <div className="social-skeleton" key={i} aria-hidden="true" />
          ))}
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
}: {
  post: PostSummary;
  onOpen?: () => void;
}) {
  const c = useSocialMessages();
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
      <div className="social-card-meta">
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
        {post.caption && <p className="social-card-caption">{post.caption}</p>}
      </div>
    </article>
  );
}
