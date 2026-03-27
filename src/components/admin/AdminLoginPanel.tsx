interface AdminLoginPanelProps {
  adminAuthError: string | null;
  adminPassword: string;
  isAdminAuthSubmitting: boolean;
  onLogin: () => void;
  onPasswordChange: (value: string) => void;
  onPasswordKeyDown: (key: string) => void;
}

export function AdminLoginPanel({
  adminAuthError,
  adminPassword,
  isAdminAuthSubmitting,
  onLogin,
  onPasswordChange,
  onPasswordKeyDown,
}: AdminLoginPanelProps) {
  return (
    <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-white">관리자 로그인</h2>
      <input
        type="password"
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
        placeholder="관리자 비밀번호"
        value={adminPassword}
        onChange={(event) => onPasswordChange(event.target.value)}
        onKeyDown={(event) => onPasswordKeyDown(event.key)}
      />
      {adminAuthError ? <p className="text-sm text-red-400">{adminAuthError}</p> : null}
      <button
        onClick={onLogin}
        disabled={isAdminAuthSubmitting}
        className={`w-full px-4 py-3 rounded-xl text-sm font-bold text-black ${
          isAdminAuthSubmitting ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400'
        }`}
      >
        {isAdminAuthSubmitting ? '로그인 중...' : '로그인'}
      </button>
    </div>
  );
}
