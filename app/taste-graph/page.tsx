import { redirect } from "next/navigation";

type LegacyTasteGraphPageProps = {
  searchParams: Promise<{ source?: string; view?: string; tag?: string }>;
};

export default async function LegacyTasteGraphPage({ searchParams }: LegacyTasteGraphPageProps) {
  const query = await searchParams;
  const sourcePath = query.source === "digbox" ? "saved" : query.source ? "closet" : null;
  const nextQuery = new URLSearchParams();
  if (query.view === "brands") nextQuery.set("view", "brands");
  if (query.tag) nextQuery.set("tag", query.tag);
  const suffix = nextQuery.size ? `?${nextQuery.toString()}` : "";

  redirect(sourcePath ? `/taste/${sourcePath}${suffix}` : `/taste${suffix}`);
}
