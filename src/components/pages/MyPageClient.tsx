"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MyPageView } from "../views/MyPageView";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useMySizesContext } from "../../contexts/MySizesContext";
import { supabase } from "../../lib/supabase";

export function MyPageClient() {
  const router = useRouter();
  const auth = useAuthContext();
  const authUserId = auth.authUser?.id;
  const { closetProducts, ensureLoaded: ensureClosetLoaded } = useClosetContext();
  const { mySizes, createMySize, deleteMySize, ensureLoaded: ensureMySizesLoaded } = useMySizesContext();

  useEffect(() => {
    if (!auth.isAuthLoading && !authUserId) {
      router.replace("/login");
    }
  }, [auth.isAuthLoading, authUserId, router]);

  useEffect(() => {
    if (authUserId) {
      ensureClosetLoaded();
      ensureMySizesLoaded();
    }
  }, [authUserId, ensureClosetLoaded, ensureMySizesLoaded]);

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
