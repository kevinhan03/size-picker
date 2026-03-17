import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CategoryDropdownProps {
  options: readonly string[];
  value: string;
  counts: Record<string, number>;
  onChange: (value: string) => void;
  totalLabel?: string;
  ariaLabel?: string;
  className?: string;
}

export function CategoryDropdown({
  options,
  value,
  counts,
  onChange,
  totalLabel = 'Total',
  ariaLabel = '상품 카테고리 필터',
  className = 'relative w-28 sm:mr-4 sm:w-28',
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={className}>
      <button
        type="button"
        className={`flex h-[1.7rem] w-full items-center justify-between rounded-[20px] border-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))] pl-3 pr-3 text-left text-[0.7rem] font-medium shadow-[0_16px_36px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-colors sm:h-8 sm:pl-4 sm:pr-4 sm:text-xs ${value ? 'text-white' : 'text-gray-400'}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span className="truncate">{value || totalLabel}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 sm:h-4 sm:w-4 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-[14px] border-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] shadow-[0_20px_44px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
          role="listbox"
          aria-label={ariaLabel}
        >
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2 text-left text-[0.7rem] text-white transition-colors hover:bg-white/[0.08] sm:px-4 sm:py-3 sm:text-xs"
            onClick={() => handleSelect('')}
          >
            <span>{totalLabel}</span>
            <span className="text-[9px] text-gray-400 sm:text-[10px]">{counts[totalLabel] ?? 0}</span>
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-[0.7rem] text-white transition-colors hover:bg-white/[0.08] sm:px-4 sm:py-3 sm:text-xs"
              onClick={() => handleSelect(option)}
            >
              <span>{option}</span>
              <span className="text-[9px] text-gray-400 sm:text-[10px]">{counts[option] ?? 0}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
