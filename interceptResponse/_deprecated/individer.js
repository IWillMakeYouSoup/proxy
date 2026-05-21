import { transformJson } from '../helpers.js';

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
    name: 'individer',

    // match: { method: 'GET', path: '/api/individer' },

    transform(upstreamRes, _req) {
        // Example: inject a field into the JSON response body
        // return transformJson(upstreamRes, body => ({ ...body, extra: 'injected' }));

        // Example: override the status code
        // upstreamRes.status = 200;

        // Example: add a response header
        // upstreamRes.headers['x-intercepted-by'] = 'individer';

        return transformJson(upstreamRes, body => ({ ...body, fornamn: 'proxy', tilltalsnamn: 'proxy', efternamn: 'proxy' }));
    },
    }
];
