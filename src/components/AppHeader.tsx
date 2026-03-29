import { Globe, LayoutGrid, LogIn, Plus } from 'lucide-react';
import type { ViewMode } from '../types';

interface AppHeaderProps {
  viewMode: ViewMode;
  authUser: { email?: string } | null;
  dbUsername: string | null;
  onLogoClick: () => void;
  onMypageClick: () => void;
  onConverterClick: () => void;
  onGridClick: () => void;
  onAddProductClick: () => void;
  onLoginClick: () => void;
}

export function AppHeader({
  viewMode,
  authUser,
  dbUsername,
  onLogoClick,
  onMypageClick,
  onConverterClick,
  onGridClick,
  onAddProductClick,
  onLoginClick,
}: AppHeaderProps) {
  return (
    <header className="fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-gray-800 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onLogoClick}>
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/favicon-simple.svg" alt="DIGDA logo" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-bold text-xl tracking-tight text-orange-500">DIGDA</span>
          </div>
          {authUser && (
            <span
              className="text-gray-500 text-xs font-medium cursor-pointer hover:text-gray-300 transition"
              onClick={onMypageClick}
            >
              | {String(dbUsername ?? authUser.email?.split('@')[0] ?? '')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onConverterClick}
            className={`p-1.5 rounded-lg transition border backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${
              viewMode === 'converter'
                ? 'bg-orange-500 text-black border-orange-500'
                : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] border-white/20 text-gray-200 hover:border-orange-500/60 hover:text-orange-400'
            }`}
            title="해외 사이즈 변환기"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            onClick={onGridClick}
            className="p-1.5 text-gray-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] backdrop-blur-xl border border-white/20 hover:text-orange-400 hover:border-orange-500/60 transition rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            title="전체 상품 보기"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={onAddProductClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition backdrop-blur-xl border border-[#00FF00]/40 bg-[linear-gradient(180deg,rgba(0,255,0,0.22),rgba(0,255,0,0.09))] text-[#00FF00] hover:border-[#00FF00]/70 hover:bg-[linear-gradient(180deg,rgba(0,255,0,0.32),rgba(0,255,0,0.15))] shadow-[0_4px_16px_rgba(0,255,0,0.15)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">상품 추가</span>
          </button>
          {!authUser && (
            <button
              onClick={onLoginClick}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition backdrop-blur-xl border shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${
                viewMode === 'login'
                  ? 'bg-orange-500 text-black border-orange-500'
                  : 'border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.07))] text-gray-200 hover:border-orange-500/60 hover:text-orange-400'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
