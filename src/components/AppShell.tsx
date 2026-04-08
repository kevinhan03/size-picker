"use client";

import { AddProductModal } from "./AddProductModal";
import { AppHeader } from "./AppHeader";
import { GoogleSignupCompleteModal } from "./GoogleSignupCompleteModal";
import { NeedsUsernameModal } from "./NeedsUsernameModal";
import { SearchResultOverlay } from "./SearchResultOverlay";
import { useAuthContext } from "../contexts/AuthContext";
import { useProductFormContext } from "../contexts/ProductFormContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuthContext();
  const productForm = useProductFormContext();

  return (
    <>
      <AppHeader />
      {children}
      <SearchResultOverlay />
      <AddProductModal form={productForm} />
      {auth.needsUsername && (
        <NeedsUsernameModal
          pendingUsername={auth.pendingUsername}
          onUsernameChange={auth.setPendingUsername}
          onSubmit={() => void auth.submitUsername(() => {})}
          usernameError={auth.usernameError}
          isSubmitting={auth.isSubmittingUsername}
        />
      )}
      {auth.googleSignupComplete && (
        <GoogleSignupCompleteModal
          onStart={() => {
            auth.setGoogleSignupComplete(false);
          }}
        />
      )}
    </>
  );
}
