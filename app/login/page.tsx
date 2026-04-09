import type { Metadata } from "next";
import { LoginPageClient } from "../../src/components/pages/LoginPageClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginRoutePage() {
  return <LoginPageClient />;
}
