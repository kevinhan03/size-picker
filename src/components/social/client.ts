"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../contexts/AuthContext";
import { buildLoginHref } from "../../utils/authNavigation";
export async function socialFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, { credentials: "include", ...init });
  const body = await response.json();
  if (!response.ok || !body.ok) throw new Error(body.error || "server_error");
  return body.data as T;
}
export const SOCIAL_CHANGE = "digbox-social-change";
let revision = 0;
export function socialRevision() {
  return revision;
}
export function changed() {
  revision++;
  window.dispatchEvent(new Event(SOCIAL_CHANGE));
}
function subscribe(listener: () => void) {
  window.addEventListener(SOCIAL_CHANGE, listener);
  return () => window.removeEventListener(SOCIAL_CHANGE, listener);
}
export function useSocialVersion() {
  return useSyncExternalStore(subscribe, socialRevision, () => 0);
}
export function useSocialAuth() {
  const auth = useAuthContext();
  const router = useRouter();
  return {
    userId: auth.authUser?.id || null,
    ensure: () => {
      if (auth.authUser) return true;
      router.push(
        buildLoginHref(
          "login",
          window.location.pathname + window.location.search
        )
      );
      return false;
    },
  };
}
export function useSocialResource<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const version = useSocialVersion();
  const { userId } = useSocialAuth();
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const seq = ++sequence.current;
    if (!url) {
      setLoading(false);
      return;
    }
    try {
      const value = await socialFetch<T>(url);
      if (seq === sequence.current) {
        setData(value);
        setError(null);
      }
    } catch (e) {
      if (seq === sequence.current) setError(e);
    } finally {
      if (seq === sequence.current) setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    setData(null);
    setLoading(true);
    void reload();
    const currentSequence = sequence;
    const refresh = window.setInterval(
      () => {
        void reload();
      },
      50 * 60 * 1000
    );
    return () => {
      currentSequence.current++;
      window.clearInterval(refresh);
    };
  }, [reload, userId]);
  useEffect(() => {
    if (version) void reload();
  }, [version, reload]);
  return { data, setData, error, loading, reload };
}
