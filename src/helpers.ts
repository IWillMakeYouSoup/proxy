import type { AxiosResponse } from 'axios';

/**
 * Parse the response buffer as JSON, call fn(body), write the result back.
 * Automatically updates content-length and sets content-type to application/json.
 */
export function transformJson(
  upstreamRes: AxiosResponse,
  fn: (body: any) => any,
): AxiosResponse {
  const raw = (upstreamRes.data as Buffer | undefined)?.toString('utf8')?.trim();
  if (!raw) return upstreamRes;

  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    return upstreamRes;
  }

  const updated = fn(json);
  const buf = Buffer.from(JSON.stringify(updated));
  upstreamRes.data = buf;
  upstreamRes.headers['content-type'] = 'application/json; charset=utf-8';
  upstreamRes.headers['content-length'] = String(buf.length);
  return upstreamRes;
}
