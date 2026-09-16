import { profileSummary } from "../../../server/services/social";
import {
  socialAccount,
  socialResponse,
} from "../../../server/services/social-http";
export async function GET(request: Request) {
  return socialResponse(async () =>
    profileSummary(
      new URL(request.url).searchParams.get("username") || "",
      (await socialAccount(request))?.id || null
    )
  );
}
