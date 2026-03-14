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
        className={`flex w-full items-center justify-between rounded-[20px] border border-gray-700 bg-gray-900 pl-4 pr-4 py-3 text-left text-xs font-medium ${value ? 'text-white' : 'text-gray-400'}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span className="truncate">{value || totalLabel}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-[10px] border border-gray-700 bg-gray-900"
          role="listbox"
          aria-label={ariaLabel}
        >
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left text-xs text-white hover:bg-gray-800"
            onClick={() => handleSelect('')}
          >
            <span>{totalLabel}</span>
            <span className="text-[10px] text-gray-400">{counts[totalLabel] ?? 0}</span>
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left text-xs text-white hover:bg-gray-800"
              onClick={() => handleSelect(option)}
            >
              <span>{option}</span>
              <span className="text-[10px] text-gray-400">{counts[option] ?? 0}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
