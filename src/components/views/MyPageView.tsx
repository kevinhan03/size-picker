"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Copy, LogOut, Plus, Ruler, Shirt, Star, Trash2, UserRound } from "lucide-react";
import type { Product } from "../../types";

interface MyPageViewProps {
  username: string;
  digboxHref: string;
  closetCount: number;
  digboxCount: number;
  closetPreviewProducts: Product[];
  digboxPreviewProducts: Product[];
  sizeLabels: string[];
  onLogout: () => void;
  onDeleteAccount: () => void;
  isDeletingAccount: boolean;
  deleteAccountError: string | null;
}

const cardClass =
  "rounded-2xl border border-white/10 bg-white/[0.055] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_18px_46px_rgba(0,0,0,0.42)] backdrop-blur-2xl";

function ProductCardCarousel({ products, icon }: { products: Product[]; icon: React.ReactNode }) {
  const preview = products.slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const didSwipeRef = React.useRef(false);

  const slideToNext = () => {
    if (preview.length <= 1) return;
    setActiveIndex((current) => (current + 1) % preview.length);
  };

  const slideToPrevious = () => {
    if (preview.length <= 1) return;
    setActiveIndex((current) => (current - 1 + preview.length) % preview.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLButtonElement>) => {
    const touch = event.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    didSwipeRef.current = false;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLButtonElement>) => {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (startX === null || startY === null || preview.length <= 1) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    if (Math.abs(deltaX) < 36 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

    didSwipeRef.current = true;
    if (deltaX < 0) slideToNext();
    else slideToPrevious();
  };

  const handleCarouselClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    slideToNext();
  };

  if (preview.length === 0) {
    return (
      <div className="flex h-full min-h-[156px] items-center justify-center rounded-2xl border border-white/[0.06] bg-black/20 text-gray-600">
        {icon}
      </div>
    );
  }

  const getOffset = (index: number) => {
    if (preview.length === 1) return 0;
    if (preview.length === 2) return index === activeIndex ? 0 : 1;
    let offset = index - activeIndex;
    const half = preview.length / 2;
    if (offset > half) offset -= preview.length;
    if (offset < -half) offset += preview.length;
    return offset;
  };

  const getCardStyle = (offset: number): React.CSSProperties => {
    const visibleOffset = Math.abs(offset) <= 1;
    const x = offset === 0 ? "0%" : offset < 0 ? "var(--mypage-side-card-x-neg)" : "var(--mypage-side-card-x)";
    return {
      left: "50%",
      opacity: visibleOffset ? (offset === 0 ? 1 : 0.58) : 0,
      pointerEvents: visibleOffset ? "auto" : "none",
      transform: `translateX(calc(-50% + ${x})) translateY(-50%) scale(${offset === 0 ? 1 : 0.72})`,
      zIndex: offset === 0 ? 10 : visibleOffset ? 1 : 0,
    };
  };

  return (
    <div className="min-h-[190px] w-full min-w-0 max-w-full overflow-hidden px-2 pt-3 [--mypage-side-card-x-neg:-40%] [--mypage-side-card-x:40%] sm:min-h-[292px] sm:[--mypage-side-card-x-neg:-50%] sm:[--mypage-side-card-x:50%]">
      <button
        type="button"
        onClick={handleCarouselClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative h-[170px] w-full touch-pan-y appearance-none border-0 bg-transparent p-0 shadow-none outline-none sm:h-[276px]"
        aria-label="다음 상품 보기"
      >
        {preview.map((product, index) => {
          const offset = getOffset(index);
          return (
          <div
            key={product.id}
            className="absolute top-1/2 aspect-[4/5] h-[160px] overflow-hidden rounded-2xl bg-white transition-all duration-300 ease-out sm:h-[260px]"
            style={getCardStyle(offset)}
          >
            <img
              src={product.thumbnailImage || product.image}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          </div>
          );
        })}
      </button>
    </div>
  );
}

function CollectionCard({
  title,
  count,
  href,
  products,
  icon,
  tone,
}: {
  title: string;
  count: number;
  href: string;
  products: Product[];
  icon: React.ReactNode;
  tone: "yellow" | "orange";
}) {
  const color = tone === "yellow" ? "text-yellow-300" : "text-orange-400";
  const bg = tone === "yellow" ? "bg-yellow-400/12" : "bg-orange-500/12";

  return (
    <section className={`${cardClass} flex min-h-[284px] min-w-0 flex-col p-4 sm:min-h-[292px] sm:p-5`}>
      <div className="mb-3 sm:mb-4">
        <Link href={href} className="group flex min-w-0 items-start justify-between gap-2 no-underline">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 sm:rounded-xl ${bg} ${color}`}>
              {icon}
            </span>
            <h2 className="min-w-0 truncate text-sm font-black text-white transition group-hover:text-orange-300 sm:text-lg">{title}</h2>
          </div>
          <p className="text-xs font-semibold text-gray-500 sm:text-sm">
            {count > 0 ? `${count} items saved` : "No items yet"}
          </p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-500 transition group-hover:text-orange-300 sm:h-5 sm:w-5" />
        </Link>
      </div>
      <div className="min-h-0 min-w-0 flex-1">
        <ProductCardCarousel products={products} icon={icon} />
      </div>
      {count === 0 && (
        <Link
          href={title === "DIGBOX" ? "/" : "/"}
          className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 text-xs font-black text-black transition hover:bg-orange-400 sm:mt-4 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          상품 둘러보기
        </Link>
      )}
    </section>
  );
}

export function MyPageView({
  username,
  digboxHref,
  closetCount,
  digboxCount,
  closetPreviewProducts,
  digboxPreviewProducts,
  sizeLabels,
  onLogout,
  onDeleteAccount,
  isDeletingAccount,
  deleteAccountError,
}: MyPageViewProps) {
  const [copied, setCopied] = useState(false);

  const copyPublicLink = async () => {
    const url = `${window.location.origin}${digboxHref}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:gap-4">
      <section className={`${cardClass} p-4 sm:p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 shadow-[0_0_24px_rgba(249,115,22,0.12)] sm:h-14 sm:w-14">
              <UserRound className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-tight text-white sm:text-2xl">{username}</p>
              <p className="mt-1 text-sm font-semibold text-gray-500">DIGBOX account</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:w-[340px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">DIGBOX</p>
                <p className="mt-1 text-xl font-black text-yellow-300">{digboxCount}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Closet</p>
                <p className="mt-1 text-xl font-black text-orange-400">{closetCount}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void copyPublicLink()}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] text-sm font-bold text-gray-300 transition hover:border-yellow-400/40 hover:text-yellow-300"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "링크 복사됨" : "공개 DIGBOX 링크 복사"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
        <CollectionCard
          title="DIGBOX"
          count={digboxCount}
          href={digboxHref}
          products={digboxPreviewProducts}
          icon={<Star className="h-4 w-4" />}
          tone="yellow"
        />
        <CollectionCard
          title="Closet"
          count={closetCount}
          href="/closet"
          products={closetPreviewProducts}
          icon={<Shirt className="h-4 w-4" />}
          tone="orange"
        />
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4">
        <section className={`${cardClass} p-5`}>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-gray-300">
              <Ruler className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-black text-white">My Sizes</h2>
          </div>
          {sizeLabels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {sizeLabels.slice(0, 8).map((label) => (
                <span key={label} className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-sm font-black text-orange-300">
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 text-sm font-semibold text-gray-500">
              옷장에 사이즈를 선택해 상품을 담으면 내 사이즈 요약이 자동으로 쌓입니다.
              <Link href="/closet" className="mt-3 inline-flex text-sm font-black text-orange-400 transition hover:text-orange-300">
                옷장으로 이동
              </Link>
            </div>
          )}
        </section>

        <section className={`${cardClass} p-5`}>
          <h2 className="mb-4 text-lg font-black text-white">Account</h2>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="flex h-11 items-center justify-between rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-gray-300 transition hover:border-orange-500/40 hover:text-orange-400"
            >
              <span>Logout</span>
              <LogOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDeleteAccount}
              disabled={isDeletingAccount}
              className="flex h-11 items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 text-sm font-bold text-red-300 transition hover:border-red-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{isDeletingAccount ? "Deleting..." : "Delete account"}</span>
              <Trash2 className="h-4 w-4" />
            </button>
            {deleteAccountError && (
              <p className="text-sm font-semibold text-red-300">{deleteAccountError}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
