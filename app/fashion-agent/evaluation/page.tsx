import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TasteClusterEvaluationClient } from "../../../src/components/pages/TasteClusterEvaluationClient";
export const metadata: Metadata = {
  title: "추천 평가 | DIGBOX",
  robots: { index: false, follow: false },
};
export default function TasteClusterEvaluationPage() {
  if (process.env.FASHION_AGENT_EXPERIMENTS !== "true") notFound();
  return <TasteClusterEvaluationClient />;
}
