"use client";
/* eslint-disable @next/next/no-img-element -- Product and uploaded profile images use native fallbacks. */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, LockKeyhole, Settings, Share2, UserRound } from "lucide-react";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { presentTasteSignature } from "../../utils/tasteSignature";
import { profileActivity, type PublicProfile } from "../../utils/profile";
import { getProductPageUrl } from "../../utils/product";
import type { Product } from "../../types";
import { profileMessages } from "./messages";
import "./profile.css";
import { SocialProfile } from "../social/SocialProfile";
import { PostFeed } from "../social/PostFeed";
import { CreatePostButton } from "../social/CreatePostButton";

const ClosetCollectionContent = dynamic(
  () =>
    import("../collections/ClosetCollectionContent").then(
      (module) => module.ClosetCollectionContent
    ),
  {
    ssr: false,
    loading: () => <div aria-busy="true" className="profile-posts-placeholder" />,
  }
);

export function ProfileView({
  profile,
  isOwner = false,
  discoveries,
  initialCloset,
  initialContentTab = "posts",
}: {
  profile: PublicProfile;
  initialCloset?: Product[];
  isOwner?: boolean;
  discoveries?: ReactNode;
  initialContentTab?: "posts" | "closet";
}) {
  const router = useRouter();
  const { locale } = useLocaleContext();
  const c = profileMessages[locale];
  const digbox = useDigboxContext();
  const { isLoaded } = digbox;
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatar] = useState(profile.avatarUrl);
  const [contentTab, setContentTab] = useState<"posts" | "closet">(
    initialContentTab
  );
  const [message, setMessage] = useState("");
  const [now] = useState(() => Date.now());
  useEffect(() => {
    setBio(profile.bio);
    setAvatar(profile.avatarUrl);
  }, [profile.bio, profile.avatarUrl]);
  const products =
    isOwner && isLoaded ? digbox.digboxProducts : profile.products;
  const signature = profile.tasteSignature
    ? presentTasteSignature(profile.tasteSignature, locale)
    : null;
  const activity = useMemo(
    () => profileActivity(products, now),
    [products, now]
  );
  async function share() {
    const url = `${window.location.origin}/${encodeURIComponent(profile.username)}`;
    try {
      if (navigator.share)
        await navigator.share({ title: `${profile.username} · DIGBOX`, url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage(c.copied);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setMessage(c.error);
    }
  }
  return (
    <main className="profile-page">
      <div className="profile-shell">
        <header className="profile-heading">
          <div className="profile-person">
            {avatarUrl ? (
              <img
                className="profile-avatar"
                src={avatarUrl}
                alt={profile.username}
                onError={() => setAvatar(null)}
              />
            ) : (
              <span className="profile-avatar profile-avatar-placeholder" aria-hidden="true">
                <UserRound />
              </span>
            )}
            <div className="min-w-0">
              <h1>{profile.username}</h1>
              <SocialProfile username={profile.username} />
              <p className="profile-bio">{bio || c.intro}</p>
            </div>
          </div>
          <div className="profile-actions">
            {isOwner && (
              <button
                type="button"
                aria-label={c.settings}
                title={c.settings}
                onClick={() => router.push("/settings")}
              >
                <Settings size={18} />
              </button>
            )}
            {!isOwner && (
              <button type="button" onClick={() => void share()}>
                <Share2 size={16} />
                {c.share}
              </button>
            )}
          </div>
        </header>
        {isOwner && (
          <div className="profile-owner-actions" aria-label={c.manage}>
            <button type="button" onClick={() => router.push("/sizes")}>
              {c.size}
            </button>
            {discoveries}
            <button type="button" onClick={() => void share()}>
              {c.share}
            </button>
          </div>
        )}
        {message && (
          <p role="status" className="profile-muted">
            {message}
          </p>
        )}
        {isOwner && digbox.error && (
          <p role="alert" className="profile-muted">
            {c.loadError}{" "}
            <button type="button" onClick={() => void digbox.reload()}>
              {c.retry}
            </button>
          </p>
        )}
        {signature ? (
          <section className="profile-taste profile-taste-signature" aria-labelledby="profile-taste-title">
            <div className="profile-section-heading">
              <h2 id="profile-taste-title">{c.signatureTitle.replace("{username}", profile.username)}</h2>
            </div>
            <p className="profile-taste-sentence">{signature.title}</p>
            <div className="profile-traits" aria-label={c.signatureTags}>
              {signature.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            {signature.axes.length ? <div className="profile-signature-group"><h3>{c.signaturePoints}</h3><div className="profile-signature-points">{signature.axes.map((axis) => <span key={axis}>{axis}</span>)}</div></div> : null}
            {signature.details.length ? <div className="profile-signature-group"><h3>{c.signatureDetails}</h3><p className="profile-signature-details">{signature.details.slice(0, 2).join(" · ")}</p></div> : null}
            {isOwner ? <Link className="profile-detail-link" href="/taste"><span>{c.details}</span><ArrowRight size={17} aria-hidden="true" /></Link> : null}
          </section>
        ) : isOwner ? (
          <section className="profile-taste profile-taste-empty" aria-labelledby="profile-taste-title">
            <h2 id="profile-taste-title">{c.signatureTitle.replace("{username}", profile.username)}</h2>
            <p className="profile-taste-sentence">{c.signaturePending}</p>
            <Link href="/" className="profile-detail-link">{c.discovering}<ArrowUpRight size={16} /></Link>
          </section>
        ) : null}
        {isOwner && <div className="profile-activity">
          <section>
            <h2>{c.recent}</h2>
            {activity.recent.length ? (
              <div className="profile-recent-grid">
                {activity.recent.map((product) => (
                  <Link
                    key={product.id}
                    href={getProductPageUrl(product)}
                    title={product.name}
                  >
                    <div>
                      <img
                        src={
                          product.thumbnailImage ||
                          product.image ||
                          "/images/default-product.svg"
                        }
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/default-product.svg";
                        }}
                      />
                    </div>
                    <span>{product.brand}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="profile-muted">{c.noRecent}</p>
            )}
          </section>
          <section>
            <div className="profile-section-heading">
              <h2>{c.brands}</h2>
              <span className="profile-muted">{c.period}</span>
            </div>
            <div className="profile-brands">
              {activity.brands.length ? (
                activity.brands.map((item) => (
                  <span key={item.name}>
                    {item.name}
                  </span>
                ))
              ) : (
                <p className="profile-muted">{c.noBrands}</p>
              )}
            </div>
          </section>
        </div>}
        <div
          className="profile-content-tabs"
          role="tablist"
          aria-label={c.tabs}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            const next = contentTab === "posts" ? "closet" : "posts";
            setContentTab(next);
            document.getElementById(`profile-${next}-tab`)?.focus();
          }}
        >
          {(["posts", "closet"] as const).map((value) => (
            <button
              key={value}
              id={`profile-${value}-tab`}
              type="button"
              role="tab"
              aria-selected={contentTab === value}
              aria-controls={`profile-${value}-panel`}
              tabIndex={contentTab === value ? 0 : -1}
              onClick={() => setContentTab(value)}
            >
              {c[value]}
            </button>
          ))}
        </div>
        <section
          id="profile-posts-panel"
          role="tabpanel"
          aria-labelledby="profile-posts-tab"
          hidden={contentTab !== "posts"}
          className="social-profile-content"
        >
          {contentTab === "posts" && (
            <PostFeed
              author={profile.username}
              action={isOwner ? <CreatePostButton /> : undefined}
              emptyContent={
                isOwner ? (
                  <div className="profile-posts-empty">
                    <h2>{c.noPosts}</h2>
                    <p>{c.noPostsDescription}</p>
                    <CreatePostButton label={c.createFirstPost} />
                  </div>
                ) : undefined
              }
            />
          )}
        </section>
        <section
          id="profile-closet-panel"
          role="tabpanel"
          aria-labelledby="profile-closet-tab"
          hidden={contentTab !== "closet"}
          className="profile-closet"
        >
          {isOwner ? (
            contentTab === "closet" && (
              <ClosetCollectionContent initialProducts={initialCloset} active={contentTab === "closet"} />
            )
          ) : (
            profile.closetIsPublic ? (
              profile.closetProducts?.length ? <div className="profile-public-closet-grid">{profile.closetProducts.map((product) => <Link key={product.id} href={getProductPageUrl(product)}><img src={product.thumbnailImage || product.image || "/images/default-product.svg"} alt={`${product.brand} ${product.name}`} /><span>{product.brand}</span><strong>{product.name}</strong><small>{product.category}</small></Link>)}</div> : <p className="profile-posts-placeholder">{c.publicClosetEmpty}</p>
            ) : <div className="profile-private"><LockKeyhole size={22} /><p>{c.private}</p></div>
          )}
        </section>
      </div>
    </main>
  );
}
