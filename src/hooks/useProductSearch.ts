import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { searchCatalogProducts } from '../api';
import type { Product } from '../types';
import { generateFallbackResult } from '../utils/product';

const getProductSearchText = (product: Product) =>
  `${product.brand} ${product.name}`.toLowerCase();

export function useProductSearch() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setSuggestions([]);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      void searchCatalogProducts(normalized, controller.signal)
        .then((products) => {
          setSuggestions(products);
          setError(null);
        })
        .catch((searchError: unknown) => {
          if (searchError instanceof DOMException && searchError.name === 'AbortError') return;
          setSuggestions([]);
          setError(searchError instanceof Error ? searchError.message : '상품 검색에 실패했습니다.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const shouldHideSearchHero = useMemo(
    () => Boolean(result) && !isLoading,
    [isLoading, result]
  );

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSearch = (searchItem: Product | null = null) => {
    const term = searchItem ? searchItem.name : query;
    if (!term) return null;

    setResult(null);
    setError(null);
    setShowSuggestions(false);

    const found =
      searchItem ||
      suggestions.find((item) => getProductSearchText(item).includes(term.toLowerCase())) ||
      suggestions[0] ||
      generateFallbackResult(term);

    setResult(found);
    setQuery('');
    return found;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionSelect = (product: Product) => {
    setQuery(product.name);
    handleSearch(product);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowSuggestions(Boolean(value));
  };

  const clearQuery = () => {
    setQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const resetSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    setError(null);
    setResult(null);
    setSuggestions([]);
  };

  return {
    clearQuery,
    error,
    handleKeyDown,
    handleQueryChange,
    handleSearch,
    handleSuggestionSelect,
    isLoading,
    query,
    resetSearch,
    result,
    searchContainerRef,
    setQuery,
    setResult,
    setShowSuggestions,
    shouldHideSearchHero,
    showSuggestions,
    suggestions,
  };
}
