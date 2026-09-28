import { createHmac, timingSafeEqual } from 'node:crypto';

function signature(value, secret) {
  if (!secret || secret.length < 32) throw new Error('SIZE_EXTRACTION_SECRET must have at least 32 characters');
  return createHmac('sha256', secret).update(value).digest('base64url');
}
function equal(a, b) {
  return typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export function signToken(claims, secret) {
  const encoded = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${encoded}.${signature(encoded, secret)}`;
}
export function verifyToken(token, secret, purpose) {
  if (typeof token !== 'string' || token.length > 10000) throw new Error('Invalid token');
  const [encoded, signed, extra] = token.split('.');
  if (extra || !equal(signed, signature(encoded, secret))) throw new Error('Invalid token');
  const claims = JSON.parse(Buffer.from(encoded, 'base64url').toString());
  if (claims.purpose !== purpose || !Number.isFinite(claims.exp) || claims.exp < Date.now() / 1000) throw new Error('Expired token');
  return claims;
}
export function signCallback(rawBody, timestamp, secret) {
  return signature(`callback:${timestamp}:${rawBody}`, secret);
}
export function verifyCallback(rawBody, timestamp, signed, secret) {
  return Math.abs(Date.now() - Number(timestamp)) < 120000 && equal(signed, signCallback(rawBody, timestamp, secret));
}
