"use client";

import { useEffect } from "react";
import { SizeConverterView } from "../SizeConverterView";
import { useSizeConverterState } from "../../hooks/useSizeConverterState";
import { normalizeSizeLookupValue } from "../../utils/sizeTable";

export function ConverterPageClient() {
  const converter = useSizeConverterState();
  const {
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
  } = converter;

  useEffect(() => {
    if (!convertedSize) {
      setActiveConverterRowIndex(null);
      return;
    }

    const nextIndex = sizeRows.findIndex((row) => row.label === convertedSize.label);
    setActiveConverterRowIndex(nextIndex >= 0 ? nextIndex : null);
  }, [convertedSize, setActiveConverterRowIndex, sizeRows]);

  useEffect(() => {
    if (sizeOptions.length === 0) {
      setSizeValue("");
      return;
    }

    const hasCurrentValue = sizeOptions.some(
      (option) => normalizeSizeLookupValue(option) === normalizeSizeLookupValue(sizeValue)
    );
    if (!hasCurrentValue) {
      setSizeValue(sizeOptions[0]);
    }
  }, [setSizeValue, sizeOptions, sizeValue]);

  return (
    <main className="pt-20 sm:pt-24 pb-[var(--app-main-pb)] px-[var(--app-main-px)] flex flex-col items-center min-h-screen bg-black text-white">
      <SizeConverterView
        sizeCategory={sizeCategory}
        setSizeCategory={setSizeCategory}
        sizeGender={sizeGender}
        setSizeGender={setSizeGender}
        sizeRegion={sizeRegion}
        setSizeRegion={setSizeRegion}
        sizeValue={sizeValue}
        setSizeValue={setSizeValue}
        sizeRows={sizeRows}
        sizeOptions={sizeOptions}
        convertedSize={convertedSize}
        activeConverterRowIndex={activeConverterRowIndex}
        setActiveConverterRowIndex={(index) => setActiveConverterRowIndex(index)}
      />
    </main>
  );
}
