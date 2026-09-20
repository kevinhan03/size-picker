"use client";
import { useState } from "react";
import { PostFeed } from "../social/PostFeed";
import { useSocialMessages } from "../social/messages";
import { useSocialAuth } from "../social/client";
import { SocialTabs } from "../social/SocialTabs";
import { UserSearch } from "../social/UserSearch";
export function OutfitExplorerPageClient({
  initialFollowing = false,
}: {
  initialFollowing?: boolean;
}) {
  const c = useSocialMessages();
  const auth = useSocialAuth();
  const [following, setFollowing] = useState(initialFollowing);
  function changeFeed(value: "all" | "following") {
    if (value === "following" && !auth.ensure()) return;
    setFollowing(value === "following");
    const url = new URL(window.location.href);
    url.searchParams.set("feed", value);
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search
    );
  }
  return (
    <main className="social-page outfit-explorer-page">
      <div className="social-shell">
        <div className="social-explorer-controls">
          <UserSearch />
          <SocialTabs
            label={c.explore}
            value={following ? "following" : "all"}
            options={[
              { value: "all", label: c.all },
              { value: "following", label: c.following },
            ]}
            onChange={changeFeed}
          />
        </div>
        <PostFeed following={following} />
      </div>
    </main>
  );
}
