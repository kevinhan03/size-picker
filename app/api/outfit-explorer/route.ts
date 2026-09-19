import { feed, publish } from "../../../server/services/social";
import {
  mutationAccount,
  socialAccount,
  socialResponse,
} from "../../../server/services/social-http";
export async function GET(request: Request) {
  return socialResponse(async () =>
    feed(new URL(request.url), await socialAccount(request)),
    200,
    {
      // Likes and saves are personalized, so this must never be shared by a
      // CDN. A short, cookie-keyed browser cache makes repeat visits instant.
      "Cache-Control": "private, max-age=20, stale-while-revalidate=120",
      Vary: "Cookie",
    }
  );
}
export async function POST(request: Request) {
  return socialResponse(async () => {
    const account = await mutationAccount(request);
    return publish(await request.json(), account, false);
  }, 201);
}
