"use client";

import { createContext, useContext } from "react";
import { useMySizes } from "../hooks/useMySizes";
import { useAuthContext } from "./AuthContext";

type MySizesContextValue = ReturnType<typeof useMySizes>;

const MySizesContext = createContext<MySizesContextValue | null>(null);

export function MySizesProvider({ children }: { children: React.ReactNode }) {
  const { authUser } = useAuthContext();
  const value = useMySizes(Boolean(authUser));
  return <MySizesContext.Provider value={value}>{children}</MySizesContext.Provider>;
}

export function useMySizesContext() {
  const context = useContext(MySizesContext);
  if (!context) throw new Error("useMySizesContext must be used within MySizesProvider");
  return context;
}
