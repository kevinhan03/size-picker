import { notFound } from "next/navigation";
import type { StyleTagName } from "../../../src/types";
import { TAGS, type TasteCollectionSource } from "../../../src/utils/tasteGraph";
import { TasteGraphPageClient } from "../../../src/components/pages/TasteGraphPageClient";
import { redirect } from "next/navigation";
import { getInitialAuthState } from "../../../server/auth/user-session";
import { getTasteAnalysis } from "../../../server/services/taste-analysis";
import { ClosetProvider } from "../../../src/contexts/ClosetContext";
import { DigboxProvider } from "../../../src/contexts/DigboxContext";
import { buildLoginHref } from "../../../src/utils/authNavigation";

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

  const auth = await getInitialAuthState();
  if (!auth.user?.id) {
    const queryParams = new URLSearchParams();
    if (initialView === "brands") queryParams.set("view", "brands");
    if (initialTag) queryParams.set("tag", initialTag);
    const returnTo = `/taste/${source}${queryParams.size > 0 ? `?${queryParams.toString()}` : ""}`;
    redirect(buildLoginHref("login", returnTo, "taste"));
  }
  const [closet, digbox] = await Promise.all([
    getTasteAnalysis(auth.user.id, "closet"),
    getTasteAnalysis(auth.user.id, "digbox"),
  ]);

  return (
    <ClosetProvider initialProducts={closet.products} initialAnalysisLoaded refreshAnalysisAfterMutation>
      <DigboxProvider initialProducts={digbox.products} initialAnalysisLoaded refreshAnalysisAfterMutation>
        <TasteGraphPageClient
          initialSource={initialSource}
          initialView={initialView}
          initialTag={initialTag}
          initialGraphs={{ closet: closet.graph, digbox: digbox.graph }}
        />
      </DigboxProvider>
    </ClosetProvider>
  );
}
