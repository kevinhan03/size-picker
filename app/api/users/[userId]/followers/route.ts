import { followList } from "../../../../../server/services/social";
import {
  socialAccount,
  socialResponse,
} from "../../../../../server/services/social-http";
export async function GET(
  request: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  return socialResponse(async () =>
    followList(
      (await ctx.params).userId,
      "followers",
      (await socialAccount(request))?.id || null,
      new URL(request.url)
    )
  );
}
