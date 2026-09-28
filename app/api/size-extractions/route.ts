import { getRegisteredRequestUser, hasValidMutationOrigin } from '../../../server/auth/request-user';
import { describeJob, extractionConfig, finishJob, getJob, startJob } from '../../../server/services/size-extraction/jobs';
import { emptyResult, extractStatic } from '../../../server/services/size-extraction/extract.mjs';
import { extractChartImage } from '../../../server/services/size-extraction/ocr';
import type { ProductMetadataPayload } from '../../../src/types';

type SizeExtractionResult = NonNullable<ProductMetadataPayload['sizeExtraction']>;

export const maxDuration = 60;
export const runtime = 'nodejs';

async function extractStaticResult(url: string): Promise<SizeExtractionResult> {
  let result: SizeExtractionResult = emptyResult() as SizeExtractionResult;
  try {
    const extracted = await extractStatic(url);
    result = extracted.result as SizeExtractionResult;
    if (result.status !== 'found' && extracted.images[0]) {
      result = await extractChartImage(extracted.images[0]) as SizeExtractionResult;
    }
  } catch {
    result = emptyResult('failed', 'static_extraction_failed') as SizeExtractionResult;
  }
  return result;
}

function developmentStaticResponse(result: SizeExtractionResult) {
  // The client stops polling as soon as a terminal result is returned. This
  // deliberately has no receipt or worker dispatch: local development can
  // exercise static extraction without copying production service secrets.
  return Response.json({ result, jobId: null, receipt: '', dispatch: null });
}

export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return Response.json({ error: 'Invalid origin' }, { status: 403 });
  const user = await getRegisteredRequestUser(request);
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.url !== 'string' || body.url.length > 4096) return Response.json({ error: 'Invalid URL' }, { status: 400 });
    let started: Awaited<ReturnType<typeof startJob>>;
    try {
      started = await startJob(body.url, user.id, body.refresh === true);
    } catch (error) {
      // Production always uses the signed persistent queue. A developer who
      // has not copied deployment-only secrets can still verify public, static
      // charts locally without weakening the deployed endpoint.
      if (process.env.NODE_ENV !== 'production') {
        return developmentStaticResponse(await extractStaticResult(body.url));
      }
      throw error;
    }
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
