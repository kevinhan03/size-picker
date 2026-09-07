"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MyPageView } from "../views/MyPageView";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import type { DiscoveryProduct, Product } from "../../types";
import type { PublicProfile } from "../../utils/profile";
import { ProfileView } from "../profile/ProfileView";

export function MyPageClient({
  profile,
  ownerId,
  initialCloset,
  initialCounts,
  initialDiscoveries = [],
  initialDiscoveryTotalSaveCount = 0,
  initialContentTab,
}: {
  profile: PublicProfile;
  ownerId: string;
  initialCloset: Product[];
  initialCounts: Record<string, number>;
  initialDiscoveries?: DiscoveryProduct[];
  initialDiscoveryTotalSaveCount?: number;
  initialContentTab?: "posts" | "closet";
}) {
  const router = useRouter();
  const auth = useAuthContext();
  const closet = useClosetContext();
  const { hydrate: hydrateCloset } = closet;
  const { hydrate: hydrateSaved } = useDigboxContext();
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    hydrateCloset(initialCloset);
    hydrateSaved(profile.products, initialCounts);
  }, [
    hydrateCloset,
    hydrateSaved,
    initialCloset,
    initialCounts,
    profile.products,
  ]);
  useEffect(() => {
    if (!auth.isAuthLoading && !auth.authUser) router.replace("/login");
  }, [auth.isAuthLoading, auth.authUser, router]);
  if (!auth.authUser || auth.authUser.id !== ownerId) return null;
  const username = auth.dbUsername || profile.username;
  const props = {
    username,
    discoveredProducts: initialDiscoveries,
    discoveryTotalSaveCount: initialDiscoveryTotalSaveCount,
    isDiscoveriesLoading: false,
    onLogout: () => {
      void auth.signOut("/");
    },
    onDeleteAccount: () => {
      void auth.deleteAccount().then((deleted) => {
        if (deleted) router.push("/");
      });
    },
    isDeletingAccount: auth.isDeletingAccount,
    deleteAccountError: auth.deleteAccountError,
  };
  return (
    <ProfileView
      initialCloset={initialCloset}
      profile={{ ...profile, username }}
      isOwner
      initialContentTab={initialContentTab}
      discoveries={<MyPageView {...props} section="discoveries" />}
    />
  );
}
