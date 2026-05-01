import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import {
  alignAndValidateSizeTableByOptionLabels,
  extractSizeTableWithGemini,
} from "../../../server/bootstrap/gemini.js";
import { getBearerTokenFromRequest, validateInlineImageInput } from "../../../server/utils/request-validation.js";
import { verifyBearerToken } from "../../../server/utils/verify-auth.js";

export const maxDuration = 60;

export async function POST(request: Request) {
  const token = getBearerTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ ok: false, error: "authentication required" }, { status: 401 });
  }

  const user = await verifyBearerToken(token);
  if (!user) {
    return NextResponse.json({ ok: false, error: "invalid auth token" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const { imageBase64, mimeType } = validateInlineImageInput(body);
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
