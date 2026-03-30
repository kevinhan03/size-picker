import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "../src/components/pages/SearchPageClient";

export const metadata: Metadata = {
  title: "검색",
  description: "브랜드와 상품명으로 사이즈표를 검색하세요.",
};

export default function Page() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <SearchPageClient />
    </Suspense>
  );
}
