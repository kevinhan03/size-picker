"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MyPageView } from "../views/MyPageView";
import { PageState } from "../PageState";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useMySizesContext } from "../../contexts/MySizesContext";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { changeMyUsername } from "../../api/username";
import { captureEvent } from "../../utils/analytics";
import type { DiscoveryProduct } from "../../types";

export function MyPageClient({ initialDiscoveries = [], initialDiscoveryTotalSaveCount = 0 }: { initialDiscoveries?: DiscoveryProduct[]; initialDiscoveryTotalSaveCount?: number }) {
  const router = useRouter();
  const auth = useAuthContext();
  const { t } = useLocaleContext();
  const authUserId = auth.authUser?.id;
  const { closetProducts } = useClosetContext();
  const { mySizes, createMySize, updateMySize, deleteMySize } = useMySizesContext();

  useEffect(() => {
    if (!auth.isAuthLoading && !authUserId) {
      router.replace("/login");
    }
  }, [auth.isAuthLoading, authUserId, router]);

  if (auth.isAuthLoading || !auth.authUser) {
    return (
      <main className="flex min-h-screen items-center bg-black px-4 pt-[var(--app-main-pt)]">
        <PageState kind="loading" title={t("mypage.preparing")} description={t("mypage.preparingDescription")} />
      </main>
    );
  }

  const username = String(auth.dbUsername ?? auth.authUser.email?.split("@")[0] ?? "");

  return (
    <main
      className="pt-[var(--app-main-pt)] pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex flex-col items-center min-h-screen text-white"
    >
      <MyPageView
        username={username}
        discoveredProducts={initialDiscoveries}
        discoveryTotalSaveCount={initialDiscoveryTotalSaveCount}
        isDiscoveriesLoading={false}
        closetProducts={closetProducts}
        mySizes={mySizes}
        onCreateMySize={async (input) => {
          await createMySize(input);
        }}
        onUpdateMySize={async (id, input) => {
          await updateMySize(id, input);
        }}
        onDeleteMySize={async (id) => {
          await deleteMySize(id);
        }}
        onLogout={() => {
          void auth.signOut("/");
        }}
        onChangeUsername={async (nextUsername) => {
          const result = await changeMyUsername(nextUsername);
          auth.setDbUsername(result.username);
          if (result.changed) captureEvent("username_changed", { source: "mypage" });
        }}
        onDeleteAccount={() => {
          void auth.deleteAccount().then((deleted) => {
            if (deleted) {
              router.push("/");
            }
          });
        }}
        isDeletingAccount={auth.isDeletingAccount}
        deleteAccountError={auth.deleteAccountError}
      />
    </main>
  );
}
