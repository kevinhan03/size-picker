import { ensureStoredCardThumbnail } from "../../../../../server/services/stored-card-thumbnail";

export const runtime = "nodejs";

// Recovery for assets that are not ready yet, or a failed background job.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^(?:[0-9]{1,20}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(id)) return new Response(null, { status: 400 });
  try {
    return new Response(new Uint8Array(await ensureStoredCardThumbnail(id)), { headers: {
      "Content-Type": "image/webp", "Cache-Control": "public, max-age=300, s-maxage=3600",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
