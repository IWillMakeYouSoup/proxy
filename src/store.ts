import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Request } from 'express';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import { CHANGED_DIR, ORIGINAL_DIR } from './paths.ts';
import { toRecordFileName } from './fileNames.ts';
import type { StoredRecord } from './types.ts';

mkdirSync(ORIGINAL_DIR, { recursive: true });
mkdirSync(CHANGED_DIR, { recursive: true });

function tryParseJson(data: unknown): unknown {
  if (data === undefined || data === null) return null;
  let str: string;
  if (Buffer.isBuffer(data)) {
    str = data.toString('utf8');
  } else if (typeof data === 'string') {
    str = data;
  } else {
    return data;
  }
  if (str.length === 0) return '';
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

function buildRecord(
  req: Request,
  axiosConfig: AxiosRequestConfig,
  upstreamRes: AxiosResponse,
): StoredRecord {
  return {
    request: {
      method: req.method,
      path: req.path,
      query: req.query as Record<string, unknown>,
      headers: (axiosConfig.headers ?? {}) as Record<string, string>,
      body: axiosConfig.data ?? null,
    },
    response: {
      status: upstreamRes.status,
      headers: upstreamRes.headers as Record<string, string>,
      body: tryParseJson(upstreamRes.data),
    },
  };
}

export function storeOriginal(
  req: Request,
  rawAxiosConfig: AxiosRequestConfig,
  rawUpstreamRes: AxiosResponse,
): void {
  const file = join(ORIGINAL_DIR, toRecordFileName(req.method, req.path));
  writeFileSync(
    file,
    JSON.stringify(buildRecord(req, rawAxiosConfig, rawUpstreamRes), null, 2),
  );
}

export function storeChanged(
  req: Request,
  finalAxiosConfig: AxiosRequestConfig,
  finalUpstreamRes: AxiosResponse,
): void {
  const file = join(CHANGED_DIR, toRecordFileName(req.method, req.path));
  writeFileSync(
    file,
    JSON.stringify(buildRecord(req, finalAxiosConfig, finalUpstreamRes), null, 2),
  );
}
