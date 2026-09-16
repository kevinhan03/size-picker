import { followUser } from "../../../../../server/services/social";
import {
  mutationAccount,
  socialResponse,
} from "../../../../../server/services/social-http";
type Context = { params: Promise<{ userId: string }> };
async function set(request: Request, ctx: Context, active: boolean) {
  return socialResponse(async () =>
    followUser(
      (await ctx.params).userId,
      (await mutationAccount(request)).id,
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
