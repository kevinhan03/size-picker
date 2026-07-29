import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "취향 분석 | DIGBOX",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TasteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
