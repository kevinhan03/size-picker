import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getInitialAuthState } from "../../../server/auth/user-session";
import {
  getProfileIdentityByUsername,
  getPublicUserDiscoveries,
} from "../../../server/services/profile";
import { profileSummary } from "../../../server/services/social";
import { FollowButton } from "../../../src/components/social/FollowButton";
import { ProgressiveImage } from "../../../src/components/ProgressiveImage";
import { getLocale, LOCALE_COOKIE_NAME } from "../../../src/i18n/locale";
import { getProductPageUrl } from "../../../src/utils/product";
import {
  getProductStyleProfile,
  styleProfileLabels,
} from "../../../src/utils/styleProfile";
import "../../../src/components/social/social.css";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username}이 발굴한 상품 | DIGBOX` };
}

export default async function PublicDiscoveriesPage({ params }: Props) {
  const { username } = await params;
  const [identity, auth, cookieStore] = await Promise.all([
    getProfileIdentityByUsername(username),
    getInitialAuthState(),
    cookies(),
  ]);
  if (!identity) notFound();
  if (identity.username !== username)
    redirect(`/${encodeURIComponent(identity.username)}/discoveries`);
  const locale = getLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const [products, person] = await Promise.all([
    getPublicUserDiscoveries(identity.id),
    profileSummary(identity.username, auth.user?.id || null),
  ]);
  const styleCounts = new Map<string, number>();
  for (const product of products) {
    const topStyle = getProductStyleProfile(product)?.displayEntries[0];
    if (topStyle)
      styleCounts.set(topStyle.key, (styleCounts.get(topStyle.key) || 0) + 1);
  }
  const styles = [...styleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const analyzedCount = [...styleCounts.values()].reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/${encodeURIComponent(identity.username)}`}
            className="text-sm text-gray-400 hover:text-orange-300"
          >
            ← {locale === "en" ? "Profile" : "프로필"}
          </Link>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
            {locale === "en"
              ? `${identity.username}'s discoveries`
              : `${identity.username}이 발굴한 상품`}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {locale === "en"
              ? `${products.length} products found`
              : `발굴한 상품 ${products.length}개`}
          </p>
        </div>
        <FollowButton person={person} />
      </header>

      {styles.length > 0 && (
        <section
          className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
          aria-label={
            locale === "en"
              ? "Frequently discovered styles"
              : "자주 발굴하는 스타일"
          }
        >
          <h2 className="mb-3 text-sm font-semibold text-gray-300">
            {locale === "en"
              ? "Frequently discovered styles"
              : "자주 발굴하는 스타일"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {styles.map(([style, count]) => (
              <span
                key={style}
                className="rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1.5 text-sm text-orange-200"
              >
                {styleProfileLabels(
                  style as Parameters<typeof styleProfileLabels>[0],
                  locale
                )}{" "}
                · {count}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {locale === "en"
              ? `Based on ${analyzedCount} products with style analysis`
              : `스타일 분석이 있는 상품 ${analyzedCount}개 기준`}
          </p>
        </section>
      )}

      {products.length ? (
        <section
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          aria-label={locale === "en" ? "Discovered products" : "발굴한 상품"}
        >
          {products.map((product) => (
            <Link
              key={product.id}
              href={getProductPageUrl(product)}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition hover:border-orange-400/40"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-white/[0.04]">
                {product.thumbnailImage && (
                  <ProgressiveImage
                    src={product.thumbnailImage}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-semibold text-orange-300">
                  {product.brand}
                </p>
                <h2 className="mt-1 line-clamp-2 text-sm font-semibold">
                  {product.name}
                </h2>
                {product.subCategory && (
                  <p className="mt-2 text-xs text-gray-400">
                    {product.subCategory}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <p className="py-20 text-center text-gray-400">
          {locale === "en"
            ? "No discoveries yet."
            : "아직 발굴한 상품이 없어요."}
        </p>
      )}
    </main>
  );
}
