import type { SizeTable } from "../types";

export const KOREAN_SHOE_SIZE_OPTIONS = [
  "220",
  "225",
  "230",
  "235",
  "240",
  "245",
  "250",
  "255",
  "260",
  "265",
  "270",
  "275",
  "280",
  "285",
  "290",
  "295",
  "300",
] as const;

export const isShoeCategory = (category: string | null | undefined): boolean =>
  category === "Shoes";

export const isNonApparelSizeCategory = (
  category: string | null | undefined
): boolean =>
  ["Shoes", "Bag", "JewelryWatch", "FashionAccessory"].includes(category ?? "");

export const getKoreanShoeSizeTable = (): SizeTable => ({
  headers: ["사이즈"],
  rows: KOREAN_SHOE_SIZE_OPTIONS.map((size) => [size]),
});
