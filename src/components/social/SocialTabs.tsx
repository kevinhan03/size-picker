"use client";
export function SocialTabs<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="social-tabs"
      role="tablist"
      aria-label={label}
      onKeyDown={(e) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
        e.preventDefault();
        const index = options.findIndex((o) => o.value === value);
        const next =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? options.length - 1
              : (index + (e.key === "ArrowRight" ? 1 : -1) + options.length) %
                options.length;
        onChange(options[next].value);
        e.currentTarget
          .querySelectorAll<HTMLButtonElement>("button")
          [next]?.focus();
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
