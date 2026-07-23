import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "../src/components/pages/SearchPageClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.digbox.co.kr";

export const metadata: Metadata = {
  description: "좋아하는 옷을 기록하고 공유하며, 서로의 취향에서 새로운 스타일을 발견하는 곳, DIGBOX.",
};

export default function Page() {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DIGBOX | 디그박스",
    alternateName: ["DIGBOX", "디그박스"],
    url: siteUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Suspense fallback={<main className="min-h-screen bg-black" />}>
        <SearchPageClient />
      </Suspense>
    </>
  );
}
