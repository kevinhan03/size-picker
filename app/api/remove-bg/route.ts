import { NextResponse } from "next/server";
import { createGeminiStack } from "../../../server/bootstrap/gemini.js";
import { createProductStack } from "../../../server/bootstrap/products.js";

const { assertGeminiKey, callGemini } = createGeminiStack();
const { supabase } = createProductStack();

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
      const detail = await response.text();
      return NextResponse.json(
        {
          ok: false,
          data: { imageBase64 },
          error: "Gemini remove-bg request failed",
          detail,
        },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const outputBase64 =
      payload?.candidates?.[0]?.content?.parts?.find((part: any) => part?.inlineData?.data)
        ?.inlineData?.data || "";

    if (!outputBase64) {
      return NextResponse.json(
        {
          ok: false,
          data: { imageBase64 },
          error: "Gemini remove-bg returned empty image",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { imageBase64: outputBase64 },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        data: { imageBase64 },
        error: error?.message || "remove-bg error",
      },
      { status: 500 }
    );
  }
}
