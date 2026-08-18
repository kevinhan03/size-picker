import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { assertSupabaseConfig, supabase } from "../../../server/lib/supabase.js";
import { getDigboxProducts } from "../../../server/services/user-collections";
import { DigboxPageClient } from "../../../src/components/pages/DigboxPageClient";

interface Props {
  params: Promise<{ username: string }>;
}

async function fetchUserDigbox(username: string) {
  const normalizedUsername = decodeURIComponent(username).trim();
  if (!normalizedUsername) return null;

  assertSupabaseConfig();
  const { data: user, error } = await supabase!
    .from("users")
    .select("id, username, bio")
    .ilike("username", normalizedUsername)
    .maybeSingle();
  if (error) throw error;
  if (!user?.id) return null;

  const collection = await getDigboxProducts(String(user.id));
  return {
    userId: String(user.id),
    username: String(user.username || normalizedUsername),
    bio: String(user.bio || "").trim(),
    ...collection,
  };
}

function getCachedUserDigbox(username: string) {
  return unstable_cache(
    () => fetchUserDigbox(username),
    ["public-digbox-v1", username.toLowerCase()],
    { revalidate: 60, tags: ["public-digbox"] },
  )();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username).trim();
  return {
    title: "저장한 상품 | DIGBOX",
    description: `${decodedUsername}님의 저장한 상품`,
  };
}

export default async function PublicDigboxPage({ params }: Props) {
  const { username } = await params;
  const digbox = await getCachedUserDigbox(username);
  if (!digbox) notFound();

  return (
    <DigboxPageClient
      username={digbox.username}
      bio={digbox.bio}
      products={digbox.products}
      discoveredDigboxCounts={digbox.discoveredDigboxCounts}
      hydrateOwner
    />
  );
}
