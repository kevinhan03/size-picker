import type { Metadata } from "next";
import { AdminAgentPageClient } from "../../../src/components/pages/AdminAgentPageClient";
export const metadata: Metadata = {
  title: "에이전트 운영 | DIGBOX",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AdminAgentPageClient />;
}
