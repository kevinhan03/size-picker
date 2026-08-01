"use client";

import { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth";
import type { AuthInitialState } from "../types";

type AuthContextValue = ReturnType<typeof useAuth>;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, initialState }: { children: React.ReactNode; initialState: AuthInitialState }) {
  const value = useAuth(initialState);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
