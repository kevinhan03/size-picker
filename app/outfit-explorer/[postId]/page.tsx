import { PostDetailClient } from "../../../src/components/social/PostDetailClient";
export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return <PostDetailClient postId={postId} />;
}
