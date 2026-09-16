import { addComment, feed, publish } from "../../../server/services/social";
import {
  mutationAccount,
  socialAccount,
  socialResponse,
} from "../../../server/services/social-http";
import { SocialError } from "../../../server/services/social-validation";
export async function GET(request: Request) {
  return socialResponse(async () =>
    feed(new URL(request.url), await socialAccount(request))
  );
}
export async function POST(request: Request) {
  return socialResponse(async () => {
    const account = await mutationAccount(request);
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      if (form.get("intent") !== "comment")
        throw new SocialError("invalid_input");
      return addComment(
        String(form.get("postId") || ""),
        String(form.get("body") || ""),
        account
      );
    }
    return publish(await request.json(), account, false);
  }, 201);
}
