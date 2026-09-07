"use client";
/* eslint-disable @next/next/no-img-element -- Local blob previews and user-uploaded avatars. */
import { useEffect, useState } from "react";
import { UsernameSetupForm } from "../UsernameSetupForm";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { profileMessages } from "./messages";

export function ProfileEditor({
  username,
  bio,
  avatarUrl,
  onUpdate,
  onRename,
  showSectionTitle = true,
}: {
  username: string;
  bio: string;
  avatarUrl: string | null;
  onUpdate: (update: { bio?: string; avatarUrl?: string | null }) => void;
  onRename: (name: string) => Promise<void>;
  showSectionTitle?: boolean;
}) {
  const { locale } = useLocaleContext();
  const c = profileMessages[locale];
  const [draft, setDraft] = useState(bio);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function mutate(
    path: string,
    init: RequestInit,
    kind: "bio" | "avatar"
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(path, { ...init, credentials: "include" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(c.error);
      onUpdate(
        kind === "bio"
          ? { bio: result.data.bio }
          : { avatarUrl: result.data.avatarUrl }
      );
      if (kind === "avatar") setFile(null);
      setMessage(c.savedMessage);
    } catch {
      setError(c.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="profile-editor">
      <section aria-labelledby={showSectionTitle ? "profile-editor-section-title" : undefined}>
        {showSectionTitle && (
          <h3 id="profile-editor-section-title" className="profile-editor-section-title">
            {c.profileInfo}
          </h3>
        )}
        <div className="profile-editor-list">
          <fieldset className="profile-editor-row" disabled={busy}>
            <legend className="sr-only">{c.photo}</legend>
            <div className="profile-editor-row-content">
              <strong>{c.photo}</strong>
              <small>{c.photoHelp}</small>
              <div className="profile-photo-card">
                {preview || avatarUrl ? (
                  <img className="profile-avatar" src={preview || avatarUrl!} alt={c.photo} />
                ) : (
                  <span className="profile-avatar">{username.slice(0, 1).toUpperCase()}</span>
                )}
                <label className="profile-photo-change">
                  <span>{c.changePhoto}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const next = e.target.files?.[0];
                      setError("");
                      if (next && (next.size > 3 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(next.type))) {
                        setError(c.photoHelp);
                        e.target.value = "";
                        return;
                      }
                      setFile(next || null);
                      if (next) {
                        const form = new FormData();
                        form.set("file", next);
                        void mutate("/api/user/avatar", { method: "POST", body: form }, "avatar");
                      }
                    }}
                  />
                </label>
              </div>
              {avatarUrl && (
                <button
                  className="profile-photo-remove"
                  type="button"
                  onClick={() => void mutate("/api/user/avatar", { method: "DELETE" }, "avatar")}
                >
                  {c.remove}
                </button>
              )}
            </div>
          </fieldset>
          <form className="profile-editor-row profile-bio-row"
          onSubmit={(e) => {
            e.preventDefault();
            void mutate("/api/user/bio", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bio: draft }) }, "bio");
          }}
        >
            <div className="profile-editor-row-content">
              <label htmlFor="profile-bio">{c.bio}</label>
              <small>{c.intro}</small>
              <div className="profile-bio-input-wrap">
                <textarea id="profile-bio" maxLength={160} value={draft} onChange={(e) => setDraft(e.target.value)} disabled={busy} rows={3} />
                <span className="profile-bio-count" aria-live="polite">{draft.length}/160</span>
              </div>
              <div className="profile-actions profile-bio-actions">
                <button type="submit" disabled={busy}>{c.save}</button>
              </div>
            </div>
          </form>
          <div className="profile-editor-row profile-username-row">
            <div className="profile-editor-row-content">
              <UsernameSetupForm
                initialUsername={username}
                submitLabel={c.username}
                showSuggestions={false}
                autoFocus={false}
                variant="profile"
                onSuggestionSelected={() => {}}
                onSubmit={onRename}
              />
            </div>
          </div>
        </div>
      </section>
      {busy && <p role="status">{c.loading}</p>}
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
