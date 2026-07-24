import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClientProviders } from "../src/components/ClientProviders";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "DIGBOX | 디그박스",
  description: "좋아하는 옷을 기록하고 공유하며, 서로의 취향에서 새로운 스타일을 발견하는 곳, DIGBOX.",
  applicationName: "DIGBOX | 디그박스",
  openGraph: {
    title: "DIGBOX | 디그박스",
    description: "좋아하는 옷을 기록하고 공유하며, 서로의 취향에서 새로운 스타일을 발견하는 곳, DIGBOX.",
    siteName: "DIGBOX | 디그박스",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DIGBOX | 디그박스",
    description: "좋아하는 옷을 기록하고 공유하며, 서로의 취향에서 새로운 스타일을 발견하는 곳, DIGBOX.",
  },
  icons: {
    icon: [
      {
        url: "/digbox-mark.png",
        type: "image/png",
        sizes: "806x806",
      },
    ],
    shortcut: "/digbox-mark.png",
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
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientProviders>
          {children}
          {modal}
        </ClientProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
