"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

export function ProfileDialog({
  title,
  closeLabel,
  backLabel,
  onClose,
  onBack,
  children,
}: {
  title: string;
  closeLabel: string;
  backLabel: string;
  onClose: () => void;
  onBack?: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useBodyScrollLock(ref);
  useEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      trigger?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="profile-dialog"
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <div className="profile-dialog-heading">
        <h2>{title}</h2>
        <button
          type="button"
          aria-label={onBack ? backLabel : closeLabel}
          onClick={onBack ?? onClose}
        >
          {onBack ? <ArrowLeft size={20} /> : <X size={20} />}
        </button>
      </div>
      {children}
    </dialog>
  );
}
