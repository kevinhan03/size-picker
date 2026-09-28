import { chromium } from 'playwright';
import { safeFetch, publicUrl } from '../../../server/services/size-extraction/network.mjs';
import { readPage, emptyResult } from '../../../server/services/size-extraction/extract.mjs';

let browserPromise;
async function browser() {
  if (!browserPromise) browserPromise = chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-quic', '--disable-background-networking'],
  }).then(value => { value.on('disconnected', () => { browserPromise = undefined; }); return value; }).catch(error => { browserPromise = undefined; throw error; });
  return browserPromise;
}
export async function closeBrowser() {
  if (browserPromise) await (await browserPromise).close();
}
export async function extractSizeChart(url) {
  publicUrl(url);
  const context = await (await browser()).newContext({ serviceWorkers: 'block', acceptDownloads: false, viewport: { width: 1280, height: 1600 } });
  const deadline = AbortSignal.timeout(45000);
  const terminate = () => { void context.close(); };
  deadline.addEventListener('abort', terminate, { once: true });
  const apiJson = [];
  let count = 0;
  let transferred = 0;
  try {
    await context.routeWebSocket('**/*', socket => socket.close());
    // Chromium never connects to arbitrary destinations itself. Every HTTP request
    // is fulfilled by the pinned-DNS fetcher, including redirects and child frames.
    await context.route('**/*', async route => {
      try {
        const request = route.request();
        if (++count > 150 || transferred > 18 * 1024 * 1024 || !['GET', 'HEAD'].includes(request.method()) || ['media', 'font'].includes(request.resourceType())) return await route.abort();
        const response = await safeFetch(request.url(), {
          method: request.method(), signal: deadline, timeoutMs: 8000, maxBytes: 3 * 1024 * 1024,
          headers: { accept: request.headers().accept || '*/*' }, followRedirects: false,
        });
        transferred += response.body.length;
        const contentType = String(response.headers['content-type'] || '');
        if (contentType.includes('json') && apiJson.length < 12 && response.body.length < 500000 && /size|measure|spec/i.test(request.url())) {
          try { apiJson.push(JSON.parse(response.body.toString())); } catch { /* Not JSON. */ }
        }
        const headers = {};
        for (const key of ['content-type', 'location', 'access-control-allow-origin', 'access-control-allow-credentials']) {
          if (typeof response.headers[key] === 'string') headers[key] = response.headers[key];
        }
        await route.fulfill({ status: response.status, headers, body: response.body });
      } catch { await route.abort().catch(() => {}); }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    const read = async () => readPage(await page.content(), page.url(), apiJson);
    const initial = await read();
    if (initial.result.status === 'found') return initial;
    // Static extraction already visits linked guides first. This covers guides
    // whose table only appears after their own client-side application starts.
    for (const linkedGuide of initial.links.slice(0, 2)) {
      try {
        await page.goto(publicUrl(linkedGuide).href, { waitUntil: 'domcontentloaded', timeout: 12000 });
        const found = await read();
        if (found.result.status === 'found' || found.images.length) return found;
      } catch { /* Try the in-page trigger next. */ }
    }
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 }).catch(() => {});
    const triggers = page.getByRole('button', { name: /size\s*(?:guide|chart)|사이즈\s*(?:가이드|표|정보)|실측/i })
      .or(page.getByRole('link', { name: /size\s*(?:guide|chart)|사이즈\s*(?:가이드|표|정보)|실측/i }));
    for (let index = 0; index < Math.min(await triggers.count(), 5); index++) {
      const trigger = triggers.nth(index);
      if (!await trigger.isVisible()) continue;
      await trigger.click({ timeout: 2500 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {});
      const found = await read();
      if (found.result.status === 'found' || found.images.length) return found;
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {});
    return await read();
  } catch {
    return { result: emptyResult('failed'), images: [], errorCode: 'browser_extraction_failed' };
  } finally {
    deadline.removeEventListener('abort', terminate);
    await context.close().catch(() => {});
  }
}
