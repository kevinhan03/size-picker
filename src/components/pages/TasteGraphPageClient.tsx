"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Network, Plus } from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useClosetContext } from "../../contexts/ClosetContext";
import { useDigboxContext } from "../../contexts/DigboxContext";
import { TasteGraphCanvas } from "../taste-graph/TasteGraphCanvas";
import { TasteSummaryCard } from "../taste-graph/TasteSummaryCard";

type TasteGraphSource = "closet" | "digbox";

export function TasteGraphPageClient() {
  const router = useRouter();
  const auth = useAuthContext();
  const [source, setSource] = useState<TasteGraphSource>("closet");
  const {
    closetProducts,
    isLoading: isClosetLoading,
    ensureLoaded: ensureClosetLoaded,
  } = useClosetContext();
  const {
    digboxProducts,
    isLoading: isDigboxLoading,
    ensureLoaded: ensureDigboxLoaded,
  } = useDigboxContext();

  useEffect(() => {
    if (!auth.isAuthLoading && !auth.authUser) {
      router.replace("/login");
    }
  }, [auth.authUser, auth.isAuthLoading, router]);

  useEffect(() => {
    if (!auth.authUser) return;
    ensureClosetLoaded();
    ensureDigboxLoaded();
  }, [auth.authUser, ensureClosetLoaded, ensureDigboxLoaded]);

  const activeProducts = source === "closet" ? closetProducts : digboxProducts;
  const activeLoading = source === "closet" ? isClosetLoading : isDigboxLoading;
  const sourceLabel = source === "closet" ? "옷장" : "DIGBOX";
  const sourceNoun = source === "closet" ? "옷장 상품" : "DIGBOX 상품";
  const emptyCopy = useMemo(
    () =>
      source === "closet"
        ? {
            title: "옷장이 비어있어요",
            description: "옷장에 상품을 담으면 나만의 취향그래프가 그려져요.",
          }
        : {
            title: "DIGBOX가 비어있어요",
            description: "마음에 드는 상품을 DIGBOX에 저장하면 관심 취향그래프가 그려져요.",
          },
    [source]
  );

  const sourceToggle = (
    <div className="taste-source-toggle" aria-label="취향그래프 상품 기준">
      {(["closet", "digbox"] as const).map((value) => (
        <button
          key={value}
          type="button"
          className={`taste-source-button ${source === value ? "active" : ""}`}
          onClick={() => setSource(value)}
        >
          {value === "closet" ? "옷장" : "DIGBOX"}
          <span>{value === "closet" ? closetProducts.length : digboxProducts.length}</span>
        </button>
      ))}
    </div>
  );

  if (auth.isAuthLoading || !auth.authUser) {
    return <main className="fixed inset-0 bg-black" />;
  }

  if (activeLoading) {
    return <main className="fixed inset-0 bg-black" />;
  }

  if (activeProducts.length === 0) {
    return (
      <main className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <div className="absolute left-4 right-4 top-4 flex justify-end">
          {sourceToggle}
        </div>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
          <Network className="h-7 w-7" />
        </span>
        <div>
          <p className="text-xl font-black text-white">{emptyCopy.title}</p>
          <p className="mt-2 text-sm font-semibold text-gray-500">{emptyCopy.description}</p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition hover:bg-orange-400"
        >
          <Plus className="h-4 w-4" />
          상품 둘러보기
        </Link>
        <style jsx>{toggleStyles}</style>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 flex flex-col">
      <TasteSummaryCard
        controls={sourceToggle}
        products={activeProducts}
        sourceLabel={sourceLabel}
        sourceNoun={sourceNoun}
      />
      <div className="relative min-h-0 flex-1">
        <TasteGraphCanvas products={activeProducts} />
      </div>
      <style jsx>{toggleStyles}</style>
    </main>
  );
}

const toggleStyles = `
  .taste-source-toggle {
    display: inline-grid;
    grid-template-columns: repeat(2, minmax(86px, 1fr));
    gap: 4px;
    padding: 4px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(18px);
  }

  .taste-source-button {
    display: inline-flex;
    min-height: 34px;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: #a5acb8;
    font-size: 12px;
    font-weight: 850;
    cursor: pointer;
    transition: background-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
  }

  .taste-source-button span {
    min-width: 20px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.09);
    padding: 2px 6px;
    color: inherit;
    font-size: 11px;
    line-height: 1.1;
  }

  .taste-source-button:hover {
    color: #f3f4f6;
  }

  .taste-source-button.active {
    background: #f97316;
    color: #111114;
    box-shadow: 0 8px 20px rgba(249, 115, 22, 0.22);
  }

  .taste-source-button.active span {
    background: rgba(0, 0, 0, 0.13);
  }

  @media (max-width: 640px) {
    .taste-source-toggle {
      width: 100%;
    }
  }
`;
