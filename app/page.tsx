import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "../src/components/pages/SearchPageClient";

export const metadata: Metadata = {
  description: "취향은 더 깊게, 발견은 더 쉽게. 마음에 드는 옷과 패션 아이템을 한곳에서 디깅하세요.",
};

export default function Page() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <SearchPageClient />
    </Suspense>
  );
}
