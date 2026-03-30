import {
  ITEM_LABEL,
  isLikelyMeasurementLabel,
  isLikelyMeasurementLabelLoose,
  isLikelySizeLabel,
  normalizeCellText,
  normalizeComparableSizeLabel,
  normalizeSizeLabel,
  transposeTable,
} from "../../utils/size-table.js";
import { stripHtml } from "../product-metadata/html.js";
import { uniqValues } from "../product-metadata/shared.js";

export const SIZE_KEY_NAME_PATTERN =
  /(?:size|\uC0AC\uC774\uC988|\uC635\uC158|\uCE58\uC218|\uADDC\uACA9|\uD638\uC218)/i;
export const MEASUREMENT_KEY_HINT_PATTERN =
  /(?:\uCD1D\uC7A5|\uAE30\uC7A5|\uC5B4\uAE68|\uAC00\uC2B4|\uC18C\uB9E4|\uD5C8\uB9AC|\uC5C9\uB369|\uD5C8\uBC85|\uBC11\uC704|\uBC11\uB2E8|\uAE38\uC774|length|shoulder|chest|sleeve|waist|hip|thigh|rise|hem|inseam|pit|bust|body|width)/i;

const areSequentialNumericSizeHeaders = (headers) =>
  Array.isArray(headers) &&
  headers.length > 0 &&
  headers.every((header, index) => {
    const normalized = normalizeSizeLabel(header);
    if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return false;
    return Number(normalized) === index;
  });

export const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isNumericLikeCell = (value) => {
  const text = normalizeCellText(value).toLowerCase();
  if (!text) return false;
  const cleaned = text
    .replace(/,/g, "")
    .replace(/\b(cm|mm|in|inch|kg|g|oz)\b/g, "")
    .replace(/\s+/g, "");
  return /-?\d+(?:\.\d+)?/.test(cleaned);
};

export const parseNumericCellValue = (value) => {
  const text = normalizeCellText(value).toLowerCase();
  if (!text) return null;
  const cleaned = text
    .replace(/,/g, "")
    .replace(/\b(cm|mm|in|inch|kg|g|oz)\b/g, "")
    .replace(/\s+/g, "");
  const tokenMatch = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!tokenMatch?.[0]) return null;
  const numeric = Number(tokenMatch[0]);
  return Number.isFinite(numeric) ? numeric : null;
};

export const isLikelyMeasurementKey = (value) => {
  const text = normalizeCellText(value);
  if (!text) return false;
  if (isLikelyMeasurementLabel(text)) return true;
  return MEASUREMENT_KEY_HINT_PATTERN.test(text);
};

export const hasUsableSizeTableShape = (table) => {
  if (!table || !Array.isArray(table.headers) || !Array.isArray(table.rows)) return false;
  if (table.headers.length < 2 || table.rows.length < 1) return false;

  const normalizedRows = table.rows
    .map((row) => (Array.isArray(row) ? row : []))
    .filter((row) => row.length > 0);
  if (normalizedRows.length < 1) return false;

  const measurementLikeRows = normalizedRows.filter((row) =>
    isLikelyMeasurementLabelLoose(row?.[0] || "") || isLikelyMeasurementKey(row?.[0] || "")
  ).length;
  const descriptiveRowHeaders = normalizedRows.filter((row) => {
    const headerCell = normalizeCellText(row?.[0] || "");
    if (!headerCell) return false;
    if (isLikelyMeasurementLabelLoose(headerCell) || isLikelyMeasurementKey(headerCell)) return true;
    if (isLikelySizeLabel(headerCell)) return false;
    if (parseNumericCellValue(headerCell) !== null) return false;
    return true;
  }).length;
  if (measurementLikeRows < 1 && descriptiveRowHeaders < 1) return false;

  let numericCells = 0;
  for (const row of normalizedRows) {
    for (const cell of row.slice(1)) {
      if (parseNumericCellValue(cell) !== null) numericCells += 1;
    }
  }
  const expectedValueColumns = Math.max(1, table.headers.length - 1);
  const minimumNumericCells = Math.max(1, Math.min(4, expectedValueColumns));
  if (numericCells < minimumNumericCells) return false;
  return true;
};

const pickUsableSizeTableOrientation = (table) => {
  if (!table) return null;
  if (hasUsableSizeTableShape(table)) return table;
  const transposed = transposeTable(table);
  if (hasUsableSizeTableShape(transposed)) return transposed;
  return null;
};

export const extractOptionSizeLabelsFromHtml = (html) => {
  const labels = [];
  const seen = new Set();
  const push = (value) => {
    const normalized = normalizeComparableSizeLabel(value);
    if (!normalized || !isLikelySizeLabel(normalized) || seen.has(normalized)) return;
    seen.add(normalized);
    labels.push(normalized);
  };

  const optionPattern =
    /<(?:option|button|label|span|li)[^>]*?(?:data-option|data-size|class=["'][^"']*(?:size|option)[^"']*["'])[\s\S]*?>([\s\S]*?)<\/(?:option|button|label|span|li)>/gi;
  let optionMatch = null;
  while ((optionMatch = optionPattern.exec(String(html || ""))) !== null) {
    const tokens = normalizeCellText(stripHtml(optionMatch[1] || "")).split(/\s+/);
    for (const token of tokens) push(token);
  }

  return uniqValues(labels);
};

export const alignAndValidateSizeTableByOptionLabels = (table, optionSizeLabels = []) => {
  if (!table) return null;
  const usableTable = pickUsableSizeTableOrientation(table);
  if (!usableTable) return null;

  const normalizedOptions = uniqValues(
    (optionSizeLabels || [])
      .map((value) => normalizeComparableSizeLabel(value))
      .filter((value) => isLikelySizeLabel(value))
  );
  if (normalizedOptions.length < 2) return usableTable;

  const normalizedHeaders = usableTable.headers
    .slice(1)
    .map((value) => normalizeComparableSizeLabel(value))
    .filter(Boolean);
  if (normalizedHeaders.length < 2) return null;

  const shouldReplaceHeaders =
    areSequentialNumericSizeHeaders(normalizedHeaders) &&
    normalizedOptions.length === normalizedHeaders.length;
  if (shouldReplaceHeaders) {
    return {
      headers: [usableTable.headers[0] || ITEM_LABEL, ...normalizedOptions],
      rows: usableTable.rows,
    };
  }

  const optionSet = new Set(normalizedOptions);
  const optionIndexByValue = new Map();
  normalizedHeaders.forEach((value, index) => {
    if (!optionSet.has(value)) return;
    if (!optionIndexByValue.has(value)) optionIndexByValue.set(value, index + 1);
  });
  const matchedOptionsInOrder = normalizedOptions.filter((value) => optionIndexByValue.has(value));
  if (matchedOptionsInOrder.length >= 2) {
    const projectedHeaders = [usableTable.headers[0] || ITEM_LABEL, ...matchedOptionsInOrder];
    const projectedRows = usableTable.rows.map((row) => [
      row?.[0] || "",
      ...matchedOptionsInOrder.map((optionValue) => row?.[optionIndexByValue.get(optionValue)] || ""),
    ]);
    const projectedTable = {
      headers: projectedHeaders,
      rows: projectedRows,
    };
    return hasUsableSizeTableShape(projectedTable) ? projectedTable : null;
  }

  const overlapCount = normalizedHeaders.filter((header) => optionSet.has(header)).length;
  const requiredOverlap = Math.max(
    1,
    Math.min(2, Math.ceil(Math.min(normalizedHeaders.length, normalizedOptions.length) * 0.5))
  );
  if (overlapCount < requiredOverlap) return null;
  if (normalizedHeaders.length > normalizedOptions.length + 1) return null;
  const unknownHeaderCount = normalizedHeaders.filter((header) => !optionSet.has(header)).length;
  if (unknownHeaderCount > Math.max(1, Math.floor(normalizedHeaders.length * 0.4))) return null;
  return usableTable;
};

export const scoreSizeTableCandidate = (table) => {
  if (!table) return -1;
  if (!hasUsableSizeTableShape(table)) return -1;
  const hintedMeasurementRows = table.rows.filter((row) =>
    isLikelyMeasurementKey(row?.[0] || "")
  ).length;
  if (hintedMeasurementRows === 0) return -1;

  const numericValues = [];
  for (const row of table.rows) {
    for (const cell of row.slice(1)) {
      const numeric = parseNumericCellValue(cell);
      if (numeric === null) continue;
      numericValues.push(numeric);
    }
  }
  if (numericValues.length >= 2) {
    const plausibleCount = numericValues.filter((value) => value > 0 && value <= 400).length;
    if (plausibleCount / numericValues.length < 0.5) return -1;
  }

  const normalizedSizeHeaders = table.headers
    .slice(1)
    .map((header) => normalizeComparableSizeLabel(header))
    .filter(Boolean);
  const sizeHeaderCount = normalizedSizeHeaders.filter((header) => isLikelySizeLabel(header)).length;
  const measurementRowCount = table.rows.filter((row) => isLikelyMeasurementLabel(row?.[0] || "")).length;
  const alphaSizeHeaderCount = normalizedSizeHeaders.filter((header) =>
    /^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE)$/i.test(header)
  ).length;
  const numericSizeHeaderCount = normalizedSizeHeaders.filter((header) =>
    /^\d{1,4}(?:\s*\([^)]{1,30}\))?$/i.test(header)
  ).length;
  const mixedHeaderPenalty = alphaSizeHeaderCount > 0 && numericSizeHeaderCount > 0 ? 5 : 0;

  return (
    sizeHeaderCount * 3 +
    measurementRowCount * 3 +
    hintedMeasurementRows * 2 +
    table.rows.length -
    mixedHeaderPenalty
  );
};

export { isNumericLikeCell };
