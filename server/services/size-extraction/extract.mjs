import { safeFetch, publicUrl } from './network.mjs';
import { extractNextDataPayload, extractJsonObjectsFromApplicationScripts } from '../product-metadata/html.js';
import { extractSizeTableFromHtmlTables, extractSizeTableFromJsonData } from '../size-table/parsers.js';
import { alignAndValidateSizeTableByOptionLabels } from '../size-table/extraction.js';
import { extractImageCandidatesFromHtml, extractSizeChartPageCandidatesFromHtml, isLikelySizeChartImageUrl } from '../product-metadata/images.js';

/** @typedef {NonNullable<import('../../../src/types/index.ts').ProductMetadataPayload['sizeExtraction']>} SizeExtractionResult */

/**
 * @param {SizeExtractionResult['status']} [status]
 * @param {string|null} [errorCode]
 * @returns {SizeExtractionResult}
 */
export const emptyResult = (status = 'not_found', errorCode = null) => ({
  status,
  table: null,
  source: null,
  confidence: null,
  sourceUrl: null,
  errorCode,
});
export function validateTable(value) {
  if (!value || !Array.isArray(value.headers) || !Array.isArray(value.rows) ||
      value.headers.length > 32 || value.rows.length > 64 || value.rows.some(row => !Array.isArray(row) || row.length !== value.headers.length) ||
      [...value.headers, ...value.rows.flat()].some(cell => typeof cell !== 'string' || cell.length > 100)) return null;
  return alignAndValidateSizeTableByOptionLabels(value, []);
}
export function readPage(html, url, apiJson = []) {
  const json = [extractNextDataPayload(html), ...extractJsonObjectsFromApplicationScripts(html), ...apiJson].filter(Boolean);
  const jsonTable = validateTable(extractSizeTableFromJsonData(json));
  const domTable = jsonTable ? null : validateTable(extractSizeTableFromHtmlTables(html));
  const table = jsonTable || domTable;
  // The current editor assumes cm and garment dimensions. Never silently import a body or inch chart.
  // A product page can contain both a garment-size API response and an
  // unrelated body-measurement guide. Once a validated site/API table was
  // found, it is the product table and must not be discarded because of that
  // surrounding guide text.
  const ambiguous = !jsonTable && /(?:body measurements|신체\s*치수|인체\s*치수|\binches\b|\binch\b|단위\s*[:：]?\s*mm)/i.test(html);
  return {
    result: table && !ambiguous ? { status: 'found', table, source: jsonTable ? (apiJson.length ? 'site_api' : 'embedded_json') : 'dom_table', confidence: 'medium', sourceUrl: url, errorCode: null } : emptyResult('not_found', ambiguous ? 'ambiguous_measurements' : null),
    images: extractImageCandidatesFromHtml({ html, pageUrl: url, priorityPattern: /size|사이즈|치수|chart|measurement/i }).filter(isLikelySizeChartImageUrl).slice(0, 3),
    links: extractSizeChartPageCandidatesFromHtml({ html, pageUrl: url }).filter(link => {
      try { return publicUrl(link).origin === publicUrl(url).origin; } catch { return false; }
    }).slice(0, 2),
  };
}
export async function extractUniqloSizeChart(value, signal) {
  const url = publicUrl(value);
  const match = url.pathname.match(/^\/kr\/ko\/products\/(E\d{6}-\d{3})\/\d{2}\/?$/);
  if (url.hostname !== 'www.uniqlo.com' || !match) return null;
  const api = new URL('/kr/api/commerce/v5/ko/products/size-charts', url.origin);
  api.search = new URLSearchParams({
    productIdsWithColorCode: match[1], includeBodyMeasurements: 'false', simpleSizeChart: 'true', httpFailure: 'true',
  }).toString();
  try {
    const response = await safeFetch(api.href, { signal, timeoutMs: 8000, maxBytes: 500000, headers: { accept: 'application/json', referer: url.href } });
    if (response.status !== 200 || !String(response.headers['content-type']).includes('json')) return null;
    const payload = JSON.parse(response.body.toString('utf8'));
    const product = payload.result?.find(item => item.productId === match[1]);
    if (payload.status !== 'ok' || !Array.isArray(product?.sizeChart)) return null;
    // Only garment dimensions for the requested product; exclude body charts.
    const parsed = readPage('', url.href, [{ sizeChart: product.sizeChart }]);
    return parsed.result.status === 'found' ? parsed.result : null;
  } catch { return null; }
}
export async function extractStatic(url) {
  const visited = new Set();
  const queue = [url];
  const images = [];
  const signal = AbortSignal.timeout(18000);
  const siteApi = await extractUniqloSizeChart(url, signal);
  if (siteApi) return { result: siteApi, images: [] };
  while (queue.length && visited.size < 3) {
    const next = queue.shift();
    if (visited.has(next)) continue;
    visited.add(next);
    try {
      const response = await safeFetch(next, { signal, timeoutMs: 6000 });
      if (response.status !== 200 || !String(response.headers['content-type']).includes('text/html')) continue;
      const parsed = readPage(response.body.toString('utf8'), response.url);
      if (parsed.result.status === 'found') return { result: parsed.result, images: [] };
      if (!parsed.result.errorCode) images.push(...parsed.images);
      if (visited.size === 1) queue.push(...parsed.links);
    } catch { /* Partial extraction must not break product metadata. */ }
  }
  return { result: emptyResult(), images: [...new Set(images)].slice(0, 2) };
}
