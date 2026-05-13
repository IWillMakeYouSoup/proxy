/**
 * Parse the response buffer as JSON, call fn(body), write the result back.
 * Automatically updates content-length and sets content-type to application/json.
 *
 * Usage:
 *   transformJson(upstreamRes, body => ({ ...body, extra: 'injected' }));
 *   transformJson(upstreamRes, body => { delete body.sensitiveField; return body; });
 */
export function transformJson(upstreamRes, fn) {
  const raw = upstreamRes.data?.toString('utf8')?.trim();
  if (!raw) return upstreamRes;

  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    return upstreamRes;
  }

  const updated = fn(json);
  const buf     = Buffer.from(JSON.stringify(updated));
  upstreamRes.data = buf;
  upstreamRes.headers['content-type']   = 'application/json; charset=utf-8';
  upstreamRes.headers['content-length'] = String(buf.length);
  return upstreamRes;
}
