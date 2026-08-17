"use client";

import { createContext, useContext } from "react";
import { useDigbox } from "../hooks/useDigbox";
import { useAuthContext } from "./AuthContext";

type DigboxContextValue = ReturnType<typeof useDigbox>;

const DigboxContext = createContext<DigboxContextValue | null>(null);

export function DigboxProvider({
  children,
  initialProducts,
  initialCounts = {},
  initialAnalysisLoaded = false,
  refreshAnalysisAfterMutation = false,
}: {
  children: React.ReactNode;
  initialProducts?: import("../types").Product[];
  initialCounts?: Record<string, number>;
  initialAnalysisLoaded?: boolean;
  refreshAnalysisAfterMutation?: boolean;
}) {
  const { authUser, dbUsername } = useAuthContext();
  const value = useDigbox(Boolean(authUser && dbUsername), initialProducts, initialCounts, {
    initialAnalysisLoaded,
    refreshAnalysisAfterMutation,
  });
  return <DigboxContext.Provider value={value}>{children}</DigboxContext.Provider>;
}

export function useDigboxContext() {
  const context = useContext(DigboxContext);
  if (!context) throw new Error("useDigboxContext must be used within DigboxProvider");
  return context;
}

export type { DigboxToast } from "../hooks/useDigbox";
