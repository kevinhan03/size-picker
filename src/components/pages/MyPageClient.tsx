"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MyPageView } from "../views/MyPageView";
import { useAuthContext } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export function MyPageClient() {
  const router = useRouter();
  const auth = useAuthContext();

  useEffect(() => {
    if (!auth.isAuthLoading && !auth.authUser) {
      router.replace("/login");
    }
  }, [auth.authUser, auth.isAuthLoading, router]);

  if (auth.isAuthLoading || !auth.authUser) {
    return <main className="min-h-screen bg-black" />;
  }

  return (
    <main className="pt-[var(--app-main-pt)] pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex flex-col items-center min-h-screen bg-black text-white">
      <MyPageView
        username={String(auth.dbUsername ?? auth.authUser.email?.split("@")[0] ?? "")}
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
