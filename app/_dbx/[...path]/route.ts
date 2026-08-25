import { NextResponse } from "next/server";
import { hasValidMutationOrigin } from "../../../server/auth/request-user";

const INGEST_HOST = "https://us.i.posthog.com";
const ALLOWED_PATH = /^(?:e|batch|decide|flags)(?:\/|$)/;

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  if (!hasValidMutationOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const { path } = await context.params;
  const targetPath = path.join("/");
  if (!ALLOWED_PATH.test(targetPath)) return NextResponse.json({ ok: false }, { status: 404 });

  const token = process.env.POSTHOG_API_KEY;
  if (!token) return NextResponse.json({ ok: true }, { status: 202 });

  const incoming = new URL(request.url);
  const target = new URL(`${INGEST_HOST}/${targetPath}`);
  incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  target.searchParams.set("api_key", token);

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const payload = await request.json() as Record<string, unknown>;
      body = JSON.stringify({ ...payload, api_key: token });
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  }

  const upstream = await fetch(target, {
    method: request.method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body,
    cache: "no-store",
  });
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Cache-Control": upstream.headers.get("cache-control") || "no-store",
      "Content-Type": upstream.headers.get("content-type") || "application/json",
    },
  });
}

export const GET = forward;
export const POST = forward;
