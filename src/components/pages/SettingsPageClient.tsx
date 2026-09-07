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
import "../profile/profile.css";

export function SettingsPageClient({
  username: initialUsername,
  bio: initialBio,
  avatarUrl: initialAvatarUrl,
}: {
  username: string;
  bio: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const auth = useAuthContext();
  const { locale } = useLocaleContext();
  const c = profileMessages[locale];
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const username = auth.dbUsername || initialUsername;

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

          <MyPageView
            section="settings"
            discoveredProducts={[]}
            discoveryTotalSaveCount={0}
            isDiscoveriesLoading={false}
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
