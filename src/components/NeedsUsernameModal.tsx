interface NeedsUsernameModalProps {
  pendingUsername: string;
  onUsernameChange: (value: string) => void;
  onSubmit: () => void;
  usernameError: string | null;
  isSubmitting: boolean;
}

export function NeedsUsernameModal({
  pendingUsername,
  onUsernameChange,
  onSubmit,
  usernameError,
  isSubmitting,
}: NeedsUsernameModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.6)] max-w-sm w-full mx-4">
        <h2 className="text-white font-bold text-lg mb-1">닉네임을 설정해주세요</h2>
        <p className="text-gray-500 text-sm mb-6">구글 회원가입 마지막 단계입니다.</p>
        <input
          type="text"
          value={pendingUsername}
          onChange={(e) => onUsernameChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
          placeholder="사용할 이름을 입력하세요"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 placeholder:text-sm focus:outline-none focus:border-orange-500 transition mb-3"
          autoFocus
        />
        <p className="-mt-1 mb-3 text-xs font-medium text-gray-500">
          영문, 숫자, 밑줄(_), 마침표(.)만 사용해 3-20자로 입력하세요.
        </p>
        {usernameError && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2 mb-3">
            {usernameError}
          </p>
        )}
        <button
          disabled={isSubmitting}
          onClick={onSubmit}
          className={`w-full py-3 rounded-xl text-sm font-bold transition ${isSubmitting ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400 text-black'}`}
        >
          {isSubmitting ? '저장 중...' : '완료'}
        </button>
      </div>
    </div>
  );
}
