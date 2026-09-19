"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useSocialMessages } from "./messages";
import "./social.css";
export function SocialDialog({
  title,
  onClose,
  children,
  wide = false,
  className = "",
  onEscape,
  headerStart,
  headerEnd,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  className?: string;
  onEscape?: () => boolean;
  headerStart?: ReactNode;
  headerEnd?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const c = useSocialMessages();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`social-dialog ${wide ? "social-dialog-wide" : ""} ${className}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (onEscape?.()) return;
        onClose();
      }}
    >
      <header className="social-dialog-header">
        <div className="social-dialog-header-side social-dialog-header-start">
          {headerStart}
        </div>
        <h2>{title}</h2>
        <div className="social-dialog-header-side social-dialog-header-end">
          {headerEnd ?? (
            <button className="social-icon" onClick={onClose} aria-label={c.close}>
              <X size={20} />
            </button>
          )}
        </div>
      </header>
      {children}
    </dialog>
  );
}
