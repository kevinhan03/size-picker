"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MyPageView } from "../views/MyPageView";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { useMySizesContext } from "../../contexts/MySizesContext";
import { supabase } from "../../lib/supabase";

export function MyPageClient() {
  const router = useRouter();
  const auth = useAuthContext();
  const { closetProducts } = useClosetContext();
  const { digboxProducts } = useDigboxContext();
  const { mySizes, createMySize, deleteMySize } = useMySizesContext();

  useEffect(() => {
    if (!auth.isAuthLoading && !auth.authUser) {
      router.replace("/login");
    }
  }, [auth.authUser, auth.isAuthLoading, router]);

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
        closetPreviewProducts={closetProducts.slice(0, 5)}
        digboxPreviewProducts={digboxProducts.slice(0, 5)}
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
