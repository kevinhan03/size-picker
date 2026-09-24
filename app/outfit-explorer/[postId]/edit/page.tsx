import { PostComposerRouteClient } from "../../../../src/components/social/PostComposerRouteClient";

export default async function EditOutfitExplorerPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return <PostComposerRouteClient postId={postId} />;
}
