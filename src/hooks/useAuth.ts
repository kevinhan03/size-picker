import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cleanupUnregisteredGoogleAccount, completeMyProfile, deleteMyAccount } from "../api";
import { supabase } from "../lib/supabase";
import { getAuthErrorMessage } from "../utils/authMessage";
import { normalizeUsername, validateUsername } from "../utils/username";

type AuthUser = { id?: string; email?: string; user_metadata?: Record<string, unknown> } | null;
const GOOGLE_SIGNUP_TOAST_KEY = "digbox_google_signup_complete_toast";

const hasInvalidRefreshToken = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return code === "refresh_token_not_found" || (typeof message === "string" && message.toLowerCase().includes("invalid refresh token"));
};

export function useAuth() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser>(null);
  const [dbUsername, setDbUsername] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [pendingUsername, setPendingUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const processingUserIdRef = useRef<string | null>(null);

  const navigateToLogin = useCallback(() => router.push("/login"), [router]);

  const checkAndSetUser = useCallback(async (user: AuthUser, forceUserUpdate = false) => {
    setAuthUser((current) => !forceUserUpdate && (current?.id ?? null) === (user?.id ?? null) ? current : user);
    if (!user || !supabase) {
      processingUserIdRef.current = null;
      setDbUsername(null);
      setNeedsUsername(false);
      setIsAuthLoading(false);
      return;
    }
    if (processingUserIdRef.current === (user.id ?? null)) return;
    processingUserIdRef.current = user.id ?? null;

    const rawIntent = sessionStorage.getItem("google_oauth_intent");
    sessionStorage.removeItem("google_oauth_intent");
    const intent = rawIntent === "login" || rawIntent === "signup" ? rawIntent : null;
    const { data, error } = await supabase.from("users").select("id, username").eq("id", user.id).maybeSingle();
    if (processingUserIdRef.current !== user.id) return;
    if (error) {
      setIsAuthLoading(false);
      return;
    }
    if (!data) {
      if (intent === "login") {
        processingUserIdRef.current = null;
        try { await cleanupUnregisteredGoogleAccount(); } catch { /* scheduled cleanup remains as a fallback */ }
        await supabase.auth.signOut();
        setAuthUser(null);
        setNeedsUsername(false);
        setGoogleAuthError("unregistered_google");
        setIsAuthLoading(false);
        navigateToLogin();
        return;
      }
      setDbUsername(null);
      setPendingUsername(normalizeUsername(user.user_metadata?.username));
      setNeedsUsername(true);
      setIsAuthLoading(false);
      return;
    }
    setNeedsUsername(false);
    setDbUsername(String(data.username));
    setIsAuthLoading(false);
  }, [navigateToLogin]);

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }
    const authClient = supabase;
    authClient.auth.getSession().then(async ({ data, error }) => {
      if (hasInvalidRefreshToken(error)) await authClient.auth.signOut({ scope: "local" });
      void checkAndSetUser(data.session?.user ?? null);
    }).catch(() => setIsAuthLoading(false));
    const { data: listener } = authClient.auth.onAuthStateChange((event, session) => {
      if (event !== "TOKEN_REFRESHED") void checkAndSetUser(session?.user ?? null, event === "USER_UPDATED");
    });
    return () => listener.subscription.unsubscribe();
  }, [checkAndSetUser]);

  const submitUsername = async (value: string) => {
    const username = normalizeUsername(value);
    const validationError = validateUsername(username);
    if (validationError) { setUsernameError(validationError); throw new Error(validationError); }
    if (isSubmittingUsername) return;
    setIsSubmittingUsername(true);
    setUsernameError(null);
    try {
      const completedUsername = await completeMyProfile(username);
      setNeedsUsername(false);
      setDbUsername(completedUsername);
      setPendingUsername("");
      sessionStorage.setItem(GOOGLE_SIGNUP_TOAST_KEY, "1");
    } catch (error: unknown) {
      const message = getAuthErrorMessage(error);
      setUsernameError(message);
      throw new Error(message);
    } finally {
      setIsSubmittingUsername(false);
    }
  };

  const signOut = async (destination = "/") => {
    await supabase?.auth.signOut();
    setAuthUser(null);
    setDbUsername(null);
    setNeedsUsername(false);
    router.replace(destination);
  };

  const abandonIncompleteGoogleSignup = async (destination = "/") => {
    try {
      await cleanupUnregisteredGoogleAccount();
    } catch {
      // Always let the user leave; the scheduled cleanup handles retry cases.
    }
    await signOut(destination);
  };

  const deleteAccount = async () => {
    if (!supabase || isDeletingAccount) return false;
    setDeleteAccountError(null);
    setIsDeletingAccount(true);
    try {
      await deleteMyAccount();
      await signOut("/login");
      return true;
    } catch (error: unknown) {
      setDeleteAccountError(getAuthErrorMessage(error, "계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요."));
      return false;
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return { authUser, dbUsername, isAuthLoading, needsUsername, pendingUsername, setPendingUsername, usernameError, isSubmittingUsername, googleAuthError, setGoogleAuthError, isDeletingAccount, deleteAccountError, deleteAccount, submitUsername, signOut, abandonIncompleteGoogleSignup, setDbUsername };
}
