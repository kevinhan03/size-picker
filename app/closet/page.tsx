import type { Metadata } from "next";
import { ClosetPageClient } from "../../src/components/pages/ClosetPageClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ClosetPage() {
  return <ClosetPageClient />;
}
