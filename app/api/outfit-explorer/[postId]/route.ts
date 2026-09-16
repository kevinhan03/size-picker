import {
  check,
  publish,
  readPosts,
  requirePost,
  socialDb,
} from "../../../../server/services/social";
import {
  mutationAccount,
  socialAccount,
  socialResponse,
} from "../../../../server/services/social-http";
type Context = { params: Promise<{ postId: string }> };
export async function GET(request: Request, ctx: Context) {
  return socialResponse(async () => {
    const { postId } = await ctx.params;
    const account = await socialAccount(request);
    await requirePost(postId, account);
    return { post: (await readPosts([postId], account, true))[0] };
  });
}
export async function PATCH(request: Request, ctx: Context) {
  return socialResponse(async () => {
    const account = await mutationAccount(request);
    const { postId } = await ctx.params;
    await requirePost(postId, account, true);
    return publish({ ...(await request.json()), id: postId }, account, true);
  });
}
export async function DELETE(request: Request, ctx: Context) {
  return socialResponse(async () => {
    const account = await mutationAccount(request);
    const { postId } = await ctx.params;
    await requirePost(postId, account, true);
    const result = await socialDb()
      .from("outfit_explorer_posts")
      .delete()
      .eq("id", postId);
    check(result.error);
    return { deleted: true };
  });
}
