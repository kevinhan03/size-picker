import "./social.css";

/** Mirrors the shape of an explore card so loading never looks like a separate page. */
export function SocialFeedLoadingCards({
  count = 6,
  photoOnly = false,
}: {
  count?: number;
  photoOnly?: boolean;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <article className="social-loading-card" key={index} aria-hidden="true">
          <div className="social-loading-media">
            <span className="social-loading-shimmer" />
          </div>
          {!photoOnly && (
            <div className="social-loading-meta">
              <span className="social-loading-avatar" />
              <span className="social-loading-line social-loading-author" />
              <span className="social-loading-line social-loading-action" />
            </div>
          )}
        </article>
      ))}
    </>
  );
}

export function SocialFeedLoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="social-grid social-grid-loading" aria-busy="true" aria-live="polite" aria-label="게시물을 불러오는 중">
      <SocialFeedLoadingCards count={count} />
    </div>
  );
}
