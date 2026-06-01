import type { Request } from 'express';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import { getRequestReplacer, getResponseReplacer } from './loader.ts';
import type { RequestReplacer, ResponseReplacer } from '../types.ts';

function buildUpstreamUrl(path: string): string {
  let baseUrl = (process.env.BASE_URL ?? '').replace(/\/$/, '');
  const apiSegment = path.split('/').find(Boolean) ?? '';
  baseUrl = baseUrl.replaceAll('<api>', apiSegment);
  return baseUrl + path.replace('/' + apiSegment, '');
}

export function applyRequestReplacer(
  axiosConfig: AxiosRequestConfig,
  req: Request,
  identity: string,
): AxiosRequestConfig {
  const replacer = getRequestReplacer(req.method, identity) as RequestReplacer | undefined;
  if (!replacer) return axiosConfig;

  const { content } = replacer;
  console.log(`[replacers] applying request replacer: ${req.method} ${identity}`);

  return {
    ...axiosConfig,
    method: content.method,
    url: buildUpstreamUrl(content.path),
    headers: { ...content.headers },
    params: { ...content.query },
    data: content.body ?? undefined,
  };
}

export function applyResponseReplacer(
  upstreamRes: AxiosResponse,
  req: Request,
  identity: string,
): AxiosResponse {
  const replacer = getResponseReplacer(req.method, identity) as ResponseReplacer | undefined;
  if (!replacer) return upstreamRes;

  const { content } = replacer;
  console.log(`[replacers] applying response replacer: ${req.method} ${identity}`);

  const bodyBuffer =
    typeof content.body === 'string'
      ? Buffer.from(content.body)
      : Buffer.from(JSON.stringify(content.body));

  const headers: Record<string, string> = { ...content.headers };
  headers['content-length'] = String(bodyBuffer.length);

  upstreamRes.status = content.status;
  upstreamRes.headers = headers as any;
  upstreamRes.data = bodyBuffer;

  return upstreamRes;
}
