import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Request } from 'express';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import { INTERCEPT_REQUEST_DIR, INTERCEPT_RESPONSE_DIR } from './paths.ts';
import { applyRequestReplacer, applyResponseReplacer } from './replacers/interceptor.ts';

export { transformJson } from './helpers.ts';

// =============================================================================
// LEGACY INTERCEPTOR LOADER
// =============================================================================
// Per-endpoint .js files in interceptRequest/ and interceptResponse/ are still
// auto-loaded for backwards compatibility, but anything inside a `_deprecated/`
// subfolder (or any path starting with `_`) is skipped — these are kept as
// reference now that the generalized replacer interceptor exists.

interface LegacyInterceptor {
  name?: string;
  match?: {
    method?: string;
    path?: string | RegExp;
  };
  transform: (...args: any[]) => any;
  _autoPath?: string | null;
}

function toKebabPath(filename: string): string {
  return '/' + filename.replaceAll(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

async function loadInterceptors(dir: string): Promise<LegacyInterceptor[]> {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir).filter(
    (f) => !f.startsWith('_') && (f.endsWith('.js') || f.endsWith('.mjs')),
  );
  const files = entries.filter((f) => {
    try {
      return statSync(join(dir, f)).isFile();
    } catch {
      return false;
    }
  });

  const nested = await Promise.all(
    files.map(async (f) => {
      const mod = await import(pathToFileURL(join(dir, f)).href);
      const items: LegacyInterceptor[] = Array.isArray(mod.default)
        ? mod.default
        : [mod.default];
      const baseName = f.replace(/\.m?js$/, '');
      return items.map((item) => {
        item._autoPath = item.match?.path ? null : toKebabPath(baseName);
        return item;
      });
    }),
  );
  return nested.flat();
}

function matches(interceptor: LegacyInterceptor, method: string, reqPath: string): boolean {
  reqPath = reqPath.replace(/^https?:\/\/[^/]+\//, '');
  const m = interceptor.match;
  if (m) {
    if (m.method && m.method.toUpperCase() !== method.toUpperCase()) return false;
    if (m.path instanceof RegExp) return m.path.test(reqPath);
    if (typeof m.path === 'string') {
      return reqPath === m.path || reqPath.startsWith(m.path + '/');
    }
    return true;
  }

  if (interceptor._autoPath) {
    return (
      reqPath === interceptor._autoPath || reqPath.startsWith(interceptor._autoPath + '/')
    );
  }

  return true;
}

const requestInterceptors = await loadInterceptors(INTERCEPT_REQUEST_DIR);
const responseInterceptors = await loadInterceptors(INTERCEPT_RESPONSE_DIR);

// =============================================================================
// MOCK ROUTES
// =============================================================================

export interface Mock {
  method?: string;
  path: string;
  handler: (req: Request, res: any) => void;
}

export const mocks: Mock[] = [];

// =============================================================================
// REQUEST / RESPONSE TRANSFORM PIPELINES
// =============================================================================
// Order: generalized replacer first (so legacy interceptors operate on the
// already-replaced config/response), then any legacy interceptors that match.

export function requestTransform(
  axiosConfig: AxiosRequestConfig,
  req: Request,
): AxiosRequestConfig {
  axiosConfig = applyRequestReplacer(axiosConfig, req);

  const method = axiosConfig.method ?? req.method;
  const reqPath = req.path;

  for (const interceptor of requestInterceptors) {
    if (matches(interceptor, method, reqPath)) {
      console.log('Request interceptor matched:', interceptor.name);
      axiosConfig = interceptor.transform(axiosConfig) ?? axiosConfig;
    }
  }

  return axiosConfig;
}

export function responseTransform(
  upstreamRes: AxiosResponse,
  req: Request,
): AxiosResponse {
  upstreamRes = applyResponseReplacer(upstreamRes, req);

  for (const interceptor of responseInterceptors) {
    if (matches(interceptor, req.method, req.path)) {
      console.log('Response interceptor matched:', interceptor.name);
      upstreamRes = interceptor.transform(upstreamRes, req) ?? upstreamRes;
    }
  }

  return upstreamRes;
}
