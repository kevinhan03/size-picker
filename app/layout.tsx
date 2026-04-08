import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { ClientProviders } from "../src/components/ClientProviders";
import { fetchInitialProducts } from "../server/utils/products-list";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "DIGBOX",
    template: "%s | DIGBOX",
  },
  description: "의류와 신발의 사이즈표를 검색하고 비교하는 Next.js 기반 상품 사이즈 플랫폼.",
  openGraph: {
    title: "DIGBOX",
    description: "의류와 신발의 사이즈표를 검색하고 비교하는 Next.js 기반 상품 사이즈 플랫폼.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DIGBOX",
    description: "의류와 신발의 사이즈표를 검색하고 비교하는 Next.js 기반 상품 사이즈 플랫폼.",
  },
  icons: {
    icon: "/favicon-simple.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: ReactNode;
  modal: ReactNode;
}>) {
  const initialProducts = await fetchInitialProducts().catch(() => []);

  return (
    <html lang="ko">
      <body>
        <ClientProviders initialProducts={initialProducts}>
          {children}
          {modal}
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}
