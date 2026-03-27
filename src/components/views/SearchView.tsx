import type { KeyboardEvent, RefObject, SyntheticEvent } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { ProgressiveImage } from '../ProgressiveImage';
import type { Product } from '../../types';

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
        className={`w-full max-w-2xl text-center overflow-hidden transition-all duration-500 ease-out ${
          shouldHideSearchHero
            ? 'max-h-0 mb-0 opacity-0 -translate-y-4 pointer-events-none'
            : 'max-h-96 mb-5 opacity-100 translate-y-0'
        }`}
        aria-hidden={shouldHideSearchHero}
      >
        <h1 className="mt-[var(--hero-title-mt)] mb-[var(--hero-title-mb)] text-[length:var(--hero-title-size)] font-extrabold leading-tight tracking-tight">
          <span className="block text-white">모든 룩의 사이즈표를</span>
          <span className="block text-orange-500">한 번에 검색하세요</span>
        </h1>
        <p className="mt-8 text-[length:var(--hero-subtitle-size)] text-white">
          <span className="block">공식 홈페이지와 사용자들이 공유한 데이터를 통해</span>
          <span className="block">가장 정확한 사이즈 정보를 제공합니다.</span>
        </p>
      </div>

      <div
        className={`w-full max-w-2xl relative transition-all duration-500 ${resultVisible || isLoading ? 'mt-0' : 'mt-4'}`}
        ref={searchContainerRef}
      >
        <div className="relative group">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_30%,transparent_72%,rgba(255,255,255,0.08))]" />
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className={`w-6 h-6 transition-colors ${showSuggestions ? 'text-orange-500' : 'text-gray-500'}`} />
          </div>
          <input
            type="text"
            className="w-full pl-14 pr-14 py-[var(--search-input-py)] bg-gray-900 border-2 border-gray-800 rounded-2xl shadow-xl text-[length:var(--search-input-font-size)] text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            placeholder="브랜드명 또는 상품명"
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
              className="absolute inset-y-0 right-14 pr-2 flex items-center text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onSearch}
            className="absolute inset-y-2 right-2 rounded-xl bg-orange-500 px-3 text-black hover:bg-orange-400 transition-colors shadow-lg"
            style={{ boxShadow: 'var(--ui-depth-shadow)' }}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 z-20 max-h-96 overflow-y-auto overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] shadow-[0_20px_48px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
            {suggestions.length > 0 ? (
              <ul>
                {suggestions.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => onSuggestionSelect(item)}
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer border-b border-white/10 transition-colors hover:bg-white/[0.08] last:border-0"
                  >
                    <div className="w-10 h-10 rounded-md flex-shrink-0 overflow-hidden bg-white/10">
                      <ProgressiveImage
                        src={item.image}
                        thumbnailSrc={item.thumbnailImage}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={onImageLoadError}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-sm text-gray-400">
                        {item.brand} 쨌 {item.category}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                검색어와 일치하는 추천 상품이 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading && <div className="mt-10 text-gray-300">검색 중...</div>}
      {error && !isLoading && <div className="mt-6 text-red-300">{error}</div>}
    </>
  );
}
