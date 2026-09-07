import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getInitialAuthState } from "../../server/auth/user-session";
import {
  getClosetProducts,
  getDigboxProducts,
  getUserDiscoveries,
} from "../../server/services/user-collections";
import { getPublicProfile } from "../../server/services/profile";
import { PublicProfileClient } from "../../src/components/profile/PublicProfileClient";
import { MyPageClient } from "../../src/components/pages/MyPageClient";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} | DIGBOX`,
    description: `${username} · DIGBOX taste archive`,
    alternates: { canonical: `/${encodeURIComponent(username)}` },
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: Props) {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  const name = username.trim().toLowerCase();
  const profile = await unstable_cache(
    () => getPublicProfile(name),
    ["public-profile-v2", name],
    { revalidate: 60, tags: ["public-digbox"] }
  )();

  if (!profile) notFound();

  if (profile.username.toLowerCase() !== name) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
      else if (value !== undefined) query.set(key, value);
    }
    redirect(
      `/${encodeURIComponent(profile.username)}${query.size ? `?${query}` : ""}`
    );
  }

  const auth = await getInitialAuthState();
  const initialContentTab = resolvedSearchParams.tab === "closet" ? "closet" : "posts";
  const isOwner = Boolean(
    auth.user?.id &&
      auth.username?.toLowerCase() === profile.username.toLowerCase()
  );

  if (isOwner && auth.user) {
    const [closet, discovery, saved] = await Promise.all([
      getClosetProducts(auth.user.id),
      getUserDiscoveries(auth.user.id),
      getDigboxProducts(auth.user.id),
    ]);
    return (
      <MyPageClient
        ownerId={auth.user.id}
        initialCloset={closet}
        initialCounts={saved.discoveredDigboxCounts}
        profile={{ ...profile, products: saved.products }}
        initialDiscoveries={discovery.products}
        initialDiscoveryTotalSaveCount={discovery.totalSaveCount}
        initialContentTab={initialContentTab}
      />
    );
  }

  return <PublicProfileClient profile={profile} initialContentTab={initialContentTab} />;
}
