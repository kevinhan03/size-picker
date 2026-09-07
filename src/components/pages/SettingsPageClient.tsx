"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { changeMyUsername } from "../../api/username";
import { captureEvent } from "../../utils/analytics";
import { MyPageView } from "../views/MyPageView";
import { ProfileEditor } from "../profile/ProfileEditor";
import { profileMessages } from "../profile/messages";
import { useLocaleContext } from "../../contexts/LocaleContext";
import { authenticatedFetch } from "../../api/shared";
import "../profile/profile.css";

export function SettingsPageClient({
  username: initialUsername,
  bio: initialBio,
  avatarUrl: initialAvatarUrl,
  closetIsPublic: initialClosetIsPublic,
}: {
  username: string;
  bio: string;
  avatarUrl: string | null;
  closetIsPublic: boolean;
}) {
  const router = useRouter();
  const auth = useAuthContext();
  const { locale } = useLocaleContext();
  const c = profileMessages[locale];
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const username = auth.dbUsername || initialUsername;
  const [closetIsPublic, setClosetIsPublic] = useState(initialClosetIsPublic);
  const [visibilityError, setVisibilityError] = useState("");
  const [isVisibilitySaving, setIsVisibilitySaving] = useState(false);

  const updateClosetVisibility = async (next: boolean) => {
    if (isVisibilitySaving || next === closetIsPublic) return;
    const previous = closetIsPublic;
    setClosetIsPublic(next);
    setVisibilityError("");
    setIsVisibilitySaving(true);
    try {
      const response = await authenticatedFetch("/api/user/closet-visibility", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ closetIsPublic: next }) });
      if (!response.ok) throw new Error();
    } catch {
      setClosetIsPublic(previous);
      setVisibilityError(c.closetVisibilityError);
    } finally {
      setIsVisibilitySaving(false);
    }
  };

  const onRename = async (name: string) => {
    const result = await changeMyUsername(name);
    auth.setDbUsername(result.username);
    if (result.changed) captureEvent("username_changed", { source: "settings" });
    router.replace("/settings");
  };

  return (
    <main className="settings-page min-h-screen bg-black px-[var(--app-main-px)] pb-[var(--app-main-pb)] pt-[var(--page-header-top)] text-white">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#f2a56c]">DIGBOX</p>
            <h1 className="mt-2 text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#f5f5f6] sm:text-4xl">{c.settings}</h1>
          </div>
          <Link
            href={`/${encodeURIComponent(username)}`}
            aria-label={c.back}
            title={c.back}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-[color,transform] hover:text-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </header>

        <div className="mt-8 flex flex-col gap-10">
          <section aria-labelledby="settings-profile-title">
            <h2 id="settings-profile-title" className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-gray-500">{c.profileInfo}</h2>
            <ProfileEditor
              username={username}
              bio={bio}
              avatarUrl={avatarUrl}
              showSectionTitle={false}
              onRename={onRename}
              onUpdate={(update) => {
                if (update.bio !== undefined) setBio(update.bio);
                if (update.avatarUrl !== undefined) setAvatarUrl(update.avatarUrl);
              }}
            />
          </section>
          <section aria-labelledby="closet-visibility-title">
            <h2 id="closet-visibility-title" className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-gray-500">{c.closetVisibility}</h2>
            <label className={`flex min-h-[4.75rem] items-center justify-between gap-4 rounded-2xl border border-white/[0.1] bg-white/[0.035] px-4 py-3.5 transition-[background-color,border-color,transform] duration-150 motion-reduce:transform-none ${isVisibilitySaving ? "cursor-wait opacity-70" : "cursor-pointer hover:border-white/[0.18] hover:bg-white/[0.055] active:scale-[0.99]"}`}>
              <span className="min-w-0"><span className="block text-[0.9375rem] font-bold tracking-[-0.01em] text-white">{c.closetVisibility}</span><span className={`mt-1 block text-xs font-semibold ${closetIsPublic ? "text-orange-300" : "text-gray-400"}`}>{closetIsPublic ? c.closetPublic : c.closetPrivate}</span></span>
              <input type="checkbox" checked={closetIsPublic} disabled={isVisibilitySaving} onChange={(event) => void updateClosetVisibility(event.target.checked)} className="peer sr-only" />
              <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full shadow-inner transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-300/80 ${closetIsPublic ? "bg-orange-500" : "bg-white/[0.16]"}`}>
                <span className={`pointer-events-none absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full border border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,.45)] transition-transform duration-200 motion-reduce:transition-none ${closetIsPublic ? "translate-x-5" : "translate-x-0"}`} />
              </span>
            </label>
            <p className="mt-2 px-1 text-xs font-medium leading-5 text-gray-500">{c.closetVisibilityDescription}</p>
            {visibilityError && <p className="mt-2 text-xs font-semibold text-red-300">{visibilityError}</p>}
          </section>

          <MyPageView
            onLogout={() => void auth.signOut("/")}
            onDeleteAccount={() => {
              void auth.deleteAccount().then((deleted) => {
                if (deleted) router.push("/");
              });
            }}
            isDeletingAccount={auth.isDeletingAccount}
            deleteAccountError={auth.deleteAccountError}
          />
        </div>
      </div>
    </main>
  );
}
