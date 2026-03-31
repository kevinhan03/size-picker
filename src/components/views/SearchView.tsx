import type { KeyboardEvent, RefObject, SyntheticEvent } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { ProgressiveImage } from "../ProgressiveImage";
import type { Product } from "../../types";

interface SearchViewProps {
  error: string | null;
  isLoading: boolean;
  onClearQuery: () => void;
  onImageLoadError: (event: SyntheticEvent<HTMLImageElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onSuggestionSelect: (product: Product) => void;
  onSuggestionVisibilityChange: (visible: boolean) => void;
  query: string;
  resultVisible: boolean;
  searchContainerRef: RefObject<HTMLDivElement | null>;
  shouldHideSearchHero: boolean;
  showSuggestions: boolean;
  suggestions: Product[];
}

export function SearchView({
  error,
  isLoading,
  onClearQuery,
  onImageLoadError,
  onKeyDown,
  onQueryChange,
  onSearch,
  onSuggestionSelect,
  onSuggestionVisibilityChange,
  query,
  resultVisible,
  searchContainerRef,
  shouldHideSearchHero,
  showSuggestions,
  suggestions,
}: SearchViewProps) {
  return (
    <>
      <div
        className={`w-full max-w-2xl overflow-hidden text-center transition-all duration-500 ease-out ${
          shouldHideSearchHero
            ? "pointer-events-none mb-0 max-h-0 -translate-y-4 opacity-0"
            : "mb-5 max-h-96 translate-y-0 opacity-100"
        }`}
        aria-hidden={shouldHideSearchHero}
      >
        <h1 className="mb-[var(--hero-title-mb)] mt-[var(--hero-title-mt)] text-[length:var(--hero-title-size)] font-extrabold leading-tight tracking-tight">
          <span className="block text-white">모든 룩의 사이즈표를</span>
          <span className="block text-orange-500">한 번에 검색하세요</span>
        </h1>
        <p className="mt-8 text-[length:var(--hero-subtitle-size)] text-white">
          <span className="block">공식 페이지와 사용자들이 공유한 데이터를 바탕으로</span>
          <span className="block">더 정확한 사이즈 정보를 제공합니다</span>
        </p>
      </div>

      <div
        className={`relative w-full max-w-2xl transition-all duration-500 ${resultVisible || isLoading ? "mt-0" : "mt-4"}`}
        ref={searchContainerRef}
      >
        <div className="group relative">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_30%,transparent_72%,rgba(255,255,255,0.08))]" />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
            <Search className={`h-6 w-6 transition-colors ${showSuggestions ? "text-orange-500" : "text-gray-500"}`} />
          </div>
          <input
            type="text"
            className="w-full rounded-2xl border-2 border-gray-800 bg-gray-900 py-[var(--search-input-py)] pl-14 pr-14 text-[length:var(--search-input-font-size)] text-white shadow-xl transition-all placeholder:text-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="브랜드명 또는 상품명을 검색하세요"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => {
              if (query) onSuggestionVisibilityChange(true);
            }}
          />
          {query && (
            <button
              onClick={onClearQuery}
              className="absolute inset-y-0 right-14 flex items-center pr-2 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onSearch}
            className="absolute inset-y-2 right-2 rounded-xl bg-orange-500 px-3 text-black shadow-lg transition-colors hover:bg-orange-400"
            style={{ boxShadow: "var(--ui-depth-shadow)" }}
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {showSuggestions && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-96 overflow-hidden overflow-y-auto rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] shadow-[0_20px_48px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
            {suggestions.length > 0 ? (
              <ul>
                {suggestions.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => onSuggestionSelect(item)}
                    className="flex cursor-pointer items-center gap-4 border-b border-white/10 px-5 py-4 transition-colors last:border-0 hover:bg-white/[0.08]"
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-white/10">
                      <ProgressiveImage
                        src={item.image}
                        thumbnailSrc={item.thumbnailImage}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={onImageLoadError}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-sm text-gray-400">
                        {item.brand} · {item.category}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">검색어와 일치하는 추천 상품이 없습니다.</div>
            )}
          </div>
        )}
      </div>

      {isLoading && <div className="mt-10 text-gray-300">검색 중...</div>}
      {error && !isLoading && <div className="mt-6 text-red-300">{error}</div>}
    </>
  );
}
