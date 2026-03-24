/**
 * One-time migration: re-normalize size_table headers for all products.
 * Fixes cases where "소매기장", "sleeve length" etc. were incorrectly mapped to 총장.
 *
 * Usage: node scripts/migrate-size-labels.mjs
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const SUPABASE_PRODUCTS_TABLE = (process.env.SUPABASE_PRODUCTS_TABLE || 'products').trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Normalization logic (mirrors server/index.js) ────────────────────────────

const TOTAL_LENGTH_LABEL = '총장';

const TOTAL_LENGTH_ALIAS_KEYS = ['총장', '전체길이', '전체장', '기장', 'totallength', 'length', 'total'];

const MEASUREMENT_ALIAS_MAP = {
  '총장': TOTAL_LENGTH_LABEL,
  '전체길이': TOTAL_LENGTH_LABEL,
  '전체장': TOTAL_LENGTH_LABEL,
  '기장': TOTAL_LENGTH_LABEL,
  '상의총장': TOTAL_LENGTH_LABEL,
  '하의총장': TOTAL_LENGTH_LABEL,
  '바지총장': TOTAL_LENGTH_LABEL,
  'length': TOTAL_LENGTH_LABEL,
  'total': TOTAL_LENGTH_LABEL,
  '소매': '소매',
  '소매길이': '소매',
  '소매기장': '소매',
  '화장': '소매',
  'sleeve': '소매',
  '어깨': '어깨',
  '어깨너비': '어깨',
  '어깨너이': '어깨',
  'shoulder': '어깨',
  '가슴': '가슴',
  '가슴단면': '가슴',
  '품': '가슴',
  'chest': '가슴',
  'bust': '가슴',
  '허리': '허리',
  '허리단면': '허리',
  'waist': '허리',
  '엉덩이': '엉덩이',
  '힙': '엉덩이',
  'hip': '엉덩이',
  '허벅지': '허벅지',
  '허벅지단면': '허벅지',
  'thigh': '허벅지',
  '밑위': '밑위',
  'rise': '밑위',
  '밑단': '밑단',
  '밑단단면': '밑단',
  'hem': '밑단',
  '인심': '인심',
  'inseam': '인심',
};

const normalizeCellText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const normalizeAliasKey = (value) =>
  normalizeCellText(value)
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^0-9a-z\u3131-\uD79D]/g, '');

const isTotalLengthAliasKey = (aliasKey) =>
  Boolean(aliasKey) &&
  TOTAL_LENGTH_ALIAS_KEYS.some((key) => aliasKey === key || aliasKey.includes(key));

const inferMeasurementLabelFromAliasKey = (aliasKey) => {
  if (!aliasKey) return '';
  if (aliasKey.includes('shoulder') || aliasKey.includes('어깨')) return '어깨';
  if (aliasKey.includes('chest') || aliasKey.includes('bust') || aliasKey.includes('bodywidth') || aliasKey.includes('pit') || aliasKey.includes('가슴') || aliasKey.includes('품')) return '가슴';
  if (aliasKey.includes('sleeve') || aliasKey.includes('arm') || aliasKey.includes('소매') || aliasKey.includes('화장')) return '소매';
  if (aliasKey.includes('waist') || aliasKey.includes('허리')) return '허리';
  if (aliasKey.includes('hip') || aliasKey.includes('엉덩이') || aliasKey.includes('힙')) return '엉덩이';
  if (aliasKey.includes('thigh') || aliasKey.includes('허벅지')) return '허벅지';
  if (aliasKey.includes('rise') || aliasKey.includes('밑위')) return '밑위';
  if (aliasKey.includes('hem') || aliasKey.includes('밑단')) return '밑단';
  if (aliasKey.includes('inseam') || aliasKey.includes('인심')) return '인심';
  return '';
};

const normalizeMeasurementLabel = (value) => {
  const raw = normalizeCellText(value);
  if (!raw) return '';
  const sanitizedRaw = raw.replace(/^(?:cm|mm|in(?:ch)?)\s+/i, '');
  const aliasKey = normalizeAliasKey(sanitizedRaw);
  if (MEASUREMENT_ALIAS_MAP[aliasKey]) return MEASUREMENT_ALIAS_MAP[aliasKey];
  const inferred = inferMeasurementLabelFromAliasKey(aliasKey);
  if (inferred) return inferred;
  if (isTotalLengthAliasKey(aliasKey)) return TOTAL_LENGTH_LABEL;
  return sanitizedRaw;
};

// ── Migration ─────────────────────────────────────────────────────────────────

const { data: products, error } = await supabase
  .from(SUPABASE_PRODUCTS_TABLE)
  .select('id, brand, name, size_table')
  .not('size_table', 'is', null);

if (error) {
  console.error('Failed to fetch products:', error.message);
  process.exit(1);
}

console.log(`Fetched ${products.length} products with size tables.\n`);

let updatedCount = 0;
let skippedCount = 0;

for (const product of products) {
  const table = product.size_table;
  if (!table?.headers?.length) { skippedCount++; continue; }

  // Only headers[0] is the 항목 column — re-normalize headers[1..] (size labels) are left as-is.
  // Measurement labels are in rows[][0] (first cell of each row).
  const newRows = table.rows.map((row) => {
    if (!Array.isArray(row) || row.length === 0) return row;
    const oldLabel = row[0];
    const newLabel = normalizeMeasurementLabel(oldLabel);
    return newLabel !== oldLabel ? [newLabel, ...row.slice(1)] : row;
  });

  const changed = newRows.some((row, i) => row[0] !== table.rows[i]?.[0]);

  if (!changed) { skippedCount++; continue; }

  // Show diff
  console.log(`[${product.brand}] ${product.name} (${product.id})`);
  newRows.forEach((row, i) => {
    const oldLabel = table.rows[i]?.[0];
    if (row[0] !== oldLabel) {
      console.log(`  "${oldLabel}" → "${row[0]}"`);
    }
  });

  const { error: updateError } = await supabase
    .from(SUPABASE_PRODUCTS_TABLE)
    .update({ size_table: { ...table, rows: newRows } })
    .eq('id', product.id);

  if (updateError) {
    console.error(`  ✗ Update failed: ${updateError.message}`);
  } else {
    console.log(`  ✓ Updated\n`);
    updatedCount++;
  }
}

console.log(`\nDone. Updated: ${updatedCount}, Skipped (no change): ${skippedCount}`);
