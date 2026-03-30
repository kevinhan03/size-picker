import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { BRAND_RULES_CACHE_TTL_MS, SUPABASE_STORAGE_BUCKET } from "../config/env.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { normalizeCellText } from "./size-table.js";

const BRAND_RULES_FILE_PATH = resolve(process.cwd(), "server", "config", "brand-rules.csv");
const BRAND_RULES_STORAGE_PATH = "_config/brand-rules.json";
const VALID_BRAND_RULE_TYPES = new Set(["domain", "url", "brand", "brand_contains"]);

let brandRulesCache = null;
let brandRulesCacheUpdatedAt = 0;
let brandRulesRefreshPromise = null;

const parseDelimitedLine = (line, delimiter = ",") => {
  const output = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      output.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  output.push(current);
  return output.map((value) => String(value || "").trim());
};

const parseBrandRulesCsv = (csvText) => {
  const raw = String(csvText || "").trim();
  if (!raw) return [];

  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0].split(",").map((value) => String(value || "").trim().toLowerCase());
  const matchTypeIndex = header.indexOf("match_type");
  const matchValueIndex = header.indexOf("match_value");
  const canonicalBrandIndex = header.indexOf("canonical_brand");
  if (matchTypeIndex < 0 || matchValueIndex < 0 || canonicalBrandIndex < 0) return [];

  return lines
    .slice(1)
    .map((line) => parseDelimitedLine(line, ","))
    .map((columns) => ({
      matchType: String(columns[matchTypeIndex] || "").trim().toLowerCase(),
      matchValue: String(columns[matchValueIndex] || "").trim(),
      canonicalBrand: String(columns[canonicalBrandIndex] || "").trim(),
    }))
    .filter((rule) => rule.matchType && rule.matchValue && rule.canonicalBrand);
};

const readBrandRulesFile = () => {
  try {
    if (!existsSync(BRAND_RULES_FILE_PATH)) return [];
    return parseBrandRulesCsv(readFileSync(BRAND_RULES_FILE_PATH, "utf8"));
  } catch (error) {
    console.error("[brand-rules] failed to read brand rules csv", error);
    return [];
  }
};

const setBrandRulesCache = (rules) => {
  brandRulesCache = Array.isArray(rules) ? rules : [];
  brandRulesCacheUpdatedAt = Date.now();
  return brandRulesCache;
};

export const getBrandRules = () => {
  if (Array.isArray(brandRulesCache)) return brandRulesCache;
  return setBrandRulesCache(readBrandRulesFile());
};

const escapeCsvCell = (value) => {
  const normalized = String(value ?? "");
  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }
  return normalized;
};

const normalizeBrandRuleText = (value) =>
  normalizeCellText(value)
    .toLowerCase()
    .replace(/\s+/g, " ");

const normalizeHostName = (value) => {
  const raw = normalizeCellText(value).toLowerCase();
  if (!raw) return "";

  try {
    const parsed = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
};

const normalizeBrandNameBase = (value) =>
  normalizeCellText(value)
    .replace(/\s*공식\s*온라인\s*스토어$/i, "")
    .replace(/\s*공식\s*스토어$/i, "")
    .replace(/\s*official\s+online\s+store$/i, "")
    .replace(/\s*official\s+store$/i, "")
    .trim();

export const normalizeBrandRule = (rule) => {
  if (!rule || typeof rule !== "object") return null;

  const matchType = String(rule.matchType || "").trim().toLowerCase();
  const matchValue = String(rule.matchValue || "").trim();
  const canonicalBrand = String(rule.canonicalBrand || "").trim();
  if (!VALID_BRAND_RULE_TYPES.has(matchType) || !matchValue || !canonicalBrand) {
    return null;
  }

  return {
    matchType,
    matchValue,
    canonicalBrand: normalizeBrandNameBase(canonicalBrand),
  };
};

const serializeBrandRulesCsv = (rules) => {
  const normalizedRules = Array.isArray(rules)
    ? rules.map((rule) => normalizeBrandRule(rule)).filter(Boolean)
    : [];
  const lines = [
    "match_type,match_value,canonical_brand",
    ...normalizedRules.map((rule) =>
      [rule.matchType, rule.matchValue, rule.canonicalBrand].map(escapeCsvCell).join(",")
    ),
  ];
  return `${lines.join("\n")}\n`;
};

const parseBrandRulesStoragePayload = (raw) => {
  try {
    const parsed = JSON.parse(String(raw || ""));
    const rules = Array.isArray(parsed?.rules) ? parsed.rules : [];
    return rules.map((rule) => normalizeBrandRule(rule)).filter(Boolean);
  } catch (error) {
    console.error("[brand-rules] failed to parse storage payload", error);
    return null;
  }
};

const loadBrandRulesFromStorage = async () => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .download(BRAND_RULES_STORAGE_PATH);
    if (error) {
      const message = String(error.message || "").toLowerCase();
      const statusCode = Number(error.statusCode || error.status || 0);
      if (statusCode === 404 || message.includes("not found") || message.includes("object not found")) {
        return null;
      }
      console.error("[brand-rules] failed to download rules from storage", error);
      return null;
    }

    const raw = typeof data?.text === "function" ? await data.text() : "";
    const parsedRules = parseBrandRulesStoragePayload(raw);
    return Array.isArray(parsedRules) ? parsedRules : null;
  } catch (error) {
    console.error("[brand-rules] unexpected storage read error", error);
    return null;
  }
};

const persistBrandRulesToStorage = async (rules) => {
  assertSupabaseConfig();

  const normalizedRules = Array.isArray(rules)
    ? rules.map((rule) => normalizeBrandRule(rule)).filter(Boolean)
    : [];
  const payload = JSON.stringify({ rules: normalizedRules }, null, 2);
  const { error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(BRAND_RULES_STORAGE_PATH, new Blob([payload], { type: "application/json; charset=utf-8" }), {
      upsert: true,
      contentType: "application/json; charset=utf-8",
      cacheControl: "0",
    });
  if (error) throw error;
  return normalizedRules;
};

export const refreshBrandRulesCache = async ({ force = false } = {}) => {
  const hasFreshCache =
    Array.isArray(brandRulesCache) &&
    brandRulesCacheUpdatedAt > 0 &&
    Date.now() - brandRulesCacheUpdatedAt < BRAND_RULES_CACHE_TTL_MS;
  if (!force && hasFreshCache) return brandRulesCache;
  if (brandRulesRefreshPromise) return brandRulesRefreshPromise;

  brandRulesRefreshPromise = (async () => {
    const storageRules = await loadBrandRulesFromStorage();
    if (Array.isArray(storageRules)) {
      return setBrandRulesCache(storageRules);
    }
    return setBrandRulesCache(readBrandRulesFile());
  })();

  try {
    return await brandRulesRefreshPromise;
  } finally {
    brandRulesRefreshPromise = null;
  }
};

export const writeBrandRules = async (rules) => {
  const normalizedRules = await persistBrandRulesToStorage(rules);
  const csv = serializeBrandRulesCsv(normalizedRules);

  try {
    writeFileSync(BRAND_RULES_FILE_PATH, csv, "utf8");
  } catch (error) {
    console.warn("[brand-rules] local csv sync skipped", error?.message || error);
  }

  return setBrandRulesCache(normalizedRules);
};

const applyBrandRule = ({ brand = "", url = "" }) => {
  const normalizedBrand = normalizeBrandNameBase(brand);
  const normalizedBrandKey = normalizeBrandRuleText(normalizedBrand);
  const normalizedUrl = normalizeCellText(url).toLowerCase();
  const normalizedHost = normalizeHostName(url);

  for (const rule of getBrandRules()) {
    const ruleType = String(rule.matchType || "").toLowerCase();
    const canonicalBrand = normalizeBrandNameBase(rule.canonicalBrand || "");
    if (!canonicalBrand) continue;

    if (ruleType === "domain") {
      const ruleHost = normalizeHostName(rule.matchValue);
      if (ruleHost && (normalizedHost === ruleHost || normalizedHost.endsWith(`.${ruleHost}`))) {
        return canonicalBrand;
      }
      continue;
    }

    if (ruleType === "url") {
      const ruleUrl = normalizeCellText(rule.matchValue).toLowerCase();
      if (ruleUrl && normalizedUrl.includes(ruleUrl)) {
        return canonicalBrand;
      }
      continue;
    }

    if (ruleType === "brand") {
      if (normalizedBrandKey && normalizedBrandKey === normalizeBrandRuleText(rule.matchValue)) {
        return canonicalBrand;
      }
      continue;
    }

    if (ruleType === "brand_contains") {
      const ruleBrandPart = normalizeBrandRuleText(rule.matchValue);
      if (ruleBrandPart && normalizedBrandKey.includes(ruleBrandPart)) {
        return canonicalBrand;
      }
    }
  }

  return normalizedBrand;
};

export const normalizeBrandName = (value, context = {}) =>
  applyBrandRule({
    brand: value,
    url: context?.url || "",
  });
