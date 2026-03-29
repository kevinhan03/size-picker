/**
 * Rewrites existing product brands in Supabase using server/config/brand-rules.csv.
 *
 * Usage:
 *   node scripts/backfill-brand-names.mjs --dry-run
 *   node scripts/backfill-brand-names.mjs --report
 *   node scripts/backfill-brand-names.mjs
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ENV_FILE_PATH = resolve(process.cwd(), '.env');

const loadDotEnvFile = () => {
  if (!existsSync(ENV_FILE_PATH)) return;

  const raw = readFileSync(ENV_FILE_PATH, 'utf8').replace(/^\uFEFF/, '');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = String(line || '').trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
};

loadDotEnvFile();

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const SUPABASE_PRODUCTS_TABLE = String(process.env.SUPABASE_PRODUCTS_TABLE || 'products').trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const { normalizeBrandName } = await import('../server/shared.js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const isDryRun = process.argv.includes('--dry-run');
const shouldWriteReport = process.argv.includes('--report');
const PAGE_SIZE = 1000;
const REPORT_FILE_PATH = resolve(process.cwd(), 'tmp', 'brand-backfill-report.csv');

const fetchAllProducts = async () => {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .select('id,brand,name,url')
      .range(from, to);

    if (error) throw error;

    const batch = Array.isArray(data) ? data : [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
};

const products = await fetchAllProducts();
console.log(`Fetched ${products.length} products from ${SUPABASE_PRODUCTS_TABLE}.`);

let changedCount = 0;
let skippedCount = 0;
let failedCount = 0;
const reportRows = [];

const escapeCsvCell = (value) => {
  const normalized = String(value ?? '');
  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

for (const product of products) {
  const id = String(product?.id || '').trim();
  const currentBrand = String(product?.brand || '').trim();
  const name = String(product?.name || '').trim();
  const url = String(product?.url || '').trim();
  const canonicalBrand = normalizeBrandName(currentBrand, { url });

  if (!id || !currentBrand || !canonicalBrand || canonicalBrand === currentBrand) {
    skippedCount += 1;
    continue;
  }

  changedCount += 1;
  reportRows.push({
    id,
    currentBrand,
    canonicalBrand,
    name,
    url,
  });
  console.log(`[${id}] ${name || '(no name)'}`);
  console.log(`  ${currentBrand} -> ${canonicalBrand}`);

  if (isDryRun) continue;

  const { error: updateError } = await supabase
    .from(SUPABASE_PRODUCTS_TABLE)
    .update({ brand: canonicalBrand })
    .eq('id', id);

  if (updateError) {
    failedCount += 1;
    console.error(`  update failed: ${updateError.message}`);
  } else {
    console.log('  updated');
  }
}

if (shouldWriteReport) {
  mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true });
  const csvLines = [
    ['id', 'current_brand', 'canonical_brand', 'name', 'url'].join(','),
    ...reportRows.map((row) =>
      [
        row.id,
        row.currentBrand,
        row.canonicalBrand,
        row.name,
        row.url,
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
  ];
  writeFileSync(REPORT_FILE_PATH, `${csvLines.join('\n')}\n`, 'utf8');
  console.log(`\nReport written: ${REPORT_FILE_PATH}`);
}

if (isDryRun) {
  console.log(`\nDry run complete. Would update: ${changedCount}, skipped: ${skippedCount}`);
} else {
  console.log(
    `\nBackfill complete. Updated: ${changedCount - failedCount}, failed: ${failedCount}, skipped: ${skippedCount}`
  );
}
