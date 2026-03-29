import { NextResponse } from "next/server";
import { createGeminiStack } from "../../../server/bootstrap/gemini.js";

const { alignAndValidateSizeTableByOptionLabels, extractSizeTableWithGemini } =
  createGeminiStack();

export const maxDuration = 60;

export async function POST(request: Request) {
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
  } catch (error: any) {
    const statusCode = Number(error?.statusCode) || 500;
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "size-table error",
      },
      { status: statusCode }
    );
  }
}
