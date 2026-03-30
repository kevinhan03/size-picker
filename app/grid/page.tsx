import type { Metadata } from "next";
import { Suspense } from "react";
import { GridPageClient } from "../../src/components/pages/GridPageClient";

export const metadata: Metadata = {
  title: "전체 상품 보기",
  description: "등록된 상품의 사이즈표를 전체 목록에서 탐색하세요.",
};

export default function GridPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <GridPageClient />
    </Suspense>
  );
}
