import { transformJson } from '../helpers.js';

const body = {
  "context": {
    "status": "Success",
    "sources": [
      {
        "source": "ITP",
        "status": "Success",
            "updatedAt": "2026-05-20T13:16:42+02:00"
      }
    ],
    "traceId": "82562434703c4b51b7a97805898fea24"
  },
  "data": {
    "individId": "cdcc343b-eed6-455a-892d-39594c9470a2",
    "valKraverHd": false,
    "varningarFinns": true,
    "varningar": [
      {
        "orsak": "Prisets på valt familjeskydd är högre än inbetald premie.",
        "orsakskod": "407"
      }
    ]
  }
}

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

    match: { method: 'POST', path: '/individuella-val/v1/familjeskyddskontroll/ITP1' },

    transform(upstreamRes, _req) {
      // Example: inject a field into the JSON response body
      // return transformJson(upstreamRes, body => ({ ...body, extra: 'injected' }));

      // Example: override the status code
      upstreamRes.status = 400;

      // Example: add a response header
      // upstreamRes.headers['x-intercepted-by'] = 'individer';
      
      return transformJson(upstreamRes, body => ({ ...body, data: {...body.data, varningar } }));
    },
  },
];
