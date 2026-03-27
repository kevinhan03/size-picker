interface GoogleSignupCompleteModalProps {
  onStart: () => void;
}

export function GoogleSignupCompleteModal({ onStart }: GoogleSignupCompleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.6)] max-w-sm w-full mx-4 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-white font-bold text-lg mb-2">회원가입이 완료됐습니다!</h2>
        <p className="text-gray-400 text-sm mb-6">이제 구글 계정으로 로그인할 수 있어요.</p>
        <button
          onClick={onStart}
          className="w-full py-3 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-black transition"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
