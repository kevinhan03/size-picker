import { useEffect, useState } from "react";

interface UseAdminSessionOptions {
  isAdminPage: boolean;
  onAuthenticated?: () => Promise<void> | void;
}

export function useAdminSession({ isAdminPage, onAuthenticated }: UseAdminSessionOptions) {
  const [isAdminCheckingSession, setIsAdminCheckingSession] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [isAdminAuthSubmitting, setIsAdminAuthSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdminPage) return;

    let isActive = true;
    setIsAdminCheckingSession(true);

    void (async () => {
      try {
        const response = await fetch("/api/admin/session", { credentials: "include" });
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "관리자 세션 확인에 실패했습니다.");
        }

        if (!isActive) return;
        const authenticated = Boolean(payload?.data?.authenticated);
        setIsAdminAuthenticated(authenticated);
        setAdminAuthError(null);

        if (authenticated) {
          await onAuthenticated?.();
        }
      } catch (sessionError: unknown) {
        if (!isActive) return;
        const message =
          sessionError instanceof Error ? sessionError.message : "관리자 세션 확인에 실패했습니다.";
        setAdminAuthError(message);
        setIsAdminAuthenticated(false);
      } finally {
        if (isActive) setIsAdminCheckingSession(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isAdminPage, onAuthenticated]);

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      setAdminAuthError("관리자 비밀번호를 입력해 주세요.");
      return false;
    }

    setIsAdminAuthSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: adminPassword }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "관리자 로그인에 실패했습니다.");
      }

      setIsAdminAuthenticated(true);
      setAdminPassword("");
      setAdminAuthError(null);
      await onAuthenticated?.();
      return true;
    } catch (loginError: unknown) {
      const message = loginError instanceof Error ? loginError.message : "관리자 로그인에 실패했습니다.";
      setAdminAuthError(message);
      setIsAdminAuthenticated(false);
      return false;
    } finally {
      setIsAdminAuthSubmitting(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore logout request errors; always reset client auth state
    } finally {
      setIsAdminAuthenticated(false);
      setAdminPassword("");
    }
  };

  return {
    isAdminCheckingSession,
    isAdminAuthenticated,
    adminPassword,
    setAdminPassword,
    adminAuthError,
    setAdminAuthError,
    isAdminAuthSubmitting,
    handleAdminLogin,
    handleAdminLogout,
  };
}
