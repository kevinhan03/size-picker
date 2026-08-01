import { TasteGraphPageClient } from "../../src/components/pages/TasteGraphPageClient";
import { redirect } from "next/navigation";
import { getInitialAuthState } from "../../server/auth/user-session";
import { getTasteAnalysis } from "../../server/services/taste-analysis";
import { ClosetProvider } from "../../src/contexts/ClosetContext";
import { DigboxProvider } from "../../src/contexts/DigboxContext";

export default async function TastePage() {
  const auth = await getInitialAuthState();
  if (!auth.user?.id) redirect("/login");
  const [closet, digbox] = await Promise.all([
    getTasteAnalysis(auth.user.id, "closet"),
    getTasteAnalysis(auth.user.id, "digbox"),
  ]);
  return <ClosetProvider initialProducts={closet.products}><DigboxProvider initialProducts={digbox.products}><TasteGraphPageClient initialGraphs={{ closet: closet.graph, digbox: digbox.graph }} /></DigboxProvider></ClosetProvider>;
}
