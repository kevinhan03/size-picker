import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cleanupUnregisteredGoogleAccount, completeMyProfile, deleteMyAccount } from "../api";
import { supabase } from "../lib/supabase";
import { getAuthHeaders } from "../api/shared";
import type { AuthInitialState } from "../types";
import { getAuthErrorMessage } from "../utils/authMessage";
import { normalizeUsername, validateUsername } from "../utils/username";
import { clearAuthSnapshot, readAuthSnapshot, writeAuthSnapshot } from "../utils/authCache";
import { clearCollectionSnapshot } from "../utils/collectionCache";

type AuthUser = { id?: string; email?: string } | null;
type AuthSessionResponse = { ok?: boolean; data?: AuthInitialState };
const GOOGLE_SIGNUP_TOAST_KEY = "digbox_google_signup_complete_toast";

export function useAuth(initialState: AuthInitialState) {
  const router = useRouter();
  const [cachedInitialState] = useState<AuthInitialState | null>(() => initialState.user ? null : readAuthSnapshot());
  // The first client render must match the anonymous static HTML emitted by the
  // root layout. Apply a browser-only snapshot only after hydration.
  const [authUser, setAuthUser] = useState<AuthUser>(initialState.user);
  const authUserRef = useRef<AuthUser>(initialState.user);
  const [dbUsername, setDbUsername] = useState<string | null>(initialState.username);
  const [needsUsername, setNeedsUsername] = useState(initialState.needsUsername);
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(supabase) && !initialState.user);
  const [pendingUsername, setPendingUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  useEffect(() => {
    const state = initialState.user ? initialState : cachedInitialState || initialState;
    authUserRef.current = state.user;
    setAuthUser(state.user);
    setDbUsername(state.username);
    setNeedsUsername(state.needsUsername);
    if (cachedInitialState && !initialState.user) setIsAuthLoading(false);
  }, [cachedInitialState, initialState]);

  useEffect(() => {
    const authClient = supabase;
    if (!authClient) {
      setIsAuthLoading(false);
      return;
    }

    let cancelled = false;
    const applyAnonymousState = () => {
      if (cancelled) return;
      const previousUserId = authUserRef.current?.id;
      if (previousUserId) clearCollectionSnapshot(previousUserId);
      clearAuthSnapshot();
      authUserRef.current = null;
      setAuthUser(null);
      setDbUsername(null);
      setNeedsUsername(false);
    };
    const loadSession = async () => {
      try {
        const { data } = await authClient.auth.getSession();
        if (!data.session) {
          applyAnonymousState();
          return;
        }
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
          headers: await getAuthHeaders(),
        });
        const payload = await response.json() as AuthSessionResponse;
        if (!response.ok || !payload.ok || !payload.data?.user) {
          applyAnonymousState();
          return;
        }
        if (cancelled) return;
        const previousUserId = authUserRef.current?.id;
        if (previousUserId && previousUserId !== payload.data.user.id) clearCollectionSnapshot(previousUserId);
        writeAuthSnapshot(payload.data);
        authUserRef.current = payload.data.user;
        setAuthUser(payload.data.user);
        setDbUsername(payload.data.username);
        setNeedsUsername(payload.data.needsUsername);
      } catch {
        applyAnonymousState();
      } finally {
        if (!cancelled) setIsAuthLoading(false);
      }
    };

    void loadSession();
    const { data: listener } = authClient.auth.onAuthStateChange(() => {
      void loadSession();
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const navigateToLogin = useCallback(() => router.push("/login"), [router]);

  const submitUsername = async (value: string) => {
    const username = normalizeUsername(value);
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      throw new Error(validationError);
    }
    if (isSubmittingUsername) return;
    setIsSubmittingUsername(true);
    setUsernameError(null);
    try {
      const completedUsername = await completeMyProfile(username);
      setNeedsUsername(false);
      setDbUsername(completedUsername);
      const userId = authUserRef.current?.id;
      if (userId) writeAuthSnapshot({ user: { id: userId, email: authUserRef.current?.email }, username: completedUsername, needsUsername: false });
      setPendingUsername("");
      sessionStorage.setItem(GOOGLE_SIGNUP_TOAST_KEY, "1");
      router.refresh();
    } catch (error: unknown) {
      const message = getAuthErrorMessage(error);
      setUsernameError(message);
      throw new Error(message);
    } finally {
      setIsSubmittingUsername(false);
    }
  };

  const signOut = async (destination = "/") => {
    await fetch("/api/auth/logout", { method: "POST" });
    await supabase?.auth.signOut({ scope: "local" });
    if (authUserRef.current?.id) clearCollectionSnapshot(authUserRef.current.id);
    clearAuthSnapshot();
    authUserRef.current = null;
    setAuthUser(null);
    setDbUsername(null);
    setNeedsUsername(false);
    router.replace(destination);
    router.refresh();
  };

  const abandonIncompleteGoogleSignup = async (destination = "/") => {
    try {
      await cleanupUnregisteredGoogleAccount();
    } catch {
      // The scheduled cleanup remains as a fallback.
    }
    await signOut(destination);
  };

  const deleteAccount = async () => {
    if (isDeletingAccount) return false;
    setDeleteAccountError(null);
    setIsDeletingAccount(true);
    try {
      await deleteMyAccount();
      await signOut("/login");
      return true;
    } catch (error: unknown) {
      setDeleteAccountError(getAuthErrorMessage(error, "계정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요."));
      return false;
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return {
    authUser,
    dbUsername,
    isAuthLoading,
    needsUsername,
    pendingUsername,
    setPendingUsername,
    usernameError,
    isSubmittingUsername,
    googleAuthError,
    setGoogleAuthError,
    isDeletingAccount,
    deleteAccountError,
    deleteAccount,
    submitUsername,
    signOut,
    abandonIncompleteGoogleSignup,
    setDbUsername,
    navigateToLogin,
  };
}
