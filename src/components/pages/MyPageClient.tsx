"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../contexts/AuthContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import type { PublicProfile } from "../../utils/profile";
import { ProfileView } from "../profile/ProfileView";
import { useLocaleContext } from "../../contexts/LocaleContext";

function OwnerDiscoveries() {
  const { t } = useLocaleContext();
  return (
    <Link href="/discoveries">{t("discoveries.performance")}</Link>
  );
}

export function MyPageClient({
  profile,
  ownerId,
  initialCounts,
  initialContentTab,
}: {
  profile: PublicProfile;
  ownerId: string;
  initialCounts: Record<string, number>;
  initialContentTab?: "posts" | "closet";
}) {
  const router = useRouter();
  const auth = useAuthContext();
  const { hydrate: hydrateSaved } = useDigboxContext();
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    hydrateSaved(profile.products, initialCounts);
  }, [
    hydrateSaved,
    initialCounts,
    profile.products,
  ]);
  useEffect(() => {
    if (!auth.isAuthLoading && !auth.authUser) router.replace("/login");
  }, [auth.isAuthLoading, auth.authUser, router]);
  if (!auth.isAuthLoading && (!auth.authUser || auth.authUser.id !== ownerId)) return null;
  return (
    <ProfileView
      profile={{ ...profile, username: auth.dbUsername || profile.username }}
      isOwner
      initialContentTab={initialContentTab}
      discoveries={<OwnerDiscoveries />}
    />
  );
}
