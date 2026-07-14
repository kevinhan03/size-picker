import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { UsernameOnboardingPageClient } from "../../../src/components/pages/UsernameOnboardingPageClient";

export default async function UsernameOnboardingPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect('/login');

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) redirect('/login?error=auth_callback_failed');
  if (profile?.username) redirect('/');

  return <UsernameOnboardingPageClient />;
}
