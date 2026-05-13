import { transformJson } from '../helpers.js';

const test = {
  status: 'Success',
  sources: [
    {
      source: 'ITP111',
      status: 'Success',
      updatedAt: '2026-04-16T13:58:03+02:00',
      expiresAt: '2026-04-17T00:00:00+02:00',
      isStaleData: false,
    },
  ],
  traceId: '1a9a69b367e14b7a9e9cdb13d5626e16',
};

/**
 * Interceptor shape:
 *
 *   match  (optional) — filter which responses this runs on.
 *            method: HTTP verb string, e.g. 'GET', or omit to match any.
 *            path:   exact string or RegExp, or omit to match any path.
 *
 *   transform(upstreamRes, req) — mutate and return upstreamRes.
 *            upstreamRes.status   — HTTP status code
 *            upstreamRes.headers  — response headers
 *            upstreamRes.data     — response body (Buffer)
 *
 *   transformJson(upstreamRes, fn) — helper: parse buffer as JSON,
 *            call fn(body), re-encode, update content-type/content-length.
 */
export default [
  {
    name: 'individuellaVal',

    // match: { method: 'GET', path: '/api/individuella-val' },

    transform(upstreamRes, _req) {
      // Example: inject a field into the JSON response body
      // return transformJson(upstreamRes, body => ({ ...body, extra: 'injected' }));

      // Example: override the status code
      // upstreamRes.status = 200;

      // Example: add a response header
      // upstreamRes.headers['x-intercepted-by'] = 'individer';
      
      return transformJson(upstreamRes, body => ({ ...body, context: test }));
    },
  },
];
