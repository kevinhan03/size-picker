"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginPage } from "../LoginPage";
import { useAuthContext } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export function LoginPageClient() {
  const router = useRouter();
  const auth = useAuthContext();

  useEffect(() => {
    if (!auth.isAuthLoading && auth.authUser) {
      router.replace("/");
    }
  }, [auth.authUser, auth.isAuthLoading, router]);

  return (
    <main className="pt-[var(--app-main-pt)] pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex flex-col items-center min-h-screen bg-black text-white">
      {supabase ? (
        <LoginPage
          supabase={supabase}
          onSuccess={() => {}}
          googleAuthError={auth.googleAuthError}
          onClearGoogleAuthError={() => auth.setGoogleAuthError(null)}
        />
      ) : null}
    </main>
  );
}
