import type { Metadata } from "next";
import { AdminRoutePageClient } from "../../src/components/pages/AdminRoutePageClient";

export const metadata: Metadata = {
  title: "관리자",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRoutePage() {
  return <AdminRoutePageClient />;
}
