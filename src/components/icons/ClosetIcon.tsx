export function ClosetIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4.75h12c.69 0 1.25.56 1.25 1.25v13.25H4.75V6c0-.69.56-1.25 1.25-1.25Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 4.75v14.5M8.75 12h.01M15.25 12h.01M7 19.25v1M17 19.25v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
