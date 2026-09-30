import { chromium } from 'playwright';
import { safeFetch, publicUrl, resolvePublicIPv4 } from '../../../server/services/size-extraction/network.mjs';
import { readPage, emptyResult, extractUniqloSizeChart } from '../../../server/services/size-extraction/extract.mjs';

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

// Some storefronts serve a bot-check page to Node HTTP clients but permit a
// normal Chromium navigation. This fallback still never lets Chromium resolve
// or reach an arbitrary host: the original host is DNS-checked and pinned to
// one public IPv4 address, while every cross-origin request is aborted.
async function extractWithPinnedSameOriginBrowser(value, outerSignal) {
  const resolved = await resolvePublicIPv4(value, outerSignal);
  const targetOrigin = resolved.url.origin;
  const directBrowser = await chromium.launch({
    headless: true,
    args: [
      '--disable-dev-shm-usage',
      '--disable-quic',
      '--disable-background-networking',
      `--host-resolver-rules=MAP ${resolved.url.hostname} ${resolved.address}, EXCLUDE localhost`,
    ],
  });
  const context = await directBrowser.newContext({ serviceWorkers: 'block', acceptDownloads: false, viewport: { width: 1280, height: 1600 } });
  const close = () => { void context.close(); };
  outerSignal?.addEventListener('abort', close, { once: true });
  const apiJson = [];
  let count = 0;
  try {
    await context.routeWebSocket('**/*', socket => socket.close());
    await context.route('**/*', async route => {
      try {
        const request = route.request();
        const requestUrl = publicUrl(request.url());
        if (++count > 150 || requestUrl.origin !== targetOrigin || !['GET', 'HEAD'].includes(request.method()) || ['media', 'font', 'image'].includes(request.resourceType())) return await route.abort();
        await route.continue();
      } catch { await route.abort().catch(() => {}); }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.on('response', async response => {
      try {
        if (apiJson.length >= 12 || !/size|measure|spec/i.test(response.url()) || !String(response.headers()['content-type'] || '').includes('json')) return;
        const body = await response.body();
        if (body.length < 500000) apiJson.push(JSON.parse(body.toString()));
      } catch { /* Ignore non-readable responses. */ }
    });
    await page.goto(resolved.url.href, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
    const read = async () => readPage(await page.content(), page.url(), apiJson);
    let found = await read();
    if (found.result.status === 'found') return found;
    const triggers = page.getByRole('button', { name: /size\s*(?:guide|chart)|사이즈\s*(?:가이드|표|정보)|실측/i })
      .or(page.getByRole('link', { name: /size\s*(?:guide|chart)|사이즈\s*(?:가이드|표|정보)|실측/i }));
    for (let index = 0; index < Math.min(await triggers.count(), 5); index++) {
      const trigger = triggers.nth(index);
      if (!await trigger.isVisible()) continue;
      await trigger.click({ timeout: 2500 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {});
      found = await read();
      if (found.result.status === 'found' || found.images.length) return found;
    }
    return found;
  } finally {
    outerSignal?.removeEventListener('abort', close);
    await context.close().catch(() => {});
    await directBrowser.close().catch(() => {});
  }
}

export async function extractSizeChart(url) {
  const targetUrl = publicUrl(url);
  const deadline = AbortSignal.timeout(45000);
  const siteApi = await extractUniqloSizeChart(url, deadline);
  if (siteApi) return { result: siteApi, images: [], links: [] };
  // Uniqlo's size API needs Chromium's own session. Try the DNS-pinned,
  // same-origin browser before proxy navigation consumes the extraction budget.
  // Launch it before the shared browser to avoid two Chromium instances at once.
  if (targetUrl.hostname === 'www.uniqlo.com') {
    try {
      const direct = await extractWithPinnedSameOriginBrowser(url, deadline);
      if (direct.result.status === 'found') return direct;
    } catch (error) {
      console.error(JSON.stringify({ event: 'pinned_browser_extraction_failed', host: targetUrl.hostname, message: error.message }));
    }
  }
  if (deadline.aborted) return { result: emptyResult('failed'), images: [], errorCode: 'browser_extraction_failed' };
  const context = await (await browser()).newContext({ serviceWorkers: 'block', acceptDownloads: false, viewport: { width: 1280, height: 1600 } });
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
    const finalResult = await read();
    if (finalResult.result.status === 'found' || deadline.aborted) return finalResult;
    const directResult = await extractWithPinnedSameOriginBrowser(url, deadline).catch(() => null);
    return directResult || finalResult;
  } catch (error) {
    console.error(JSON.stringify({ event: 'browser_extraction_failed', host: targetUrl.hostname, message: error.message }));
    return { result: emptyResult('failed'), images: [], errorCode: 'browser_extraction_failed' };
  } finally {
    deadline.removeEventListener('abort', terminate);
    await context.close().catch(() => {});
  }
}
