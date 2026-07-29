import { notFound } from "next/navigation";
import type { StyleTagName } from "../../../src/types";
import { TAGS, type TasteCollectionSource } from "../../../src/utils/tasteGraph";
import { TasteGraphPageClient } from "../../../src/components/pages/TasteGraphPageClient";

type TasteSourcePageProps = {
  params: Promise<{ source: string }>;
  searchParams: Promise<{ view?: string; tag?: string }>;
};

export default async function TasteSourcePage({ params, searchParams }: TasteSourcePageProps) {
  const [{ source }, query] = await Promise.all([params, searchParams]);
  if (source !== "closet" && source !== "saved") notFound();

  const initialSource: TasteCollectionSource = source === "saved" ? "digbox" : "closet";
  const initialView = query.view === "brands" ? "brands" : "products";
  const initialTag =
    query.tag && (TAGS as string[]).includes(query.tag)
      ? (query.tag as StyleTagName)
      : undefined;

  return (
    <TasteGraphPageClient
      initialSource={initialSource}
      initialView={initialView}
      initialTag={initialTag}
    />
  );
}
