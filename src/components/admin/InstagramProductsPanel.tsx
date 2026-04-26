"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Instagram, Search, Star, Users } from "lucide-react";
import type { Product } from "../../types";
import { toPublicUrl } from "../../utils/product";
import { useProductFormContext } from "../../contexts/ProductFormContext";

interface InstagramProductsPanelProps {
  featuredProducts: Product[];
  allProducts: Product[];
  isInstagramLoading: boolean;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  instagramProfileUrl: string;
  onInstagramProfileUrlChange: (url: string) => void;
  onInstagramProfileUrlSave: () => void;
}

export function InstagramProductsPanel({
  featuredProducts,
  allProducts,
  isInstagramLoading,
  onPublish,
  onUnpublish,
  onMove,
  instagramProfileUrl,
  onInstagramProfileUrlChange,
  onInstagramProfileUrlSave,
}: InstagramProductsPanelProps) {
  const productForm = useProductFormContext();
  const [mode, setMode] = useState<"new" | "existing" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const nonFeaturedProducts = allProducts.filter((p) => !p.isInstagram);
  const filteredProducts = nonFeaturedProducts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.brand.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  });

  const handleNewProduct = () => {
    productForm.setIsInstagramMode(true);
    productForm.openModal();
    setMode(null);
  };

  const handleToggleMode = (next: "new" | "existing") => {
    if (mode === next) {
      setMode(null);
    } else {
      setMode(next);
      if (next === "new") {
        handleNewProduct();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 인스타그램 프로필 링크 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="mb-4 text-base font-bold text-white">인스타그램 게시물 링크</h3>
        <div className="flex items-center gap-2">
          <Instagram className="h-5 w-5 flex-shrink-0 text-pink-400" />
          <input
            type="url"
            value={instagramProfileUrl}
            onChange={(e) => onInstagramProfileUrlChange(e.target.value)}
            placeholder="https://www.instagram.com/..."
            className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none"
          />
          <button
            onClick={onInstagramProfileUrlSave}
            disabled={isInstagramLoading}
            className="flex-shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-orange-400 disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>

      {/* 게시 방법 선택 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="mb-5 text-base font-bold text-white">상품 게시</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleToggleMode("new")}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.1] active:scale-[0.98]"
          >
            <Star className="h-5 w-5 flex-shrink-0 text-orange-400" />
            <span className="text-sm font-bold text-white">새 상품 게시</span>
          </button>
          <button
            onClick={() => handleToggleMode("existing")}
            className={`flex items-center gap-3 rounded-xl border px-5 py-4 text-left transition hover:-translate-y-0.5 active:scale-[0.98] ${
              mode === "existing"
                ? "border-orange-500/60 bg-orange-500/10"
                : "border-white/10 bg-white/[0.06] hover:bg-white/[0.1]"
            }`}
          >
            <Users className="h-5 w-5 flex-shrink-0 text-orange-400" />
            <span className="text-sm font-bold text-white">기존 상품 게시</span>
          </button>
        </div>
      </div>

      {/* 기존 상품 선택 패널 */}
      {mode === "existing" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h3 className="mb-4 text-base font-bold text-white">
            기존 상품 선택{" "}
            <span className="ml-1 text-sm font-normal text-gray-400">
              ({nonFeaturedProducts.length})
            </span>
          </h3>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="브랜드명 또는 상품명 검색"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <p className="text-sm text-gray-500">
              {searchQuery ? "검색 결과가 없습니다." : "게시 가능한 상품이 없습니다."}
            </p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {filteredProducts.map((product) => {
                const thumbSrc = product.imagePath
                  ? toPublicUrl(product.imagePath, { width: 160, height: 160, quality: 65 })
                  : product.image;
                return (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                  >
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800">
                      {thumbSrc && (
                        <img
                          src={thumbSrc}
                          alt={product.name}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase text-orange-400">{product.brand}</p>
                      <p className="truncate text-sm font-medium text-white">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                    <button
                      onClick={() => onPublish(product.id)}
                      disabled={isInstagramLoading}
                      className="flex-shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-orange-400 disabled:opacity-50"
                    >
                      게시
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* 현재 게시된 인스타 상품 목록 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="mb-4 text-base font-bold text-white">
          현재 게시된 상품{" "}
          <span className="ml-1 text-sm font-normal text-gray-400">({featuredProducts.length})</span>
        </h3>
        {featuredProducts.length === 0 ? (
          <p className="text-sm text-gray-500">게시된 인스타 상품이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {featuredProducts.map((product, index) => {
              const thumbSrc = product.imagePath
                ? toPublicUrl(product.imagePath, { width: 160, height: 160, quality: 65 })
                : product.image;
              return (
                <li
                  key={product.id}
                  className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-xs font-black text-orange-300">
                    {index + 1}
                  </div>
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800">
                    {thumbSrc && (
                      <img
                        src={thumbSrc}
                        alt={product.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase text-orange-400">{product.brand}</p>
                    <p className="truncate text-sm font-medium text-white">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onMove(product.id, "up")}
                      disabled={isInstagramLoading || index === 0}
                      aria-label="Move product up"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 text-gray-300 transition hover:border-orange-500 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(product.id, "down")}
                      disabled={isInstagramLoading || index === featuredProducts.length - 1}
                      aria-label="Move product down"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 text-gray-300 transition hover:border-orange-500 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => onUnpublish(product.id)}
                    disabled={isInstagramLoading}
                    className="flex-shrink-0 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:border-red-500 hover:text-red-400 disabled:opacity-50"
                  >
                    내림
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
