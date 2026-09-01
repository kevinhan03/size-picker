const TOTAL_LENGTH_LABEL = "\uCD1D\uC7A5";
const ITEM_LABEL = "\uD56D\uBAA9";
const SIZE_COLUMN_LABEL = "\uC0AC\uC774\uC988";
const MEASUREMENT_LABEL_HINT_PATTERN =
  /(?:\uCD1D\uC7A5|\uAE30\uC7A5|\uC5B4\uAE68|\uAC00\uC2B4|\uC18C\uB9E4|\uD5C8\uB9AC|\uC5C9\uB369|\uD5C8\uBC85|\uBC11\uC704|\uBC11\uB2E8|\uAE38\uC774|length|shoulder|chest|sleeve|waist|hip|thigh|rise|hem|inseam|pit|bust|body|width)/i;
const MEASUREMENT_ALIAS_MAP = {
  "\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  "\uC804\uCCB4\uAE38\uC774": TOTAL_LENGTH_LABEL,
  "\uC804\uCCB4\uC7A5": TOTAL_LENGTH_LABEL,
  "\uAE30\uC7A5": TOTAL_LENGTH_LABEL,
  "\uC0C1\uC758\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  "\uD558\uC758\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  "\uBC14\uC9C0\uCD1D\uC7A5": TOTAL_LENGTH_LABEL,
  "\uD558\uC758\uAE38\uC774": TOTAL_LENGTH_LABEL,
  "\uBC14\uC9C0\uAE38\uC774": TOTAL_LENGTH_LABEL,
  "\uD32C\uCE20\uAE38\uC774": TOTAL_LENGTH_LABEL,
  "\uCD1D\uAE30\uC7A5": TOTAL_LENGTH_LABEL,
  "\uCD1D\uAE38\uC774": TOTAL_LENGTH_LABEL,
  outseam: TOTAL_LENGTH_LABEL,
  leglength: TOTAL_LENGTH_LABEL,
  length: TOTAL_LENGTH_LABEL,
  total: TOTAL_LENGTH_LABEL,
  "\uC18C\uB9E4": "\uC18C\uB9E4",
  "\uC18C\uB9E4\uAE38\uC774": "\uC18C\uB9E4",
  "\uC18C\uB9E4\uAE30\uC7A5": "\uC18C\uB9E4",
  "\uC18C\uB9E4\uC7A5": "\uC18C\uB9E4",
  "\uD314\uAE38\uC774": "\uC18C\uB9E4",
  "\uD314\uC7A5": "\uC18C\uB9E4",
  sleevelength: "\uC18C\uB9E4",
  sleeve: "\uC18C\uB9E4",
  "\uC5B4\uAE68": "\uC5B4\uAE68",
  "\uC5B4\uAE68\uB108\uBE44": "\uC5B4\uAE68",
  "\uC5B4\uAE68\uB113\uC774": "\uC5B4\uAE68",
  "\uC5B4\uAE68\uD3ED": "\uC5B4\uAE68",
  "\uC5B4\uAE68\uB2E8\uBA74": "\uC5B4\uAE68",
  shoulderwidth: "\uC5B4\uAE68",
  shoulder: "\uC5B4\uAE68",
  "\uAC00\uC2B4": "\uAC00\uC2B4",
  "\uAC00\uC2B4\uB2E8\uBA74": "\uAC00\uC2B4",
  "\uAC00\uC2B4\uB108\uBE44": "\uAC00\uC2B4",
  "\uAC00\uC2B4\uD3ED": "\uAC00\uC2B4",
  "\uBAB8\uD1B5\uB2E8\uBA74": "\uAC00\uC2B4",
  "\uD488": "\uAC00\uC2B4",
  chestwidth: "\uAC00\uC2B4",
  body: "\uAC00\uC2B4",
  chest: "\uAC00\uC2B4",
  bust: "\uAC00\uC2B4",
  "\uD5C8\uB9AC": "\uD5C8\uB9AC",
  "\uD5C8\uB9AC\uB2E8\uBA74": "\uD5C8\uB9AC",
  "\uD5C8\uB9AC\uB108\uBE44": "\uD5C8\uB9AC",
  "\uD5C8\uB9AC\uD3ED": "\uD5C8\uB9AC",
  waistwidth: "\uD5C8\uB9AC",
  waist: "\uD5C8\uB9AC",
  "\uC5C9\uB369\uC774": "\uC5C9\uB369\uC774",
  "\uD799": "\uC5C9\uB369\uC774",
  "\uC5C9\uB369\uC774\uB2E8\uBA74": "\uC5C9\uB369\uC774",
  "\uD799\uB2E8\uBA74": "\uC5C9\uB369\uC774",
  "\uC5C9\uB369\uC774\uB108\uBE44": "\uC5C9\uB369\uC774",
  "\uD799\uB108\uBE44": "\uC5C9\uB369\uC774",
  hip: "\uC5C9\uB369\uC774",
  "\uD5C8\uBC85\uC9C0": "\uD5C8\uBC85\uC9C0",
  "\uD5C8\uBC85\uC9C0\uB2E8\uBA74": "\uD5C8\uBC85\uC9C0",
  "\uD5C8\uBC85\uC9C0\uB108\uBE44": "\uD5C8\uBC85\uC9C0",
  thigh: "\uD5C8\uBC85\uC9C0",
  "\uBC11\uC704": "\uBC11\uC704",
  "\uC55E\uBC11\uC704": "\uBC11\uC704",
  "\uBC11\uC704\uAE38\uC774": "\uBC11\uC704",
  frontrise: "\uBC11\uC704",
  backrise: "\uB4B7\uBC11\uC704",
  rearrise: "\uB4B7\uBC11\uC704",
  rise: "\uBC11\uC704",
  "\uBC11\uB2E8": "\uBC11\uB2E8",
  "\uBC11\uB2E8\uB2E8\uBA74": "\uBC11\uB2E8",
  "\uBC11\uB2E8\uB108\uBE44": "\uBC11\uB2E8",
  "\uBC11\uB2E8\uD3ED": "\uBC11\uB2E8",
  "\uD558\uB2E8\uB108\uBE44": "\uBC11\uB2E8",
  legopening: "\uBC11\uB2E8",
  hem: "\uBC11\uB2E8",
  "\uC778\uC2EC": "\uC778\uC2EC",
  "\uC548\uCABD\uB2E4\uB9AC\uAE38\uC774": "\uC778\uC2EC",
  "\uC548\uCABD\uD5C8\uBC85\uC9C0\uAE38\uC774": "\uC778\uC2EC",
  insideleg: "\uC778\uC2EC",
  inseam: "\uC778\uC2EC",
};
const TOTAL_LENGTH_ALIAS_KEYS = [
  "\uCD1D\uC7A5",
  "\uC804\uCCB4\uAE38\uC774",
  "\uC804\uCCB4\uC7A5",
  "\uAE30\uC7A5",
  "totallength",
  "length",
  "total",
];

export const normalizeCellText = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeMeasurementValueForDisplay = (value) =>
  normalizeCellText(value).replace(
    /(-?\d+(?:\.\d+)?)\s*(?:cm\b|㎝|센치|센티미터)/gi,
    "$1"
  );

const normalizeAliasKey = (value) =>
  normalizeCellText(value)
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9a-z\u3131-\uD79D]/g, "");

const isTotalLengthAliasKey = (aliasKey) =>
  Boolean(aliasKey) &&
  TOTAL_LENGTH_ALIAS_KEYS.some(
    (key) => aliasKey === key || aliasKey.includes(key)
  );

const isCircumferenceAliasKey = (aliasKey) =>
  /(?:\uB458\uB808|circumference|girth)/.test(aliasKey);

const inferMeasurementLabelFromAliasKey = (aliasKey) => {
  if (!aliasKey) return "";
  if (
    aliasKey.includes("outseam") ||
    aliasKey.includes("\uBC14\uC9C0\uCD1D\uC7A5") ||
    aliasKey.includes("\uCD1D\uAE38\uC774")
  )
    return TOTAL_LENGTH_LABEL;
  if (aliasKey.includes("shoulder") || aliasKey.includes("\uC5B4\uAE68"))
    return "\uC5B4\uAE68";
  if (
    aliasKey.includes("chest") ||
    aliasKey.includes("bust") ||
    aliasKey.includes("bodywidth") ||
    aliasKey.includes("pit") ||
    aliasKey.includes("\uAC00\uC2B4") ||
    aliasKey.includes("\uD488")
  ) {
    return "\uAC00\uC2B4";
  }
  if (
    aliasKey.includes("sleeve") ||
    aliasKey.includes("arm") ||
    aliasKey.includes("\uC18C\uB9E4")
  )
    return "\uC18C\uB9E4";
  if (aliasKey.includes("waist") || aliasKey.includes("\uD5C8\uB9AC"))
    return "\uD5C8\uB9AC";
  if (
    aliasKey.includes("hip") ||
    aliasKey.includes("\uC5C9\uB369\uC774") ||
    aliasKey.includes("\uD799")
  )
    return "\uC5C9\uB369\uC774";
  if (aliasKey.includes("thigh") || aliasKey.includes("\uD5C8\uBC85\uC9C0"))
    return "\uD5C8\uBC85\uC9C0";
  if (aliasKey.includes("\uB4B7\uBC11\uC704")) return "\uB4B7\uBC11\uC704";
  if (
    aliasKey.includes("rise") ||
    aliasKey.includes("\uBC11\uC704") ||
    aliasKey.includes("\uC55E\uBC11\uC704")
  )
    return "\uBC11\uC704";
  if (
    aliasKey.includes("hem") ||
    aliasKey.includes("cuff") ||
    aliasKey.includes("\uBC11\uB2E8")
  )
    return "\uBC11\uB2E8";
  if (aliasKey.includes("inseam") || aliasKey.includes("\uC778\uC2EC"))
    return "\uC778\uC2EC";
  return "";
};

const MEASUREMENT_LABEL_EN = {
  [TOTAL_LENGTH_LABEL]: "Total length",
  [ITEM_LABEL]: "Item",
  [SIZE_COLUMN_LABEL]: "Size",
  어깨: "Shoulder",
  가슴: "Chest",
  소매: "Sleeve",
  허리: "Waist",
  엉덩이: "Hip",
  힙: "Hip",
  허벅지: "Thigh",
  뒷밑위: "Back rise",
  밑위: "Rise",
  밑단: "Hem",
  인심: "Inseam",
};

/**
 * Translates a canonical (Korean) measurement label for display only.
 * The canonical Korean value from normalizeMeasurementLabel stays the
 * matching key everywhere else (snapshots, comparisons, recommendations).
 */
export const translateMeasurementLabel = (label, isEnglish) => {
  if (!isEnglish) return label;
  return MEASUREMENT_LABEL_EN[label] || label;
};

export const normalizeMeasurementLabel = (value) => {
  const raw = normalizeCellText(value);
  if (!raw) return "";
  const sanitizedRaw = raw.replace(/^(?:cm|mm|in(?:ch)?)\s+/i, "");
  const aliasKey = normalizeAliasKey(sanitizedRaw);
  // 둘레는 단면이 아니다. 임의로 반으로 계산하지 않고 extra에 보존한다.
  if (isCircumferenceAliasKey(aliasKey)) return sanitizedRaw;
  const mapped = MEASUREMENT_ALIAS_MAP[aliasKey];
  if (mapped) return mapped === "\uD799" ? "\uC5C9\uB369\uC774" : mapped;
  const inferred = inferMeasurementLabelFromAliasKey(aliasKey);
  if (inferred) return inferred;
  if (isTotalLengthAliasKey(aliasKey)) return TOTAL_LENGTH_LABEL;
  return sanitizedRaw;
};

const BOTTOM_STANDARD_HEADERS = [
  SIZE_COLUMN_LABEL,
  TOTAL_LENGTH_LABEL,
  "\uD5C8\uB9AC\uB2E8\uBA74",
  "\uC5C9\uB369\uC774\uB2E8\uBA74",
  "\uD5C8\uBC85\uC9C0\uB2E8\uBA74",
  "\uBC11\uC704",
  "\uBC11\uB2E8\uB2E8\uBA74",
];
const TOP_LIKE_STANDARD_HEADERS = [
  SIZE_COLUMN_LABEL,
  TOTAL_LENGTH_LABEL,
  "어깨너비",
  "가슴단면",
  "소매길이",
];
const SKIRT_STANDARD_HEADERS = [
  SIZE_COLUMN_LABEL,
  TOTAL_LENGTH_LABEL,
  "허리단면",
  "밑단단면",
];

const normalizeDisplayCategory = (category) =>
  normalizeCellText(category).toLowerCase();

export const isBottomCategory = (category) =>
  normalizeDisplayCategory(category) === "bottom";
export const isSizeTableNormalizationCategory = (category) =>
  ["top", "outer", "bottom", "dressskirt"].includes(
    normalizeDisplayCategory(category)
  );

export const isBottomDisplaySizeTable = (table) => {
  const normalized = parseSizeTable(table);
  if (!normalized?.headers?.length) return false;
  return (
    normalized.headers.length === BOTTOM_STANDARD_HEADERS.length &&
    BOTTOM_STANDARD_HEADERS.every(
      (header, index) => normalized.headers[index] === header
    )
  );
};

export const normalizeBottomSizeTableForDisplay = (table) => {
  const normalized = parseSizeTable(table);
  if (!normalized?.rows?.length) return normalized;

  const sourceHeaders = normalized.headers.map((header, index) => {
    if (index === 0) return SIZE_COLUMN_LABEL;
    const normalizedHeader = normalizeCellText(header);
    if (
      normalizedHeader === "\uD5C8\uB9AC" ||
      normalizedHeader === "\uD5C8\uB9AC\uB2E8\uBA74"
    )
      return "\uD5C8\uB9AC\uB2E8\uBA74";
    if (
      normalizedHeader === "\uD799" ||
      normalizedHeader === "\uC5C9\uB369\uC774" ||
      normalizedHeader === "\uC5C9\uB369\uC774\uB2E8\uBA74"
    )
      return "\uC5C9\uB369\uC774\uB2E8\uBA74";
    if (
      normalizedHeader === "\uD5C8\uBC85\uC9C0" ||
      normalizedHeader === "\uD5C8\uBC85\uC9C0\uB2E8\uBA74"
    )
      return "\uD5C8\uBC85\uC9C0\uB2E8\uBA74";
    if (
      normalizedHeader === "\uBC11\uB2E8" ||
      normalizedHeader === "\uBC11\uB2E8\uB2E8\uBA74"
    )
      return "\uBC11\uB2E8\uB2E8\uBA74";
    return normalizedHeader;
  });
  const firstIndexByLabel = new Map();
  sourceHeaders.forEach((header, index) => {
    if (index === 0 || !header || firstIndexByLabel.has(header)) return;
    if (!BOTTOM_STANDARD_HEADERS.includes(header)) return;
    firstIndexByLabel.set(header, index);
  });
  const extraIndexes = sourceHeaders
    .map((header, index) => ({ header, index }))
    .filter(
      ({ header, index }) =>
        index > 0 && header && !BOTTOM_STANDARD_HEADERS.includes(header)
    );

  const displayTable = {
    headers: [...BOTTOM_STANDARD_HEADERS],
    rows: normalized.rows.map((row) => [
      normalizeMeasurementValueForDisplay(row?.[0]),
      ...BOTTOM_STANDARD_HEADERS.slice(1).map((header) => {
        const sourceIndex = firstIndexByLabel.get(header);
        return sourceIndex === undefined
          ? ""
          : normalizeMeasurementValueForDisplay(row?.[sourceIndex]);
      }),
    ]),
  };

  if (extraIndexes.length > 0) {
    displayTable.extra = {
      headers: [SIZE_COLUMN_LABEL, ...extraIndexes.map(({ header }) => header)],
      rows: normalized.rows.map((row) => [
        normalizeMeasurementValueForDisplay(row?.[0]),
        ...extraIndexes.map(({ index }) =>
          normalizeMeasurementValueForDisplay(row?.[index])
        ),
      ]),
    };
  }

  return displayTable;
};

const normalizeTopLikeHeader = (header) => {
  const label = normalizeMeasurementLabel(header);
  if (label === "어깨") return "어깨너비";
  if (label === "가슴") return "가슴단면";
  if (label === "소매") return "소매길이";
  return label;
};

const normalizeSkirtHeader = (header) => {
  const label = normalizeMeasurementLabel(header);
  if (label === "허리") return "허리단면";
  if (label === "밑단") return "밑단단면";
  return label;
};

const normalizeToStandardHeaders = (
  table,
  standardHeaders,
  normalizeHeader
) => {
  const normalized = parseSizeTable(table);
  if (!normalized?.rows?.length) return normalized;
  const sourceHeaders = normalized.headers.map((header, index) =>
    index === 0 ? SIZE_COLUMN_LABEL : normalizeHeader(header)
  );
  const firstIndexByHeader = new Map();
  sourceHeaders.forEach((header, index) => {
    if (
      index > 0 &&
      header &&
      standardHeaders.includes(header) &&
      !firstIndexByHeader.has(header)
    ) {
      firstIndexByHeader.set(header, index);
    }
  });
  const extraIndexes = sourceHeaders
    .map((header, index) => ({ header, index }))
    .filter(
      ({ header, index }) =>
        index > 0 && header && !standardHeaders.includes(header)
    );
  const result = {
    headers: [...standardHeaders],
    rows: normalized.rows.map((row) => [
      normalizeMeasurementValueForDisplay(row?.[0]),
      ...standardHeaders.slice(1).map((header) => {
        const sourceIndex = firstIndexByHeader.get(header);
        return sourceIndex === undefined
          ? ""
          : normalizeMeasurementValueForDisplay(row?.[sourceIndex]);
      }),
    ]),
  };
  if (extraIndexes.length > 0) {
    result.extra = {
      headers: [SIZE_COLUMN_LABEL, ...extraIndexes.map(({ header }) => header)],
      rows: normalized.rows.map((row) => [
        normalizeMeasurementValueForDisplay(row?.[0]),
        ...extraIndexes.map(({ index }) =>
          normalizeMeasurementValueForDisplay(row?.[index])
        ),
      ]),
    };
  }
  return result;
};

const isDressLikeTable = (table) => {
  const normalized = parseSizeTable(table);
  return Boolean(
    normalized?.headers
      .slice(1)
      .some((header) =>
        ["어깨", "가슴", "소매"].includes(normalizeMeasurementLabel(header))
      )
  );
};

const isSkirtLikeTable = (table) => {
  const normalized = parseSizeTable(table);
  return Boolean(
    normalized?.headers
      .slice(1)
      .some((header) =>
        ["허리", "밑단"].includes(normalizeMeasurementLabel(header))
      )
  );
};

export const normalizeSizeTableForCategory = (category, table) => {
  const normalizedCategory = normalizeDisplayCategory(category);
  if (normalizedCategory === "bottom")
    return normalizeBottomSizeTableForDisplay(table);
  if (normalizedCategory === "top" || normalizedCategory === "outer") {
    return normalizeToStandardHeaders(
      table,
      TOP_LIKE_STANDARD_HEADERS,
      normalizeTopLikeHeader
    );
  }
  if (normalizedCategory === "dressskirt") {
    if (isDressLikeTable(table))
      return normalizeToStandardHeaders(
        table,
        TOP_LIKE_STANDARD_HEADERS,
        normalizeTopLikeHeader
      );
    if (isSkirtLikeTable(table))
      return normalizeToStandardHeaders(
        table,
        SKIRT_STANDARD_HEADERS,
        normalizeSkirtHeader
      );
    return null;
  }
  return parseSizeTable(table);
};

const isStandardTable = (table, standardHeaders) => {
  const normalized = parseSizeTable(table);
  return Boolean(
    normalized &&
    normalized.headers.length === standardHeaders.length &&
    standardHeaders.every(
      (header, index) => normalized.headers[index] === header
    )
  );
};

export const getDisplaySizeTable = (product) => {
  if (!product || typeof product !== "object") return null;
  const normalized = parseSizeTable(product.normalizedSizeTable ?? null);
  if (isSizeTableNormalizationCategory(product.category)) {
    const validNormalized =
      isBottomDisplaySizeTable(normalized) ||
      isStandardTable(normalized, TOP_LIKE_STANDARD_HEADERS) ||
      isStandardTable(normalized, SKIRT_STANDARD_HEADERS);
    if (validNormalized) return normalized;
    return normalizeSizeTableForCategory(
      product.category,
      product.sizeTable || normalized || null
    );
  }
  return normalized || parseSizeTable(product.sizeTable);
};

export const normalizeSizeLabel = (value) =>
  normalizeCellText(value).toUpperCase();

export const normalizeComparableSizeLabel = (value) => {
  const text = normalizeSizeLabel(value);
  if (!text) return "";

  const alphaWithNumericMatch = text.match(
    /^(XXS|XS|S|M|L|XL|XXL|XXXL)\s*\(\s*\d{1,3}\s*\)$/i
  );
  if (alphaWithNumericMatch) return alphaWithNumericMatch[1].toUpperCase();

  const alphaWithDescriptorMatch = text.match(
    /^(XXS|XS|S|M|L|XL|XXL|XXXL)\s*\([^)]{1,30}\)$/i
  );
  if (alphaWithDescriptorMatch)
    return alphaWithDescriptorMatch[1].toUpperCase();

  const numericWithAlphaMatch = text.match(
    /^\d{1,3}\s*\(\s*(XXS|XS|S|M|L|XL|XXL|XXXL)\s*\)$/i
  );
  if (numericWithAlphaMatch) return numericWithAlphaMatch[1].toUpperCase();

  const alphaWithSizeSuffixMatch = text.match(
    /^(XXS|XS|S|M|L|XL|XXL|XXXL)\s*SIZE$/i
  );
  if (alphaWithSizeSuffixMatch)
    return alphaWithSizeSuffixMatch[1].toUpperCase();

  return text;
};

export const isLikelySizeLabel = (value) => {
  const text = normalizeSizeLabel(value);
  if (!text) return false;
  if (/^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE)$/i.test(text)) return true;
  if (/^(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*\(\s*\d{1,3}\s*\)$/i.test(text))
    return true;
  if (/^(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*\([^)]{1,30}\)$/i.test(text))
    return true;
  if (/^\d{1,3}\s*\(\s*(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*\)$/i.test(text))
    return true;
  if (/^\d{1,3}\s*\(\s*\d{1,3}\s*~\s*\d{1,3}\s*\)$/.test(text)) return true;
  if (/^\d{1,3}\s*\([^)]{1,30}\)$/.test(text)) return true;
  if (/^(EU|US|UK|JP|KR)\s*\d{1,3}(?:\.\d+)?$/.test(text)) return true;
  if (/^(?:W|L)?\d{2,3}(?:\s*\/\s*(?:W|L)?\d{2,3})$/.test(text)) return true;
  if (/^(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*[-/()]?\s*\d{2,3}$/.test(text))
    return true;
  if (/^\d{2,3}\s*[-/()]?\s*(?:XXS|XS|S|M|L|XL|XXL|XXXL)$/.test(text))
    return true;
  if (/^-?\d{1,4}(?:\.\d+)?$/.test(text)) {
    const numeric = Number(text);
    return Number.isFinite(numeric) && numeric >= 0 && numeric <= 400;
  }
  return false;
};

export const isLikelyMeasurementLabel = (value) => {
  const normalized = normalizeMeasurementLabel(value);
  return (
    Boolean(normalized) &&
    Object.values(MEASUREMENT_ALIAS_MAP).includes(normalized)
  );
};

export const isLikelyMeasurementLabelLoose = (value) => {
  const normalized = normalizeMeasurementLabel(value);
  if (
    Boolean(normalized) &&
    Object.values(MEASUREMENT_ALIAS_MAP).includes(normalized)
  )
    return true;
  return MEASUREMENT_LABEL_HINT_PATTERN.test(normalizeCellText(value));
};

const makeRectangularRows = (rows, width) =>
  rows.map((row) => {
    const normalized = Array.isArray(row)
      ? row.map((cell) => normalizeCellText(cell))
      : [];
    return [
      ...normalized,
      ...new Array(Math.max(width - normalized.length, 0)).fill(""),
    ].slice(0, width);
  });

export const transposeTable = ({ headers, rows }) => {
  const width = Math.max(headers.length, ...rows.map((row) => row.length), 0);
  const fullHeaders = [
    ...headers,
    ...new Array(Math.max(width - headers.length, 0)).fill(""),
  ];
  const fullRows = makeRectangularRows(rows, width);
  const matrix = [fullHeaders, ...fullRows];
  if (matrix.length === 0 || width === 0) return { headers: [], rows: [] };
  const transposed = Array.from({ length: width }, (_, colIdx) =>
    matrix.map((row) => normalizeCellText(row[colIdx]))
  );
  return { headers: transposed[0] || [], rows: transposed.slice(1) };
};

const standardizeSizeTable = (value) => {
  if (!value || typeof value !== "object") return null;
  const parsed = value;
  const headers = Array.isArray(parsed.headers)
    ? parsed.headers.map((header) => normalizeCellText(header))
    : [];
  const rows = Array.isArray(parsed.rows)
    ? parsed.rows.map((row) =>
        Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : []
      )
    : [];
  const extra =
    parsed.extra && typeof parsed.extra === "object" ? parsed.extra : null;
  const extraHeaders = Array.isArray(extra?.headers)
    ? extra.headers.map((header) => normalizeCellText(header))
    : [];
  const extraRows = Array.isArray(extra?.rows)
    ? extra.rows.map((row) =>
        Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : []
      )
    : [];
  if (headers.length === 0 && rows.length === 0) return null;

  const width = Math.max(headers.length, ...rows.map((row) => row.length), 0);
  if (width === 0) return null;

  const normalizedHeaders = [
    ...headers,
    ...new Array(width - headers.length).fill(""),
  ].slice(0, width);
  normalizedHeaders[0] = SIZE_COLUMN_LABEL;
  for (let idx = 1; idx < normalizedHeaders.length; idx += 1) {
    normalizedHeaders[idx] = normalizeMeasurementLabel(normalizedHeaders[idx]);
  }

  const normalizedRows = makeRectangularRows(rows, width).map((row) => {
    const nextRow = [...row];
    nextRow[0] = normalizeSizeLabel(nextRow[0]);
    return nextRow;
  });

  const result = {
    headers: normalizedHeaders,
    rows: normalizedRows,
  };
  if (extraHeaders.length > 0 && extraRows.length > 0) {
    const extraWidth = Math.max(
      extraHeaders.length,
      ...extraRows.map((row) => row.length),
      0
    );
    result.extra = {
      headers: [
        ...extraHeaders,
        ...new Array(Math.max(extraWidth - extraHeaders.length, 0)).fill(""),
      ].slice(0, extraWidth),
      rows: makeRectangularRows(extraRows, extraWidth),
    };
  }
  return result;
};

export const parseSizeTable = (value) => {
  if (!value) return null;

  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object") return null;
  return standardizeSizeTable(parsed);
};

export { ITEM_LABEL, standardizeSizeTable };
