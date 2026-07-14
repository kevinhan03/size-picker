import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPageClient } from "../../src/components/pages/LoginPageClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginRoutePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <LoginPageClient />
    </Suspense>
  );
}
