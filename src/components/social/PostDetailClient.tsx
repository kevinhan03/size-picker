"use client";
/* eslint-disable @next/next/no-img-element -- Signed post images and tag snapshots. */
import { Suspense, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MoreHorizontal,
  Tag,
  UserRound,
} from "lucide-react";
import { useLocaleContext } from "../../contexts/LocaleContext";
import type { Product } from "../../types";
import { useProductModalQuery } from "../../hooks/useProductModalQuery";
import { ProductDetailRouteModal } from "../ProductDetailRouteModal";
import type { PostDetail } from "../../types/social";
import {
  changed,
  socialFetch,
  useSocialAuth,
  useSocialResource,
} from "./client";
import { socialError, useSocialMessages } from "./messages";
import { FollowButton } from "./FollowButton";
import { ConfirmDialog } from "./ConfirmDialog";
import { SocialDialog } from "./SocialDialog";
import "./social.css";
const PostComposer = dynamic(
  () => import("./PostComposer").then((m) => m.PostComposer),
  { ssr: false }
);
export function PostDetailClient({ postId }: { postId: string }) {
  const c = useSocialMessages();
  const { locale } = useLocaleContext();
  const router = useRouter();
  const auth = useSocialAuth();
  const resource = useSocialResource<{ post: PostDetail }>(
    `/api/outfit-explorer/${postId}`
  );
  const post = resource.data?.post;
  const [index, setIndex] = useState(0);
  const [showTags, setShowTags] = useState(false);
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const lock = useRef(false);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; left: number; active: boolean } | null>(null);
  const suppressClick = useRef(false);
  const modal = useProductModalQuery();
  function selectPhoto(next: number) {
    if (!post || !track.current) return;
    const target = Math.max(0, Math.min(post.images.length - 1, next));
    track.current.scrollTo({ left: target * track.current.clientWidth, behavior: "instant" });
    setIndex(target);
  }
  function move(delta: number) {
    selectPhoto(index + delta);
  }
  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    drag.current = null;
    const element = event.currentTarget;
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    if (!start.active) return;
    const width = element.clientWidth;
    const distance = element.scrollLeft - start.left;
    const origin = Math.round(start.left / width);
    const next = origin + (Math.abs(distance) > Math.min(48, width * 0.15) ? Math.sign(distance) : 0);
    // Restore native snapping after the mouse-driven scroll, at the selected slide.
    element.scrollLeft = Math.max(0, Math.min((post?.images.length || 1) - 1, next)) * width;
    element.classList.remove("is-dragging");
    setIndex(Math.round(element.scrollLeft / width));
  }
  async function toggle(kind: "like" | "save") {
    if (!post || lock.current || !auth.ensure()) return;
    const old = post;
    const active = kind === "like" ? !post.isLiked : !post.isSaved;
    lock.current = true;
    setBusy(kind);
    setError("");
    resource.setData({
      post: {
        ...post,
        ...(kind === "like"
          ? { isLiked: active, likeCount: post.likeCount + (active ? 1 : -1) }
          : { isSaved: active }),
      },
    });
    try {
      await socialFetch(`/api/outfit-explorer/${post.id}/${kind}`, {
        method: active ? "PUT" : "DELETE",
      });
      changed();
    } catch (e) {
      resource.setData({ post: old });
      setError(socialError(e, c));
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  async function remove() {
    if (!post || lock.current) return;
    setConfirmDelete(false);
    lock.current = true;
    setBusy("delete");
    try {
      await socialFetch(`/api/outfit-explorer/${post.id}`, {
        method: "DELETE",
      });
      changed();
      router.replace("/outfit-explorer");
    } catch (e) {
      setError(socialError(e, c));
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  async function submitComment() {
    if (!post || !comment.trim() || lock.current || !auth.ensure()) return;
    lock.current = true;
    setBusy("comment");
    setError("");
    try {
      const form = new FormData();
      form.set("intent", "comment");
      form.set("postId", post.id);
      form.set("body", comment);
      await socialFetch(`/api/outfit-explorer`, { method: "POST", body: form });
      setComment("");
      await resource.reload();
    } catch (e) {
      setError(socialError(e, c));
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  const image = post?.images[Math.min(index, (post?.images.length || 1) - 1)];
  const postFrameRatio = 4 / 5;
  const items =
    post?.images
      .flatMap((i) => i.tags)
      .filter(
        (tag, i, all) =>
          all.findIndex(
            (t) => (t.productId || t.id) === (tag.productId || tag.id)
          ) === i
      ) || [];
  return (
    <main className="social-page">
      <div className="social-detail">
        {resource.loading ? (
          <div
            className="social-skeleton"
            style={{ height: "70vh", marginTop: 20 }}
            aria-label={c.loading}
          />
        ) : resource.error || !post || !image ? (
          <div className="social-empty">
            <p>
              {resource.error ? socialError(resource.error, c) : c.notFound}
            </p>
            <button
              className="social-button"
              onClick={() => void resource.reload()}
            >
              {c.retry}
            </button>
          </div>
        ) : (
          <>
            <header className="social-author-row">
              <Link
                href="/outfit-explorer"
                className="social-icon"
                aria-label={c.returnExplore}
                title={c.returnExplore}
              >
                <ArrowLeft size={20} />
              </Link>
              {post.author ? (
                <Link href={`/${encodeURIComponent(post.author.username)}`}>
                  {post.author.avatarUrl ? (
                    <img
                      className="social-avatar"
                      src={post.author.avatarUrl}
                      alt=""
                    />
                  ) : (
                    <span className="social-avatar">
                      <UserRound size={16} />
                    </span>
                  )}
                  {post.author.username}
                </Link>
              ) : (
                <span>{post.uploaderName}</span>
              )}
              {post.author && <FollowButton person={post.author} />}
              {post.canManage && (
                <button
                  type="button"
                  className="social-icon social-post-menu-trigger"
                  aria-label={c.menu}
                  aria-expanded={menu}
                  onClick={() => setMenu(!menu)}
                >
                  <MoreHorizontal size={20} />
                </button>
              )}
            </header>
            {menu && post.canManage && (
              <SocialDialog title={c.menu} onClose={() => setMenu(false)}>
                <div className="social-post-menu-actions">
                <button
                  type="button"
                  className="social-button"
                  disabled={!!busy}
                  onClick={() => {
                    setEditing(true);
                    setMenu(false);
                  }}
                >
                  {c.edit}
                </button>
                <button
                  type="button"
                  className="social-button"
                  disabled={!!busy}
                  onClick={() => {
                    setMenu(false);
                    setConfirmDelete(true);
                  }}
                >
                  {c.deletePost}
                </button>
                </div>
              </SocialDialog>
            )}
            <section
              className="social-carousel"
              aria-label={c.photo}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  move(-1);
                }
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  move(1);
                }
              }}
            >
              <div
                ref={track}
                className="social-image-stage"
                onScroll={(event) => {
                  const element = event.currentTarget;
                  if (element.clientWidth) setIndex(Math.max(0, Math.min(post.images.length - 1, Math.round(element.scrollLeft / element.clientWidth))));
                }}
                onDragStart={(event) => event.preventDefault()}
                onPointerDown={(event) => {
                  suppressClick.current = false;
                  // Touch scrolling and momentum belong to the browser; only emulate mouse dragging.
                  if (event.pointerType !== "mouse" || event.button !== 0 || post.images.length < 2) return;
                  drag.current = { pointerId: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft, active: false };
                }}
                onPointerMove={(event) => {
                  const start = drag.current;
                  if (!start || start.pointerId !== event.pointerId) return;
                  const distance = event.clientX - start.x;
                  if (!start.active && Math.abs(distance) < 8) return;
                  if (!start.active) {
                    start.active = true;
                    suppressClick.current = true;
                    event.currentTarget.classList.add("is-dragging");
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }
                  event.currentTarget.scrollLeft = start.left - distance;
                }}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                onPointerLeave={() => { if (!drag.current?.active) drag.current = null; }}
                onClickCapture={(event) => {
                  if (suppressClick.current) {
                    event.preventDefault();
                    event.stopPropagation();
                    suppressClick.current = false;
                  }
                }}
              >
                {post.images.map((slide, slideIndex) => {
                  const imageRatio = slide.width && slide.height ? slide.width / slide.height : postFrameRatio;
                  const imageFitWidth = Math.min(1, imageRatio / postFrameRatio) * 100;
                  return (
                <div className="social-post-slide" key={slide.id} inert={slideIndex !== index}>
                <div
                  className="social-post-image-fit"
                  style={{ aspectRatio: String(imageRatio), width: `${imageFitWidth}%` }}
                >
                <img
                  src={slide.url}
                  alt={post.caption || `${post.uploaderName} ${slideIndex + 1}`}
                  width={slide.width || undefined}
                  height={slide.height || undefined}
                  draggable={false}
                />
                {showTags &&
                  slide.tags.map((tag) => {
                    const placePreviewLeft = tag.x > 0.62;
                    return (
                      <div key={tag.id}>
                        <button
                          type="button"
                          className={`social-tag-pin${placePreviewLeft ? " has-preview-left" : ""}`}
                          style={{
                            left: `${tag.x * 100}%`,
                            top: `${tag.y * 100}%`,
                          }}
                          disabled={!tag.productId}
                          aria-label={`${tag.product.brand} ${tag.product.name}`}
                          onClick={() =>
                            tag.productId && modal.openProduct(tag.productId)
                          }
                        />
                        <span
                          className={`social-tag-preview${placePreviewLeft ? " is-left" : ""}`}
                          style={{
                            left: `${tag.x * 100}%`,
                            top: `${tag.y * 100}%`,
                          }}
                        >
                          <img
                            src={tag.product.image || "/images/default-product.svg"}
                            alt=""
                          />
                          <span>
                            <strong>{tag.product.brand}</strong>
                            <small>{tag.product.name}</small>
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                </div>
                  );
                })}
              </div>
              <span className="social-photo-counter" aria-live="polite">
                {index + 1}/{post.images.length}
              </span>
              <button
                type="button"
                className="social-icon social-arrow social-arrow-prev"
                aria-label={c.previousPhoto}
                disabled={index === 0}
                onMouseDown={(event) => event.preventDefault()}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  move(-1);
                }}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className="social-icon social-arrow social-arrow-next"
                aria-label={c.nextPhoto}
                disabled={index === post.images.length - 1}
                onMouseDown={(event) => event.preventDefault()}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  move(1);
                }}
              >
                <ChevronRight size={22} />
              </button>
              {image.tags.length > 0 && (
                <button
                  type="button"
                  className="social-icon social-show-tags"
                  aria-pressed={showTags}
                  aria-label={showTags ? c.hideTags : c.showTags}
                  onClick={() => setShowTags(!showTags)}
                >
                  <Tag size={14} />
                </button>
              )}
            </section>
            {post.images.length > 1 && (
              <div className="social-dots">
                {post.images.map((i, n) => (
                  <button
                    key={i.id}
                    aria-label={`${c.photo} ${n + 1}`}
                    aria-current={index === n}
                    onClick={() => selectPhoto(n)}
                  />
                ))}
              </div>
            )}
            {items.length > 0 && (
              <>
                <h2 className="social-section-label">
                  {c.outfitItems} {items.length}
                </h2>
                <div className="social-items">
                  {items.map((t) => (
                    <button
                      key={t.id}
                      className="social-item"
                      disabled={!t.productId}
                      onClick={() =>
                        t.productId && modal.openProduct(t.productId)
                      }
                    >
                      <img
                        src={t.product.image || "/images/default-product.svg"}
                        alt=""
                      />
                      <div>
                        <strong>{t.product.brand}</strong>
                        <span>{t.product.name}</span>
                        {!t.productId && <span>{c.unavailable}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="social-actions">
              <button
                className={`social-icon ${post.isLiked ? "social-active" : ""}`}
                aria-pressed={post.isLiked}
                aria-label={post.isLiked ? c.unlike : c.like}
                disabled={!!busy}
                onClick={() => void toggle("like")}
              >
                <Heart
                  size={24}
                  fill={post.isLiked ? "currentColor" : "none"}
                />
              </button>
              <span className="social-muted">{post.likeCount}</span>
              <button
                className={`social-icon social-save ${post.isSaved ? "social-active" : ""}`}
                aria-pressed={post.isSaved}
                aria-label={post.isSaved ? c.unsave : c.save}
                disabled={!!busy}
                onClick={() => void toggle("save")}
              >
                <Bookmark
                  size={24}
                  fill={post.isSaved ? "currentColor" : "none"}
                />
              </button>
            </div>
            {error && (
              <p className="social-error" role="alert">
                {error}
              </p>
            )}
            {post.caption && <p className="social-caption">{post.caption}</p>}
            <section className="social-comments" aria-label={c.comments}>
              {post.comments.map((entry) => (
                <p key={entry.id}>{entry.body}</p>
              ))}
              <form
                className="social-comment-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitComment();
                }}
              >
                <input
                  className="social-input"
                  value={comment}
                  maxLength={1000}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={c.commentPlaceholder}
                  aria-label={c.commentPlaceholder}
                />
                <button className="social-button" disabled={!!busy || !comment.trim()}>
                  {c.comment}
                </button>
              </form>
            </section>
            <p className="social-date">
              {new Date(post.createdAt).toLocaleDateString(
                locale === "en" ? "en-US" : "ko-KR"
              )}
            </p>
            {editing && (
              <PostComposer
                post={post}
                onClose={() => setEditing(false)}
                onPublished={() => {
                  selectPhoto(0);
                  void resource.reload();
                }}
              />
            )}
          </>
        )}
      </div>
      {modal.productId && (
        <Suspense>
          <TaggedProduct id={modal.productId} onClose={modal.closeProduct} />
        </Suspense>
      )}
      {confirmDelete && (
        <ConfirmDialog
          message={c.confirmDelete}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void remove()}
        />
      )}
    </main>
  );
}
function TaggedProduct({ id, onClose }: { id: string; onClose: () => void }) {
  const c = useSocialMessages();
  const detail = useSocialResource<{ product: Product }>(`/api/products/${id}`);
  return detail.data?.product ? (
    <ProductDetailRouteModal product={detail.data.product} onClose={onClose} />
  ) : (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80">
      <div className="rounded-2xl bg-[#17171a] p-8">
        <p>{detail.error ? c.unavailable : c.loading}</p>
        <button className="social-button" onClick={onClose}>
          {c.close}
        </button>
      </div>
    </div>
  );
}
