import { useMemo, useState } from 'react';
import { CATEGORY_OPTIONS } from '../constants';
import type { Product } from '../types';

export function useGridState(allProducts: Product[]) {
  const [gridCategoryFilter, setGridCategoryFilter] = useState<string>('');
  const [gridSubCategoryFilter, setGridSubCategoryFilter] = useState<string>('');
  const [gridSearchQuery, setGridSearchQuery] = useState('');

  const gridCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Total: allProducts.length };
    for (const category of CATEGORY_OPTIONS) {
      counts[category] = 0;
    }

    for (const product of allProducts) {
      if (product.category in counts) {
        counts[product.category] += 1;
      }
    }

    return counts;
  }, [allProducts]);

  const filteredGridProducts = useMemo(() => {
    const normalizedGridSearchQuery = gridSearchQuery.trim().toLowerCase();

    return allProducts.filter((product) => {
      if (gridCategoryFilter && product.category !== gridCategoryFilter) {
        return false;
      }
      if (gridSubCategoryFilter && product.subCategory !== gridSubCategoryFilter) return false;

      if (!normalizedGridSearchQuery) {
        return true;
      }

      const searchableText = [product.brand, product.name, product.category, product.subCategory, product.url]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedGridSearchQuery);
    });
  }, [allProducts, gridCategoryFilter, gridSubCategoryFilter, gridSearchQuery]);

  return {
    gridCategoryCounts,
    gridCategoryFilter,
    filteredGridProducts,
    gridSearchQuery,
    gridSubCategoryFilter,
    setGridCategoryFilter,
    setGridSubCategoryFilter,
    setGridSearchQuery,
  };
}
