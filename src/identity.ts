import type { Request } from 'express';

// Some upstreams use a single endpoint with the meaningful identifier in the
// body (e.g. Umbraco's GraphQL `content(url: "...")`). For those, deriveIdentity
// pulls the identifier out of the body and returns a synthetic path that's
// unique per logical resource. Used for storage filenames and replacer keys.
export function deriveIdentity(req: Request): string {
  const apiSegment = req.path.split('/').find(Boolean) ?? '';

  if (apiSegment === 'umbraco' && req.method.toUpperCase() === 'POST') {
    const query = extractGraphQLQuery(req.body);
    const match = query.match(/content\(\s*url:\s*"([^"]+)"/);
    if (match) {
      const contentPath = match[1].replace(/^\/+|\/+$/g, '');
      return contentPath ? `/umbraco/${contentPath}` : '/umbraco';
    }
  }

  return req.path;
}

function extractGraphQLQuery(body: unknown): string {
  if (!body) return '';
  if (Buffer.isBuffer(body)) {
    try {
      const parsed = JSON.parse(body.toString('utf8'));
      return typeof parsed?.query === 'string' ? parsed.query : '';
    } catch {
      return '';
    }
  }
  if (typeof body === 'object' && 'query' in body) {
    const q = (body as { query: unknown }).query;
    return typeof q === 'string' ? q : '';
  }
  return '';
}
