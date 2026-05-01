import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertGeminiKey, callGemini } from "../../../server/bootstrap/gemini.js";
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
    assertGeminiKey();

    const response = await callGemini("gemini-2.5-flash-image-preview", {
      contents: [
        {
          parts: [
            {
              text:
                "Remove background from this product image. Keep only the product and produce clean output.",
            },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: "Gemini remove-bg request failed" },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const outputBase64 =
      payload?.candidates?.[0]?.content?.parts?.find((part: any) => part?.inlineData?.data)
        ?.inlineData?.data || "";

    if (!outputBase64) {
      return NextResponse.json(
        { ok: false, error: "Gemini remove-bg returned empty image" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { imageBase64: outputBase64 },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "remove-bg error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
