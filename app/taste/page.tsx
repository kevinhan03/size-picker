import { TasteGraphPageClient } from "../../src/components/pages/TasteGraphPageClient";
import { redirect } from "next/navigation";
import { getInitialAuthState } from "../../server/auth/user-session";
import { getTasteSummary } from "../../server/services/taste-analysis";
import { ClosetProvider } from "../../src/contexts/ClosetContext";
import { DigboxProvider } from "../../src/contexts/DigboxContext";
import { buildLoginHref } from "../../src/utils/authNavigation";

export default async function TastePage() {
  const auth = await getInitialAuthState();
  if (!auth.user?.id) redirect(buildLoginHref("login", "/taste", "taste"));
  const [closet, digbox] = await Promise.all([
    getTasteSummary(auth.user.id, "closet"),
    getTasteSummary(auth.user.id, "digbox"),
  ]);
  return <ClosetProvider initialProducts={closet.products} initialAnalysisLoaded refreshAnalysisAfterMutation><DigboxProvider initialProducts={digbox.products} initialAnalysisLoaded refreshAnalysisAfterMutation><TasteGraphPageClient /></DigboxProvider></ClosetProvider>;
}
