"use client";
import { useLocaleContext } from "../../src/contexts/LocaleContext";
import { profileMessages } from "../../src/components/profile/messages";
export default function ProfileError({ reset }: { reset: () => void }) {
  const { locale } = useLocaleContext();
  const c = profileMessages[locale];
  return (
    <main className="px-6 pt-[var(--app-main-pt)] text-center text-white">
      <p role="alert">{c.loadError}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-black"
      >
        {c.retry}
      </button>
    </main>
  );
}
