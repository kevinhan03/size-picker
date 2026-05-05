import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { ClientProviders } from "../src/components/ClientProviders";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "DIGBOX",
  description: "취향은 더 깊게, 발견은 더 쉽게. 마음에 드는 옷과 패션 아이템을 한곳에서 디깅하세요.",
  openGraph: {
    title: "DIGBOX",
    description: "취향은 더 깊게, 발견은 더 쉽게. 마음에 드는 옷과 패션 아이템을 한곳에서 디깅하세요.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DIGBOX",
    description: "취향은 더 깊게, 발견은 더 쉽게. 마음에 드는 옷과 패션 아이템을 한곳에서 디깅하세요.",
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
  return (
    <html lang="ko">
      <body>
        <ClientProviders>
          {children}
          {modal}
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}
