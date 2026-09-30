import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export function isPublicIPv4(address) {
  if (isIP(address) !== 4) return false;
  const [a, b, c] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}

export function publicUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.port || !url.hostname.includes('.') || /(?:^|\.)(?:localhost|local|internal)\.?$/i.test(url.hostname) ||
      (isIP(url.hostname) && !isPublicIPv4(url.hostname)) || url.hostname.includes(':')) {
    throw new Error('Unsafe URL');
  }
  url.hash = '';
  return url;
}

export function normalizeExtractionUrl(value) {
  const url = publicUrl(value);
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
  }
  // Preserve variant, locale and product query parameters.
  url.searchParams.sort();
  return url.href;
}

// Resolve every address before a browser fallback is allowed to connect. The
// caller pins Chromium to this exact public IPv4 address, so a host cannot use
// DNS rebinding after it has passed URL validation.
export async function resolvePublicIPv4(value, signal) {
  const url = publicUrl(value);
  const addresses = await Promise.race([
    lookup(url.hostname, { all: true, family: 4 }),
    new Promise((_, reject) => {
      signal?.addEventListener('abort', () => reject(new Error('Fetch timed out')), { once: true });
    }),
  ]);
  if (!addresses.length || addresses.some(({ address }) => !isPublicIPv4(address))) {
    throw new Error('Unsafe DNS address');
  }
  return { url, address: addresses[0].address };
}

/** Resolve once and pin the connection to the checked address (DNS rebinding safe).
 * IPv6 is deliberately not supported by this crawler. Bodies and total time are bounded.
 */
export async function safeFetch(value, options = {}) {
  const { timeoutMs = 10000, maxBytes = 4 * 1024 * 1024, redirects = 4, signal,
    method = 'GET', body, headers = {}, followRedirects = true } = options;
  const deadline = Date.now() + timeoutMs;
  let url = publicUrl(value);
  for (let hop = 0; hop <= redirects; hop++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('Fetch timed out');
    const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(remaining)]) : AbortSignal.timeout(remaining);
    const resolved = await resolvePublicIPv4(url.href, requestSignal);
    const pinned = resolved.address;
    const response = await new Promise((resolve, reject) => {
      const request = (url.protocol === 'https:' ? https : http).request(url, {
        method, signal: requestSignal, agent: false, family: 4,
        lookup: (_hostname, _options, cb) => cb(null, pinned, 4),
        headers: { 'user-agent': 'Mozilla/5.0', ...headers, 'accept-encoding': 'identity', host: url.host },
      }, (incoming) => {
        let length = 0;
        const chunks = [];
        incoming.on('data', (chunk) => {
          length += chunk.length;
          if (length > maxBytes) incoming.destroy(new Error('Response too large'));
          else chunks.push(chunk);
        });
        incoming.on('error', reject);
        incoming.on('end', () => resolve({ status: incoming.statusCode, headers: incoming.headers, body: Buffer.concat(chunks), url: url.href }));
      });
      request.on('error', reject);
      request.end(body);
    });
    if (followRedirects && [301, 302, 303, 307, 308].includes(response.status) && response.headers.location) {
      url = publicUrl(new URL(response.headers.location, url).href);
      continue;
    }
    if (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') throw new Error('Unsupported content encoding');
    return response;
  }
  throw new Error('Too many redirects');
}
