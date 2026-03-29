interface MyPageViewProps {
  username: string;
  onLogout: () => void;
}

export function MyPageView({ username, onLogout }: MyPageViewProps) {
  return (
    <div className="w-full max-w-md mx-auto mt-16 px-4">
      <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <h2 className="text-white font-bold text-lg mb-1">마이페이지</h2>
        <p className="text-gray-500 text-sm mb-8">{username}</p>
        <button
          onClick={onLogout}
          className="w-full py-3 rounded-xl text-sm font-bold transition border border-red-500/40 bg-[linear-gradient(180deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))] text-red-400 hover:bg-[linear-gradient(180deg,rgba(239,68,68,0.25),rgba(239,68,68,0.1))] hover:border-red-500/70"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
