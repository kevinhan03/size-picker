"use client";
import { useEffect, useRef, useState } from "react";
import type { SocialProfileSummary } from "../../types/social";
import { changed, socialFetch, useSocialAuth } from "./client";
import { socialError, useSocialMessages } from "./messages";
export function FollowButton({ person }: { person: SocialProfileSummary }) {
  const c = useSocialMessages();
  const auth = useSocialAuth();
  const [following, setFollowing] = useState(person.isFollowing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    setFollowing(person.isFollowing);
  }, [person.isFollowing]);
  if (person.isSelf || auth.userId === person.id) return null;
  async function toggle() {
    if (lock.current || !auth.ensure()) return;
    const previous = following;
    lock.current = true;
    setBusy(true);
    setFollowing(!previous);
    setError("");
    try {
      await socialFetch(`/api/users/${person.id}/follow`, {
        method: previous ? "DELETE" : "PUT",
      });
      changed();
    } catch (e) {
      setFollowing(previous);
      setError(socialError(e, c));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <>
      <button
        className={`social-button ${following ? "" : "social-primary"}`}
        disabled={busy}
        aria-pressed={following}
        onClick={() => void toggle()}
      >
        {following ? c.unfollow : c.follow}
      </button>
      {error && (
        <span role="alert" className="social-error">
          {error}
        </span>
      )}
    </>
  );
}
