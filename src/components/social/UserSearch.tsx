"use client";

import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SocialProfileSummary } from "../../types/social";
import { socialFetch } from "./client";
import { useSocialMessages } from "./messages";

export function UserSearch() {
  const c = useSocialMessages();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SocialProfileSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const sequence = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsFocused(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    const requestId = ++sequence.current;
    if (trimmedQuery.length < 2) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      void socialFetch<{ users: SocialProfileSummary[] }>(
        `/api/social-users?query=${encodeURIComponent(trimmedQuery)}`
      )
        .then((result) => {
          if (requestId === sequence.current) setUsers(result.users);
        })
        .catch(() => {
          if (requestId === sequence.current) setUsers([]);
        })
        .finally(() => {
          if (requestId === sequence.current) setLoading(false);
        });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [trimmedQuery]);

  return (
    <div className="social-user-search" ref={rootRef}>
      <div className="social-user-search-input">
        <Search size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={c.searchPeoplePlaceholder}
          aria-label={c.searchPeople}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isFocused && trimmedQuery.length >= 2}
          aria-controls="social-user-search-results"
        />
      </div>
      {isFocused && trimmedQuery.length >= 2 && (
        <div id="social-user-search-results" className="social-user-search-results" role="listbox">
          {loading ? (
            <p className="social-user-search-status">{c.loading}</p>
          ) : users.length ? (
            users.map((user) => (
              <Link
                key={user.id}
                href={`/${encodeURIComponent(user.username)}`}
                className="social-user-search-result"
                role="option"
                onClick={() => setQuery("")}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Remote social avatars have variable sources.
                  <img src={user.avatarUrl} alt="" />
                ) : (
                  <span className="social-user-search-avatar" aria-hidden="true">
                    <UserRound size={14} />
                  </span>
                )}
                <span>{user.username}</span>
              </Link>
            ))
          ) : (
            <p className="social-user-search-status">{c.noPeople}</p>
          )}
        </div>
      )}
    </div>
  );
}
