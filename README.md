# Proxy Server

A transparent HTTP proxy with per-route request/response interception, structured logging, and automatic request storage. Designed for API testing and mocking.

Set env config:
INDIVIDUELLA_VAL_API_CLIENT_BASE_URL="http://localhost:3333/individuella-val"
FORSAKRINGAR_API_CLIENT_BASE_URL="http://localhost:3333/forsakringar"
ANSTALLNINGAR_API_CLIENT_BASE_URL="http://localhost:3333/anstallda"
ANVANDARE_API_CLIENT_BASE_URL="http://localhost:3333/anvandare"
INDIVIDER_API_CLIENT_BASE_URL="http://localhost:3333/individer"
FORETAG_API_CLIENT_BASE_URL="http://localhost:3333/foretag"
PENSIONER_API_CLIENT_BASE_URL="http://localhost:3333/pensioner"
GRUNDDATA_API_CLIENT_BASE_URL="http://localhost:3333/grunddata"

---

## Setup

```bash
cp .env.example .env   # configure PORT and BASE_URL
npm install
npm start              # or: node --watch server.js
```

---

## Configuration (`.env`)

| Variable   | Description |
|------------|-------------|
| `PORT`     | Port the proxy listens on (default: `3000`) |
| `BASE_URL` | Upstream API base URL. Supports `<api>` placeholder (see below) |
| `LOG_AUTH` | Set to `true` to log full Authorization header values (default: redacted) |

### `<api>` placeholder

If `BASE_URL` contains `<api>`, it is replaced at request time with the first path segment:

```
BASE_URL=https://<api>.example.com

Request: /individuella-val/v1/endpoint
→ forwards to: https://individuella-val.example.com/v1/endpoint
```

---

## How a request flows

```
Client request
  │
  ├─ Morgan  (one-line access log)
  │
  ├─ Mock middleware  (rules.js → mocks[])
  │     Matched? → respond immediately, never reach upstream
  │
  └─ proxyHandler  (proxy.js)
        │
        ├─ requestTransform  ← runs matching interceptors from interceptRequest/
        ├─ axios → upstream
        ├─ responseTransform ← runs matching interceptors from interceptResponse/
        ├─ logPair           ← structured console log
        ├─ storeRequest      ← writes requests/<method>_<path>.json
        └─ res.send()
              │
              ▼
           Client
```

---

## File structure

```
server.js               Entry point — Express setup, mock mounting, start
proxy.js                Core forwarding logic (axios)
rules.js                Loads interceptors, runs transforms, exports mocks
helpers.js              transformJson() utility
logger.js               Structured console logger
store.js                Persists request/response pairs to requests/

interceptRequest/       Request interceptor modules (one file per API)
interceptResponse/      Response interceptor modules (one file per API)

requests/               Auto-created — stored JSON files per request
```

---

## Interceptors

Each file in `interceptRequest/` and `interceptResponse/` exports an **array** of interceptor objects. The filename (camelCase → kebab-case) is automatically used as the path matcher, so `individuellaVal.js` matches any request to `/individuella-val/*` without any explicit `match` config.

### Interceptor object shape

```js
{
  name: 'myInterceptor',        // optional, used in logs

  match: {                      // optional — omit to match all requests
    method: 'GET',              // optional HTTP verb filter
    path: '/v1/some-path',      // optional exact path or RegExp
  },

  transform(axiosConfig) { … }  // request interceptor signature
  transform(upstreamRes, req) { … }  // response interceptor signature
}
```

A file can export multiple interceptors for different endpoints:

```js
export default [
  { name: 'one', match: { path: '/v1/foo' }, transform(cfg) { … } },
  { name: 'two', match: { path: '/v1/bar' }, transform(cfg) { … } },
];
```

### Request interceptor (`interceptRequest/`)

`transform` receives `axiosConfig` and must return it.

```js
transform(axiosConfig) {
  // Add / overwrite a header
  axiosConfig.headers['x-my-header'] = 'value';

  // Remove a header
  delete axiosConfig.headers['x-remove-me'];

  // Inject a field into a JSON body (POST/PUT/PATCH)
  axiosConfig.data = { ...axiosConfig.data, extraField: 'value' };

  // Replace the body entirely
  axiosConfig.data = { foo: 'bar' };

  // Rewrite the URL path
  axiosConfig.url = axiosConfig.url.replace('/v1/', '/v2/');

  // Add a query param
  axiosConfig.params = { ...axiosConfig.params, debug: 'true' };

  return axiosConfig;
}
```

### Response interceptor (`interceptResponse/`)

`transform` receives `upstreamRes` and `req`, and must return `upstreamRes`.
Use `transformJson` to safely modify a JSON body (handles empty / non-JSON responses gracefully).

```js
import { transformJson } from '../helpers.js';

transform(upstreamRes, req) {
  // Inject a field into the JSON response body
  return transformJson(upstreamRes, body => ({ ...body, extra: 'injected' }));

  // Remove a field
  return transformJson(upstreamRes, ({ secret, ...rest }) => rest);

  // Override the status code
  upstreamRes.status = 200;

  // Add a response header
  upstreamRes.headers['x-proxied-by'] = 'my-proxy';

  return upstreamRes;
}
```

---

## Mock routes

Define mock routes in `rules.js` to return a static response without ever hitting upstream:

```js
export const mocks = [
  {
    method: 'GET',
    path: '/api/users/me',
    handler(req, res) {
      res.json({ id: 1, name: 'Mock User' });
    },
  },
];
```

---

## Stored requests (`requests/`)

After every proxied request, a JSON file is written to `requests/` named `<method>_<path>.json` (e.g. `get_individuella-val_v1_endpoint.json`). Existing files are overwritten. Each file contains the post-transform request (headers, body) and the post-transform response:

```json
{
  "request": {
    "method": "GET",
    "path": "/individuella-val/v1/endpoint",
    "headers": { "authorization": "Bearer …", "x-intercepted-by": "…" },
    "body": null
  },
  "response": {
    "status": 200,
    "headers": { "content-type": "application/json" },
    "body": { … }
  }
}
```

---

## Logging

Every proxied request prints two things:

1. **Morgan access line** — immediate on receipt:
   ```
   GET /individuella-val/v1/endpoint 200 1024 bytes - 43 ms
   ```

2. **Structured block** — after upstream responds, showing request headers, request body (if present), response status, response headers, and response body preview (up to 500 chars). The `Authorization` header is printed as `Bearer [REDACTED]` unless `LOG_AUTH=true`.
