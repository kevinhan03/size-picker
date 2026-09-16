"use client";
import { SocialDialog } from "./SocialDialog";
import { useSocialMessages } from "./messages";
export function ConfirmDialog({
  message,
  onCancel,
  onConfirm,
}: {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const c = useSocialMessages();
  return (
    <SocialDialog title={message} onClose={onCancel}>
      <div className="social-compose-footer">
        <button autoFocus className="social-button" onClick={onCancel}>
          {c.cancel}
        </button>
        <button className="social-button social-primary" onClick={onConfirm}>
          {c.remove}
        </button>
      </div>
    </SocialDialog>
  );
}
