import {
  ITEM_LABEL,
  isLikelyMeasurementLabel,
  isLikelyMeasurementLabelLoose,
  isLikelySizeLabel,
  normalizeCellText,
  normalizeComparableSizeLabel,
  normalizeMeasurementLabel,
  normalizeSizeLabel,
  parseSizeTable,
  standardizeSizeTable,
  transposeTable,
} from "../../utils/size-table.js";
import { stripHtml } from "../product-metadata/html.js";
import { uniqValues } from "../product-metadata/shared.js";

const SIZE_KEY_NAME_PATTERN =
  /(?:size|\uC0AC\uC774\uC988|\uC635\uC158|\uCE58\uC218|\uADDC\uACA9|\uD638\uC218)/i;
const SIZE_HINT_PATTERN =
  /(?:size|\uC0AC\uC774\uC988|\uCE58\uC218|chart|guide|measurement|spec|\bcm\b)/i;
const SIZE_TABLE_STOP_PATTERN =
  /(?:model|detail|fabric|delivery|shipping|material|\uC18C\uC7AC|\uC138\uD0C1|\uBC30\uC1A1|\uC0C1\uC138|\*)/i;
const SIZE_LABEL_TOKEN_PATTERN = /(?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4})/gi;
const URL_VALUE_HINT_PATTERN = /^(?:https?:)?\/\/|^\/[^/]|^\.\.?\//i;
const HTML_PAGE_PATH_PATTERN = /\.(?:html?|php|aspx?|jsp)(?:[?#].*)?$/i;
const SIZE_CHART_PATH_HINT_PATTERN = /(?:size|chart|guide|measurement|spec|fit)/i;
const MEASUREMENT_KEY_HINT_PATTERN =
  /(?:\uCD1D\uC7A5|\uAE30\uC7A5|\uC5B4\uAE68|\uAC00\uC2B4|\uC18C\uB9E4|\uD5C8\uB9AC|\uC5C9\uB369|\uD5C8\uBC85|\uBC11\uC704|\uBC11\uB2E8|\uAE38\uC774|length|shoulder|chest|sleeve|waist|hip|thigh|rise|hem|inseam|pit|bust|body|width)/i;

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

const areSequentialNumericSizeHeaders = (headers) =>
  Array.isArray(headers) &&
  headers.length > 0 &&
  headers.every((header, index) => {
    const normalized = normalizeSizeLabel(header);
    if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return false;
    return Number(normalized) === index;
  });

const isPlainObject = (value) =>
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

const parseNumericCellValue = (value) => {
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

const isLikelyMeasurementKey = (value) => {
  const text = normalizeCellText(value);
  if (!text) return false;
  if (isLikelyMeasurementLabel(text)) return true;
  return MEASUREMENT_KEY_HINT_PATTERN.test(text);
};

const hasUsableSizeTableShape = (table) => {
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

const looksLikeUrlValue = (value) => {
  const text = normalizeCellText(value);
  if (!text || /\s/.test(text) || text.length > 1500) return false;
  if (URL_VALUE_HINT_PATTERN.test(text)) return true;
  if (HTML_PAGE_PATH_PATTERN.test(text)) return true;
  if (/^[A-Za-z0-9/_-]+(?:\?[^\s]*)?$/.test(text) && SIZE_CHART_PATH_HINT_PATTERN.test(text)) return true;
  return false;
};

const scoreSizeTableCandidate = (table) => {
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

const extractSizeTableFromArrayOfArrays = (rows) => {
  if (!Array.isArray(rows) || rows.length < 2) return null;
  const normalized = rows
    .map((row) => (Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : []))
    .filter((row) => row.length >= 2);
  if (normalized.length < 2) return null;

  return standardizeSizeTable({
    headers: normalized[0],
    rows: normalized.slice(1),
  });
};

const extractSizeTableFromArrayOfObjects = (rows) => {
  const objects = Array.isArray(rows) ? rows.filter((row) => isPlainObject(row)) : [];
  if (objects.length < 2) return null;

  const keyCounts = new Map();
  for (const row of objects) {
    for (const key of Object.keys(row)) {
      const normalizedKey = normalizeCellText(key);
      if (!normalizedKey) continue;
      keyCounts.set(normalizedKey, (keyCounts.get(normalizedKey) || 0) + 1);
    }
  }
  const minPresence = Math.max(2, Math.ceil(objects.length * 0.6));
  const commonKeys = [...keyCounts.entries()]
    .filter(([, count]) => count >= minPresence)
    .map(([key]) => key);
  if (commonKeys.length < 2) return null;

  const sizeScoreForKey = (key) =>
    objects.reduce((score, row) => score + (isLikelySizeLabel(row[key]) ? 1 : 0), 0);

  let sizeKey =
    commonKeys.find((key) => SIZE_KEY_NAME_PATTERN.test(key)) ||
    commonKeys
      .map((key) => ({ key, score: sizeScoreForKey(key) }))
      .sort((left, right) => right.score - left.score)[0]?.key ||
    "";
  if (!sizeKey || sizeScoreForKey(sizeKey) < 2) return null;

  const sizeValues = objects.map((row) => normalizeSizeLabel(row[sizeKey])).filter(Boolean);
  if (uniqValues(sizeValues).length < 2) return null;

  const measureKeys = commonKeys.filter((key) => {
    if (key === sizeKey) return false;
    const numericCount = objects.reduce(
      (count, row) => count + (isNumericLikeCell(row[key]) ? 1 : 0),
      0
    );
    return numericCount >= minPresence;
  });
  if (measureKeys.length === 0) return null;
  if (measureKeys.filter((key) => isLikelyMeasurementKey(key)).length === 0) return null;

  return standardizeSizeTable({
    headers: ["size", ...sizeValues],
    rows: measureKeys.map((key) => [key, ...objects.map((row) => normalizeCellText(row[key]))]),
  });
};

const extractSizeTableFromSizeMapObject = (node) => {
  if (!isPlainObject(node)) return null;
  const entries = Object.entries(node).filter(
    ([, value]) => isPlainObject(value) && Object.keys(value).length >= 1
  );
  if (entries.length < 2) return null;
  const sizeLabels = entries.map(([key]) => normalizeSizeLabel(key)).filter(Boolean);
  if (sizeLabels.filter((label) => isLikelySizeLabel(label)).length < 2) return null;

  const valueObjects = entries.map(([, value]) => value);
  const keyCounts = new Map();
  for (const item of valueObjects) {
    for (const key of Object.keys(item)) {
      const normalizedKey = normalizeCellText(key);
      if (!normalizedKey) continue;
      keyCounts.set(normalizedKey, (keyCounts.get(normalizedKey) || 0) + 1);
    }
  }
  const minPresence = Math.max(2, Math.ceil(valueObjects.length * 0.6));
  const measureKeys = [...keyCounts.entries()]
    .filter(([, count]) => count >= minPresence)
    .map(([key]) => key)
    .filter((key) => {
      const numericCount = valueObjects.reduce(
        (count, item) => count + (isNumericLikeCell(item[key]) ? 1 : 0),
        0
      );
      return numericCount >= minPresence;
    });
  if (measureKeys.length === 0) return null;
  if (measureKeys.filter((key) => isLikelyMeasurementKey(key)).length === 0) return null;

  return standardizeSizeTable({
    headers: ["size", ...sizeLabels],
    rows: measureKeys.map((key) => [key, ...valueObjects.map((item) => normalizeCellText(item[key]))]),
  });
};

const extractSizeTableFromJsonData = (jsonData) => {
  if (!jsonData) return null;
  const stack = [jsonData];
  let visited = 0;
  let bestTable = null;
  let bestScore = -1;

  while (stack.length > 0 && visited < 3000) {
    const node = stack.pop();
    visited += 1;

    const consider = (table) => {
      const score = scoreSizeTableCandidate(table);
      if (score > bestScore) {
        bestScore = score;
        bestTable = table;
      }
    };

    if (Array.isArray(node)) {
      consider(extractSizeTableFromArrayOfArrays(node));
      consider(extractSizeTableFromArrayOfObjects(node));
      for (const item of node) {
        if (item && typeof item === "object") stack.push(item);
      }
      continue;
    }
    if (!isPlainObject(node)) continue;

    if (Array.isArray(node.headers) && Array.isArray(node.rows)) {
      consider(parseSizeTable(node));
    }
    consider(extractSizeTableFromSizeMapObject(node));

    for (const value of Object.values(node)) {
      if (value && typeof value === "object") stack.push(value);
    }
  }

  return bestScore >= 4 ? bestTable : null;
};

export const collectTextBlocksFromJsonData = (jsonData) => {
  const blocks = [];
  const stack = [{ node: jsonData, keyHint: "" }];
  let visited = 0;

  while (stack.length > 0 && visited < 4000 && blocks.length < 80) {
    const { node, keyHint } = stack.pop();
    visited += 1;

    if (typeof node === "string") {
      const text = normalizeCellText(node);
      if (text.length >= 8 && text.length <= 2000) {
        const combined = `${keyHint} ${text}`;
        if (SIZE_HINT_PATTERN.test(combined)) blocks.push(text);
      }
      continue;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        stack.push({ node: item, keyHint });
      }
      continue;
    }
    if (!isPlainObject(node)) continue;

    for (const [key, value] of Object.entries(node)) {
      const nextHint = `${keyHint} ${String(key || "")}`.trim();
      stack.push({ node: value, keyHint: nextHint });
    }
  }

  return uniqValues(blocks);
};

const extractSizeTableFromHtmlTables = (html) => {
  const tablePattern = /<table[\s\S]*?<\/table>/gi;
  let bestScore = -1;
  let bestTable = null;
  let tableMatch = null;

  while ((tableMatch = tablePattern.exec(String(html || ""))) !== null) {
    const tableHtml = tableMatch[0];
    const rowPattern = /<tr[\s\S]*?<\/tr>/gi;
    const rows = [];
    let rowMatch = null;
    while ((rowMatch = rowPattern.exec(tableHtml)) !== null) {
      const cellPattern = /<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi;
      const cells = [];
      let cellMatch = null;
      while ((cellMatch = cellPattern.exec(rowMatch[0])) !== null) {
        const cleaned = normalizeCellText(stripHtml(cellMatch[1]));
        if (cleaned) cells.push(cleaned);
      }
      if (cells.length > 0) rows.push(cells);
    }

    if (rows.length < 2) continue;
    const candidate = standardizeSizeTable({
      headers: rows[0],
      rows: rows.slice(1),
    });
    if (!candidate) continue;

    const keywordBoost =
      /(?:size|\uC0AC\uC774\uC988|\uCE58\uC218|cm|\uCD1D\uC7A5|\uAC00\uC2B4|\uC5B4\uAE68|\uD5C8\uB9AC|\uC18C\uB9E4)/i
        .test(stripHtml(tableHtml))
        ? 2
        : 0;
    const score = scoreSizeTableCandidate(candidate) + keywordBoost;
    if (score > bestScore) {
      bestScore = score;
      bestTable = candidate;
    }
  }

  return bestScore >= 4 ? bestTable : null;
};

const extractSizeTableFromPlainText = (value) => {
  const text = normalizeCellText(value);
  if (!text) return null;

  const indexedSizeRows = [];
  const indexedSizeRowPattern = /\[(\d{1,3})\]\s*([\s\S]*?)(?=(?:\[\d{1,3}\])|$)/g;
  let indexedSizeRowMatch = null;
  while ((indexedSizeRowMatch = indexedSizeRowPattern.exec(text)) !== null) {
    const sizeValue = normalizeSizeLabel(indexedSizeRowMatch[1] || "");
    const bodySegment = normalizeCellText(indexedSizeRowMatch[2] || "");
    if (!sizeValue || !bodySegment) continue;

    const measurementOrder = [];
    const measurementValues = new Map();
    const segmentTokens = bodySegment.split(/\s*\/\s*/).map((token) => normalizeCellText(token)).filter(Boolean);
    for (const token of segmentTokens) {
      const tokenMatch = token.match(
        /^([A-Za-z\u3131-\uD79D ]{1,30})\s*[:\-]?\s*(-?\d+(?:\.\d+)?(?:\s*(?:cm|mm|in|inch))?)$/i
      );
      if (!tokenMatch) continue;

      const normalizedLabel = normalizeMeasurementLabel(tokenMatch[1]);
      if (!isLikelyMeasurementLabelLoose(normalizedLabel)) continue;
      const normalizedValue = normalizeCellText(tokenMatch[2]).replace(/\s*(?:cm|mm|in|inch)\b/gi, "");
      if (!normalizedValue) continue;
      if (!measurementValues.has(normalizedLabel)) measurementOrder.push(normalizedLabel);
      measurementValues.set(normalizedLabel, normalizedValue);
    }

    if (measurementValues.size < 2) continue;
    indexedSizeRows.push({ sizeValue, measurementOrder, measurementValues });
  }

  if (indexedSizeRows.length >= 2) {
    const sizeHeaders = uniqValues(indexedSizeRows.map((row) => row.sizeValue));
    if (sizeHeaders.length >= 2) {
      const measurementLabels = [];
      const measurementLabelSet = new Set();
      for (const row of indexedSizeRows) {
        for (const label of row.measurementOrder) {
          if (!label || measurementLabelSet.has(label)) continue;
          measurementLabelSet.add(label);
          measurementLabels.push(label);
        }
      }
      if (measurementLabels.length >= 2) {
        const rows = measurementLabels.map((label) => [
          label,
          ...indexedSizeRows.map((row) => row.measurementValues.get(label) || ""),
        ]);
        const parsedIndexedTable = standardizeSizeTable({
          headers: ["size", ...sizeHeaders],
          rows,
        });
        if (parsedIndexedTable) return parsedIndexedTable;
      }
    }
  }

  const genericSizeHeaderPattern =
    /((?<![A-Za-z0-9])(?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4})(?:\s*\([^)]{1,30}\))?(?![A-Za-z0-9])(?:\s*\/\s*(?<![A-Za-z0-9])(?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4})(?:\s*\([^)]{1,30}\))?(?![A-Za-z0-9])){1,9})/gi;
  let bestGenericTable = null;
  let bestGenericScore = -1;
  let genericSizeHeaderMatch = null;
  while ((genericSizeHeaderMatch = genericSizeHeaderPattern.exec(text)) !== null) {
    const rawSizeValues =
      genericSizeHeaderMatch[1].match(
        /(?<![A-Za-z0-9])(?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4})(?:\s*\([^)]{1,30}\))?(?![A-Za-z0-9])/gi
      ) || [];
    const sizeValues = uniqValues(
      rawSizeValues
        .map((token) => normalizeComparableSizeLabel(token))
        .filter((token) => isLikelySizeLabel(token))
    );
    if (sizeValues.length < 2) continue;

    const bodySegment = text
      .slice((genericSizeHeaderMatch.index || 0) + genericSizeHeaderMatch[0].length)
      .split(SIZE_TABLE_STOP_PATTERN)[0];
    const measurementPattern =
      /([A-Za-z\u3131-\uD79D ]{1,30})\s*[:\-]?\s*(-?\d+(?:\.\d+)?(?:\s*(?:cm|mm|in|inch))?(?:\s*(?:\/|\||,)\s*-?\d+(?:\.\d+)?(?:\s*(?:cm|mm|in|inch))?){1,10})/gi;
    const rows = [];
    let measurementMatch = null;
    while ((measurementMatch = measurementPattern.exec(bodySegment)) !== null) {
      const normalizedLabel = normalizeMeasurementLabel(measurementMatch[1]);
      if (!isLikelyMeasurementLabelLoose(normalizedLabel)) continue;
      const values = (measurementMatch[2].match(/-?\d+(?:\.\d+)?/g) || []).slice(0, sizeValues.length);
      if (values.length < 2) continue;
      rows.push([normalizedLabel, ...values]);
    }
    if (rows.length === 0) continue;

    const parsedTable = standardizeSizeTable({
      headers: ["size", ...sizeValues],
      rows,
    });
    if (!parsedTable) continue;

    const alphaSizeCount = sizeValues.filter((value) =>
      /^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE)$/i.test(value)
    ).length;
    const numericSizeCount = sizeValues.filter((value) => /^\d{1,4}$/.test(value)).length;
    let candidateScore = scoreSizeTableCandidate(parsedTable) + sizeValues.length * 3 + alphaSizeCount;
    if (alphaSizeCount === 1 && numericSizeCount >= 1) candidateScore -= 6;
    if (candidateScore > bestGenericScore) {
      bestGenericScore = candidateScore;
      bestGenericTable = parsedTable;
    }
  }
  if (bestGenericTable) return bestGenericTable;

  const sizeBlock = text.match(/(?:size|\uC0AC\uC774\uC988)\s*\(([^)]+)\)\s*([\s\S]{0,1200})/i);
  if (sizeBlock) {
    const measurementHeaders = String(sizeBlock[1] || "")
      .split(/[\/|,]/)
      .map((item) => normalizeCellText(item))
      .filter(Boolean);
    if (measurementHeaders.length > 0) {
      const bodySegment = String(sizeBlock[2] || "").split(SIZE_TABLE_STOP_PATTERN)[0];
      const rowPattern =
        /((?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4}))\s*:\s*([0-9.]+(?:\s*\/\s*[0-9.]+){1,8})/gi;
      const rows = [];
      let rowMatch = null;
      while ((rowMatch = rowPattern.exec(bodySegment)) !== null) {
        const sizeValue = normalizeSizeLabel(rowMatch[1]);
        const measurements = String(rowMatch[2] || "")
          .split("/")
          .map((item) => normalizeCellText(item))
          .filter(Boolean);
        if (measurements.length < 2) continue;
        rows.push([sizeValue, ...measurements]);
      }
      if (rows.length > 0) {
        const valueColumnCount = Math.max(...rows.map((row) => Math.max(row.length - 1, 0)), 0);
        if (valueColumnCount > 0) {
          const headers = ["size", ...measurementHeaders.slice(0, valueColumnCount)];
          while (headers.length <= valueColumnCount) headers.push(`measure_${headers.length}`);
          const normalizedRows = rows.map((row) => [row[0], ...row.slice(1, valueColumnCount + 1)]);
          const table = standardizeSizeTable({ headers, rows: normalizedRows });
          if (table) return table;
        }
      }
    }
  }

  const headerMatch = text.match(
    /(?:size|\uC0AC\uC774\uC988)\s*(?:\([^)]*\))?\s*((?:(?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4})\s*){2,10})/i
  );
  if (!headerMatch) return null;

  const sizeValues = (headerMatch[1].match(SIZE_LABEL_TOKEN_PATTERN) || []).map((token) =>
    normalizeSizeLabel(token)
  );
  if (uniqValues(sizeValues).length < 2) return null;

  const bodySegment = text
    .slice((headerMatch.index || 0) + headerMatch[0].length)
    .split(SIZE_TABLE_STOP_PATTERN)[0];
  const measurementPattern =
    /([A-Za-z\u3131-\uD79D]{1,20})\s*[:\-]?\s*([0-9.]+(?:\s*(?:\/|\||,)\s*[0-9.]+|\s+[0-9.]+){1,10})/g;
  const rows = [];
  let measurementMatch = null;
  while ((measurementMatch = measurementPattern.exec(bodySegment)) !== null) {
    const normalizedLabel = normalizeMeasurementLabel(measurementMatch[1]);
    if (!isLikelyMeasurementLabel(normalizedLabel)) continue;
    const values = (measurementMatch[2].match(/-?\d+(?:\.\d+)?/g) || []).slice(0, sizeValues.length);
    if (values.length < 2) continue;
    rows.push([normalizedLabel, ...values]);
  }
  if (rows.length === 0) return null;

  return standardizeSizeTable({
    headers: ["size", ...sizeValues],
    rows,
  });
};

export const extractSizeTableFromPage = ({ html, textBlocks = [], jsonData = null }) => {
  let bestTable = null;
  let bestScore = -1;

  const consider = (table, bonus = 0) => {
    if (!table) return;
    const score = scoreSizeTableCandidate(table);
    if (score < 0) return;
    const weightedScore = score + bonus;
    if (weightedScore > bestScore) {
      bestScore = weightedScore;
      bestTable = table;
    }
  };

  consider(extractSizeTableFromHtmlTables(html), 2);
  consider(extractSizeTableFromJsonData(jsonData), 0);

  for (const block of textBlocks) {
    consider(extractSizeTableFromPlainText(stripHtml(block)), 1);
  }

  consider(extractSizeTableFromPlainText(stripHtml(html)), 1);
  return bestTable;
};
