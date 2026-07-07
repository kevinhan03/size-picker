/**
 * Downloads external category product images, uploads them to Supabase Storage,
 * and rewrites products.image_path to match normal submission uploads.
 *
 * Usage:
 *   node scripts/migrate-bottom-images-to-storage.mjs --dry-run
 *   node scripts/migrate-bottom-images-to-storage.mjs --category=Outer --limit=3
 *   node scripts/migrate-bottom-images-to-storage.mjs --category=Outer
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const ENV_FILE_PATH = resolve(process.cwd(), '.env');
const DEFAULT_BUCKET = 'product-assets';
const DEFAULT_TABLE = 'products';
const DEFAULT_CATEGORY = 'Bottom';
const STORAGE_PREFIX = 'submissions/';
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30000;

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
const SUPABASE_PRODUCTS_TABLE = String(process.env.SUPABASE_PRODUCTS_TABLE || DEFAULT_TABLE).trim();
const SUPABASE_STORAGE_BUCKET = String(process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET).trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.slice('--limit='.length)) : 0;
const categoryArg = args.find((arg) => arg.startsWith('--category='));
const category = (categoryArg ? categoryArg.slice('--category='.length) : DEFAULT_CATEGORY).trim() || DEFAULT_CATEGORY;
const reportCategorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category';
const REPORT_FILE_PATH = resolve(process.cwd(), 'tmp', `${reportCategorySlug}-image-storage-migration-report.csv`);
const ids = args
  .filter((arg) => arg.startsWith('--id='))
  .map((arg) => arg.slice('--id='.length).trim())
  .filter(Boolean);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const isExternalHttpUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

const extensionFromContentType = (contentType) => {
  const normalized = String(contentType || '').split(';')[0].trim().toLowerCase();
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
  };
  return map[normalized] || '';
};

const extensionFromUrl = (url) => {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-z0-9]{2,5})$/i);
    const extension = match ? match[1].toLowerCase() : '';
    return ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(extension)
      ? extension.replace('jpeg', 'jpg')
      : '';
  } catch {
    return '';
  }
};

const extensionFromMagicBytes = (buffer) => {
  if (buffer.length >= 12) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) return 'png';
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) return 'webp';
    if (
      buffer[4] === 0x66 &&
      buffer[5] === 0x74 &&
      buffer[6] === 0x79 &&
      buffer[7] === 0x70 &&
      buffer.slice(8, 12).toString('ascii').includes('avif')
    ) return 'avif';
  }
  if (buffer.length >= 6 && buffer.slice(0, 3).toString('ascii') === 'GIF') return 'gif';
  return '';
};

const contentTypeForExtension = (extension) => {
  const normalized = String(extension || '').toLowerCase();
  if (normalized === 'jpg') return 'image/jpeg';
  if (normalized === 'png') return 'image/png';
  if (normalized === 'webp') return 'image/webp';
  if (normalized === 'avif') return 'image/avif';
  if (normalized === 'gif') return 'image/gif';
  return 'application/octet-stream';
};

const fetchProducts = async () => {
  let query = supabase
    .from(SUPABASE_PRODUCTS_TABLE)
    .select('id,brand,name,url,image_path')
    .eq('category', category)
    .filter('image_path', 'not.is', null)
    .order('id', { ascending: true });

  if (ids.length > 0) {
    query = query.in('id', ids);
  }

  const { data, error } = await query;
  if (error) throw error;

  let products = (Array.isArray(data) ? data : []).filter((product) =>
    isExternalHttpUrl(product?.image_path)
  );
  if (limit > 0) products = products.slice(0, limit);
  return products;
};

const downloadImage = async (product) => {
  const imageUrl = String(product.image_path || '').trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = {
      Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36',
    };

    const productUrl = String(product.url || '').trim();
    if (isExternalHttpUrl(productUrl)) {
      try {
        headers.Referer = new URL(productUrl).origin;
      } catch {
        headers.Referer = productUrl;
      }
    }

    const response = await fetch(imageUrl, {
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`download failed with HTTP ${response.status}`);
    }

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_IMAGE_BYTES) {
      throw new Error(`image too large: ${contentLength} bytes`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0) throw new Error('downloaded empty file');
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new Error(`image too large: ${buffer.length} bytes`);
    }

    const responseContentType = response.headers.get('content-type') || '';
    const extension =
      extensionFromMagicBytes(buffer) ||
      extensionFromContentType(responseContentType) ||
      extensionFromUrl(imageUrl);

    if (!extension) {
      throw new Error(`could not detect image type: ${responseContentType || 'unknown'}`);
    }

    return {
      buffer,
      extension,
      contentType: contentTypeForExtension(extension),
      byteLength: buffer.length,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const escapeCsvCell = (value) => {
  const normalized = String(value ?? '');
  if (/[",\r\n]/.test(normalized)) return `"${normalized.replace(/"/g, '""')}"`;
  return normalized;
};

const reportRows = [];
const products = await fetchProducts();
console.log(`Found ${products.length} ${category} products with external image URLs.`);
if (isDryRun) console.log('Dry run mode: no files will be uploaded and no rows will be updated.');

let uploadedCount = 0;
let updatedCount = 0;
let failedCount = 0;

for (const product of products) {
  const id = String(product.id || '').trim();
  const oldImagePath = String(product.image_path || '').trim();
  const label = `${product.brand || '(no brand)'} / ${product.name || '(no name)'}`;
  console.log(`\n[${id}] ${label}`);

  const row = {
    id,
    brand: product.brand || '',
    name: product.name || '',
    oldImagePath,
    newImagePath: '',
    status: '',
    message: '',
  };

  try {
    const image = await downloadImage(product);
    const newImagePath = `${STORAGE_PREFIX}${randomUUID()}.${image.extension}`;
    row.newImagePath = newImagePath;
    console.log(`  downloaded ${image.byteLength} bytes as ${image.contentType}`);
    console.log(`  target ${SUPABASE_STORAGE_BUCKET}/${newImagePath}`);

    if (isDryRun) {
      row.status = 'dry-run';
      row.message = `would upload ${image.byteLength} bytes`;
      reportRows.push(row);
      continue;
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(newImagePath, image.buffer, {
        contentType: image.contentType,
        upsert: false,
      });

    if (uploadError || !uploadData?.path) {
      throw new Error(uploadError?.message || 'upload returned no path');
    }
    uploadedCount += 1;

    const { data: updatedRows, error: updateError } = await supabase
      .from(SUPABASE_PRODUCTS_TABLE)
      .update({ image_path: uploadData.path })
      .eq('id', id)
      .eq('image_path', oldImagePath)
      .select('id,image_path');

    if (updateError) throw updateError;
    if (!Array.isArray(updatedRows) || updatedRows.length !== 1) {
      throw new Error('row was not updated, likely because image_path changed');
    }

    updatedCount += 1;
    row.status = 'updated';
    row.message = 'uploaded and updated';
    console.log('  updated');
  } catch (error) {
    failedCount += 1;
    row.status = 'failed';
    row.message = error?.message || String(error);
    console.error(`  failed: ${row.message}`);
  }

  reportRows.push(row);
}

mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true });
const csvLines = [
  ['id', 'brand', 'name', 'old_image_path', 'new_image_path', 'status', 'message'].join(','),
  ...reportRows.map((row) =>
    [
      row.id,
      row.brand,
      row.name,
      row.oldImagePath,
      row.newImagePath,
      row.status,
      row.message,
    ]
      .map(escapeCsvCell)
      .join(',')
  ),
];
writeFileSync(REPORT_FILE_PATH, `${csvLines.join('\n')}\n`, 'utf8');

console.log(`\nReport written: ${REPORT_FILE_PATH}`);
console.log(
  `Complete. Found: ${products.length}, uploaded: ${uploadedCount}, updated: ${updatedCount}, failed: ${failedCount}, dryRun: ${isDryRun}`
);
