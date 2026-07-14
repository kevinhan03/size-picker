"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MyPageView } from "../views/MyPageView";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useMySizesContext } from "../../contexts/MySizesContext";
import { supabase } from "../../lib/supabase";
import type { Product } from "../../types";

export function MyPageClient() {
  const router = useRouter();
  const auth = useAuthContext();
  const authUserId = auth.authUser?.id;
  const { closetProducts, ensureLoaded: ensureClosetLoaded } = useClosetContext();
  const { digboxProducts, ensureLoaded: ensureDigboxLoaded } = useDigboxContext();
  const { mySizes, createMySize, deleteMySize, ensureLoaded: ensureMySizesLoaded } = useMySizesContext();
  const [discoveredProducts, setDiscoveredProducts] = useState<Product[]>([]);
  const [isDiscoveriesLoading, setIsDiscoveriesLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthLoading && !authUserId) {
      router.replace("/login");
    }
  }, [auth.isAuthLoading, authUserId, router]);

  useEffect(() => {
    if (authUserId) {
      ensureClosetLoaded();
      ensureDigboxLoaded();
      ensureMySizesLoaded();
    }
  }, [authUserId, ensureClosetLoaded, ensureDigboxLoaded, ensureMySizesLoaded]);

  useEffect(() => {
    if (!authUserId) return;
    let active = true;
    void (async () => {
      try {
        const sessionResult = supabase ? await supabase.auth.getSession() : null;
        const token = String(sessionResult?.data.session?.access_token || "").trim();
        if (!token) return;
        const response = await fetch("/api/my-discoveries", { headers: { Authorization: `Bearer ${token}` } });
        const payload = await response.json() as { ok?: boolean; data?: { products?: Product[] } };
        if (active && response.ok && payload.ok && Array.isArray(payload.data?.products)) {
          setDiscoveredProducts(payload.data.products);
        }
      } catch {
        // The rest of My Page stays usable when this optional collection cannot load.
      } finally {
        if (active) setIsDiscoveriesLoading(false);
      }
    })();
    return () => { active = false; };
  }, [authUserId]);

  if (auth.isAuthLoading || !auth.authUser) {
    return <main className="min-h-screen bg-black" />;
  }

  const username = String(auth.dbUsername ?? auth.authUser.email?.split("@")[0] ?? "");

  return (
    <main
      className="pt-[var(--app-main-pt)] pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex flex-col items-center min-h-screen text-white"
    >
      <MyPageView
        username={username}
        digboxHref={`/u/${encodeURIComponent(username)}`}
        closetCount={closetProducts.length}
        digboxCount={digboxProducts.length}
        discoveredProducts={discoveredProducts}
        isDiscoveriesLoading={isDiscoveriesLoading}
        closetProducts={closetProducts}
        mySizes={mySizes}
        onCreateMySize={async (input) => {
          await createMySize(input);
        }}
        onDeleteMySize={async (id) => {
          await deleteMySize(id);
        }}
        onLogout={() => {
          void supabase?.auth.signOut();
          router.push("/");
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
