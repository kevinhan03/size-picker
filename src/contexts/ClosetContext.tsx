"use client";

import { createContext, useContext } from "react";
import { useCloset } from "../hooks/useCloset";
import { useAuthContext } from "./AuthContext";

type ClosetContextValue = ReturnType<typeof useCloset>;

const ClosetContext = createContext<ClosetContextValue | null>(null);

export function ClosetProvider({ children, initialProducts }: { children: React.ReactNode; initialProducts?: import("../types").Product[] }) {
  const { authUser } = useAuthContext();
  const value = useCloset(Boolean(authUser), initialProducts);
  return <ClosetContext.Provider value={value}>{children}</ClosetContext.Provider>;
}

export function useClosetContext() {
  const context = useContext(ClosetContext);
  if (!context) throw new Error("useClosetContext must be used within ClosetProvider");
  return context;
}

export type { ClosetToast } from "../hooks/useCloset";
