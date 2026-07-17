"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { TutorialAnchorRect } from "./OnboardingTutorial";

export interface FilterDropdownOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  eyebrow: string;
  options: FilterDropdownOption[];
  value: string;
  onChange: (value: string, anchorRect?: TutorialAnchorRect) => void;
  onOpenChange?: (isOpen: boolean, anchorRect?: TutorialAnchorRect) => void;
}

export function FilterDropdown({ eyebrow, options, value, onChange, onOpenChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openedByKeyboard, setOpenedByKeyboard] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const hasValue = value !== "";
  const getAnchorRect = (): TutorialAnchorRect | undefined => {
    const rect = dropdownRef.current?.getBoundingClientRect();
    if (!rect) return undefined;
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  };

  useEffect(() => {
    onOpenChange?.(isOpen, getAnchorRect());
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative min-w-0 flex-[1_1_0]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          setOpenedByKeyboard(false);
          setIsOpen((open) => !open);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpenedByKeyboard(true);
            setIsOpen(true);
          }
        }}
        className={`flex h-10 w-full items-center justify-between gap-2.5 rounded-full border bg-[linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03))] px-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_14px_30px_rgba(0,0,0,.24)] outline-none backdrop-blur-xl transition focus-visible:border-orange-400/70 focus-visible:ring-2 focus-visible:ring-orange-500/20 sm:h-11 ${
          isOpen
            ? "border-orange-500/70"
            : hasValue
              ? "border-orange-500/55 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_0_22px_rgba(249,115,22,.16)]"
              : "border-white/[.18] hover:border-orange-500/55"
        }`}
      >
        <span className="min-w-0">
          <span className="block text-[8px] font-black uppercase leading-none tracking-[.18em] text-gray-500 sm:text-[9px]">
            {eyebrow}
          </span>
          <span className={`mt-0.5 block truncate text-[11px] font-black opacity-70 sm:text-xs ${hasValue ? "text-orange-300" : "text-white"}`}>
            {selectedOption?.label ?? ""}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-gray-500 transition ${isOpen ? "rotate-180 text-orange-300" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className={`ui-floating-surface absolute left-0 right-0 top-full z-30 mt-2 max-h-72 origin-top overflow-y-auto rounded-[16px] border border-white/[.12] bg-[#111114]/90 p-1.5 shadow-[0_22px_60px_rgba(0,0,0,.48)] backdrop-blur-[20px] ${openedByKeyboard ? "" : "animate-[filter-dropdown-in_var(--duration-popover)_var(--ease-out)]"} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={`${eyebrow}-${option.value || "all"}`}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value, getAnchorRect());
                  setIsOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onChange(option.value, getAnchorRect());
                    setIsOpen(false);
                  }
                }}
                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-left text-sm font-bold leading-none shadow-none outline-none transition focus-visible:bg-white/[.08] ${
                  selected
                    ? "bg-orange-500/[.14] text-orange-300"
                    : "text-gray-300 hover:bg-white/[.07] hover:text-white"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {selected && <Check className="h-4 w-4 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
