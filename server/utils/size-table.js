const TOTAL_LENGTH_LABEL = "\uCD1D\uC7A5";
const ITEM_LABEL = "\uD56D\uBAA9";
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
  "length": TOTAL_LENGTH_LABEL,
  "total": TOTAL_LENGTH_LABEL,
  "\uC18C\uB9E4": "\uC18C\uB9E4",
  "\uC18C\uB9E4\uAE38\uC774": "\uC18C\uB9E4",
  "\uC18C\uB9E4\uAE30\uC7A5": "\uC18C\uB9E4",
  "\uD654\uC7A5": "\uC18C\uB9E4",
  "sleeve": "\uC18C\uB9E4",
  "\uC5B4\uAE68": "\uC5B4\uAE68",
  "\uC5B4\uAE68\uB108\uBE44": "\uC5B4\uAE68",
  "\uC5B4\uAE68\uB113\uC774": "\uC5B4\uAE68",
  "shoulder": "\uC5B4\uAE68",
  "\uAC00\uC2B4": "\uAC00\uC2B4",
  "\uAC00\uC2B4\uB2E8\uBA74": "\uAC00\uC2B4",
  "\uD488": "\uAC00\uC2B4",
  "chest": "\uAC00\uC2B4",
  "bust": "\uAC00\uC2B4",
  "\uD5C8\uB9AC": "\uD5C8\uB9AC",
  "\uD5C8\uB9AC\uB2E8\uBA74": "\uD5C8\uB9AC",
  "waist": "\uD5C8\uB9AC",
  "\uC5C9\uB369\uC774": "\uC5C9\uB369\uC774",
  "\uD799": "\uC5C9\uB369\uC774",
  "hip": "\uC5C9\uB369\uC774",
  "\uD5C8\uBC85\uC9C0": "\uD5C8\uBC85\uC9C0",
  "\uD5C8\uBC85\uC9C0\uB2E8\uBA74": "\uD5C8\uBC85\uC9C0",
  "thigh": "\uD5C8\uBC85\uC9C0",
  "\uBC11\uC704": "\uBC11\uC704",
  "rise": "\uBC11\uC704",
  "\uBC11\uB2E8": "\uBC11\uB2E8",
  "\uBC11\uB2E8\uB2E8\uBA74": "\uBC11\uB2E8",
  "hem": "\uBC11\uB2E8",
  "\uC778\uC2EC": "\uC778\uC2EC",
  "inseam": "\uC778\uC2EC",
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

export const normalizeCellText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeAliasKey = (value) =>
  normalizeCellText(value)
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^0-9a-z\u3131-\uD79D]/g, "");

const isTotalLengthAliasKey = (aliasKey) =>
  Boolean(aliasKey) &&
  TOTAL_LENGTH_ALIAS_KEYS.some((key) => aliasKey === key || aliasKey.includes(key));

const inferMeasurementLabelFromAliasKey = (aliasKey) => {
  if (!aliasKey) return "";
  if (aliasKey.includes("shoulder") || aliasKey.includes("\uC5B4\uAE68")) return "\uC5B4\uAE68";
  if (aliasKey.includes("chest") || aliasKey.includes("bust") || aliasKey.includes("bodywidth") || aliasKey.includes("pit") || aliasKey.includes("\uAC00\uC2B4") || aliasKey.includes("\uD488")) {
    return "\uAC00\uC2B4";
  }
  if (aliasKey.includes("sleeve") || aliasKey.includes("arm") || aliasKey.includes("\uC18C\uB9E4") || aliasKey.includes("\uD654\uC7A5")) return "\uC18C\uB9E4";
  if (aliasKey.includes("waist") || aliasKey.includes("\uD5C8\uB9AC")) return "\uD5C8\uB9AC";
  if (aliasKey.includes("hip") || aliasKey.includes("\uC5C9\uB369\uC774") || aliasKey.includes("\uD799")) return "\uC5C9\uB369\uC774";
  if (aliasKey.includes("thigh") || aliasKey.includes("\uD5C8\uBC85\uC9C0")) return "\uD5C8\uBC85\uC9C0";
  if (aliasKey.includes("rise") || aliasKey.includes("\uBC11\uC704")) return "\uBC11\uC704";
  if (aliasKey.includes("hem") || aliasKey.includes("\uBC11\uB2E8")) return "\uBC11\uB2E8";
  if (aliasKey.includes("inseam") || aliasKey.includes("\uC778\uC2EC")) return "\uC778\uC2EC";
  return "";
};

export const normalizeMeasurementLabel = (value) => {
  const raw = normalizeCellText(value);
  if (!raw) return "";
  const sanitizedRaw = raw.replace(/^(?:cm|mm|in(?:ch)?)\s+/i, "");
  const aliasKey = normalizeAliasKey(sanitizedRaw);
  if (MEASUREMENT_ALIAS_MAP[aliasKey]) return MEASUREMENT_ALIAS_MAP[aliasKey];
  const inferred = inferMeasurementLabelFromAliasKey(aliasKey);
  if (inferred) return inferred;
  if (isTotalLengthAliasKey(aliasKey)) return TOTAL_LENGTH_LABEL;
  return sanitizedRaw;
};

export const normalizeSizeLabel = (value) => normalizeCellText(value).toUpperCase();

export const normalizeComparableSizeLabel = (value) => {
  const text = normalizeSizeLabel(value);
  if (!text) return "";

  const alphaWithNumericMatch = text.match(/^(XXS|XS|S|M|L|XL|XXL|XXXL)\s*\(\s*\d{1,3}\s*\)$/i);
  if (alphaWithNumericMatch) return alphaWithNumericMatch[1].toUpperCase();

  const alphaWithDescriptorMatch = text.match(/^(XXS|XS|S|M|L|XL|XXL|XXXL)\s*\([^)]{1,30}\)$/i);
  if (alphaWithDescriptorMatch) return alphaWithDescriptorMatch[1].toUpperCase();

  const numericWithAlphaMatch = text.match(/^\d{1,3}\s*\(\s*(XXS|XS|S|M|L|XL|XXL|XXXL)\s*\)$/i);
  if (numericWithAlphaMatch) return numericWithAlphaMatch[1].toUpperCase();

  const alphaWithSizeSuffixMatch = text.match(/^(XXS|XS|S|M|L|XL|XXL|XXXL)\s*SIZE$/i);
  if (alphaWithSizeSuffixMatch) return alphaWithSizeSuffixMatch[1].toUpperCase();

  return text;
};

export const isLikelySizeLabel = (value) => {
  const text = normalizeSizeLabel(value);
  if (!text) return false;
  if (/^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE)$/i.test(text)) return true;
  if (/^(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*\(\s*\d{1,3}\s*\)$/i.test(text)) return true;
  if (/^(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*\([^)]{1,30}\)$/i.test(text)) return true;
  if (/^\d{1,3}\s*\(\s*(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*\)$/i.test(text)) return true;
  if (/^\d{1,3}\s*\(\s*\d{1,3}\s*~\s*\d{1,3}\s*\)$/.test(text)) return true;
  if (/^\d{1,3}\s*\([^)]{1,30}\)$/.test(text)) return true;
  if (/^(EU|US|UK|JP|KR)\s*\d{1,3}(?:\.\d+)?$/.test(text)) return true;
  if (/^(?:W|L)?\d{2,3}(?:\s*\/\s*(?:W|L)?\d{2,3})$/.test(text)) return true;
  if (/^(?:XXS|XS|S|M|L|XL|XXL|XXXL)\s*[-/()]?\s*\d{2,3}$/.test(text)) return true;
  if (/^\d{2,3}\s*[-/()]?\s*(?:XXS|XS|S|M|L|XL|XXL|XXXL)$/.test(text)) return true;
  if (/^-?\d{1,4}(?:\.\d+)?$/.test(text)) {
    const numeric = Number(text);
    return Number.isFinite(numeric) && numeric >= 0 && numeric <= 400;
  }
  return false;
};

export const isLikelyMeasurementLabel = (value) => {
  const normalized = normalizeMeasurementLabel(value);
  return Boolean(normalized) && Object.values(MEASUREMENT_ALIAS_MAP).includes(normalized);
};

export const isLikelyMeasurementLabelLoose = (value) => {
  const normalized = normalizeMeasurementLabel(value);
  if (Boolean(normalized) && Object.values(MEASUREMENT_ALIAS_MAP).includes(normalized)) return true;
  return MEASUREMENT_LABEL_HINT_PATTERN.test(normalizeCellText(value));
};

const makeRectangularRows = (rows, width) =>
  rows.map((row) => {
    const normalized = Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : [];
    return [...normalized, ...new Array(Math.max(width - normalized.length, 0)).fill("")].slice(0, width);
  });

export const transposeTable = ({ headers, rows }) => {
  const width = Math.max(headers.length, ...rows.map((row) => row.length), 0);
  const fullHeaders = [...headers, ...new Array(Math.max(width - headers.length, 0)).fill("")];
  const fullRows = makeRectangularRows(rows, width);
  const matrix = [fullHeaders, ...fullRows];
  if (matrix.length === 0 || width === 0) return { headers: [], rows: [] };
  const transposed = Array.from({ length: width }, (_, colIdx) =>
    matrix.map((row) => normalizeCellText(row[colIdx]))
  );
  return { headers: transposed[0] || [], rows: transposed.slice(1) };
};

const tableOrientationScore = (table) => {
  const columnHeaders = table.headers.slice(1);
  const rowHeaders = table.rows.map((row) => row[0] || "");
  const sizeInColumns = columnHeaders.filter((value) => isLikelySizeLabel(value)).length;
  const measurementInRows = rowHeaders.filter((value) => isLikelyMeasurementLabelLoose(value)).length;
  const sizeInRows = rowHeaders.filter((value) => isLikelySizeLabel(value)).length;
  const measurementInColumns = columnHeaders.filter((value) => isLikelyMeasurementLabelLoose(value)).length;
  const numericRowHeaders = rowHeaders.filter((value) =>
    /^-?\d+(?:\.\d+)?(?:\s*(?:cm|mm|in|inch))?$/i.test(normalizeCellText(value))
  ).length;
  return (
    sizeInColumns * 4 +
    measurementInRows * 4 -
    sizeInRows * 4 -
    measurementInColumns * 3 -
    numericRowHeaders * 2
  );
};

const sortMeasurementRows = (rows) => {
  const nextRows = [...rows];
  const totalLengthIndex = nextRows.findIndex(
    (row) => normalizeMeasurementLabel(row?.[0] || "") === TOTAL_LENGTH_LABEL
  );
  if (totalLengthIndex <= 0) return nextRows;
  const [totalLengthRow] = nextRows.splice(totalLengthIndex, 1);
  nextRows.unshift(totalLengthRow);
  return nextRows;
};

const standardizeSizeTable = (value) => {
  if (!value || typeof value !== "object") return null;
  const parsed = value;
  const headers = Array.isArray(parsed.headers)
    ? parsed.headers.map((header) => normalizeCellText(header))
    : [];
  const rows = Array.isArray(parsed.rows)
    ? parsed.rows.map((row) => (Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : []))
    : [];
  if (headers.length === 0 && rows.length === 0) return null;

  const asIs = { headers: [...headers], rows: rows.map((row) => [...row]) };
  const transposed = transposeTable(asIs);
  const selected =
    tableOrientationScore(transposed) > tableOrientationScore(asIs) ? transposed : asIs;

  const width = Math.max(selected.headers.length, ...selected.rows.map((row) => row.length), 0);
  if (width === 0) return null;
  const normalizedHeaders = [...selected.headers, ...new Array(width - selected.headers.length).fill("")].slice(0, width);
  normalizedHeaders[0] = ITEM_LABEL;
  for (let idx = 1; idx < normalizedHeaders.length; idx += 1) {
    normalizedHeaders[idx] = normalizeSizeLabel(normalizedHeaders[idx]);
  }

  const normalizedRows = makeRectangularRows(selected.rows, width).map((row) => {
    const nextRow = [...row];
    nextRow[0] = normalizeMeasurementLabel(nextRow[0]);
    return nextRow;
  });

  return {
    headers: normalizedHeaders,
    rows: sortMeasurementRows(normalizedRows),
  };
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

export {
  ITEM_LABEL,
  standardizeSizeTable,
};
