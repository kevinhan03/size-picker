"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../contexts/AuthContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import type { DiscoveryProduct } from "../../types";
import type { PublicProfile } from "../../utils/profile";
import { ProfileView } from "../profile/ProfileView";
import { authenticatedFetch, parseApiJson } from "../../api/shared";

const MyPageView = dynamic(
  () => import("../views/MyPageView").then((module) => module.MyPageView),
  { ssr: false }
);

function OwnerDiscoveries({
  onLogout,
  onDeleteAccount,
  isDeletingAccount,
  deleteAccountError,
}: {
  onLogout: () => void;
  onDeleteAccount: () => void;
  isDeletingAccount: boolean;
  deleteAccountError: string | null;
}) {
  const auth = useAuthContext();
  const [data, setData] = useState<{ products: DiscoveryProduct[]; totalSaveCount: number }>({
    products: [],
    totalSaveCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    if (auth.isAuthLoading || !auth.authUser) return;
    let active = true;
    void (async () => {
      try {
        if (active) {
          setIsLoading(true);
          setHasError(false);
        }
        const endpoint = "/api/my-discoveries";
        const response = await authenticatedFetch(endpoint);
        const payload = await parseApiJson<{
          ok?: boolean;
          data?: { products?: DiscoveryProduct[]; totalSaveCount?: number };
        }>(response, endpoint);
        if (!response.ok || !payload.ok) {
          if (active) setHasError(true);
          return;
        }
        if (active) {
          setData({
            products: Array.isArray(payload.data?.products) ? payload.data.products : [],
            totalSaveCount: Number(payload.data?.totalSaveCount) || 0,
          });
        }
      } catch {
        if (active) setHasError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [auth.authUser, auth.isAuthLoading, requestVersion]);

  return (
    <MyPageView
      section="discoveries"
      discoveredProducts={data.products}
      discoveryTotalSaveCount={data.totalSaveCount}
      isDiscoveriesLoading={isLoading}
      discoveriesError={hasError}
      onRetryDiscoveries={() => setRequestVersion((version) => version + 1)}
      onLogout={onLogout}
      onDeleteAccount={onDeleteAccount}
      isDeletingAccount={isDeletingAccount}
      deleteAccountError={deleteAccountError}
    />
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
  const props = {
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
      profile={{ ...profile, username: auth.dbUsername || profile.username }}
      isOwner
      initialContentTab={initialContentTab}
      discoveries={<OwnerDiscoveries {...props} />}
    />
  );
}
