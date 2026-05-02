import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { completeMyProfile, deleteMyAccount } from "../api";
import { supabase } from "../lib/supabase";
import { getAuthErrorMessage } from "../utils/authMessage";
import { normalizeUsername, validateUsername } from "../utils/username";

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
        const metadataUsername = normalizeUsername(user.user_metadata?.username);
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
          setGoogleAuthError("가입되지 않은 Google 계정입니다. 먼저 Google로 회원가입을 진행해 주세요.");
          setIsAuthLoading(false);
          navigateToLogin();
          return;
        }

        if (metadataUsername) {
          const validationError = validateUsername(metadataUsername);
          if (!validationError) {
            try {
              const completedUsername = await completeMyProfile(metadataUsername);
              if (processingUserIdRef.current !== user.id) return;
              setNeedsUsername(false);
              setDbUsername(completedUsername);
              setPendingUsername("");
              setIsAuthLoading(false);
              return;
            } catch {
              // Fall through to the username modal so the user can choose another name.
            }
          }
          setPendingUsername(metadataUsername);
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
    const validationError = validateUsername(trimmed);
    if (validationError) {
      setUsernameError(validationError);
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

    let completedUsername = "";
    try {
      completedUsername = await completeMyProfile(trimmed);
    } catch (error: unknown) {
      setUsernameError(getAuthErrorMessage(error));
      setIsSubmittingUsername(false);
      return;
    }

    setNeedsUsername(false);
    setDbUsername(completedUsername);
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
      setDeleteAccountError(getAuthErrorMessage(error, "계정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요."));
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
