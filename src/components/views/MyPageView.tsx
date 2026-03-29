interface MyPageViewProps {
  username: string;
  onLogout: () => void;
  onDeleteAccount: () => void;
  isDeletingAccount: boolean;
  deleteAccountError: string | null;
}

export function MyPageView({
  username,
  onLogout,
  onDeleteAccount,
  isDeletingAccount,
  deleteAccountError,
}: MyPageViewProps) {
  return (
    <div className="w-full max-w-md mx-auto mt-16 px-4">
      <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <h2 className="text-white font-bold text-lg mb-1">My Page</h2>
        <p className="text-gray-500 text-sm mb-8">{username}</p>
        <button
          onClick={onLogout}
          className="w-full py-3 rounded-xl text-sm font-bold transition border border-red-500/40 bg-[linear-gradient(180deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))] text-red-400 hover:bg-[linear-gradient(180deg,rgba(239,68,68,0.25),rgba(239,68,68,0.1))] hover:border-red-500/70"
        >
          Logout
        </button>
        <button
          onClick={onDeleteAccount}
          disabled={isDeletingAccount}
          className="mt-8 w-full py-2 rounded-lg text-xs transition border border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20 disabled:cursor-not-allowed disabled:text-gray-600"
        >
          {isDeletingAccount ? 'Deleting account...' : 'Delete account'}
        </button>
        {deleteAccountError ? (
          <p className="mt-3 text-xs text-red-400">{deleteAccountError}</p>
        ) : null}
      </div>
    </div>
  );
}
