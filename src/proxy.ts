import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { Request, Response } from 'express';

import { requestTransform, responseTransform } from './rules.ts';
import { logPair } from './logger.ts';
import { storeChanged, storeOriginal } from './store.ts';
import { UPSTREAM_OVERRIDES } from './upstreams.ts';
import { deriveIdentity } from './identity.ts';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
]);

function buildUpstreamHeaders(reqHeaders: Record<string, any>): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(reqHeaders)) {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
    }
  }
  return headers;
}

export async function proxyHandler(req: Request, res: Response): Promise<void> {
  console.log(`[proxy] ← ${req.method} ${req.originalUrl}`);

  const identity = deriveIdentity(req);
  const apiSegment = req.path.split('/').find(Boolean) ?? '';
  const override = UPSTREAM_OVERRIDES[apiSegment];

  let upstreamUrl: string;
  if (override) {
    upstreamUrl = override.replace(/\/$/, '') + req.path.replace('/' + apiSegment, '');
  } else {
    const baseUrl = (process.env.BASE_URL ?? '').replace(/\/$/, '').replaceAll('<api>', apiSegment);
    upstreamUrl = baseUrl + req.path.replace('/' + apiSegment, '');
  }
  console.log(upstreamUrl);

  const rawAxiosConfig: AxiosRequestConfig = {
    method: req.method,
    url: upstreamUrl,
    headers: buildUpstreamHeaders(req.headers as Record<string, any>),
    params: req.query,
    data:
      req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
    responseType: 'arraybuffer',
    validateStatus: () => true,
    maxRedirects: 0,
  };

  // Snapshot the raw outbound config BEFORE any interceptors (request replacer
  // or legacy) run, so originalRequests/ always reflects what the client sent.
  const originalRequestSnapshot: AxiosRequestConfig = {
    ...rawAxiosConfig,
    headers: { ...rawAxiosConfig.headers } as Record<string, string>,
    params: { ...(rawAxiosConfig.params as object) },
  };

  const finalAxiosConfig = requestTransform(rawAxiosConfig, req, identity);

  const start = Date.now();
  let upstreamRes: AxiosResponse;
  try {
    upstreamRes = await axios(finalAxiosConfig);
  } catch (err) {
    const message = (err as Error).message;
    console.error('[proxy] upstream error:', message);
    res.status(502).json({ error: 'Bad Gateway', message });
    return;
  }
  const durationMs = Date.now() - start;

  // Snapshot the raw upstream response BEFORE the response replacer / legacy
  // response interceptors mutate it. This is the actual upstream answer to
  // whatever request we sent (we don't fire a second HTTP call to capture
  // "what would have come back without the request replacer").
  const rawResponseSnapshot: AxiosResponse = {
    ...upstreamRes,
    headers: { ...(upstreamRes.headers as Record<string, any>) } as any,
    data: Buffer.isBuffer(upstreamRes.data)
      ? Buffer.from(upstreamRes.data)
      : upstreamRes.data,
  };

  storeOriginal(req, identity, originalRequestSnapshot, rawResponseSnapshot);

  const finalUpstreamRes = responseTransform(upstreamRes, req, identity);

  logPair(req, finalAxiosConfig.data, finalUpstreamRes, durationMs);
  storeChanged(req, identity, finalAxiosConfig, finalUpstreamRes);

  for (const [key, value] of Object.entries(finalUpstreamRes.headers)) {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      res.setHeader(key, value as string);
    }
  }

  res
    .status(finalUpstreamRes.status)
    .send(
      Buffer.isBuffer(finalUpstreamRes.data)
        ? finalUpstreamRes.data
        : Buffer.from(finalUpstreamRes.data),
    );
}
