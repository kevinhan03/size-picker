import { getRegisteredRequestUser, hasValidMutationOrigin } from '../../../server/auth/request-user';
import { describeJob, extractionConfig, finishJob, getJob, startJob } from '../../../server/services/size-extraction/jobs';
import { emptyResult, extractStatic } from '../../../server/services/size-extraction/extract.mjs';
import { extractChartImage } from '../../../server/services/size-extraction/ocr';
import type { ProductMetadataPayload } from '../../../src/types';

type SizeExtractionResult = NonNullable<ProductMetadataPayload['sizeExtraction']>;

export const maxDuration = 60;
export const runtime = 'nodejs';

async function extractStaticResult(url: string, useLocalBrowser = false): Promise<SizeExtractionResult> {
  let result: SizeExtractionResult = emptyResult() as SizeExtractionResult;
  try {
    const extracted = await extractStatic(url);
    result = extracted.result as SizeExtractionResult;
    let images = extracted.images;
    if (process.env.NODE_ENV === 'development' && useLocalBrowser && result.status !== 'found') {
      const { extractSizeChart } = await import('../../../services/product-scraper/src/extract-size-chart.mjs');
      const dynamic = await extractSizeChart(url);
      result = dynamic.result as SizeExtractionResult;
      images = dynamic.images.length ? dynamic.images : images;
    }
    if (result.status !== 'found' && images[0]) {
      result = await extractChartImage(images[0]) as SizeExtractionResult;
    }
  } catch {
    result = emptyResult('failed', 'static_extraction_failed') as SizeExtractionResult;
  }
  return result;
}

function developmentResponse(result: SizeExtractionResult) {
  // The client stops polling as soon as a terminal result is returned. This
  // deliberately has no receipt or worker dispatch: the local server runs the
  // same DNS-pinned browser extractor without copying production secrets.
  return Response.json({ result, jobId: null, receipt: '', dispatch: null });
}

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return Response.json({ error: 'Invalid origin' }, { status: 403 });
  const user = await getRegisteredRequestUser(request);
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.url !== 'string' || body.url.length > 4096) return Response.json({ error: 'Invalid URL' }, { status: 400 });
    if (process.env.NODE_ENV === 'development') {
      return developmentResponse(await extractStaticResult(body.url, true));
    }
    const started = await startJob(body.url, user.id, body.refresh === true);
    const { job, leader } = started;
    if (leader) {
      let result = await extractStaticResult(String(job.normalized_url || body.url));
      const { db, worker } = extractionConfig();
      if (result.status === 'found' || !worker) {
        if (result.status !== 'found' && !worker) {
          result = emptyResult('failed', 'dynamic_service_not_configured') as SizeExtractionResult;
        }
        await finishJob(job.id, job.attempt, result, 'static');
      } else {
        const { error } = await db.from('product_url_extractions').update({ status: 'queued', updated_at: new Date().toISOString() }).eq('id', job.id).eq('attempt', job.attempt).eq('status', 'static');
        if (error) throw new Error('Unable to queue extraction');
      }
      const { data, error } = await db.from('product_url_extractions').select('*').eq('id', job.id).single();
      if (error) throw new Error('Unable to read extraction');
      return Response.json(describeJob(data, user.id));
    }
    return Response.json(describeJob(job, user.id));
  } catch (error) {
    const limited = error instanceof Error && error.message === 'extraction_rate_limit';
    return Response.json({ error: limited ? 'Too many extraction requests' : 'Size extraction unavailable' }, { status: limited ? 429 : 503 });
  }
}
export async function GET(request: Request) {
  const user = await getRegisteredRequestUser(request);
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
  try {
    const job = await getJob(request.headers.get('x-extraction-receipt') || '', user.id);
    return Response.json(describeJob(job, user.id), { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Job unavailable' }, { status: 404 }); }
}
