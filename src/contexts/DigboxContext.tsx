"use client";

import { createContext, useContext } from "react";
import { useDigbox } from "../hooks/useDigbox";
import { useAuthContext } from "./AuthContext";
import { useProductsContext } from "./ProductsContext";

type DigboxContextValue = ReturnType<typeof useDigbox>;

const DigboxContext = createContext<DigboxContextValue | null>(null);

export function DigboxProvider({ children }: { children: React.ReactNode }) {
  const { authUser, dbUsername } = useAuthContext();
  const { products } = useProductsContext();
  const value = useDigbox(Boolean(authUser && dbUsername), products);
  return <DigboxContext.Provider value={value}>{children}</DigboxContext.Provider>;
}

export function useDigboxContext() {
  const context = useContext(DigboxContext);
  if (!context) throw new Error("useDigboxContext must be used within DigboxProvider");
  return context;
}

export type { DigboxToast } from "../hooks/useDigbox";
