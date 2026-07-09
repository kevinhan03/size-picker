"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Network, Plus } from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { TasteGraphCanvas } from "../taste-graph/TasteGraphCanvas";
import { TasteSummaryCard } from "../taste-graph/TasteSummaryCard";

export function TasteGraphPageClient() {
  const router = useRouter();
  const auth = useAuthContext();
  const { closetProducts, isLoading, ensureLoaded } = useClosetContext();

  useEffect(() => {
    if (!auth.isAuthLoading && !auth.authUser) {
      router.replace("/login");
    }
  }, [auth.authUser, auth.isAuthLoading, router]);

  useEffect(() => {
    if (auth.authUser) ensureLoaded();
  }, [auth.authUser, ensureLoaded]);

  if (auth.isAuthLoading || !auth.authUser) {
    return <main className="fixed inset-0 bg-black" />;
  }

  if (isLoading) {
    return <main className="fixed inset-0 bg-black" />;
  }

  if (closetProducts.length === 0) {
    return (
      <main className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
          <Network className="h-7 w-7" />
        </span>
        <div>
          <p className="text-xl font-black text-white">옷장이 비어있어요</p>
          <p className="mt-2 text-sm font-semibold text-gray-500">옷장에 상품을 담으면 나만의 취향그래프가 그려져요.</p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition hover:bg-orange-400"
        >
          <Plus className="h-4 w-4" />
          상품 둘러보기
        </Link>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 flex flex-col">
      <TasteSummaryCard products={closetProducts} />
      <div className="relative min-h-0 flex-1">
        <TasteGraphCanvas products={closetProducts} />
      </div>
    </main>
  );
}
