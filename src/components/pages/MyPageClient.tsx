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
    <main
      className="pt-[var(--app-main-pt)] pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex flex-col items-center min-h-screen text-white"
      style={{
        background: "#1a1a1a",
        backgroundImage: [
          "radial-gradient(ellipse 55% 45% at 12% 20%, rgba(249,115,22,0.14) 0%, transparent 65%)",
          "radial-gradient(ellipse 50% 55% at 88% 80%, rgba(99,102,241,0.11) 0%, transparent 65%)",
          "radial-gradient(ellipse 40% 40% at 55% 45%, rgba(236,72,153,0.06) 0%, transparent 60%)",
        ].join(", "),
      }}
    >
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
