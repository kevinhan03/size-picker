import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../../app/api/size-extractions/route';
import { startJob } from './jobs';
import { emptyResult, extractStatic } from './extract.mjs';
import { extractSizeChart } from '../../../services/product-scraper/src/extract-size-chart.mjs';
import { extractChartImage } from './ocr';

vi.mock('../../auth/request-user', () => ({
  hasValidMutationOrigin: vi.fn(() => true),
  getRegisteredRequestUser: vi.fn(async () => ({ id: 'registered-test-user' })),
}));
vi.mock('./jobs', () => ({ startJob: vi.fn(), describeJob: vi.fn(), extractionConfig: vi.fn(), finishJob: vi.fn(), getJob: vi.fn() }));
vi.mock('./extract.mjs', async importOriginal => ({
  ...await importOriginal<typeof import('./extract.mjs')>(), extractStatic: vi.fn(),
}));
vi.mock('../../../services/product-scraper/src/extract-size-chart.mjs', () => ({ extractSizeChart: vi.fn() }));
vi.mock('./ocr', () => ({ extractChartImage: vi.fn() }));

const url = 'https://www.uniqlo.com/kr/ko/products/E486167-000/00';
const found = {
  ...emptyResult(), status: 'found' as const, source: 'site_api' as const, sourceUrl: url,
  table: { headers: ['사이즈', 'S', 'M'], rows: [['총장', '64', '66'], ['가슴', '58', '61']] },
};
const request = () => new Request('http://localhost:3000/api/size-extractions', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }),
});

beforeEach(() => { vi.stubEnv('NODE_ENV', 'development'); });
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); });

describe('local size extraction', () => {
  it('runs the browser locally for a dynamic chart without dispatching a Render job', async () => {
    vi.mocked(extractStatic).mockResolvedValue({ result: emptyResult(), images: ['https://shop.example.com/color-chip.jpg'] });
    vi.mocked(extractSizeChart).mockResolvedValue({ result: found, images: [], links: [] });

    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ result: found, dispatch: null, receipt: '', jobId: null });
    expect(extractSizeChart).toHaveBeenCalledWith(url);
    expect(startJob).not.toHaveBeenCalled();
    expect(extractChartImage).not.toHaveBeenCalled();
  });

  it('keeps static charts fast without launching a browser', async () => {
    vi.mocked(extractStatic).mockResolvedValue({ result: found, images: [] });
    expect((await (await POST(request())).json()).result).toEqual(found);
    expect(extractSizeChart).not.toHaveBeenCalled();
  });

  it('keeps production on the signed queue when configuration is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.mocked(startJob).mockRejectedValue(new Error('Size extraction is not configured'));
    expect((await POST(request())).status).toBe(503);
    expect(extractSizeChart).not.toHaveBeenCalled();
  });
});
