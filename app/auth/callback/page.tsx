'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code || !supabase) {
      router.replace('/login');
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(() => {
      router.replace('/');
    }).catch(() => {
      router.replace('/login');
    });
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400 text-sm">로그인 중...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">로그인 중...</p>
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}
