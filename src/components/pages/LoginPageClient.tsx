"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginPage } from "../LoginPage";
import { useAuthContext } from "../../contexts/AuthContext";
import { captureEvent } from "../../utils/analytics";
import {
  type AuthEntryContext,
  clearAuthContinuation,
  readAuthContinuation,
  sanitizeReturnTo,
  saveAuthContinuation,
} from "../../utils/authNavigation";

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuthContext();
  const { googleAuthError, setGoogleAuthError } = auth;
  const authUserId = auth.authUser?.id;
  const completedRef = useRef(false);
  const [isGuestDigboxSignup, setIsGuestDigboxSignup] = useState(false);
  const [isUnregisteredGoogle, setIsUnregisteredGoogle] = useState(false);
  const queryIntent = searchParams.get("intent") === "signup" ? "signup" : "login";
  const queryReturnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const hasQueryIntent = searchParams.has("intent");
  const hasQueryReturnTo = searchParams.has("returnTo");
  const hasUnregisteredGoogleQuery = searchParams.get("error") === "unregistered_google";
  const hasUnregisteredGoogleState = googleAuthError === "unregistered_google";
  const queryContext = searchParams.get("context");
  const authEntryContext: AuthEntryContext | undefined =
    queryContext === "taste" || queryContext === "closet" || queryContext === "saved" ? queryContext : undefined;

  useEffect(() => {
    if (!hasUnregisteredGoogleState) return;
    setIsUnregisteredGoogle(true);
    setGoogleAuthError(null);
  }, [hasUnregisteredGoogleState, setGoogleAuthError]);

  useEffect(() => {
    if (authUserId) return;
    const existing = readAuthContinuation();
    // A fresh protected-page visit has explicit query parameters and must win
    // over a stale continuation. OAuth returns to /login without them, so it
    // intentionally resumes the value kept in session storage.
    const intent = hasQueryIntent ? queryIntent : existing?.intent || queryIntent;
    const returnTo = hasQueryReturnTo ? queryReturnTo : existing?.returnTo || queryReturnTo;
    setIsGuestDigboxSignup(intent === "signup" && existing?.source === "guest_digbox");
    saveAuthContinuation({
      intent,
      returnTo,
      source: existing?.source || "direct",
      method: existing?.method,
    });
  }, [authUserId, hasQueryIntent, hasQueryReturnTo, queryIntent, queryReturnTo]);

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
    <main className="flex min-h-screen flex-col items-center bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[calc(4rem+env(safe-area-inset-top)+1rem)] font-sans text-white">
      <LoginPage
          onSuccess={() => router.refresh()}
          googleAuthError={hasUnregisteredGoogleState ? null : auth.googleAuthError}
          onClearGoogleAuthError={() => auth.setGoogleAuthError(null)}
          initialTab={queryIntent}
          authEntryContext={authEntryContext}
          isGuestDigboxSignup={isGuestDigboxSignup}
          isUnregisteredGoogle={isUnregisteredGoogle || hasUnregisteredGoogleQuery || hasUnregisteredGoogleState}
      />
    </main>
  );
}
