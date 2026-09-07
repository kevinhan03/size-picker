"use client";
/* eslint-disable @next/next/no-img-element -- Product and uploaded profile images use native fallbacks. */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LockKeyhole, Settings, Share2 } from "lucide-react";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import {
  computeTasteSummary,
  describeTasteCollection,
} from "../../utils/tasteGraph";
import {
  styleProfileLabels as styleTagLabel,
  styleProfileVector,
} from "../../utils/styleProfile";
import { profileActivity, type PublicProfile } from "../../utils/profile";
import { getProductPageUrl } from "../../utils/product";
import { ClosetCollectionContent } from "../collections/ClosetCollectionContent";
import type { Product } from "../../types";
import { profileMessages } from "./messages";
import "./profile.css";

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
  const summary = useMemo(() => computeTasteSummary(products), [products]);
  // The existing interpretation follows the active locale.
  const interpretation = describeTasteCollection(products, summary, locale);
  const representativeProducts = useMemo(() => {
    const coreTags = summary.entries.slice(0, 3).map((entry) => entry.tag);
    if (!coreTags.length) return [];
    return products
      .map((product) => {
        const vector = styleProfileVector(product);
        const score = vector
          ? coreTags.reduce((sum, tag) => sum + Number(vector[tag] || 0), 0)
          : 0;
        return { product, score };
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 4)
      .map(({ product }) => product);
  }, [products, summary.entries]);
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
              <span className="profile-avatar" aria-hidden="true">
                {profile.username.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <span className="profile-eyebrow">TASTE ARCHIVE</span>
              <h1>{profile.username}</h1>
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
        <section
          className="profile-taste"
          aria-labelledby="profile-taste-title"
        >
          <div className="profile-section-heading">
            <h2 id="profile-taste-title">{c.taste}</h2>
            <span className="profile-muted">
              {c.based} · {summary.taggedCount} {c.count}
            </span>
          </div>
          <p className="profile-taste-sentence">
            {products.length ? interpretation?.summary || c.pending : c.noTaste}
          </p>
          <div className="profile-traits">
            {summary.entries.slice(0, 3).map((entry) => (
              <span key={entry.tag}>{styleTagLabel(entry.tag, locale)}</span>
            ))}
          </div>
          {interpretation?.details.length ? (
            <div className="profile-taste-evidence">
              <span>{c.evidence}</span>
              <p>{interpretation.details.slice(0, 3).join(" · ")}</p>
            </div>
          ) : null}
          {representativeProducts.length ? (
            <section
              className="profile-taste-representatives"
              aria-labelledby="profile-representative-title"
            >
              <h3 id="profile-representative-title">{c.representative}</h3>
              <div className="profile-representative-grid">
                {representativeProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={getProductPageUrl(product)}
                    title={`${product.brand} ${product.name}`}
                  >
                    <img
                      src={
                        product.thumbnailImage ||
                        product.image ||
                        "/images/default-product.svg"
                      }
                      alt={`${product.brand} ${product.name}`}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/images/default-product.svg";
                      }}
                    />
                    <span>{product.brand}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {isOwner ? (
            <Link className="profile-detail-link" href="/taste">
              {c.details}
              <ArrowUpRight size={16} />
            </Link>
          ) : (
            interpretation && (
              <details className="profile-public-details">
                <summary>{c.details}</summary>
                <p>
                  {interpretation.axes
                    .map((axis) => `${axis.title}: ${axis.label}`)
                    .join(" / ")}
                </p>
              </details>
            )
          )}
          {!products.length && isOwner && (
            <Link href="/" className="profile-detail-link">
              {c.discovering}
              <ArrowUpRight size={16} />
            </Link>
          )}
        </section>
        <div className="profile-activity">
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
        </div>
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
          className="profile-posts-placeholder"
        >
          <p>{c.noPosts}</p>
        </section>
        <section
          id="profile-closet-panel"
          role="tabpanel"
          aria-labelledby="profile-closet-tab"
          hidden={contentTab !== "closet"}
          className="profile-closet"
        >
          {isOwner ? (
            <>
              <ClosetCollectionContent initialProducts={initialCloset} active={contentTab === "closet"} />
              {discoveries}
            </>
          ) : (
            <div className="profile-private">
              <LockKeyhole size={22} />
              <p>{c.private}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
