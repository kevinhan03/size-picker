import type { ReactNode } from "react";
import { Inbox, LoaderCircle, TriangleAlert } from "lucide-react";

type PageStateKind = "loading" | "empty" | "error";

interface PageStateProps {
  kind: PageStateKind;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

const icons = {
  loading: LoaderCircle,
  empty: Inbox,
  error: TriangleAlert,
};

/** A clear, accessible state surface for auth, loading, empty, and error screens. */
export function PageState({ kind, title, description, action, className = "" }: PageStateProps) {
  const Icon = icons[kind];

  return (
    <section
      aria-busy={kind === "loading"}
      aria-live="polite"
      className={`ui-page-state ui-panel mx-auto flex min-h-[18rem] w-full max-w-md flex-col items-center justify-center rounded-[28px] px-6 py-12 text-center ${className}`}
    >
      <span className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${kind === "error" ? "bg-red-500/12 text-red-300" : "bg-orange-500/12 text-orange-400"}`}>
        <Icon className={`h-5 w-5 ${kind === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
      </span>
      <h1 className="text-lg font-bold tracking-[-0.02em] text-white">{title}</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
