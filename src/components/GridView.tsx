import type { SyntheticEvent } from "react";
import { LayoutGrid, Search } from "lucide-react";
import { CategoryDropdown } from "./CategoryDropdown";
import { ProgressiveImage } from "./ProgressiveImage";
import type { Product } from "../types";
import { CATEGORY_OPTIONS } from "../constants";

interface GridViewProps {
  allProducts: Product[];
  filteredGridProducts: Product[];
  gridCategoryCounts: Record<string, number>;
  gridCategoryFilter: string;
  setGridCategoryFilter: (value: string) => void;
  gridSearchQuery: string;
  setGridSearchQuery: (value: string) => void;
  onProductClick: (product: Product) => void;
  onImageError: (event: SyntheticEvent<HTMLImageElement>) => void;
}

export function GridView({
  allProducts,
  filteredGridProducts,
  gridCategoryCounts,
  gridCategoryFilter,
  setGridCategoryFilter,
  gridSearchQuery,
  setGridSearchQuery,
  onProductClick,
  onImageError,
}: GridViewProps) {
  return (
    <div className="w-full max-w-7xl">
      <div className="mb-6 flex flex-col gap-4">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
          <LayoutGrid className="h-7 w-7 text-orange-500" />
          전체 상품 보기
        </h2>
        <div className="h-6 sm:h-8" />
        <div className="fixed left-1/2 top-[5.6rem] z-30 flex w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 justify-end sm:top-[8.3rem]">
          <div className="flex w-full max-w-[11.5rem] flex-col-reverse items-end justify-end gap-2 sm:ml-auto sm:w-fit sm:max-w-none sm:flex-row sm:items-center sm:gap-3">
            <CategoryDropdown
              options={CATEGORY_OPTIONS}
              value={gridCategoryFilter}
              counts={gridCategoryCounts}
              onChange={setGridCategoryFilter}
              totalLabel="Total"
              ariaLabel="상품 카테고리 필터"
              className="relative w-[5.6rem] shrink-0 sm:w-28"
            />
            <label className="relative block w-[7.2rem] sm:w-40">
              <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] h-3 w-3 -translate-y-1/2 text-gray-400 sm:left-4 sm:h-4 sm:w-4" />
              <input
                type="text"
                value={gridSearchQuery}
                onChange={(event) => setGridSearchQuery(event.target.value)}
                placeholder="상품 검색"
                aria-label="전체 상품 검색"
                className="h-[1.7rem] w-full rounded-[20px] border-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.88),rgba(28,28,28,0.72))] pl-8 pr-3 text-[0.7rem] font-medium text-white shadow-[0_16px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl placeholder:text-gray-400 focus:outline-none sm:h-8 sm:pl-10 sm:pr-4 sm:text-xs"
              />
            </label>
          </div>
        </div>
      </div>
      {allProducts.length === 0 ? (
        <div className="py-20 text-center text-gray-500">등록된 상품이 없습니다.</div>
      ) : filteredGridProducts.length === 0 ? (
        <div className="py-20 text-center text-gray-500">검색 조건에 맞는 상품이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {filteredGridProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => onProductClick(product)}
              className="ui-product-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(0,0,0,0.3)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_32%,transparent_68%,rgba(255,255,255,0.1))]" />
              <div className="relative mx-1.5 mb-0 mt-1.5 flex h-44 items-center justify-center overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(17,24,39,0.72),rgba(0,0,0,0.46))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:m-3 sm:h-48 sm:rounded-[22px] sm:p-4">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_28%)]" />
                <ProgressiveImage
                  src={product.image}
                  thumbnailSrc={product.thumbnailImage}
                  alt={product.name}
                  className="relative z-[1] max-h-full max-w-full rounded-[10px] object-contain"
                  onError={onImageError}
                />
              </div>
              <div className="flex flex-1 flex-col justify-center bg-black/10 px-4 pb-4 pt-3 text-center sm:px-5 sm:pb-5 sm:pt-4">
                <div className="mb-2 w-full pl-[5%] text-left text-xs font-bold uppercase tracking-wide text-orange-500">{product.brand}</div>
                <h3 className="mb-1 w-full pl-[5%] text-left text-[0.95rem] font-bold leading-tight text-white sm:text-lg">{product.name}</h3>
                <div className="pt-2 text-sm text-gray-300">{product.category}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
