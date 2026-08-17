import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cleanupUnregisteredGoogleAccount, completeMyProfile, deleteMyAccount } from "../api";
import type { AuthInitialState } from "../types";
import { getAuthErrorMessage } from "../utils/authMessage";
import { normalizeUsername, validateUsername } from "../utils/username";
import { useLocaleContext } from "../contexts/LocaleContext";

type AuthUser = { id?: string; email?: string } | null;
const GOOGLE_SIGNUP_TOAST_KEY = "digbox_google_signup_complete_toast";

export function useAuth(initialState: AuthInitialState) {
  const router = useRouter();
  const { t } = useLocaleContext();
  const [authUser, setAuthUser] = useState<AuthUser>(initialState.user);
  const [dbUsername, setDbUsername] = useState<string | null>(initialState.username);
  const [needsUsername, setNeedsUsername] = useState(initialState.needsUsername);
  const [pendingUsername, setPendingUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  useEffect(() => {
    setAuthUser(initialState.user);
    setDbUsername(initialState.username);
    setNeedsUsername(initialState.needsUsername);
  }, [initialState]);

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
      setDeleteAccountError(getAuthErrorMessage(error, t("mypage.deleteAccountError")));
      return false;
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return {
    authUser,
    dbUsername,
    isAuthLoading: false,
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
