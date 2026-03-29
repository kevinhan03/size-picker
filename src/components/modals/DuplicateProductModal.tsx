import { ShieldAlert } from 'lucide-react';

interface DuplicateProductModalProps {
  onClose: () => void;
}

export function DuplicateProductModal({ onClose }: DuplicateProductModalProps) {
  return (
    <div className="fixed inset-0 z-[72] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border border-red-500/40 bg-gray-950 px-6 py-7 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">이미 등록된 상품입니다.</h3>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-orange-400 transition"
        >
          확인
        </button>
      </div>
    </div>
  );
}
