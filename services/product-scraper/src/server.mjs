import http from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { signCallback, verifyToken } from '../../../server/services/size-extraction/tokens.mjs';
import { extractSizeChart, closeBrowser } from './extract-size-chart.mjs';

const secret = process.env.SIZE_EXTRACTION_SECRET || '';
const callbackUrl = process.env.SIZE_EXTRACTION_CALLBACK_URL || '';
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean));
if (secret.length < 32 || !callbackUrl.startsWith('https://') || !allowedOrigins.size) throw new Error('Missing scraper configuration');
let busy = false;
let active;
async function callback(payload) {
  const raw = JSON.stringify(payload);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const timestamp = String(Date.now());
      const response = await fetch(callbackUrl, {
        method: 'POST', signal: AbortSignal.timeout(55000), redirect: 'error',
        headers: { 'Content-Type': 'application/json', 'x-extraction-timestamp': timestamp, 'x-extraction-signature': signCallback(raw, timestamp, secret) }, body: raw,
      });
      if (response.ok) return await response.json();
      console.error(JSON.stringify({ event: 'callback_http_error', phase: payload.phase, jobId: payload.jobId, status: response.status, target: callbackUrl }));
      if ([401, 409].includes(response.status)) throw new Error('Callback rejected');
    } catch (error) {
      console.error(JSON.stringify({ event: 'callback_request_failed', phase: payload.phase, jobId: payload.jobId, target: callbackUrl, message: error.message }));
    }
    await delay((attempt + 1) * 1000);
  }
  throw new Error('Callback unavailable');
}
const server = http.createServer(async (req, res) => {
  const reply = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
  if (req.url === '/health' && req.method === 'GET') return reply(200, { ok: true });
  const origin = req.headers.origin;
  if (!origin || !allowedOrigins.has(origin)) return reply(403, { error: 'Origin denied' });
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return reply(204, null);
  }
  if (req.url !== '/jobs' || req.method !== 'POST') return reply(404, { error: 'Not found' });
  let claims;
  try { claims = verifyToken(String(req.headers.authorization || '').replace(/^Bearer /, ''), secret, 'scrape'); }
  catch { console.error(JSON.stringify({ event: 'worker_token_rejected' })); return reply(401, { error: 'Invalid token' }); }
  if (busy) { res.setHeader('Retry-After', '5'); return reply(429, { error: 'Busy' }); }
  busy = true;
  try {
    const identity = { jobId: claims.jobId, attempt: claims.attempt };
    console.info(JSON.stringify({ event: 'job_claim_requested', jobId: claims.jobId }));
    const claim = await callback({ ...identity, phase: 'claim' });
    if (!claim.claimed) { busy = false; return reply(202, { accepted: true }); }
    active = (async () => {
      const result = await extractSizeChart(claims.url);
      await callback({ ...identity, phase: 'complete', result });
    })().catch(() => { console.error('Size extraction failed; durable lease will expire', claims.jobId); }).finally(() => { busy = false; active = undefined; });
    return reply(202, { accepted: true });
  } catch (error) { console.error(JSON.stringify({ event: 'job_claim_failed', jobId: claims.jobId, message: error.message })); busy = false; return reply(503, { error: 'Unable to claim job' }); }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(Number(process.env.PORT || 10000), '0.0.0.0');
process.on('SIGTERM', async () => {
  server.close();
  await Promise.race([active || Promise.resolve(), delay(20000)]);
  await closeBrowser();
  process.exit(0);
});
