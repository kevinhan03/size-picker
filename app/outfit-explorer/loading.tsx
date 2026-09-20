import { SocialFeedLoadingSkeleton } from "../../src/components/social/SocialFeedLoadingSkeleton";

export default function OutfitExplorerLoading() {
  return (
    <main className="social-page outfit-explorer-page">
      <div className="social-shell">
        <div className="social-explorer-loading-controls" aria-hidden="true">
          <span />
          <span />
        </div>
        <SocialFeedLoadingSkeleton />
      </div>
    </main>
  );
}
