"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginPage } from "../LoginPage";
import { useAuthContext } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { captureEvent } from "../../utils/analytics";
import {
  clearAuthContinuation,
  readAuthContinuation,
  sanitizeReturnTo,
  saveAuthContinuation,
} from "../../utils/authNavigation";

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuthContext();
  const authUserId = auth.authUser?.id;
  const completedRef = useRef(false);
  const [isGuestDigboxSignup, setIsGuestDigboxSignup] = useState(false);
  const queryIntent = searchParams.get("intent") === "signup" ? "signup" : "login";
  const queryReturnTo = sanitizeReturnTo(searchParams.get("returnTo"));

  useEffect(() => {
    if (authUserId) return;
    const existing = readAuthContinuation();
    setIsGuestDigboxSignup(queryIntent === "signup" && existing?.source === "guest_digbox");
    saveAuthContinuation({
      intent: queryIntent,
      returnTo: queryReturnTo,
      source: existing?.source || "direct",
      method: existing?.method,
    });
  }, [authUserId, queryIntent, queryReturnTo]);

  useEffect(() => {
    if (auth.isAuthLoading || !authUserId || !auth.dbUsername || completedRef.current) return;
    completedRef.current = true;
    const continuation = readAuthContinuation();
    captureEvent("auth_completed", {
      mode: continuation?.intent || queryIntent,
      method: continuation?.method || "unknown",
      source: continuation?.source || "direct",
    });
    const returnTo = continuation?.returnTo || queryReturnTo;
    clearAuthContinuation();
    router.replace(returnTo);
  }, [auth.dbUsername, auth.isAuthLoading, authUserId, queryIntent, queryReturnTo, router]);

  return (
    <main className="pt-[var(--app-main-pt)] pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex min-h-screen flex-col items-center bg-black text-white">
      {supabase ? (
        <LoginPage
          supabase={supabase}
          onSuccess={() => {}}
          googleAuthError={auth.googleAuthError}
          onClearGoogleAuthError={() => auth.setGoogleAuthError(null)}
          initialTab={queryIntent}
          isGuestDigboxSignup={isGuestDigboxSignup}
        />
      ) : null}
    </main>
  );
}
