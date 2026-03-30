import type { Metadata } from "next";
import { MyPageClient } from "../../src/components/pages/MyPageClient";

export const metadata: Metadata = {
  title: "마이페이지",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyPageRoute() {
  return <MyPageClient />;
}
