"use client";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useSocialAuth } from "./client";
import { useSocialMessages } from "./messages";
export function CreatePostButton({ label }: { label?: string }) {
  const auth = useSocialAuth();
  const c = useSocialMessages();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <>
      <button
        className="social-button social-primary"
        onClick={() => {
          if (!auth.ensure()) return;
          router.push(`/outfit-explorer/new?returnTo=${encodeURIComponent(pathname || "/outfit-explorer")}`);
        }}
      >
        <Plus size={17} />
        {label || c.create}
      </button>
    </>
  );
}
