import { extractionConfig, finishJob } from '../../../../server/services/size-extraction/jobs';
import { verifyCallback } from '../../../../server/services/size-extraction/tokens.mjs';
import { emptyResult, validateTable } from '../../../../server/services/size-extraction/extract.mjs';
import { publicUrl } from '../../../../server/services/size-extraction/network.mjs';
import { extractChartImage } from '../../../../server/services/size-extraction/ocr';
import type { ProductMetadataPayload } from '../../../../src/types';

type SizeExtractionResult = NonNullable<ProductMetadataPayload['sizeExtraction']>;

export const maxDuration = 60;
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const { db, secret } = extractionConfig();
    if (Number(request.headers.get('content-length')) > 100000) return new Response(null, { status: 413 });
    const raw = await request.text();
    if (raw.length > 100000 || !verifyCallback(raw, request.headers.get('x-extraction-timestamp'), request.headers.get('x-extraction-signature'), secret)) return new Response(null, { status: 401 });
    const body = JSON.parse(raw);
    const { data: job, error } = await db.from('product_url_extractions').select('*').eq('id', body.jobId).eq('attempt', body.attempt).maybeSingle();
    if (error || !job || Date.parse(job.expires_at) < Date.now()) return new Response(null, { status: 409 });
    if (body.phase === 'claim') {
      const { data, error: claimError } = await db.from('product_url_extractions').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', job.id).eq('attempt', job.attempt).eq('status', 'queued').select('id');
      if (claimError) return new Response(null, { status: 503 });
      return Response.json({ claimed: Boolean(data?.length) });
    }
    if (body.phase !== 'complete') return new Response(null, { status: 400 });
    if (['completed', 'not_found', 'failed'].includes(job.status)) return Response.json({ ok: true });
    if (job.status !== 'processing') return new Response(null, { status: 409 });
    // Store the raw result before OCR. A failed callback can safely be retried.
    const { error: persistError } = await db.from('product_url_extractions').update({ raw_result: body.result }).eq('id', job.id).eq('attempt', job.attempt).eq('status', 'processing');
    if (persistError) return new Response(null, { status: 503 });
    let result: SizeExtractionResult = emptyResult() as SizeExtractionResult;
    const candidate = body.result?.result;
    const table = validateTable(candidate?.table);
    if (candidate?.status === 'found' && table && ['site_api', 'embedded_json', 'dom_table'].includes(candidate.source)) {
      result = {
        status: 'found',
        table,
        source: candidate.source,
        confidence: 'medium',
        sourceUrl: publicUrl(candidate.sourceUrl).href,
        errorCode: null,
      };
    } else if (body.result?.images?.[0]) {
      result = await extractChartImage(publicUrl(body.result.images[0]).href) as SizeExtractionResult;
    } else if (body.result?.errorCode) {
      result = emptyResult('failed', 'browser_extraction_failed') as SizeExtractionResult;
    }
    await finishJob(job.id, job.attempt, result, 'processing');
    return Response.json({ ok: true });
  } catch { return Response.json({ error: 'Callback failed' }, { status: 503 }); }
}
