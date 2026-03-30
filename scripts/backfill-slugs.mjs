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

const slugifyText = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// 한국어 브랜드명 → 영문 매핑
const BRAND_KO_EN = {
  '뉴발란스': 'new balance',
  '닥터마틴': 'dr martens',
  '무신사 스탠다드': 'musinsa standard',
  '무신사스탠다드': 'musinsa standard',
  '이외들': 'eoeodeul',
  '르아르': 'l-arc',
  '주앙옴므': 'jouan homme',
  '토피': 'topi',
  '커스텀어클락': 'custom aclock',
  '어널러코드': 'unallcode',
  '파브레가': 'fabregas',
  '엘무드': 'elmood',
  '쿠어': 'coor',
  '애프터프레이': 'afterpray',
  '유니클로': 'uniqlo',
  '브라운야드': 'brownyard',
  '인더로우': 'intheraw',
  '다이브인': 'divein',
  '마이라이브러리': 'mylibrary',
};

const extractEnglishBrand = (brand) => {
  const parenMatch = brand.match(/\(([a-zA-Z0-9][a-zA-Z0-9\s&'./+-]*)\)/);
  if (parenMatch) return parenMatch[1].trim();
  const pipeMatch = brand.match(/^([^|]+)\|/);
  if (pipeMatch) return pipeMatch[1].trim();
  const prefixMatch = brand.match(/^([A-Za-z0-9][A-Za-z0-9\s&'.+®-]+?)\s+[가-힣]/);
  if (prefixMatch) return prefixMatch[1].trim();
  // 한국어 브랜드 사전 확인
  const trimmed = brand.trim();
  if (BRAND_KO_EN[trimmed]) return BRAND_KO_EN[trimmed];
  return brand;
};

const hasKorean = (text) => /[가-힣]/.test(text);

// 한국어 패션 용어 로컬 사전 (Gemini 불가 시 fallback)
const KO_EN_DICT = [
  // 아우터
  ['피쉬테일 코트', 'fishtail coat'], ['피코트', 'pea coat'], ['피 코트', 'pea coat'],
  ['트렌치코트', 'trench coat'], ['트렌치 코트', 'trench coat'],
  ['더플코트', 'duffle coat'], ['더플 코트', 'duffle coat'],
  ['레더 자켓', 'leather jacket'], ['가죽 자켓', 'leather jacket'],
  ['블루종', 'blouson'], ['집업 블루종', 'zip-up blouson'],
  ['워시드 블루종', 'washed blouson'], ['해링턴 블루종', 'harrington blouson'],
  ['해링턴 자켓', 'harrington jacket'], ['해링턴재킷', 'harrington jacket'],
  ['봄버 자켓', 'bomber jacket'], ['MA-1', 'ma-1'],
  ['필드 재킷', 'field jacket'], ['파카', 'parka'],
  ['윈드브레이커', 'windbreaker'], ['바람막이', 'windbreaker'],
  ['커버올', 'coverall'], ['워크 재킷', 'work jacket'],
  ['코치 자켓', 'coach jacket'], ['나일론 자켓', 'nylon jacket'],
  ['덱커 자켓', 'decker jacket'],
  // 상의
  ['스웨터', 'sweater'], ['스웻', 'sweat'], ['스웨트', 'sweat'],
  ['니트', 'knit'], ['가디건', 'cardigan'], ['카디건', 'cardigan'],
  ['후드', 'hoodie'], ['후디', 'hoodie'], ['후드블루종', 'hooded blouson'],
  ['집업', 'zip-up'], ['반집업', 'half-zip'],
  ['셔츠', 'shirt'], ['옥스포드 셔츠', 'oxford shirt'],
  ['플란넬 셔츠', 'flannel shirt'], ['체크 셔츠', 'check shirt'],
  ['스트라이프 셔츠', 'stripe shirt'], ['유틸리티 셔츠', 'utility shirt'],
  ['티셔츠', 't-shirt'], ['롱슬리브', 'longsleeve'], ['긴팔', 'longsleeve'],
  ['폴로', 'polo'], ['터틀넥', 'turtleneck'], ['하이넥', 'high-neck'],
  ['크루넥', 'crewneck'], ['브이넥', 'v-neck'], ['헨리넥', 'henley neck'],
  ['나그랑', 'dolman'],
  // 하의
  ['데님 팬츠', 'denim pants'], ['청바지', 'jeans'], ['진', 'jeans'],
  ['배기진', 'baggy jeans'], ['배기핏 진', 'baggy jeans'], ['스트레이트진', 'straight jeans'],
  ['와이드 팬츠', 'wide pants'], ['와이드 데님', 'wide denim'],
  ['슬랙스', 'slacks'], ['카고 팬츠', 'cargo pants'], ['카고팬츠', 'cargo pants'],
  ['코튼 팬츠', 'cotton pants'], ['워크 팬츠', 'work pants'],
  ['핀턱 슬랙스', 'pintuck slacks'], ['헤링본 팬츠', 'herringbone pants'],
  // 신발
  ['스니커즈', 'sneakers'], ['더비 슈즈', 'derby shoes'], ['로퍼', 'loafers'],
  ['부츠', 'boots'], ['첼시 부츠', 'chelsea boots'],
  // 색상
  ['블랙', 'black'], ['화이트', 'white'], ['그레이', 'grey'],
  ['베이지', 'beige'], ['브라운', 'brown'], ['네이비', 'navy'], ['카키', 'khaki'],
  ['인디고', 'indigo'], ['차콜', 'charcoal'], ['버건디', 'burgundy'],
  ['체리레드', 'cherry red'], ['올리브', 'olive'], ['레드', 'red'],
  ['샌드', 'sand'], ['다크그레이', 'dark grey'], ['다크 그레이', 'dark grey'],
  ['헤더 베이지', 'heather beige'], ['헤더베이지', 'heather beige'],
  ['멜란지그레이', 'melange grey'], ['멜란지 그레이', 'melange grey'],
  ['워시드블루그레이', 'washed blue grey'], ['워시드차콜', 'washed charcoal'],
  // 수식어
  ['워시드', 'washed'], ['오버 다이드', 'over dyed'], ['오버다이드', 'over dyed'],
  ['오버사이즈', 'oversized'], ['레귤러핏', 'regular fit'], ['레귤러 핏', 'regular fit'],
  ['와이드핏', 'wide fit'], ['와이드 핏', 'wide fit'],
  ['울', 'wool'], ['코튼', 'cotton'], ['수피마 코튼', 'supima cotton'],
  ['스웨이드', 'suede'], ['레더', 'leather'],
  ['발수', 'water-repellent'], ['에어울', 'air wool'],
  ['더블 레이어드', 'double layered'], ['콘트라스트', 'contrast'],
  ['멀티 스트라이프', 'multi stripe'], ['깅엄 체크', 'gingham check'],
  ['스테레오', 'stereo'], ['에브리데이', 'everyday'], ['에어리', 'airy'],
  ['쉘터', 'shelter'], ['시티 레저', 'city leisure'],
  ['헤드라이트', 'headlight'],
  ['반집업나그랑', 'half-zip dolman'],
  ['수플레얀스탠드칼라가디건', 'souffle yarn stand collar cardigan'],
  ['유틸리티오버사이즈셔츠', 'utility oversized shirt'],
  ['크루넥풀집가디건', 'crewneck full-zip cardigan'],
  ['메리노크루넥스웨터', 'merino crewneck sweater'],
  ['스트레이트진셀비지', 'straight selvedge jeans'],
  ['파인니트 스웨터', 'fine knit sweater'],
];

const localTranslate = (name) => {
  let result = name
    .replace(/\[.*?\]/g, (m) => m.replace(/[가-힣]+/g, '').trim())
    .replace(/\(.*?\)/g, (m) => m.replace(/[가-힣]+/g, '').trim())
    .trim();

  // 사전 순서대로 치환 (긴 표현 우선)
  const sorted = [...KO_EN_DICT].sort((a, b) => b[0].length - a[0].length);
  for (const [ko, en] of sorted) {
    result = result.replace(new RegExp(ko, 'gi'), en);
  }
  return result;
};

const translateKoreanName = async (name) => {
  if (!hasKorean(name)) return name;

  // Gemini API 시도
  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Translate this Korean fashion product name to English. Return ONLY the English translation, no Korean.\n"배기진" → baggy jeans\n"네오 피쉬테일 코트 카키" → neo fishtail coat khaki\n"울 브이넥 스웨터 멜란지그레이" → wool v-neck sweater melange grey\n"워시드 엔지니어 데님 팬츠 워시드블루그레이" → washed engineer denim pants washed blue grey\n"오버 다이드 커버올 자켓 워시드차콜" → over dyed coverall jacket washed charcoal\n"후드블루종" → hooded blouson\n"해링턴재킷" → harrington jacket\n"${name}" →`,
              }],
            }],
            generationConfig: { maxOutputTokens: 100, temperature: 0, thinkingConfig: { thinkingBudget: 0 } },
          }),
        }
      );
      if (response.ok) {
        const json = await response.json();
        const translated = String(json?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        // 번역 결과에 한국어가 없고 비어있지 않으면 사용
        if (translated && !hasKorean(translated)) return translated;
      }
    } catch {
      // fallthrough to local translate
    }
  }

  // 로컬 사전 fallback
  return localTranslate(name);
};

const generateSlugWithGemini = async (brand, name) => {
  const brandSlug = slugifyText(extractEnglishBrand(brand));
  const translatedName = await translateKoreanName(name);
  const nameSlug = slugifyText(translatedName);
  const combined = [brandSlug, nameSlug].filter(Boolean).join('-').replace(/-{2,}/g, '-').slice(0, 80);
  return combined || slugifyText(`${brand} ${name}`);
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
