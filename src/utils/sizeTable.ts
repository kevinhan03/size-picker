import type { SizeTable, SizeConversionRow, SizeRegionKey, Product, SizeRecommendation } from '../types';
import {
  TOTAL_LENGTH_LABEL,
  ITEM_LABEL,
  SIZE_COLUMN_LABEL,
  MEASUREMENT_LABEL_HINT_PATTERN,
  TOTAL_LENGTH_ALIAS_KEYS,
  MEASUREMENT_ALIAS_MAP,
} from '../constants';

export const normalizeCellText = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();

export const normalizeAliasKey = (value: unknown): string =>
  normalizeCellText(value)
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^0-9a-z\u3131-\uD79D]/g, '');

export const isTotalLengthAliasKey = (aliasKey: string): boolean =>
  Boolean(aliasKey) &&
  TOTAL_LENGTH_ALIAS_KEYS.some((key) => aliasKey === key || aliasKey.includes(key));

export const inferMeasurementLabelFromAliasKey = (aliasKey: string): string => {
  if (!aliasKey) return '';
  if (aliasKey.includes('shoulder') || aliasKey.includes('어깨')) return '어깨';
  if (aliasKey.includes('chest') || aliasKey.includes('bust') || aliasKey.includes('bodywidth') || aliasKey.includes('pit') || aliasKey.includes('가슴') || aliasKey.includes('품')) return '가슴';
  if (aliasKey.includes('sleeve') || aliasKey.includes('arm') || aliasKey.includes('소매') || aliasKey.includes('화장')) return '소매';
  if (aliasKey.includes('waist') || aliasKey.includes('허리')) return '허리';
  if (aliasKey.includes('hip') || aliasKey.includes('엉덩이') || aliasKey.includes('힙')) return '엉덩이';
  if (aliasKey.includes('thigh') || aliasKey.includes('허벅지')) return '허벅지';
  if (aliasKey.includes('rise') || aliasKey.includes('밑위')) return '밑위';
  if (aliasKey.includes('hem') || aliasKey.includes('밑단')) return '밑단';
  if (aliasKey.includes('inseam') || aliasKey.includes('인심')) return '인심';
  return '';
};

export const normalizeMeasurementLabel = (value: unknown): string => {
  const raw = normalizeCellText(value);
  if (!raw) return '';
  const aliasKey = normalizeAliasKey(raw);
  if (MEASUREMENT_ALIAS_MAP[aliasKey]) return MEASUREMENT_ALIAS_MAP[aliasKey];
  const inferred = inferMeasurementLabelFromAliasKey(aliasKey);
  if (inferred) return inferred;
  if (isTotalLengthAliasKey(aliasKey)) return TOTAL_LENGTH_LABEL;
  return raw;
};

export const normalizeSizeLabel = (value: unknown): string => normalizeCellText(value).toUpperCase();
export const normalizeSizeLookupValue = (value: unknown): string =>
  normalizeCellText(value)
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/MM$/, '');

export const findConvertedSize = (
  rows: SizeConversionRow[],
  region: SizeRegionKey,
  size: string
): SizeConversionRow | null => {
  const lookup = normalizeSizeLookupValue(size);
  if (!lookup) return null;
  return rows.find((row) => normalizeSizeLookupValue(row[region]) === lookup) || null;
};

export const isLikelySizeLabel = (value: unknown): boolean => {
  const text = normalizeSizeLabel(value);
  if (!text) return false;
  if (/^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|ONE ?SIZE)$/i.test(text)) return true;
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

export const isLikelyMeasurementLabel = (value: unknown): boolean => {
  const normalized = normalizeMeasurementLabel(value);
  return Boolean(normalized) && Object.values(MEASUREMENT_ALIAS_MAP).includes(normalized);
};

export const isLikelyMeasurementLabelLoose = (value: unknown): boolean => {
  if (isLikelyMeasurementLabel(value)) return true;
  return MEASUREMENT_LABEL_HINT_PATTERN.test(normalizeCellText(value));
};

export const isPrimaryColumnHeader = (value: unknown): boolean => {
  const normalized = normalizeCellText(value);
  return normalized === ITEM_LABEL || normalized === SIZE_COLUMN_LABEL || /^size$/i.test(normalized);
};

const makeRectangularRows = (rows: string[][], width: number): string[][] =>
  rows.map((row) => {
    const normalized = Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : [];
    return [...normalized, ...new Array(Math.max(width - normalized.length, 0)).fill('')].slice(0, width);
  });

export const transposeTable = (table: SizeTable): SizeTable => {
  const width = Math.max(table.headers.length, ...table.rows.map((row) => row.length), 0);
  const fullHeaders = [...table.headers, ...new Array(Math.max(width - table.headers.length, 0)).fill('')];
  const fullRows = makeRectangularRows(table.rows, width);
  const matrix = [fullHeaders, ...fullRows];
  if (!matrix.length || !width) return { headers: [], rows: [] };
  const transposed = Array.from({ length: width }, (_, colIdx) =>
    matrix.map((row) => normalizeCellText(row[colIdx]))
  );
  return {
    headers: transposed[0] || [],
    rows: transposed.slice(1),
  };
};

export const tableOrientationScore = (table: SizeTable): number => {
  const columnHeaders = table.headers.slice(1);
  const rowHeaders = table.rows.map((row) => row[0] || '');
  const sizeInRows = rowHeaders.filter((v) => isLikelySizeLabel(v)).length;
  const sizeInColumns = columnHeaders.filter((v) => isLikelySizeLabel(v)).length;
  const measurementInColumns = columnHeaders.filter((v) => isLikelyMeasurementLabelLoose(v)).length;
  const measurementInRows = rowHeaders.filter((v) => isLikelyMeasurementLabelLoose(v)).length;
  const numericColumnHeaders = columnHeaders.filter((value) =>
    /^-?\d+(?:\.\d+)?(?:\s*(?:cm|mm|in|inch))?$/i.test(normalizeCellText(value))
  ).length;
  return (
    sizeInRows * 4 +
    measurementInColumns * 4 -
    sizeInColumns * 4 -
    measurementInRows * 3 -
    numericColumnHeaders * 2
  );
};

const prioritizeTotalLengthColumn = (table: SizeTable): SizeTable => {
  const totalLengthIndex = table.headers.findIndex(
    (header, idx) => idx > 0 && normalizeMeasurementLabel(header) === TOTAL_LENGTH_LABEL
  );
  if (totalLengthIndex <= 1) return table;

  const nextHeaders = [...table.headers];
  const [totalLengthHeader] = nextHeaders.splice(totalLengthIndex, 1);
  nextHeaders.splice(1, 0, totalLengthHeader);

  const nextRows = table.rows.map((row) => {
    const nextRow = [...row];
    const [totalLengthValue] = nextRow.splice(totalLengthIndex, 1);
    nextRow.splice(1, 0, totalLengthValue ?? '');
    return nextRow;
  });

  return { headers: nextHeaders, rows: nextRows };
};

export const normalizeSizeTable = (value: unknown): SizeTable | null => {
  if (!value) return null;
  let parsed: unknown = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const record = parsed as Record<string, unknown>;
  const headers = Array.isArray(record.headers) ? record.headers.map((v) => normalizeCellText(v)) : [];
  const rows = Array.isArray(record.rows)
    ? record.rows.map((row) => (Array.isArray(row) ? row.map((cell) => normalizeCellText(cell)) : []))
    : [];
  if (headers.length === 0 && rows.length === 0) return null;

  const asIs: SizeTable = { headers: [...headers], rows: rows.map((row) => [...row]) };
  const transposed = transposeTable(asIs);
  const selected = tableOrientationScore(transposed) > tableOrientationScore(asIs) ? transposed : asIs;

  const width = Math.max(selected.headers.length, ...selected.rows.map((row) => row.length), 0);
  if (!width) return null;

  const normalizedHeaders = [...selected.headers, ...new Array(width - selected.headers.length).fill('')].slice(0, width);
  normalizedHeaders[0] = SIZE_COLUMN_LABEL;
  for (let idx = 1; idx < normalizedHeaders.length; idx += 1) {
    normalizedHeaders[idx] = normalizeMeasurementLabel(normalizedHeaders[idx]);
  }

  const normalizedRows = makeRectangularRows(selected.rows, width).map((row) => {
    const nextRow = [...row];
    nextRow[0] = normalizeSizeLabel(nextRow[0]);
    return nextRow;
  });

  return prioritizeTotalLengthColumn({
    headers: normalizedHeaders,
    rows: normalizedRows,
  });
};

const parseFirstNumber = (value: string): number | null => {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = parseFloat(match[0]);
  return isFinite(n) ? n : null;
};

export const extractMeasurements = (headers: string[], row: string[]): Map<string, number> => {
  const map = new Map<string, number>();
  for (let i = 1; i < headers.length; i++) {
    const label = normalizeMeasurementLabel(headers[i]);
    if (!label) continue;
    const val = parseFirstNumber(row[i] ?? '');
    if (val !== null) map.set(label, val);
  }
  return map;
};

export const scoreMeasurementSimilarity = (a: Map<string, number>, b: Map<string, number>): number => {
  let totalWeight = 0;
  let weightedDiff = 0;
  a.forEach((aVal, label) => {
    const bVal = b.get(label);
    if (bVal === undefined) return;
    const weight = label === TOTAL_LENGTH_LABEL ? 2 : 1;
    weightedDiff += weight * Math.abs(aVal - bVal);
    totalWeight += weight;
  });
  return totalWeight === 0 ? Infinity : weightedDiff / totalWeight;
};

export const computeSizeRecommendations = (
  source: Product,
  selectedRowIndex: number,
  candidates: Product[],
  maxResults = 3
): SizeRecommendation[] => {
  if (!source.sizeTable) return [];
  const sourceRow = source.sizeTable.rows[selectedRowIndex];
  if (!sourceRow) return [];
  const sourceMeasurements = extractMeasurements(source.sizeTable.headers, sourceRow);
  if (sourceMeasurements.size === 0) return [];

  const results: SizeRecommendation[] = [];
  for (const product of candidates) {
    if (product.id === source.id) continue;
    if (product.category !== source.category) continue;
    if (!product.sizeTable?.rows?.length) continue;
    const hasOverlap = [...sourceMeasurements.keys()].some((k) =>
      product.sizeTable!.headers.slice(1).map(normalizeMeasurementLabel).includes(k)
    );
    if (!hasOverlap) continue;
    let bestRowIndex = 0;
    let bestScore = Infinity;
    for (let i = 0; i < product.sizeTable.rows.length; i++) {
      const m = extractMeasurements(product.sizeTable.headers, product.sizeTable.rows[i]);
      const score = scoreMeasurementSimilarity(sourceMeasurements, m);
      if (score < bestScore) {
        bestScore = score;
        bestRowIndex = i;
      }
    }
    if (bestScore < Infinity) results.push({ product, rowIndex: bestRowIndex, score: bestScore });
  }
  return results.sort((a, b) => a.score - b.score).slice(0, maxResults);
};
