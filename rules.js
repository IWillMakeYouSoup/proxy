import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// =============================================================================
// INTERCEPTOR LOADER
// =============================================================================

// Convert camelCase filename to kebab-case URL segment.
// individuellaVal → /individuella-val
function toKebabPath(filename) {
  return '/' + filename.replaceAll(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

async function loadInterceptors(folder) {
  const dir = join(__dirname, folder);
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter(f => f.endsWith('.js'));
  const nested = await Promise.all(
    files.map(async f => {
      const { default: mod } = await import(pathToFileURL(join(dir, f)).href);
      const baseName = f.slice(0, -3);
      const items = Array.isArray(mod) ? mod : [mod];
      return items.map(item => {
        item._autoPath = item.match?.path ? null : toKebabPath(baseName);
        return item;
      });
    })
  );
  return nested.flat();
}

function matches(interceptor, method, reqPath) {
  reqPath = reqPath.replace(/^https?:\/\/[^\/]+\//, '');
  // console.log(interceptor, method, reqPath)
  const m = interceptor.match;
  if (m) {
    // console.log(m, reqPath, 'matches:', m == reqPath)
    if (m.method && m.method.toUpperCase() !== method.toUpperCase()) return false;
    // console.log('Method matches')
    if (m.path instanceof RegExp) return m.path.test(reqPath);
    // console.log('Path matches')
    // if (m.path) return reqPath === m.path || reqPath.startsWith(m.path + '/');
    // console.log('No path specified, matches all')
    return true;
  }

  if (interceptor._autoPath) {
    return reqPath === interceptor._autoPath ||
           reqPath.startsWith(interceptor._autoPath + '/');
  }

  return true;
}

export const requestInterceptors  = await loadInterceptors('interceptRequest');
export const responseInterceptors = await loadInterceptors('interceptResponse');

// =============================================================================
// MOCK ROUTES
// =============================================================================
// Add entries here to intercept a request before it ever reaches the upstream.
// The handler is a plain Express (req, res) function.
//
// Format:
//   { method: 'GET' | 'POST' | ... | '*', path: '/exact/path', handler(req, res) }
//
// Example:
//   {
//     method: 'GET',
//     path: '/api/users/me',
//     handler(req, res) {
//       res.json({ id: 1, name: 'Mock User', email: 'mock@example.com' });
//     },
//   },

export const mocks = [
  // -- paste your mock definitions here --
];

// =============================================================================
// REQUEST TRANSFORM
// =============================================================================
// Runs all matching interceptors from interceptRequest/ in order.
// You can also add one-off changes directly here.

export function requestTransform(axiosConfig) {
  const method  = axiosConfig.method;
  const reqPath = new URL(axiosConfig.url).pathname;

  for (const interceptor of requestInterceptors) {
    if (matches(interceptor, method, reqPath)) {
      console.log('Request interceptor matched:', interceptor.name);
      axiosConfig = interceptor.transform(axiosConfig) ?? axiosConfig;
    }
  }

  return axiosConfig;
}

// =============================================================================
// RESPONSE TRANSFORM
// =============================================================================
// Runs all matching interceptors from interceptResponse/ in order.
// You can also add one-off changes directly here.

export function responseTransform(upstreamRes, req) {
  for (const interceptor of responseInterceptors) {
    if (matches(interceptor, req.method, req.path)) {
      console.log('Response interceptor matched:', interceptor.name);
      upstreamRes = interceptor.transform(upstreamRes, req) ?? upstreamRes;
    }
  }

  return upstreamRes;
}

export { transformJson } from './helpers.js';
