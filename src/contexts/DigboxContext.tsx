"use client";

import { createContext, useContext } from "react";
import { useDigbox } from "../hooks/useDigbox";
import { useAuthContext } from "./AuthContext";

type DigboxContextValue = ReturnType<typeof useDigbox>;

const DigboxContext = createContext<DigboxContextValue | null>(null);

export function DigboxProvider({ children }: { children: React.ReactNode }) {
  const { authUser } = useAuthContext();
  const value = useDigbox(Boolean(authUser));
  return <DigboxContext.Provider value={value}>{children}</DigboxContext.Provider>;
}

export function useDigboxContext() {
  const context = useContext(DigboxContext);
  if (!context) throw new Error("useDigboxContext must be used within DigboxProvider");
  return context;
}

export type { DigboxToast } from "../hooks/useDigbox";
