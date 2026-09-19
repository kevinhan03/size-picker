import { NextResponse } from "next/server";
import {
  getRequestAuthUser,
  hasValidMutationOrigin,
  type RegisteredRequestUser,
} from "../auth/request-user";
import { check, socialDb } from "./social";
import { SocialError } from "./social-validation";

// Validate the session itself: never trust a caller-supplied verified-user header.
export async function socialAccount(
  request: Request,
  required = false
): Promise<RegisteredRequestUser | null> {
  const auth = await getRequestAuthUser(request);
  if (auth) {
    const result = await socialDb()
      .from("users")
      .select("id,username")
      .eq("id", auth.id)
      .maybeSingle();
    check(result.error);
    if (result.data)
      return { id: result.data.id, appUsername: result.data.username };
  }
  if (required) throw new SocialError("unauthorized", 401);
  return null;
}
export async function mutationAccount(request: Request) {
  if (!hasValidMutationOrigin(request)) throw new SocialError("forbidden", 403);
  return (await socialAccount(request, true))!;
}
export async function socialResponse(
  work: () => Promise<unknown>,
  status = 200,
  headers?: HeadersInit
) {
  const startedAt = performance.now();
  try {
    return NextResponse.json(
      { ok: true, data: await work() },
      {
        status,
        headers: {
          "Cache-Control": "private, no-store",
          "Server-Timing": `social;dur=${Math.round(performance.now() - startedAt)}`,
          ...headers,
        },
      }
    );
  } catch (error) {
    if (!(error instanceof SocialError))
      console.error("Social request failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof SocialError ? error.code : "server_error",
      },
      {
        status: error instanceof SocialError ? error.status : 500,
        headers: {
          "Cache-Control": "private, no-store",
          "Server-Timing": `social;dur=${Math.round(performance.now() - startedAt)}`,
        },
      }
    );
  }
}
