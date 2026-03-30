import {
  isLikelyMeasurementLabel,
  isLikelyMeasurementLabelLoose,
  isLikelySizeLabel,
  normalizeCellText,
  normalizeComparableSizeLabel,
  normalizeMeasurementLabel,
  normalizeSizeLabel,
  parseSizeTable,
  standardizeSizeTable,
} from "../../utils/size-table.js";
import { stripHtml } from "../product-metadata/html.js";
import { uniqValues } from "../product-metadata/shared.js";
import {
  isLikelyMeasurementKey,
  isNumericLikeCell,
  isPlainObject,
  parseNumericCellValue,
  scoreSizeTableCandidate,
  SIZE_KEY_NAME_PATTERN,
} from "./validation.js";

const SIZE_HINT_PATTERN =
  /(?:size|\uC0AC\uC774\uC988|\uCE58\uC218|chart|guide|measurement|spec|\bcm\b)/i;
const SIZE_TABLE_STOP_PATTERN =
  /(?:model|detail|fabric|delivery|shipping|material|\uC18C\uC7AC|\uC138\uD0C1|\uBC30\uC1A1|\uC0C1\uC138|\*)/i;
const SIZE_LABEL_TOKEN_PATTERN = /(?:XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE|\d{1,4})/gi;

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

  const sizeKey =
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

export const extractSizeTableFromJsonData = (jsonData) => {
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

export const extractSizeTableFromHtmlTables = (html) => {
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

export const extractSizeTableFromPlainText = (value) => {
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
