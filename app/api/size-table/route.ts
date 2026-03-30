import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import {
  alignAndValidateSizeTableByOptionLabels,
  extractSizeTableWithGemini,
} from "../../../server/bootstrap/gemini.js";
import { supabase } from "../../../server/lib/supabase.js";

export const maxDuration = 60;

export async function POST(request: Request) {
  const authorization = String(request.headers.get("authorization") || "").trim();
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token || !supabase) {
    return NextResponse.json({ ok: false, error: "authentication required" }, { status: 401 });
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "invalid auth token" }, { status: 401 });
  }

  const body = await request.json();
  const imageBase64 = String(body?.imageBase64 || "").trim();
  const mimeType = String(body?.mimeType || "image/png").trim();

  if (!imageBase64) {
    return NextResponse.json({ ok: false, error: "imageBase64 is required" }, { status: 400 });
  }

  try {
    const result = await extractSizeTableWithGemini({ imageBase64, mimeType });
    const validatedTable = alignAndValidateSizeTableByOptionLabels(result.table, []);
    if (!validatedTable) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Gemini did not return a valid size table",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: validatedTable,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: getErrorMessage(error, "size-table error"),
      },
      { status: getErrorStatusCode(error) }
    );
  }
}
