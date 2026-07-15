import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatusCode } from "@/lib/api-error";
import { assertSupabaseConfig, supabase } from "../../../../server/lib/supabase.js";
import { verifyAdminRequest } from "../../../../server/utils/admin-request.js";

const SETTINGS_TABLE = "site_settings";
const SETTINGS_KEY = "style_attribute_options";
const ATTRIBUTE_KEYS = new Set([
  "fit",
  "silhouette",
  "formality",
  "utility_level",
  "material",
  "color",
  "wash_texture",
  "decoration_level",
  "era_signal",
  "sportiness",
]);

const normalizeOption = (value: unknown) => String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const normalizeOptions = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((option) => {
    const attributeKey = String(option?.attributeKey ?? "").trim();
    const optionValue = normalizeOption(option?.value);
    const identifier = `${attributeKey}:${optionValue}`;
    if (!ATTRIBUTE_KEYS.has(attributeKey) || !optionValue || seen.has(identifier)) return [];
    seen.add(identifier);
    return [{ attributeKey, value: optionValue }];
  });
};

const parseOptions = (value: unknown) => {
  try {
    return normalizeOptions(typeof value === "string" ? JSON.parse(value) : value);
  } catch {
    return [];
  }
};

export async function GET(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  try {
    assertSupabaseConfig();
    const { data, error } = await supabase!
      .from(SETTINGS_TABLE)
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ ok: true, data: { options: parseOptions(data?.value) } });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "style attribute options fetch error") },
      { status: getErrorStatusCode(error) }
    );
  }
}

export async function POST(request: Request) {
  const adminError = verifyAdminRequest(request);
  if (adminError) return adminError;

  try {
    const body = await request.json();
    const attributeKey = String(body?.attributeKey ?? "").trim();
    const value = normalizeOption(body?.value);
    if (!ATTRIBUTE_KEYS.has(attributeKey)) {
      return NextResponse.json({ ok: false, error: "invalid attributeKey" }, { status: 400 });
    }
    if (!value || value.length > 64) {
      return NextResponse.json({ ok: false, error: "value must be between 1 and 64 characters" }, { status: 400 });
    }

    assertSupabaseConfig();
    const { data: existing, error: fetchError } = await supabase!
      .from(SETTINGS_TABLE)
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    if (fetchError) throw fetchError;

    const options = normalizeOptions([...parseOptions(existing?.value), { attributeKey, value }]);
    const { error: saveError } = await supabase!
      .from(SETTINGS_TABLE)
      .upsert({ key: SETTINGS_KEY, value: JSON.stringify(options) });
    if (saveError) throw saveError;
    return NextResponse.json({ ok: true, data: { option: { attribute_key: attributeKey, value } } });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error, "style attribute option save error") },
      { status: getErrorStatusCode(error) }
    );
  }
}
