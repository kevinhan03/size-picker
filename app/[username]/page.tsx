import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getInitialAuthState } from "../../server/auth/user-session";
import {
  getDigboxProducts,
} from "../../server/services/user-collections";
import {
  getProfileIdentityByUsername,
  getPublicClosetProducts,
  getPublicProfileProducts,
} from "../../server/services/profile";
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
  const [identity, auth] = await Promise.all([
    getProfileIdentityByUsername(name),
    getInitialAuthState(),
  ]);

  if (!identity) notFound();

  if (identity.username.toLowerCase() !== name) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
      else if (value !== undefined) query.set(key, value);
    }
    redirect(
      `/${encodeURIComponent(identity.username)}${query.size ? `?${query}` : ""}`
    );
  }

  const initialContentTab = resolvedSearchParams.tab === "closet" ? "closet" : "posts";
  const isOwner = Boolean(
    auth.user?.id &&
      auth.username?.toLowerCase() === identity.username.toLowerCase()
  );

  if (isOwner && auth.user) {
    const saved = await getDigboxProducts(auth.user.id);
    return (
      <MyPageClient
        ownerId={auth.user.id}
        initialCounts={saved.discoveredDigboxCounts}
        profile={{ ...identity, products: saved.products }}
        initialContentTab={initialContentTab}
      />
    );
  }

  const [products, closetProducts] = await Promise.all([
    getPublicProfileProducts(identity.id),
    identity.closetIsPublic ? getPublicClosetProducts(identity.id) : Promise.resolve([]),
  ]);

  return (
    <PublicProfileClient
      profile={{ ...identity, products, closetProducts }}
      initialContentTab={initialContentTab}
    />
  );
}
