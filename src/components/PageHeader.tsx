import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  context?: ReactNode;
  titleAccessory?: ReactNode;
  titleId?: string;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  context,
  titleAccessory,
  titleId,
  className,
}: PageHeaderProps) {
  return (
    <header className={`border-b border-white/10 pb-6 ${className ?? ""}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#f2a56c]">{eyebrow}</p>
          <div className="mt-2 flex min-w-0 items-center gap-3">
            <h1 id={titleId} className="min-w-0 flex-1 text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.035em] text-[#f5f5f6] sm:text-4xl">
              {title}
            </h1>
            {titleAccessory ? <div className="shrink-0">{titleAccessory}</div> : null}
          </div>
          {description ? <div className="mt-3 text-sm font-semibold leading-[1.6] text-[#aeb7c4]">{description}</div> : null}
        </div>
        {action || context ? <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-64 lg:max-w-md lg:items-end">{action}{context}</div> : null}
      </div>
    </header>
  );
}
