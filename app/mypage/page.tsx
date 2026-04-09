import type { Metadata } from "next";
import { MyPageClient } from "../../src/components/pages/MyPageClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyPageRoute() {
  return <MyPageClient />;
}
