"use client";
/* eslint-disable @next/next/no-img-element -- Profile avatars. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import type { SocialProfileSummary } from "../../types/social";
import { socialFetch, useSocialResource, useSocialVersion } from "./client";
import { socialError, useSocialMessages } from "./messages";
import { FollowButton } from "./FollowButton";
import { SocialDialog } from "./SocialDialog";
export function SocialProfile({ username }: { username: string }) {
  const c = useSocialMessages();
  const resource = useSocialResource<SocialProfileSummary>(
    `/api/social-profile?username=${encodeURIComponent(username)}`
  );
  const [list, setList] = useState<"followers" | "following" | null>(null);
  const p = resource.data;
  return (
    <>
      <dl className="profile-stats">
        <div>
          <dt>{c.posts}</dt>
          <dd>{p?.postCount ?? "—"}</dd>
        </div>
        <div>
          <dt>{c.followers}</dt>
          <dd>
            <button
              className="social-profile-count"
              disabled={!p}
              onClick={() => setList("followers")}
            >
              {p?.followerCount ?? "—"}
            </button>
          </dd>
        </div>
        <div>
          <dt>{c.following}</dt>
          <dd>
            <button
              className="social-profile-count"
              disabled={!p}
              onClick={() => setList("following")}
            >
              {p?.followingCount ?? "—"}
            </button>
          </dd>
        </div>
      </dl>
      {p && !p.isSelf && <FollowButton person={p} />}{" "}
      {resource.error && (
        <button
          className="social-button"
          onClick={() => void resource.reload()}
        >
          {c.retry}
        </button>
      )}
      {p && list && (
        <PeopleList person={p} kind={list} onClose={() => setList(null)} />
      )}
    </>
  );
}
function PeopleList({
  person,
  kind,
  onClose,
}: {
  person: SocialProfileSummary;
  kind: "followers" | "following";
  onClose: () => void;
}) {
  const c = useSocialMessages();
  const version = useSocialVersion();
  const [people, setPeople] = useState<SocialProfileSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const url = `/api/users/${person.id}/${kind}`;
  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    socialFetch<{ users: SocialProfileSummary[]; nextCursor: string | null }>(
      url
    )
      .then((result) => {
        if (!cancelled) {
          setPeople(result.users);
          setCursor(result.nextCursor);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url, version]);
  async function more() {
    setBusy(true);
    try {
      const result = await socialFetch<{
        users: SocialProfileSummary[];
        nextCursor: string | null;
      }>(url + (cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""));
      setPeople((items) =>
        cursor
          ? [
              ...items,
              ...result.users.filter((p) => !items.some((i) => i.id === p.id)),
            ]
          : result.users
      );
      setCursor(result.nextCursor);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <SocialDialog
      title={kind === "followers" ? c.followers : c.following}
      onClose={onClose}
    >
      <div className="social-compose-body">
        {people.map((p) => (
          <div className="social-person" key={p.id}>
            <Link href={`/${encodeURIComponent(p.username)}`} onClick={onClose}>
              {p.avatarUrl ? (
                <img src={p.avatarUrl} className="social-avatar" alt="" />
              ) : (
                <span className="social-avatar">
                  <UserRound size={14} />
                </span>
              )}
              {p.username}
            </Link>
            <FollowButton person={p} />
          </div>
        ))}
        {!busy && !error && !people.length && (
          <p className="social-empty">{c.noPeople}</p>
        )}
        {error ? <p className="social-error">{socialError(error, c)}</p> : null}
        {busy ? (
          <p className="social-muted">{c.loading}</p>
        ) : cursor || error ? (
          <button className="social-button" onClick={() => void more()}>
            {error ? c.retry : c.more}
          </button>
        ) : null}
      </div>
    </SocialDialog>
  );
}
