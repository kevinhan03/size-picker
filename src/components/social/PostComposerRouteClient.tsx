"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PostDetail } from "../../types/social";
import { PageState } from "../PageState";
import { PostComposer } from "./PostComposer";
import { useSocialAuth, useSocialResource } from "./client";
import { socialError, useSocialMessages } from "./messages";

function returnPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : "/outfit-explorer";
}

export function PostComposerRouteClient({ postId }: { postId?: string }) {
  const c = useSocialMessages();
  const router = useRouter();
  const search = useSearchParams();
  const auth = useSocialAuth();
  const postResource = useSocialResource<{ post: PostDetail }>(
    postId ? `/api/outfit-explorer/${postId}` : null
  );
  const exitTo = returnPath(search.get("returnTo"));

  useEffect(() => {
    if (!auth.userId) auth.ensure();
  }, [auth]);

  if (!auth.userId) return null;
  if (postId && postResource.loading) {
    return <main className="social-post-composer-route-state"><PageState kind="loading" title={c.loading} description={c.loading} /></main>;
  }
  if (postId && (!postResource.data?.post || postResource.error)) {
    return (
      <main className="social-post-composer-route-state">
        <PageState
          kind="error"
          title={c.editPost}
          description={socialError(postResource.error, c)}
          action={<button type="button" className="social-button" onClick={() => router.replace(exitTo)}>{c.back}</button>}
        />
      </main>
    );
  }

  return (
    <PostComposer
      post={postResource.data?.post}
      onClose={() => router.replace(exitTo)}
      onPublished={(id) => router.replace(`/outfit-explorer/${id}`)}
    />
  );
}
