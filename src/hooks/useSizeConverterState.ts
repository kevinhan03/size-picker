import { useMemo, useState } from 'react';
import {
  CLOTHING_SIZE_ROWS_BY_GENDER,
  SHOE_SIZE_ROWS_BY_GENDER,
} from '../constants';
import type {
  SizeCategory,
  SizeConversionRow,
  SizeGender,
  SizeRegionKey,
} from '../types';
import { findConvertedSize } from '../utils/sizeTable';

export function useSizeConverterState() {
  const [sizeCategory, setSizeCategory] = useState<SizeCategory>('clothing');
  const [sizeGender, setSizeGender] = useState<SizeGender>('men');
  const [sizeRegion, setSizeRegion] = useState<SizeRegionKey>('us');
  const [sizeValue, setSizeValue] = useState('S');
  const [activeConverterRowIndex, setActiveConverterRowIndex] = useState<number | null>(null);

  const sizeRows = useMemo<SizeConversionRow[]>(() => {
    if (sizeCategory === 'shoes') return SHOE_SIZE_ROWS_BY_GENDER[sizeGender];
    return CLOTHING_SIZE_ROWS_BY_GENDER[sizeGender];
  }, [sizeCategory, sizeGender]);

  const sizeOptions = useMemo(
    () => sizeRows.map((row) => row[sizeRegion]).filter(Boolean),
    [sizeRegion, sizeRows]
  );

  const convertedSize = useMemo(
    () => findConvertedSize(sizeRows, sizeRegion, sizeValue),
    [sizeRegion, sizeRows, sizeValue]
  );

  return {
    activeConverterRowIndex,
    convertedSize,
    setActiveConverterRowIndex,
    setSizeCategory,
    setSizeGender,
    setSizeRegion,
    setSizeValue,
    sizeCategory,
    sizeGender,
    sizeOptions,
    sizeRegion,
    sizeRows,
    sizeValue,
  };
}
