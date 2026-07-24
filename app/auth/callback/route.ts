import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { assertSupabaseConfig, supabase as adminSupabase } from '../../../server/lib/supabase.js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const cookieStore = await cookies();
  const oauthIntentCookie = cookieStore.get('digbox_oauth_intent')?.value;
  const oauthIntent = oauthIntentCookie === 'signup' || oauthIntentCookie === 'login'
    ? oauthIntentCookie
    : null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'auth_callback_failed');
    return NextResponse.redirect(loginUrl);
  }

  const userId = exchangeData.user?.id;
  if (!userId) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'auth_callback_failed');
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .maybeSingle();

  const redirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, request.url));
    response.cookies.delete('digbox_oauth_intent');
    return response;
  };

  if (profileError) {
    await supabase.auth.signOut({ scope: 'local' });
    return redirect('/login?error=auth_callback_failed');
  }

  if (profile?.username) return redirect('/login');

  if (oauthIntent === 'login') {
    await supabase.auth.signOut({ scope: 'local' });
    try {
      assertSupabaseConfig();
      await adminSupabase!.auth.admin.deleteUser(userId);
    } catch {
      // The daily cleanup job retries accounts that could not be removed here.
    }
    return redirect('/login?error=unregistered_google');
  }

  // Never delete an account when the browser did not preserve its OAuth intent.
  // Treat the account as an incomplete signup so the user can finish safely.
  return redirect('/onboarding/username');
}
