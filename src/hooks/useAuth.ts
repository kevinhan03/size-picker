import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMyAccount } from "../api";
import { supabase } from "../lib/supabase";

type AuthUser = { id?: string; email?: string; user_metadata?: Record<string, unknown> } | null;

export function useAuth() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser>(null);
  const [dbUsername, setDbUsername] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [pendingUsername, setPendingUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [googleSignupComplete, setGoogleSignupComplete] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const processingUserIdRef = useRef<string | null>(null);

  const navigateToLogin = useCallback(() => {
    router.push("/login");
  }, [router]);

  const checkAndSetUser = useCallback(
    async (user: AuthUser) => {
      setAuthUser(user);
      if (!user || !supabase) {
        processingUserIdRef.current = null;
        setDbUsername(null);
        setNeedsUsername(false);
        setIsAuthLoading(false);
        return;
      }

      if (processingUserIdRef.current === (user.id ?? null)) return;
      processingUserIdRef.current = user.id ?? null;

      const rawIntent = localStorage.getItem("google_oauth_intent");
      localStorage.removeItem("google_oauth_intent");
      const intent = rawIntent === "login" || rawIntent === "signup" ? rawIntent : null;

      const { data } = await supabase.from("users").select("id, username").eq("id", user.id).maybeSingle();

      if (processingUserIdRef.current !== user.id) return;

      if (!data) {
        setDbUsername(null);
        if (intent === "login") {
          processingUserIdRef.current = null;
          try {
            await supabase.rpc("delete_my_unregistered_auth_user");
          } catch {
            // Ignore cleanup errors and continue sign-out flow.
          }
          await supabase.auth.signOut();
          setAuthUser(null);
          setNeedsUsername(false);
          setGoogleAuthError("This Google account is not registered. Please sign up with Google first.");
          setIsAuthLoading(false);
          navigateToLogin();
          return;
        }

        setNeedsUsername(true);
        setIsAuthLoading(false);
        return;
      }

      setNeedsUsername(false);
      setDbUsername(data.username as string);
      setIsAuthLoading(false);
    },
    [navigateToLogin]
  );

  useEffect(() => {
    if (!supabase) {
      setAuthUser(null);
      setDbUsername(null);
      setNeedsUsername(false);
      setIsAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      void checkAndSetUser(data.session?.user ?? null);
    }).catch(() => {
      setIsAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void checkAndSetUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [checkAndSetUser]);

  const submitUsername = async (onSuccess: () => void) => {
    const trimmed = pendingUsername.trim();
    if (!trimmed) {
      setUsernameError("Please enter a username.");
      return;
    }
    if (isSubmittingUsername) return;

    setIsSubmittingUsername(true);
    setUsernameError(null);

    const {
      data: { user: currentUser },
    } = await supabase!.auth.getUser();
    if (!currentUser) {
      await supabase!.auth.signOut();
      setNeedsUsername(false);
      setUsernameError(null);
      setIsSubmittingUsername(false);
      navigateToLogin();
      return;
    }

    const { data: existing } = await supabase!.from("users").select("username").eq("username", trimmed).maybeSingle();
    if (existing) {
      setUsernameError("That username is already taken.");
      setIsSubmittingUsername(false);
      return;
    }

    const { error: insertError } = await supabase!.from("users").insert({ id: currentUser.id, username: trimmed });
    if (insertError) {
      console.error("users insert error:", insertError);
      setUsernameError("An error occurred. Please try again.");
      setIsSubmittingUsername(false);
      return;
    }

    setNeedsUsername(false);
    setDbUsername(trimmed);
    setPendingUsername("");
    setGoogleSignupComplete(true);
    setIsSubmittingUsername(false);
    onSuccess();
  };

  const deleteAccount = async () => {
    if (!supabase || isDeletingAccount) return false;

    setDeleteAccountError(null);
    setIsDeletingAccount(true);
    try {
      await deleteMyAccount();
      await supabase.auth.signOut();
      setAuthUser(null);
      setDbUsername(null);
      setNeedsUsername(false);
      setPendingUsername("");
      setUsernameError(null);
      setGoogleSignupComplete(false);
      navigateToLogin();
      return true;
    } catch (error: unknown) {
      setDeleteAccountError(error instanceof Error ? error.message : "Failed to delete account");
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
    googleSignupComplete,
    setGoogleSignupComplete,
    isDeletingAccount,
    deleteAccountError,
    deleteAccount,
    submitUsername,
  };
}
