import { getRegisteredRequestUser, hasValidMutationOrigin } from '../../../server/auth/request-user';
import { describeJob, extractionConfig, finishJob, getJob, startJob } from '../../../server/services/size-extraction/jobs';
import { emptyResult, extractStatic } from '../../../server/services/size-extraction/extract.mjs';
import { extractChartImage } from '../../../server/services/size-extraction/ocr';
import type { ProductMetadataPayload } from '../../../src/types';

type SizeExtractionResult = NonNullable<ProductMetadataPayload['sizeExtraction']>;

export const maxDuration = 60;
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (!hasValidMutationOrigin(request)) return Response.json({ error: 'Invalid origin' }, { status: 403 });
  const user = await getRegisteredRequestUser(request);
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.url !== 'string' || body.url.length > 4096) return Response.json({ error: 'Invalid URL' }, { status: 400 });
    const { job, leader } = await startJob(body.url, user.id, body.refresh === true);
    if (leader) {
      let result: SizeExtractionResult = emptyResult() as SizeExtractionResult;
      try {
        const extracted = await extractStatic(job.normalized_url);
        result = extracted.result as SizeExtractionResult;
        if (result.status !== 'found' && extracted.images[0]) {
          result = await extractChartImage(extracted.images[0]) as SizeExtractionResult;
        }
      } catch { result = emptyResult('failed', 'static_extraction_failed') as SizeExtractionResult; }
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
