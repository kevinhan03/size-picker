import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getInitialAuthState } from "../../server/auth/user-session";
import { buildLoginHref } from "../../src/utils/authNavigation";
export const metadata: Metadata = {
  title: "내 프로필 | DIGBOX",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function MyPageRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
    else if (value !== undefined) query.set(key, value);
  }
  const auth = await getInitialAuthState();
  if (!auth.user?.id)
    redirect(buildLoginHref("login", `/mypage?${query}`, "saved"));
  if (!auth.username) redirect("/onboarding/username");
  redirect(`/${encodeURIComponent(auth.username)}${query.size ? `?${query}` : ""}`);
}
