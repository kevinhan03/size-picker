import { afterEach, describe, expect, it, vi } from 'vitest';
import { authenticatedFetch } from './shared';
import { runSizeExtraction } from './size-extraction';

vi.mock('./shared', () => ({ authenticatedFetch: vi.fn() }));

const job = {
  result: { status: 'processing', table: null, source: null, confidence: null, sourceUrl: null },
  receipt: 'receipt',
  dispatch: { url: 'https://scraper.example.com/jobs', token: 'scoped-worker-token' },
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('size extraction worker dispatch', () => {
  it.each([401, 403])('stops on worker authorization rejection %s', async status => {
    vi.mocked(authenticatedFetch).mockResolvedValueOnce(Response.json(job));
    const fetchWorker = vi.fn().mockResolvedValue(new Response(null, { status }));
    vi.stubGlobal('fetch', fetchWorker);

    await expect(runSizeExtraction('https://shop.example.com/item', new AbortController().signal, vi.fn()))
      .rejects.toThrow('Worker authorization failed');
    expect(authenticatedFetch).toHaveBeenCalledTimes(1);
    expect(fetchWorker).toHaveBeenCalledTimes(1);
  });

  it('continues polling after a transient worker wakeup failure', async () => {
    vi.useFakeTimers();
    const result = { ...job.result, status: 'not_found' };
    vi.mocked(authenticatedFetch)
      .mockResolvedValueOnce(Response.json(job))
      .mockResolvedValueOnce(Response.json({ ...job, result, dispatch: null }));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const onProgress = vi.fn();
    const extraction = runSizeExtraction('https://shop.example.com/item', new AbortController().signal, onProgress);

    await vi.advanceTimersByTimeAsync(3000);
    await extraction;
    expect(onProgress).toHaveBeenLastCalledWith(result);
    expect(authenticatedFetch).toHaveBeenCalledTimes(2);
  });
});
