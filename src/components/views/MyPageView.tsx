"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Copy, LogOut, Plus, Ruler, Shirt, Star, Trash2, UserRound } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules";
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
  const preview = products.slice(0, 6);
  const swiperRef = React.useRef<{ isEnd: boolean; slideNext: () => void; slideTo: (index: number) => void } | null>(null);

  const slideToNext = () => {
    const swiper = swiperRef.current;
    if (!swiper || preview.length <= 1) return;
    if (swiper.isEnd) {
      swiper.slideTo(0);
      return;
    }
    swiper.slideNext();
  };

  if (preview.length === 0) {
    return (
      <div className="flex h-full min-h-[156px] items-center justify-center rounded-2xl border border-white/[0.06] bg-black/20 text-gray-600">
        {icon}
      </div>
    );
  }

  return (
    <div className="mypage-card-carousel min-h-[190px] w-full min-w-0 max-w-full overflow-hidden px-2 pt-3">
      <style>{`
        .mypage-card-carousel .swiper {
          width: 100%;
          max-width: 100%;
          padding: 6px 0;
          overflow: hidden;
        }
        .mypage-card-carousel .swiper-slide {
          width: min(27vw, 132px);
          height: min(33.75vw, 165px);
          background: transparent;
          border: 0;
          box-shadow: none;
          outline: none;
        }
        @media (min-width: 640px) {
          .mypage-card-carousel .swiper-slide {
            width: min(220px, calc(100% - 32px));
            height: 275px;
          }
        }
        .mypage-card-carousel .mypage-carousel-card {
          transform: scale(0.9);
          opacity: 1;
          transition: transform 220ms ease, opacity 220ms ease;
        }
        .mypage-card-carousel .swiper-slide-active .mypage-carousel-card {
          transform: scale(1);
          opacity: 1;
        }
        .mypage-card-carousel .swiper-slide button {
          appearance: none;
          background: transparent;
          border: 0;
          box-shadow: none;
          outline: none;
        }
        @media (min-width: 640px) {
          .mypage-card-carousel .mypage-carousel-card {
            transform: scale(0.82);
            opacity: 1;
          }
        }
        .mypage-card-carousel .swiper-pagination {
          display: none;
        }
        .mypage-card-carousel .swiper-3d .swiper-slide-shadow-left,
        .mypage-card-carousel .swiper-3d .swiper-slide-shadow-right {
          background-image: none;
          background: none;
        }
      `}</style>
      <Swiper
        spaceBetween={10}
        autoplay={false}
        effect="coverflow"
        grabCursor
        centeredSlides
        loop={false}
        slidesPerView="auto"
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 120,
          modifier: 2.25,
        }}
        pagination={{ clickable: true }}
        modules={[EffectCoverflow, Autoplay, Pagination]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
      >
        {preview.map((product) => (
          <SwiperSlide key={product.id}>
            <button
              type="button"
              onClick={slideToNext}
              className="mypage-carousel-card flex h-full w-full appearance-none flex-col border-0 bg-transparent p-0 text-left shadow-none outline-none"
              aria-label="다음 상품 보기"
            >
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <img
                  src={product.thumbnailImage || product.image}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              </div>
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
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

      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1.15fr_0.85fr]">
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

      <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[1.15fr_0.85fr]">
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
