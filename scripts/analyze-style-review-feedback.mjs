import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const STYLE_TAGS = [
  "casual",
  "minimal",
  "street",
  "classic",
  "vintage",
  "lovely_romantic",
  "sporty",
  "workwear_gorpcore",
  "chic_modern",
  "glam_sexy",
];

const LEGACY_STYLE_TAG_MAP = {
  "캐주얼": "casual",
  "미니멀": "minimal",
  "스트릿": "street",
  "클래식": "classic",
  "빈티지": "vintage",
  "레트로": "vintage",
  "로맨틱": "lovely_romantic",
  "스포티": "sporty",
  "워크웨어": "workwear_gorpcore",
};

const STOPWORDS = new Set([
  "그리고",
  "하지만",
  "그래서",
  "때문",
  "상품",
  "태그",
  "점수",
  "수정",
  "느낌",
  "정도",
  "기준",
  "너무",
  "조금",
  "높음",
  "낮음",
  "높게",
  "낮게",
  "있음",
  "없음",
]);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    category: "Bottom",
    threshold: 0.15,
    examples: 12,
    notes: 20,
    json: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--all-categories") {
      options.category = "";
    } else if (arg === "--category") {
      options.category = String(args[index + 1] || "").trim();
      index += 1;
    } else if (arg === "--threshold") {
      options.threshold = Number(args[index + 1] || options.threshold);
      index += 1;
    } else if (arg === "--examples") {
      options.examples = Number(args[index + 1] || options.examples);
      index += 1;
    } else if (arg === "--notes") {
      options.notes = Number(args[index + 1] || options.notes);
      index += 1;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  options.threshold = Number.isFinite(options.threshold) ? Math.max(0, options.threshold) : 0.15;
  options.examples = Number.isFinite(options.examples) ? Math.max(0, Math.floor(options.examples)) : 12;
  options.notes = Number.isFinite(options.notes) ? Math.max(0, Math.floor(options.notes)) : 20;
  return options;
};

const printHelp = () => {
  console.log(`
Usage:
  node scripts/analyze-style-review-feedback.mjs
  node scripts/analyze-style-review-feedback.mjs --category Bottom
  node scripts/analyze-style-review-feedback.mjs --all-categories
  node scripts/analyze-style-review-feedback.mjs --threshold 0.2 --examples 20

Reads approved/edited human style tag reviews and compares AI scores with human scores.
`);
};

const loadEnvFile = (filePath) => {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
  }
};

const loadEnv = () => {
  loadEnvFile(resolve(process.cwd(), ".env.local"));
  loadEnvFile(resolve(process.cwd(), ".env"));

  const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const productsTable = String(process.env.SUPABASE_PRODUCTS_TABLE || "products").trim() || "products";

  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    throw new Error(`Missing required env value(s): ${missing.join(", ")}`);
  }

  return { supabaseUrl, serviceRoleKey, productsTable };
};

const emptyTags = () => Object.fromEntries(STYLE_TAGS.map((tag) => [tag, 0]));

const normalizeTags = (value) => {
  const output = emptyTags();
  if (!value || typeof value !== "object" || Array.isArray(value)) return output;
  for (const [rawKey, rawScore] of Object.entries(value)) {
    const tag = STYLE_TAGS.includes(rawKey) ? rawKey : LEGACY_STYLE_TAG_MAP[rawKey];
    if (!tag) continue;
    const score = Number(rawScore);
    if (Number.isFinite(score)) output[tag] = Math.max(output[tag], Math.min(1, Math.max(0, score)));
  }
  return output;
};

const fetchReviewedProducts = async (client, table, category) => {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let query = client
      .from(table)
      .select(
        "id,brand,name,category,style_tags,style_attributes,human_style_tags,human_style_attributes,tag_review_status,tag_review_note,reviewed_at"
      )
      .in("tag_review_status", ["approved", "edited"])
      .not("human_style_tags", "is", null)
      .order("reviewed_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    rows.push(...(Array.isArray(data) ? data : []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
};

const topTagsText = (tags, limit = 3) =>
  STYLE_TAGS
    .map((tag) => ({ tag, score: tags[tag] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ tag, score }) => `${tag} ${score.toFixed(2)}`)
    .join(", ");

const tokenizeNotes = (rows) => {
  const counts = new Map();
  for (const row of rows) {
    const note = String(row.tag_review_note || "").toLowerCase();
    for (const token of note.match(/[a-z0-9_가-힣]{2,}/g) || []) {
      if (STOPWORDS.has(token)) continue;
      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([token, count]) => ({ token, count }))
    .sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));
};

const analyzeRows = (rows, threshold) => {
  const tagStats = Object.fromEntries(
    STYLE_TAGS.map((tag) => [
      tag,
      {
        tag,
        count: 0,
        aiTotal: 0,
        humanTotal: 0,
        absDeltaTotal: 0,
        deltaTotal: 0,
        overCount: 0,
        underCount: 0,
      },
    ])
  );

  const examples = [];

  for (const row of rows) {
    const ai = normalizeTags(row.style_tags);
    const human = normalizeTags(row.human_style_tags);
    let maxChange = { tag: STYLE_TAGS[0], delta: 0, absDelta: 0, ai: ai[STYLE_TAGS[0]] || 0, human: human[STYLE_TAGS[0]] || 0 };

    for (const tag of STYLE_TAGS) {
      const aiScore = ai[tag] || 0;
      const humanScore = human[tag] || 0;
      const delta = humanScore - aiScore;
      const absDelta = Math.abs(delta);
      const stats = tagStats[tag];
      stats.count += 1;
      stats.aiTotal += aiScore;
      stats.humanTotal += humanScore;
      stats.absDeltaTotal += absDelta;
      stats.deltaTotal += delta;
      if (delta <= -threshold) stats.overCount += 1;
      if (delta >= threshold) stats.underCount += 1;
      if (absDelta > maxChange.absDelta) {
        maxChange = { tag, delta, absDelta, ai: aiScore, human: humanScore };
      }
    }

    examples.push({
      id: row.id,
      brand: row.brand || "",
      name: row.name || "",
      category: row.category || "",
      status: row.tag_review_status || "",
      reviewedAt: row.reviewed_at || "",
      note: row.tag_review_note || "",
      maxChange,
      aiTop: topTagsText(ai),
      humanTop: topTagsText(human),
    });
  }

  const tags = Object.values(tagStats)
    .map((stats) => ({
      tag: stats.tag,
      count: stats.count,
      aiAvg: stats.count ? stats.aiTotal / stats.count : 0,
      humanAvg: stats.count ? stats.humanTotal / stats.count : 0,
      bias: stats.count ? stats.deltaTotal / stats.count : 0,
      mae: stats.count ? stats.absDeltaTotal / stats.count : 0,
      overCount: stats.overCount,
      underCount: stats.underCount,
    }))
    .sort((a, b) => b.mae - a.mae || Math.abs(b.bias) - Math.abs(a.bias));

  examples.sort((a, b) => b.maxChange.absDelta - a.maxChange.absDelta);

  return {
    reviewedCount: rows.length,
    changedCount: examples.filter((example) => example.maxChange.absDelta > 0.001).length,
    tags,
    examples,
    noteKeywords: tokenizeNotes(rows),
  };
};

const printReport = (analysis, options) => {
  console.log("Style review feedback analysis");
  console.log("--------------------------------");
  console.log(`category: ${options.category || "all"}`);
  console.log(`reviewed products: ${analysis.reviewedCount}`);
  console.log(`products with score changes: ${analysis.changedCount}`);
  console.log(`change threshold: ${options.threshold.toFixed(2)}`);

  console.log("\nTag score drift (human - AI)");
  for (const stats of analysis.tags) {
    console.log(
      [
        `${stats.tag.padEnd(18)}`,
        `ai_avg=${stats.aiAvg.toFixed(2)}`,
        `human_avg=${stats.humanAvg.toFixed(2)}`,
        `bias=${stats.bias >= 0 ? "+" : ""}${stats.bias.toFixed(2)}`,
        `mae=${stats.mae.toFixed(2)}`,
        `AI_over=${stats.overCount}`,
        `AI_under=${stats.underCount}`,
      ].join("  ")
    );
  }

  console.log("\nLargest product-level changes");
  const changedExamples = analysis.examples.filter((item) => item.maxChange.absDelta > 0.001);
  if (!changedExamples.length) {
    console.log("none");
  }
  for (const item of changedExamples.slice(0, options.examples)) {
    const direction = item.maxChange.delta >= 0 ? "human higher" : "human lower";
    console.log(
      `- #${item.id} ${item.brand} / ${item.name} | ${item.maxChange.tag}: ${item.maxChange.ai.toFixed(2)} -> ${item.maxChange.human.toFixed(2)} (${direction})`
    );
    console.log(`  AI top: ${item.aiTop}`);
    console.log(`  Human top: ${item.humanTop}`);
    if (item.note) console.log(`  Note: ${item.note}`);
  }

  if (options.notes > 0) {
    console.log("\nFrequent review-note keywords");
    const keywords = analysis.noteKeywords.slice(0, options.notes);
    console.log(keywords.length ? keywords.map(({ token, count }) => `${token}(${count})`).join(", ") : "none");
  }
};

const main = async () => {
  const options = parseArgs();
  const env = loadEnv();
  const client = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false },
  });

  const rows = await fetchReviewedProducts(client, env.productsTable, options.category);
  const analysis = analyzeRows(rows, options.threshold);

  if (options.json) {
    console.log(JSON.stringify({ options, analysis }, null, 2));
  } else {
    printReport(analysis, options);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
