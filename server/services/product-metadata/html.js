import { normalizeCellText } from "../../utils/size-table.js";
import { normalizeBrandName, uniqValues } from "./shared.js";

export const decodeHtmlEntities = (value) =>
  String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

export const stripHtml = (value) =>
  decodeHtmlEntities(
    String(value || "")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();

export const parseHtmlAttributes = (tag) => {
  const attributes = {};
  const attrPattern = /([A-Za-z_][A-Za-z0-9_:\-.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match = null;
  while ((match = attrPattern.exec(String(tag || ""))) !== null) {
    const key = String(match[1] || "").toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";
    attributes[key] = decodeHtmlEntities(value).trim();
  }
  return attributes;
};

export const extractHtmlTitle = (html) => {
  const match = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return normalizeCellText(decodeHtmlEntities(match?.[1] || ""));
};

export const extractMetaContent = (html, key, attrName) => {
  const target = String(key || "").toLowerCase();
  const tagPattern = /<meta\s+[^>]*>/gi;
  let match = null;
  while ((match = tagPattern.exec(String(html || ""))) !== null) {
    const attrs = parseHtmlAttributes(match[0]);
    if (String(attrs[attrName] || "").toLowerCase() !== target) continue;
    if (attrs.content) return normalizeCellText(attrs.content);
  }
  return "";
};

export const extractJsonLdObjects = (html) => {
  const objects = [];
  const pattern = /<script[^>]+type=(?:"|')application\/ld\+json(?:"|')[^>]*>([\s\S]*?)<\/script>/gi;
  let match = null;
  while ((match = pattern.exec(String(html || ""))) !== null) {
    const raw = String(match[1] || "").trim();
    if (!raw) continue;
    try {
      objects.push(JSON.parse(raw));
    } catch {
      continue;
    }
  }
  return objects;
};

const collectProductNodes = (node, output = []) => {
  if (!node) return output;
  if (Array.isArray(node)) {
    for (const item of node) collectProductNodes(item, output);
    return output;
  }
  if (typeof node !== "object") return output;

  const typeValue = node["@type"];
  const types = Array.isArray(typeValue) ? typeValue : [typeValue];
  const hasProductType = types.some((type) => String(type || "").toLowerCase() === "product");
  if (hasProductType) output.push(node);

  for (const value of Object.values(node)) {
    if (value && typeof value === "object") collectProductNodes(value, output);
  }
  return output;
};

export const extractProductJsonLd = (html) => {
  const scripts = extractJsonLdObjects(html);
  const productNodes = [];
  for (const parsed of scripts) {
    collectProductNodes(parsed, productNodes);
  }
  if (productNodes.length === 0) return null;

  const bestNode = productNodes.find((node) => normalizeCellText(node?.name)) || productNodes[0];
  const brandNode = bestNode?.brand;
  const rawBrand =
    typeof brandNode === "string"
      ? brandNode
      : typeof brandNode === "object" && brandNode
        ? brandNode.name || brandNode.brand || ""
        : "";
  const rawImages = Array.isArray(bestNode?.image) ? bestNode.image : [bestNode?.image];
  return {
    name: normalizeCellText(bestNode?.name || ""),
    brand: normalizeBrandName(rawBrand),
    description: normalizeCellText(bestNode?.description || ""),
    category: normalizeCellText(bestNode?.category || ""),
    type: normalizeCellText(bestNode?.additionalType || bestNode?.["@type"] || ""),
    images: rawImages.map((value) => normalizeCellText(value)).filter(Boolean),
  };
};

export const extractNextDataPayload = (html) => {
  const match = String(html || "").match(
    /<script[^>]+id=(?:"|')__NEXT_DATA__(?:"|')[^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
};

export const extractMusinsaPageData = (nextDataPayload) => {
  const meta = nextDataPayload?.props?.pageProps?.meta?.data;
  if (!meta || typeof meta !== "object") return null;

  const resolveMusinsaImageUrl = (value) => {
    const raw = normalizeCellText(value);
    if (!raw) return "";
    if (raw.startsWith("/images/")) return `https://image.msscdn.net${raw}`;
    return raw;
  };

  const imageCandidates = [];
  if (meta.thumbnailImageUrl) imageCandidates.push(resolveMusinsaImageUrl(meta.thumbnailImageUrl));
  if (Array.isArray(meta.goodsImages)) {
    for (const item of meta.goodsImages) {
      const candidateUrl = resolveMusinsaImageUrl(item?.imageUrl || item?.url || "");
      if (candidateUrl) imageCandidates.push(candidateUrl);
    }
  }

  return {
    brand: normalizeBrandName(meta?.brandInfo?.brandName || meta?.brand || ""),
    name: normalizeCellText(meta?.goodsNm || ""),
    imageCandidates: uniqValues(imageCandidates),
    textBlocks: [meta?.goodsContents || "", meta?.specDesc || ""],
  };
};

export const extractJsonObjectsFromApplicationScripts = (html) => {
  const objects = [];
  const pattern = /<script[^>]+type=(?:"|')application\/json(?:"|')[^>]*>([\s\S]*?)<\/script>/gi;
  let match = null;
  while ((match = pattern.exec(String(html || ""))) !== null) {
    const raw = String(match?.[1] || "").trim();
    if (!raw || raw.length > 2_000_000) continue;
    if (!(raw.startsWith("{") || raw.startsWith("["))) continue;
    try {
      objects.push(JSON.parse(raw));
    } catch {
      continue;
    }
  }
  return objects;
};

export const extractBrandFromDescription = (description) => {
  const brandMatch = String(description || "").match(/(?:brand|\uBE0C\uB79C\uB4DC)\s*[:\-]?\s*([^,|]+)/i);
  return normalizeBrandName(brandMatch?.[1] || "");
};

const TAGGING_TEXT_KEYWORDS =
  /(description|product|goods|detail|material|fabric|composition|care|fit|silhouette|color|colour|wash|washed|pocket|pleat|tuck|drawstring|waist|hem|denim|cotton|wool|nylon|polyester|corduroy|linen|leather|spandex|elastane|소재|혼용|상세|설명|상품|제품|핏|실루엣|와이드|스트레이트|테이퍼드|부츠컷|밴딩|스트링|포켓|카고|턱|주름|워싱|데님|면|울|나일론|코듀로이|컬러|색상)/i;

const STYLE_SIGNAL_PATTERNS = [
  /(소재|혼용|원단|fabric|material|composition|cotton|wool|leather|nylon|polyester|denim|linen|knit|가죽|면|울|나일론|폴리에스터|데님|니트)/i,
  /(핏|실루엣|오버사이즈|레귤러|릴랙스|슬림|크롭|와이드|테이퍼드|부츠컷|fit|silhouette|oversized|relaxed|regular|slim|cropped|wide|tapered)/i,
  /(포켓|플리츠|주름|워싱|스트링|카고|자수|프린트|절개|패커블|발수|통기|디테일|pocket|pleat|wash|drawstring|cargo|embroidery|print|packable|water.?repellent|breathable)/i,
  /(재킷|코트|셔츠|티셔츠|후드|니트|팬츠|스커트|원피스|가방|jacket|coat|shirt|hoodie|sweater|pants|skirt|dress|bag)/i,
];

const COMMERCE_NOISE_PATTERNS = [
  /(배송|교환|반품|환불|결제|주문|판매가|할인|재고|품절|장바구니|회원|로그인|고객센터|사업자|개인정보|이용약관|후기|리뷰|문의|shipping|return|refund|payment|price|sale|sold out|add to cart|wishlist|customer service|privacy|terms|review|newsletter|related products)/i,
  /(copyright|all rights reserved|company info|business registration|주소|대표자|전화번호|email)/i,
];

const HARD_NOISE_PATTERN =
  /(business number|mail-order|customer service|company info|copyright|all rights reserved|개인정보처리방침|이용약관|사업자정보|언어 한국어|language 한국어|newsletter)/i;

const UI_ARTIFACT_PATTERN =
  /(새로\s*고침|\-\->|breadcrumb|스크롤|scroll to top|view more|더보기|접기|펼치기)/i;

const MEASUREMENT_PATTERN = /(?:\d+(?:\.\d+)?\s*(?:cm|mm|inch|in|kg|g)\b)/gi;
const MATERIAL_OR_CARE_PATTERN =
  /(소재|혼용|원단|안감|fabric|material|composition|cotton|wool|leather|nylon|polyester|linen|care|세탁|드라이\s*클리닝|코튼|가죽|나일론|폴리에스터|린넨|(?:^|\s)면\s*\d|(?:^|\s)울\s*\d)/i;

const hasHangul = (value) => /[가-힣]/.test(value);
const hasLatinLetters = (value) => /[A-Za-z]/.test(value);

const isSizeGuideOnlyText = (value) => {
  const measurements = String(value || "").match(MEASUREMENT_PATTERN) || [];
  return measurements.length >= 2 && !MATERIAL_OR_CARE_PATTERN.test(value);
};

const normalizeTaggingTextBlock = (value) => {
  const normalized = stripHtml(value);
  if (normalized.length < 12) return "";
  if (normalized.length > 1200) return normalized.slice(0, 1200).trim();
  return normalized;
};

/** @param {{ html?: string, seedTexts?: string[] }} input */
export const extractStyleFactTextFromHtml = (input = {}) => {
  const { html, seedTexts = [] } = input;
  const candidates = [];
  const addCandidate = (value, sourceScore) => {
    const text = normalizeTaggingTextBlock(value);
    if (!text) return;
    if (HARD_NOISE_PATTERN.test(text) || UI_ARTIFACT_PATTERN.test(text) || isSizeGuideOnlyText(text)) return;
    const signalCount = STYLE_SIGNAL_PATTERNS.filter((pattern) => pattern.test(text)).length;
    const noiseCount = COMMERCE_NOISE_PATTERNS.filter((pattern) => pattern.test(text)).length;
    const score = sourceScore + signalCount * 16 - noiseCount * 26 + Math.min(text.length, 500) / 100;
    if (signalCount === 0 || score < 18 || (text.length < 28 && signalCount < 2)) return;
    candidates.push({ text, score });
  };
  for (const text of seedTexts) {
    addCandidate(text, 72);
  }

  const source = String(html || "");
  const metaNames = [
    ["description", "name"],
    ["og:description", "property"],
    ["twitter:description", "name"],
    ["keywords", "name"],
  ];
  for (const [key, attrName] of metaNames) {
    addCandidate(extractMetaContent(source, key, attrName), 60);
  }

  const attrPattern =
    /<(?:section|article|div|p|li|span|td|th|dd|dt)[^>]*(?:class|id|data-[^=]+)=["'][^"']*(?:description|desc|detail|info|spec|material|fabric|fit|size|product|goods|prd|상품|상세|설명|소재|혼용|핏)[^"']*["'][^>]*>([\s\S]{0,5000}?)<\/(?:section|article|div|p|li|span|td|th|dd|dt)>/gi;
  let attrMatch = null;
  while ((attrMatch = attrPattern.exec(source)) !== null) {
    addCandidate(attrMatch[1] || "", 50);
  }

  const plainText = stripHtml(source);
  const sentences = plainText
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map((value) => normalizeCellText(value))
    .filter((value) => value.length >= 18 && value.length <= 500 && TAGGING_TEXT_KEYWORDS.test(value));
  for (const sentence of sentences.slice(0, 80)) addCandidate(sentence, 18);

  const bestScoreByText = new Map();
  for (const candidate of candidates) {
    const previous = bestScoreByText.get(candidate.text);
    if (previous === undefined || candidate.score > previous) bestScoreByText.set(candidate.text, candidate.score);
  }
  const rankedCandidates = [...bestScoreByText.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([text, score]) => ({ text, score }));

  // Korean storefronts often expose a Korean detail sentence and its English
  // translation together. Keep the Korean source in that case so Gemini spends
  // its limited context on distinct product facts, not duplicate translations.
  const koreanCandidates = rankedCandidates.filter((candidate) => hasHangul(candidate.text));
  return rankedCandidates
    .filter((candidate) => {
      if (hasHangul(candidate.text) || !hasLatinLetters(candidate.text)) return true;
      return !koreanCandidates.some(
        (koreanCandidate) =>
          koreanCandidate.score >= candidate.score - 10 &&
          koreanCandidate.text.length >= candidate.text.length * 0.4 &&
          koreanCandidate.text.length <= candidate.text.length * 2.5
      );
    })
    .map((candidate) => candidate.text)
    .slice(0, 8);
};

const STYLE_FACT_PATTERNS = {
  fit_silhouette:
    /(크롭(?:\s*핏)?|오버사이즈|오버핏|레귤러(?:\s*핏)?|릴랙스(?:드)?(?:\s*핏)?|슬림(?:\s*핏)?|박시(?:\s*핏)?|와이드(?:\s*핏)?|테이퍼드|스트레이트|부츠컷|플레어|벌룬|래글런\s*소매|cropped?\s*fit|oversized|relaxed\s*fit|regular\s*fit|slim\s*fit|boxy|wide\s*fit|tapered|straight|bootcut|flare|raglan)/gi,
  design_details:
    /(넥\s*비조|곡선\s*(?:시접|절개)|밴딩\s*(?:처리된\s*)?허리|카고\s*포켓|플리츠|턱\s*(?:디테일)?|드로스트링|스트링|패치\s*포켓|워싱|페이딩|디스트레스드|자수|그래픽\s*프린트|리버서블|YKK(?:\s+[A-Z]+)?(?:®)?(?:\s+프론트)?\s*(?:지퍼|zip)|throat\s*latch|curved\s*seam|elastic\s*waistband|cargo\s*pocket|pleats?|drawstring|patch\s*pocket|washed|faded|distressed|embroidery|graphic\s*print|reversible)/gi,
  functional_features:
    /(발수|방수|방풍|보온|경량|통기|흡습|속건|신축|스트레치|패커블|내구성|water(?:proof|[-\s]?repellent)|windproof|insulated|lightweight|breathable|moisture[-\s]?wicking|quick[-\s]?dry|stretch|packable|durable)/gi,
  pattern_texture:
    /(코듀로이|데님|트위드|부클레|새틴|벨벳|니트|리브|퀼팅|체크|스트라이프|플로럴|카모|레오파드|corduroy|denim|tweed|boucl[eé]|satin|velvet|knit|ribbed|quilted|check(?:ed)?|striped?|floral|camo(?:uflage)?|leopard)/gi,
  color:
    /(블랙|화이트|아이보리|크림|그레이|차콜|네이비|블루|브라운|베이지|카키|그린|레드|핑크|퍼플|옐로|오렌지|실버|골드|black|white|ivory|cream|gray|grey|charcoal|navy|blue|brown|beige|khaki|green|red|pink|purple|yellow|orange|silver|gold)/gi,
  target_gender_evidence:
    /(남성(?:용|복|\s*라인)?|여성(?:용|복|\s*라인)?|유니섹스|남녀공용|menswear|womenswear|unisex)/gi,
};

const extractMatchedFacts = (texts, pattern, max = 8) => {
  const values = [];
  for (const text of texts) {
    const matches = String(text || "").match(pattern) || [];
    values.push(...matches.map((match) => normalizeCellText(match)));
  }
  return uniqValues(values).slice(0, max);
};

const hasStyleFact = (text, pattern) => {
  pattern.lastIndex = 0;
  const matches = pattern.test(text);
  pattern.lastIndex = 0;
  return matches;
};

const trimSourceFact = (value) =>
  normalizeCellText(value)
    .replace(/\s*(?:제조자|제조국|판매원|수입원|model\s*(?:is|wearing)|모델\s*착용)\s*[:：].*$/i, "")
    .trim();

const CATEGORY_DETAIL_PATTERNS = {
  top: {
    neckline: /(라운드넥|브이넥|터틀넥|크루넥|카라|헨리넥|보트넥|round neck|v-neck|turtleneck|crew neck|collar|henley|boat neck)/gi,
    sleeve: /(반소매|긴소매|민소매|퍼프 소매|래글런 소매|돌먼 소매|short sleeve|long sleeve|sleeveless|puff sleeve|raglan|dolman)/gi,
    closure: /(버튼 여밈|스냅 여밈|하프 지퍼|풀 지퍼|button(?:ed)? closure|snap closure|half zip|full zip)/gi,
    length: /(크롭(?:\s*핏)?|롱(?:\s*기장)?|cropped?|long length)/gi,
  },
  outer: {
    collar: /(코듀로이 칼라|셔츠 칼라|스탠드 칼라|테일러드 칼라|노치드 라펠|넥 비조|corduroy collar|shirt collar|stand collar|tailored collar|notched lapel|throat latch)/gi,
    hood: /(후드 탈부착|후드|hood(?:ed| detachable)?)/gi,
    insulation: /(다운 충전재|구스다운|덕다운|신슐레이트|패딩|down fill|goose down|duck down|thinsulate|padded)/gi,
    closure: /(더블 브레스티드|버튼 여밈|단추 여밈|스냅 여밈|투웨이 지퍼|하프 지퍼|double-breasted|button(?:ed)? closure|snap closure|two-way zip|half zip)/gi,
    pocket_configuration: /(플랩 포켓|웰트 포켓|패치 포켓|가슴 포켓|내부 포켓|cargo pocket|flap pocket|welt pocket|patch pocket|chest pocket|inside pocket)/gi,
  },
  bottom: {
    rise: /(하이웨이스트|미드라이즈|로우라이즈|high-rise|mid-rise|low-rise)/gi,
    waist_construction: /(밴딩 허리|드로스트링 허리|엘라스틱 웨이스트|elastic waistband|drawstring waist)/gi,
    hem: /(롤업 밑단|컷오프 밑단|밴딩 밑단|스트링 밑단|rolled hem|cut-off hem|elastic hem|drawstring hem)/gi,
    pocket_configuration: /(카고 포켓|슬랜트 포켓|웰트 포켓|패치 포켓|cargo pocket|slant pocket|welt pocket|patch pocket)/gi,
  },
  dress_skirt: {
    garment_form: /(미니원피스|미디원피스|맥시원피스|미니스커트|미디스커트|롱스커트|dress|skirt)/gi,
    neckline: /(라운드넥|브이넥|스퀘어넥|홀터넥|round neck|v-neck|square neck|halter)/gi,
    sleeve: /(반소매|긴소매|민소매|퍼프 소매|short sleeve|long sleeve|sleeveless|puff sleeve)/gi,
    waistline: /(엠파이어 웨이스트|드로스트링 허리|밴딩 허리|empire waist|drawstring waist|elastic waistband)/gi,
    slit: /(앞트임|옆트임|뒷트임|front slit|side slit|back slit)/gi,
    closure: /(사이드 지퍼|백 지퍼|버튼 여밈|side zip|back zip|button(?:ed)? closure)/gi,
  },
  shoes: {
    shoe_form: /(스니커즈|러닝화|로퍼|더비|옥스퍼드|부츠|워커|샌들|슬리퍼|뮬|메리제인|sneaker|running shoe|loafer|derby|oxford|boot|sandal|slide|mule|mary jane)/gi,
    toe_shape: /(라운드 토|스퀘어 토|포인티드 토|아몬드 토|round toe|square toe|pointed toe|almond toe)/gi,
    closure: /(레이스업|벨크로|버클|슬립온|지퍼 여밈|lace-up|velcro|buckle|slip-on|zip closure)/gi,
    sole: /(러버 아웃솔|비브람 솔|플랫폼 솔|크레이프 솔|rubber outsole|vibram|platform sole|crepe sole)/gi,
    heel_height: /(?:굽 높이|힐 높이|heel height)\s*[:：]?\s*\d+(?:\.\d+)?\s*(?:cm|mm|in)/gi,
    ankle_height: /(로우탑|미드탑|하이탑|앵클 부츠|low-top|mid-top|high-top|ankle boot)/gi,
    width: /(와이드 핏|좁은 발볼|발볼 넓이|wide fit|narrow width|shoe width)/gi,
    cushioning: /(쿠셔닝|폼 미드솔|에어 쿠션|cushioning|foam midsole|air cushion)/gi,
    support: /(아치 서포트|미드풋 서포트|안정성|arch support|midfoot support|stability)/gi,
    activity: /(러닝|트레일 러닝|하이킹|축구|농구|스케이트|running|trail running|hiking|football|basketball|skate)/gi,
    drop: /(?:힐 투 토 드롭|heel-to-toe drop)\s*[:：]?\s*\d+(?:\.\d+)?\s*mm/gi,
    weight: /(?:무게|weight)\s*[:：]?\s*(?:약\s*)?\d+(?:\.\d+)?\s*(?:g|kg|oz)/gi,
  },
  bag: {
    bag_form: /(메신저 백|크로스백|숄더백|토트백|백팩|에코백|보스턴백|더플백|웨이스트 백|파우치|브리프케이스|클러치|messenger bag|crossbody|shoulder bag|tote bag|backpack|duffle|waist bag|pouch|briefcase|clutch)/gi,
    carry_modes: /(숄더 또는 크로스바디|크로스바디|숄더 착용|핸드 캐리|백팩 착용|shoulder or crossbody|crossbody wear|shoulder wear|hand carry|backpack)/gi,
    closure: /(지퍼 여밈|마그네틱 스냅|턴락|키스락|버클 여밈|zip(?:-top)? closure|magnetic snap|turnlock|kisslock|buckle closure)/gi,
    strap: /(조절 가능한 스트랩|탈부착 스트랩|체인 스트랩|숄더 스트랩|adjustable strap|detachable strap|chain strap|shoulder strap)/gi,
    pocket_configuration: /(내부 지퍼 포켓|외부 포켓|멀티펑션 포켓|카드 슬롯|inside zip pocket|outside pocket|multifunction pocket|card slot)/gi,
    capacity: /(노트북 수납|태블릿 수납|A4 수납|laptop compartment|tablet compartment|A4)/gi,
    dimensions: /(?:가로|세로|폭|길이|높이|너비|length|height|width)\s*[:：]?\s*\d+(?:\.\d+)?\s*(?:cm|mm|in)/gi,
    hardware: /(실버 하드웨어|골드 하드웨어|브라스 하드웨어|silver hardware|gold hardware|brass hardware)/gi,
  },
  jewelry: {
    jewelry_form: /(반지|목걸이|귀걸이|팔찌|브로치|펜던트|ring|necklace|earrings?|bracelet|brooch|pendant)/gi,
    metal_finish: /(스털링 실버|스테인리스 스틸|14k|18k|골드 도금|실버 도금|로즈 골드|sterling silver|stainless steel|gold plated|silver plated|rose gold)/gi,
    gemstone: /(다이아몬드|진주|사파이어|루비|에메랄드|큐빅|diamond|pearl|sapphire|ruby|emerald|cubic zirconia)/gi,
    chain_length: /(?:체인 길이|chain length)\s*[:：]?\s*\d+(?:\.\d+)?\s*(?:cm|mm|in)/gi,
    ring_size: /(?:링 사이즈|반지 사이즈|ring size)\s*[:：]?\s*[\w.-]+/gi,
    fastening: /(클래스프|랍스터 클래스프|후크|클립|clasp|lobster clasp|hook|clip)/gi,
  },
  watch: {
    movement_or_power: /(오토매틱|쿼츠|솔라|기계식|배터리|automatic|quartz|solar|mechanical|battery)/gi,
    case_dimensions: /(?:케이스 (?:사이즈|크기)|case size)\s*[:：]?\s*\d+(?:\.\d+)?\s*[×x]\s*\d+(?:\.\d+)?(?:\s*[×x]\s*\d+(?:\.\d+)?)?\s*mm/gi,
    case_material: /(케이스.*?(?:스테인리스 스틸|티타늄|레진|카본)|(?:stainless steel|titanium|resin|carbon).*?case)/gi,
    band_material: /(가죽 밴드|스테인리스 스틸 밴드|레진 밴드|메시 밴드|leather band|stainless steel band|resin band|mesh band)/gi,
    glass: /(사파이어 글라스|미네랄 글라스|레진 글라스|sapphire crystal|mineral glass|resin glass)/gi,
    water_resistance: /(?:방수|water resistance)\s*[:：]?\s*(?:\d+\s*(?:m|bar)|water resistant)/gi,
    watch_features: /(크로노그래프|날짜 표시|문페이즈|블루투스|GPS|스톱워치|chronograph|date display|moon phase|bluetooth|gps|stopwatch)/gi,
  },
  fashion_accessory: {
    accessory_form: /(볼캡|비니|버킷햇|캡|벨트|선글라스|안경|스카프|머플러|장갑|헤어핀|향수|baseball cap|beanie|bucket hat|belt|sunglasses|glasses|scarf|muffler|gloves|hair clip|fragrance)/gi,
    dimensions: /(?:폭|길이|둘레|가로|세로|width|length|circumference|height)\s*[:：]?\s*\d+(?:\.\d+)?\s*(?:cm|mm|in)/gi,
    closure_or_adjustment: /(조절 가능한|버클|스냅|벨크로|adjustable|buckle|snap|velcro)/gi,
    frame_material: /(아세테이트 프레임|메탈 프레임|티타늄 프레임|acetate frame|metal frame|titanium frame)/gi,
    lens_type: /(편광 렌즈|UV 차단|미러 렌즈|polarized lens|UV protection|mirror lens)/gi,
  },
};

const hasPatternMatch = (text, pattern) => {
  pattern.lastIndex = 0;
  const matches = pattern.test(text);
  pattern.lastIndex = 0;
  return matches;
};

const inferCategoryDetailType = (category, texts) => {
  const combined = texts.join(" ");
  if (/(원피스|드레스|스커트|dress|skirt)/i.test(combined)) return "dress_skirt";
  if (category === "outer") return "outer";
  if (category === "top") return "top";
  if (category === "bottom") return "bottom";
  if (category === "shoes") return "shoes";
  if (/(시계|watch)/i.test(combined)) return "watch";
  if (/(반지|목걸이|귀걸이|팔찌|브로치|펜던트|ring|necklace|earring|bracelet|brooch|pendant)/i.test(combined)) return "jewelry";
  if (/(가방|백|토트|숄더|메신저|클러치|백팩|bag|tote|shoulder bag|messenger|clutch|backpack)/i.test(combined)) return "bag";
  if (category === "acc") return "fashion_accessory";
  return "";
};

const buildCategoryDetails = ({ category, texts }) => {
  const detailType = inferCategoryDetailType(category, texts);
  const patterns = CATEGORY_DETAIL_PATTERNS[detailType];
  if (!patterns) return {};
  const attributes = Object.fromEntries(
    Object.entries(patterns)
      .map(([key, pattern]) => [key, extractMatchedFacts(texts, pattern, 8)])
      .filter(([, values]) => values.length > 0)
  );
  return Object.keys(attributes).length ? { detail_type: detailType, attributes } : {};
};

/** @param {{ sourceTexts?: string[], category?: string }} input */
export const buildStructuredProductMetadata = (input = {}) => {
  const { sourceTexts = [], category = "" } = input;
  const texts = uniqValues(
    (Array.isArray(sourceTexts) ? sourceTexts : [])
      .map((value) => trimSourceFact(value))
      .filter(Boolean)
  ).slice(0, 8);
  const materialTexts = texts.filter((text) => MATERIAL_OR_CARE_PATTERN.test(text) && !isSizeGuideOnlyText(text));
  const careTexts = texts.filter((text) => /(세탁|드라이\s*클리닝|손세탁|care\b|wash(?:ing)?\b)/i.test(text));
  const summary =
    texts.find(
      (text) =>
        !MATERIAL_OR_CARE_PATTERN.test(text) &&
        (hasStyleFact(text, STYLE_FACT_PATTERNS.fit_silhouette) ||
          hasStyleFact(text, STYLE_FACT_PATTERNS.design_details))
    ) || texts.find((text) => !MATERIAL_OR_CARE_PATTERN.test(text)) || "";

  // RegExp instances with /g retain state after test(), so reset them before
  // passing them to the extraction helper below.
  for (const pattern of Object.values(STYLE_FACT_PATTERNS)) pattern.lastIndex = 0;

  return {
    metadata_source: "product_page",
    product_summary: summary.slice(0, 500),
    materials: materialTexts.slice(0, 4),
    fit_silhouette: extractMatchedFacts(texts, STYLE_FACT_PATTERNS.fit_silhouette),
    design_details: extractMatchedFacts(texts, STYLE_FACT_PATTERNS.design_details),
    functional_features: extractMatchedFacts(texts, STYLE_FACT_PATTERNS.functional_features),
    color: extractMatchedFacts(texts, STYLE_FACT_PATTERNS.color, 3),
    pattern_texture: extractMatchedFacts(texts, STYLE_FACT_PATTERNS.pattern_texture),
    target_gender_evidence: extractMatchedFacts(texts, STYLE_FACT_PATTERNS.target_gender_evidence, 2),
    care: careTexts.slice(0, 2),
    category_details: buildCategoryDetails({ category: String(category || "").toLowerCase(), texts }),
  };
};
