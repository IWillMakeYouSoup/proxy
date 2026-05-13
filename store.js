import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const STORE_DIR  = join(__dirname, 'requests');

mkdirSync(STORE_DIR, { recursive: true });

function toFileName(method, reqPath) {
  // /individuella-val/foo/bar  →  get_individuella-val_foo_bar.json
  const safePath = reqPath.replace(/^\//, '').replaceAll('/', '_') || 'root';
  return `${method.toLowerCase()}_${safePath}.json`;
}

function tryParseJson(buffer) {
  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch {
    return buffer.toString('utf8');
  }
}

export function storeRequest(req, axiosConfig, upstreamRes) {
  const record = {
    request: {
      method:  req.method,
      path:    req.path,
      query:   req.query,
      headers: axiosConfig.headers,
      body:    axiosConfig.data ?? null,
    },
    response: {
      status:  upstreamRes.status,
      headers: upstreamRes.headers,
      body:    tryParseJson(upstreamRes.data),
    },
  };

  const file = join(STORE_DIR, toFileName(req.method, req.path));
  writeFileSync(file, JSON.stringify(record, null, 2));
}
