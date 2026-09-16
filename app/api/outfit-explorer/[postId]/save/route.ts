import { relation } from "../../../../../server/services/social";
import {
  mutationAccount,
  socialResponse,
} from "../../../../../server/services/social-http";
type Context = { params: Promise<{ postId: string }> };
async function set(request: Request, ctx: Context, active: boolean) {
  return socialResponse(async () =>
    relation(
      (await ctx.params).postId,
      await mutationAccount(request),
      "save",
      active
    )
  );
}
export async function PUT(request: Request, ctx: Context) {
  return set(request, ctx, true);
}
export async function DELETE(request: Request, ctx: Context) {
  return set(request, ctx, false);
}
