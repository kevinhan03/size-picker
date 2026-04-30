"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MyPageView } from "../views/MyPageView";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { supabase } from "../../lib/supabase";

export function MyPageClient() {
  const router = useRouter();
  const auth = useAuthContext();
  const { closetProducts } = useClosetContext();
  const { digboxProducts } = useDigboxContext();

  useEffect(() => {
    if (!auth.isAuthLoading && !auth.authUser) {
      router.replace("/login");
    }
  }, [auth.authUser, auth.isAuthLoading, router]);

  if (auth.isAuthLoading || !auth.authUser) {
    return <main className="min-h-screen bg-black" />;
  }

  const username = String(auth.dbUsername ?? auth.authUser.email?.split("@")[0] ?? "");
  const sizeLabelMap = new Map<string, string>();
  closetProducts.forEach((product) => {
    const label = String(product.closetSelectedSizeLabel || "").trim();
    if (!label) return;
    const category = String(product.category || "Item").trim();
    sizeLabelMap.set(`${category}:${label}`, `${category} ${label}`);
  });
  const sizeLabels = Array.from(sizeLabelMap.values());

  return (
    <main
      className="pt-[var(--app-main-pt)] pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex flex-col items-center min-h-screen text-white"
    >
      <MyPageView
        username={username}
        digboxHref={`/u/${encodeURIComponent(username)}`}
        closetCount={closetProducts.length}
        digboxCount={digboxProducts.length}
        closetPreviewProducts={closetProducts.slice(0, 5)}
        digboxPreviewProducts={digboxProducts.slice(0, 5)}
        sizeLabels={sizeLabels}
        onLogout={() => {
          void supabase?.auth.signOut();
          router.push("/");
        }}
        onDeleteAccount={() => {
          const shouldDelete = window.confirm("Delete your account permanently? This cannot be undone.");
          if (!shouldDelete) return;
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
