import fs from "node:fs/promises";
import path from "node:path";
import { extractStructuredProductMetadataFromUrl } from "../server/bootstrap/metadata.js";
import { supabase } from "../server/lib/supabase.js";

const isHttpUrl = (value) => /^https?:\/\/[^\s]+/i.test(String(value || "").trim());
const isStructuredMetadata = (value) =>
  Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      value.metadata_source === "product_page" &&
      typeof value.product_summary === "string" &&
      Array.isArray(value.materials) &&
      Array.isArray(value.design_details)
  );

const readFlag = (name) => process.argv.includes(name);
const readNumberOption = (name, fallback) => {
  const prefix = `${name}=`;
  const value = process.argv.find((argument) => argument.startsWith(prefix));
  const parsed = Number(value?.slice(prefix.length));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const dryRun = readFlag("--dry-run");
const limit = readNumberOption("--limit", Number.POSITIVE_INFINITY);
const concurrency = Math.min(readNumberOption("--concurrency", 2), 4);

const PAGE_SIZE = 500;
const rows = [];
for (let offset = 0; ; offset += PAGE_SIZE) {
  const { data: page, error: readError } = await supabase
    .from("products")
    .select("id,url,product_metadata")
    .order("id", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);
  if (readError) throw readError;
  rows.push(...(page || []));
  if (!page || page.length < PAGE_SIZE) break;
}

const targets = rows
  .filter((row) => isHttpUrl(row.url) && !isStructuredMetadata(row.product_metadata))
  .slice(0, limit);
const report = {
  startedAt: new Date().toISOString(),
  dryRun,
  targetCount: targets.length,
  succeeded: [],
  failed: [],
};

let cursor = 0;
const takeTarget = () => {
  const index = cursor;
  cursor += 1;
  return targets[index] || null;
};

const worker = async () => {
  for (;;) {
    const target = takeTarget();
    if (!target) return;
    try {
      const extracted = await extractStructuredProductMetadataFromUrl(target.url);
      const metadata = extracted.productMetadata;
      if (!metadata?.product_summary && !Object.values(metadata || {}).some((value) => Array.isArray(value) && value.length > 0)) {
        throw new Error("no structured facts extracted");
      }
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ product_metadata: metadata })
          .eq("id", target.id);
        if (updateError) throw updateError;
      }
      report.succeeded.push({ id: target.id, url: target.url });
      console.log(`[${report.succeeded.length + report.failed.length}/${targets.length}] ok ${target.id}`);
    } catch (error) {
      report.failed.push({
        id: target.id,
        url: target.url,
        error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
      });
      console.log(`[${report.succeeded.length + report.failed.length}/${targets.length}] failed ${target.id}`);
    }
  }
};

await Promise.all(Array.from({ length: concurrency }, () => worker()));
report.finishedAt = new Date().toISOString();
report.successCount = report.succeeded.length;
report.failureCount = report.failed.length;

const reportsDirectory = path.resolve("reports");
await fs.mkdir(reportsDirectory, { recursive: true });
const reportPath = path.join(reportsDirectory, `product-metadata-backfill-${Date.now()}.json`);
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...report, succeeded: undefined, failed: report.failed.slice(0, 10), reportPath }, null, 2));
