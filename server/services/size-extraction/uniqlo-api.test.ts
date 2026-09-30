import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeFetch } from './network.mjs';
import { extractUniqloSizeChart } from './extract.mjs';

vi.mock('./network.mjs', async importOriginal => ({
  ...await importOriginal<typeof import('./network.mjs')>(), safeFetch: vi.fn(),
}));

const url = 'https://www.uniqlo.com/kr/ko/products/E486167-000/00?colorDisplayCode=32';
const sizeChart = ['S', 'M'].map((name, index) => ({ name, sizeParts: [
  { name: '전체 길이', measurements: [{ value: String(64 + index * 2), unit: 'cm' }, { value: '25', unit: 'inch' }] },
  { name: '가슴너비', measurements: [{ value: String(58 + index * 3), unit: 'cm' }] },
  { name: '등 중심부터 소매까지 길이', measurements: [{ value: String(83 + index * 2.5), unit: 'cm' }] },
] }));
const response = (productId = 'E486167-000') => ({
  status: 200, headers: { 'content-type': 'application/json' }, url,
  body: Buffer.from(JSON.stringify({ status: 'ok', result: [{ productId, sizeChart, bodyMeasurements: [{ name: '몸 둘레', value: '999' }] }] })),
});
afterEach(() => vi.resetAllMocks());

describe('Uniqlo size API extraction', () => {
  it('selects cm garment dimensions for the exact product ID', async () => {
    vi.mocked(safeFetch).mockResolvedValue(response());
    const result = await extractUniqloSizeChart(url);
    expect(result).toMatchObject({ status: 'found', source: 'site_api', table: {
      headers: ['사이즈', 'S', 'M'], rows: [['총장', '64', '66'], ['가슴', '58', '61'], ['소매', '83', '85.5']],
    } });
    const requested = new URL(vi.mocked(safeFetch).mock.calls[0][0]);
    expect(requested.origin).toBe('https://www.uniqlo.com');
    expect(requested.searchParams.get('productIdsWithColorCode')).toBe('E486167-000');
    expect(requested.searchParams.get('includeBodyMeasurements')).toBe('false');
  });

  it('rejects a different product even when its table is valid', async () => {
    vi.mocked(safeFetch).mockResolvedValue(response('E999999-000'));
    expect(await extractUniqloSizeChart(url)).toBeNull();
  });

  it('keeps non-Uniqlo URLs on the existing extraction path', async () => {
    expect(await extractUniqloSizeChart(url.replace('www.uniqlo.com', 'shop.example.com'))).toBeNull();
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('falls back when the API is blocked', async () => {
    vi.mocked(safeFetch).mockResolvedValue({ ...response(), status: 403 });
    expect(await extractUniqloSizeChart(url)).toBeNull();
  });
});
