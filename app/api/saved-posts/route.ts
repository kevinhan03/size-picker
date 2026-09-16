import { feed } from "../../../server/services/social";
import {
  socialAccount,
  socialResponse,
} from "../../../server/services/social-http";
export async function GET(request: Request) {
  return socialResponse(async () =>
    feed(new URL(request.url), await socialAccount(request, true), true)
  );
}
