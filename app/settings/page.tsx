import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getInitialAuthState } from "../../server/auth/user-session";
import { getProfileIdentity } from "../../server/services/profile";
import { SettingsPageClient } from "../../src/components/pages/SettingsPageClient";
import { buildLoginHref } from "../../src/utils/authNavigation";

export const metadata: Metadata = {
  title: "설정 | DIGBOX",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const auth = await getInitialAuthState();
  if (!auth.user?.id) redirect(buildLoginHref("login", "/settings"));
  if (!auth.username) redirect("/onboarding/username");

  const profile = await getProfileIdentity(auth.user.id);
  return <SettingsPageClient {...profile} />;
}
