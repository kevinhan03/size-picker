/**
 * Generates and saves URL slugs for all products that don't have one yet.
 * Uses Gemini to translate Korean/English brand+name into an English slug.
 *
 * Usage:
 *   node scripts/backfill-slugs.mjs --dry-run   # 변경 없이 결과만 출력
 *   node scripts/backfill-slugs.mjs             # 실제 DB 업데이트
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');

// .env 파일 로드
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
};
loadDotEnvFile();

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || '').trim();
const SUPABASE_PRODUCTS_TABLE = String(process.env.SUPABASE_PRODUCTS_TABLE || 'products').trim();
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env에 없습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const generateSlugFallback = (brand, name) =>
  [brand, name]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);

const generateSlugWithGemini = async (brand, name) => {
  const fallback = generateSlugFallback(brand, name);
  if (!GEMINI_API_KEY) return fallback;

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Convert this fashion product's brand and name into a URL slug in English.\nBrand: ${brand}\nName: ${name}\nRules:\n- Lowercase letters, numbers, and hyphens only\n- Translate Korean words to natural English equivalents\n- Remove special characters and parentheses\n- Max 80 characters\n- Return ONLY the slug, no explanation\nExample: Brand "파브레가" Name "카일리 체크 셔츠 (다크 네이비)" → fabrega-kylie-check-shirt-dark-navy`,
            }],
          }],
          generationConfig: { maxOutputTokens: 40, temperature: 0.1 },
        }),
      }
    );
    if (!response.ok) return fallback;
    const json = await response.json();
    const text = String(json?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const clean = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
    return clean || fallback;
  } catch {
    return fallback;
  }
};

async function main() {
  console.log(isDryRun ? '[DRY RUN] 실제 DB 변경 없음\n' : '[LIVE] DB 업데이트 실행\n');

  const { data: products, error } = await supabase
    .from(SUPABASE_PRODUCTS_TABLE)
    .select('id, brand, name, slug')
    .is('slug', null)
    .order('id', { ascending: true });

  if (error) {
    console.error('상품 조회 실패:', error.message);
    process.exit(1);
  }

  console.log(`슬러그 없는 상품: ${products.length}개\n`);

  let updated = 0;
  let failed = 0;

  for (const product of products) {
    const slug = await generateSlugWithGemini(product.brand, product.name);
    console.log(`[${product.id}] ${product.brand} / ${product.name}`);
    console.log(`       → ${slug}`);

    if (!isDryRun) {
      const { error: updateError } = await supabase
        .from(SUPABASE_PRODUCTS_TABLE)
        .update({ slug })
        .eq('id', product.id);

      if (updateError) {
        console.error(`       ✗ 실패: ${updateError.message}`);
        failed++;
      } else {
        console.log(`       ✓ 저장됨`);
        updated++;
      }
    }

    // Gemini rate limit 방지
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n완료: ${updated}개 업데이트, ${failed}개 실패`);
}

main();
