import { GuestSavedPageClient } from "../../src/components/pages/GuestSavedPageClient";
import { SavedPageClient } from "../../src/components/pages/SavedPageClient";
import { getInitialAuthState } from "../../server/auth/user-session";
import { getDigboxProducts } from "../../server/services/user-collections";

export const dynamic = "force-dynamic";

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const initialTab =
    (await searchParams).tab === "posts" ? "posts" : "products";
  const auth = await getInitialAuthState();
  if (auth.user?.id && auth.username) {
    const saved = await getDigboxProducts(auth.user.id);
    return (
      <SavedPageClient
        initialTab={initialTab}
        username={auth.username}
        products={saved.products}
        discoveredDigboxCounts={saved.discoveredDigboxCounts}
      />
    );
  }

  return <GuestSavedPageClient />;
}
