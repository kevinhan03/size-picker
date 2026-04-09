import type { Metadata } from "next";
import { ConverterPageClient } from "../../src/components/pages/ConverterPageClient";

export const metadata: Metadata = {
  description: "국가별 의류 및 신발 사이즈를 빠르게 변환하세요.",
};

export default function ConverterPage() {
  return <ConverterPageClient />;
}
