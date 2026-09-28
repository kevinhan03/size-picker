import { supabase } from '../../lib/supabase.js';
import { normalizeExtractionUrl } from './network.mjs';
import { signToken, verifyToken } from './tokens.mjs';
import { emptyResult } from './extract.mjs';

export function extractionConfig() {
  const secret = process.env.SIZE_EXTRACTION_SECRET || '';
  if (secret.length < 32) throw new Error('Size extraction is not configured');
  if (!supabase) throw new Error('Database unavailable');
  return { secret, db: supabase, worker: process.env.SIZE_SCRAPER_URL || '' };
}
export async function startJob(url: string, userId: string, refresh = false) {
  const { db } = extractionConfig();
  const normalized = normalizeExtractionUrl(url);
  const { data, error } = await db.rpc('start_product_extraction', { p_url: normalized, p_user: userId, p_refresh: refresh });
  if (error) throw new Error(error.message.includes('extraction_rate_limit') ? 'extraction_rate_limit' : 'Extraction storage unavailable');
  return data;
}
// The receipt authorizes only its authenticated user; worker tokens never authorize callbacks.
export function describeJob(job: Record<string, unknown>, userId: string) {
  const { secret, worker } = extractionConfig();
  const claims = { jobId: job.id, attempt: job.attempt, exp: Math.floor(Date.now() / 1000) + 900 };
  const expired = Date.parse(String(job.expires_at)) <= Date.now();
  const terminal = ['completed', 'not_found', 'failed'].includes(String(job.status));
  return {
    result: expired ? emptyResult('failed', 'job_expired') : terminal ? job.result_json || emptyResult('failed') : emptyResult('processing'),
    jobId: job.id,
    receipt: signToken({ ...claims, purpose: 'status', userId }, secret),
    dispatch: !expired && job.status === 'queued' && worker ? {
      url: new URL('/jobs', worker).href,
      token: signToken({ ...claims, purpose: 'scrape', url: job.normalized_url }, secret),
    } : null,
  };
}
export async function getJob(receipt: string, userId: string) {
  const { db, secret } = extractionConfig();
  const claims = verifyToken(receipt, secret, 'status');
  if (claims.userId !== userId) throw new Error('Invalid receipt');
  const { data, error } = await db.from('product_url_extractions').select('*').eq('id', claims.jobId).eq('attempt', claims.attempt).maybeSingle();
  if (error || !data) throw new Error('Job not found');
  return data;
}
export async function finishJob(id: string, attempt: string, result: unknown, fromStatus: string) {
  const { db } = extractionConfig();
  const typed = result as { status: string; errorCode?: string };
  const status = typed.status === 'found' ? 'completed' : typed.status === 'not_found' ? 'not_found' : 'failed';
  const ttl = status === 'completed' ? 86400000 : status === 'not_found' ? 3600000 : 60000;
  const { error } = await db.from('product_url_extractions').update({
    status, result_json: result, error_code: typed.errorCode || null,
    updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + ttl).toISOString(),
  }).eq('id', id).eq('attempt', attempt).eq('status', fromStatus);
  if (error) throw new Error('Unable to persist extraction');
}
