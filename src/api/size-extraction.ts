import { authenticatedFetch } from './shared';
import type { ProductMetadataPayload } from '../types';

export type SizeExtractionResult = NonNullable<ProductMetadataPayload['sizeExtraction']>;
type Job = { result: SizeExtractionResult; receipt: string; dispatch: { url: string; token: string } | null };

async function pause(signal: AbortSignal, ms: number) {
  await new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}
export async function runSizeExtraction(url: string, signal: AbortSignal, onProgress: (result: SizeExtractionResult) => void, refresh = false) {
  let response = await authenticatedFetch('/api/size-extractions', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, refresh }), signal,
  });
  if (!response.ok) throw new Error('Size extraction unavailable');
  let job: Job = await response.json();
  const deadline = Date.now() + 240000;
  while (!signal.aborted) {
    onProgress(job.result);
    if (job.result.status !== 'processing') return;
    if (Date.now() >= deadline) throw new Error('Size extraction timed out');
    if (job.dispatch) {
      // Direct submission allows the free service to wake without holding a Vercel request.
      try {
        const dispatched = await fetch(job.dispatch.url, {
          method: 'POST', credentials: 'omit', headers: { Authorization: `Bearer ${job.dispatch.token}` },
          signal: AbortSignal.any([signal, AbortSignal.timeout(70000)]),
        });
        if ([401, 403].includes(dispatched.status)) throw new Error('Worker authorization failed');
      } catch (error) { if (signal.aborted) throw error; /* A wakeup timeout can be retried with the same job. */ }
    }
    await pause(signal, 3000);
    response = await authenticatedFetch('/api/size-extractions', {
      headers: { 'x-extraction-receipt': job.receipt }, signal, cache: 'no-store',
    });
    if (!response.ok) throw new Error('Unable to read extraction status');
    job = await response.json();
  }
}
