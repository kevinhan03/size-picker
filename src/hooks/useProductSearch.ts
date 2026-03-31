import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Product } from '../types';
import { generateFallbackResult } from '../utils/product';

const getProductSearchText = (product: Product) =>
  `${product.brand} ${product.name}`.toLowerCase();

interface UseProductSearchParams {
  allProducts: Product[];
  onSearchSettled: () => void;
}

export function useProductSearch({
  allProducts,
  onSearchSettled,
}: UseProductSearchParams) {
  const [query, setQuery] = useState('');
  const [isLoading] = useState(false);
  const [result, setResult] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!query) {
      return [];
    }

    return allProducts.filter((item) =>
      getProductSearchText(item).includes(query.toLowerCase())
    );
  }, [allProducts, query]);

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

    const keyword = term.toLowerCase();
    const found =
      searchItem ||
      allProducts.find((item) => getProductSearchText(item).includes(keyword)) ||
      generateFallbackResult(term);

    setResult(found);
    setQuery('');
    onSearchSettled();
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
  };

  const resetSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    setError(null);
    setResult(null);
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
