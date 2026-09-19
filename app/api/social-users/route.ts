import { searchProfiles } from "../../../server/services/social";
import {
  socialAccount,
  socialResponse,
} from "../../../server/services/social-http";

export async function GET(request: Request) {
  return socialResponse(async () =>
    searchProfiles(
      new URL(request.url).searchParams.get("query") || "",
      (await socialAccount(request))?.id || null
    )
  );
}
