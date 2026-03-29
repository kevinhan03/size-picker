export function registerAuthRoutes(app, { supabase, assertSupabaseConfig }) {
  // 미가입 구글 OAuth 유저를 auth에서 삭제
  // 로그인 탭에서 구글 로그인 시도했지만 users 테이블에 없는 경우 호출
  app.post('/api/auth/cleanup-unregistered', async (req, res) => {
    assertSupabaseConfig();

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.slice(7);

    // 토큰으로 유저 확인
    const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);
    if (verifyError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // users 테이블에 이미 등록된 유저라면 삭제하지 않음
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: 'User is already registered' });
    }

    // auth에서 삭제
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('[auth] deleteUser error:', deleteError);
      return res.status(500).json({ error: 'Failed to remove auth entry' });
    }

    return res.json({ success: true });
  });
}
