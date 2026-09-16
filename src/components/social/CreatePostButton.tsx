"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { useSocialAuth } from "./client";
import { useSocialMessages } from "./messages";
const PostComposer = dynamic(
  () => import("./PostComposer").then((m) => m.PostComposer),
  { ssr: false }
);
export function CreatePostButton({ label }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const auth = useSocialAuth();
  const c = useSocialMessages();
  return (
    <>
      <button
        className="social-button social-primary"
        onClick={() => {
          if (auth.ensure()) setOpen(true);
        }}
      >
        <Plus size={17} />
        {label || c.create}
      </button>
      {open && <PostComposer onClose={() => setOpen(false)} />}
    </>
  );
}
