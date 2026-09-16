import {
  check,
  SOCIAL_BUCKET,
  socialDb,
} from "../../../../server/services/social";
import { socialResponse } from "../../../../server/services/social-http";
import { SocialError } from "../../../../server/services/social-validation";
export async function GET(request: Request) {
  return socialResponse(async () => {
    if (
      !process.env.CRON_SECRET ||
      request.headers.get("authorization") !==
        `Bearer ${process.env.CRON_SECRET}`
    )
      throw new SocialError("unauthorized", 401);
    const db = socialDb();
    const expired = await db.rpc("social_expire_uploads");
    check(expired.error);
    const pending = await db
      .from("social_file_cleanup")
      .select("path")
      .order("created_at")
      .limit(100);
    check(pending.error);
    const paths = (pending.data || []).map((p) => p.path);
    if (paths.length) {
      const removed = await db.storage.from(SOCIAL_BUCKET).remove(paths);
      check(removed.error);
      const done = await db
        .from("social_file_cleanup")
        .delete()
        .in("path", paths);
      check(done.error);
    }
    return { removed: paths.length };
  });
}
