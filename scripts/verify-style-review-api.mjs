import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...valueParts] = arg.replace(/^--/, "").split("=");
    return [key, valueParts.join("=") || "1"];
  })
);

const parseEnvFile = (path) => {
  try {
    return readFileSync(path, "utf8")
      .split(/\r?\n/)
      .reduce((acc, line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return acc;
        const separator = trimmed.indexOf("=");
        if (separator < 0) return acc;
        const key = trimmed.slice(0, separator).trim();
        let value = trimmed.slice(separator + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        acc[key] = value;
        return acc;
      }, {});
  } catch {
    return {};
  }
};

const env = {
  ...parseEnvFile(resolve(process.cwd(), ".env")),
  ...parseEnvFile(resolve(process.cwd(), ".env.local")),
  ...process.env,
};

const baseUrl = String(args.get("base-url") || "http://127.0.0.1:3001").replace(/\/$/, "");
const productId = String(args.get("product-id") || "30").trim();
const status = String(args.get("status") || "approved").trim();
const password = String(env.ADMIN_PASSWORD || "").trim();

if (!password) {
  console.error("ADMIN_PASSWORD is missing.");
  process.exit(1);
}

const readJson = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: text || response.statusText };
  }
};

const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password }),
});
const loginPayload = await readJson(loginResponse);
const cookie = loginResponse.headers.get("set-cookie")?.split(";")[0] || "";
if (!loginResponse.ok || !loginPayload?.ok || !cookie) {
  console.error("admin login failed:", loginPayload?.error || loginResponse.statusText);
  process.exit(1);
}

const patchResponse = await fetch(`${baseUrl}/api/admin/products/${encodeURIComponent(productId)}/style-review`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Cookie: cookie,
  },
  body: JSON.stringify({
    tagReviewStatus: status,
    tagReviewNote: "API verification",
  }),
});
const patchPayload = await readJson(patchResponse);
if (!patchResponse.ok || !patchPayload?.ok) {
  console.error("style review patch failed:", patchPayload?.error || patchResponse.statusText);
  process.exit(1);
}

const getResponse = await fetch(`${baseUrl}/api/admin/products/${encodeURIComponent(productId)}/style-review`, {
  headers: { Cookie: cookie },
});
const getPayload = await readJson(getResponse);
if (!getResponse.ok || !getPayload?.ok) {
  console.error("style review fetch failed:", getPayload?.error || getResponse.statusText);
  process.exit(1);
}

const product = getPayload.data?.product || {};
const humanTags = product.human_style_tags || {};
const topTags = Object.entries(humanTags)
  .sort((a, b) => Number(b[1]) - Number(a[1]))
  .slice(0, 3)
  .map(([tag, score]) => `${tag}=${Number(score).toFixed(2)}`);

console.log("style review api ok");
console.log("product_id", product.id);
console.log("tag_review_status", product.tag_review_status);
console.log("top_human_tags", topTags.join(", "));
console.log("reviewed_at", product.reviewed_at || "");
