import type { ReplacerType } from './types.ts';

export function toRecordFileName(method: string, reqPath: string): string {
  const safePath = reqPath.replace(/^\//, '').replaceAll('/', '_') || 'root';
  return `${method.toLowerCase()}_${safePath}.json`;
}

export function toRecordId(method: string, reqPath: string): string {
  const file = toRecordFileName(method, reqPath);
  return file.replace(/\.json$/, '');
}

export function parseRecordId(
  id: string,
): { method: string; pathSegments: string[] } {
  const [methodPart, ...rest] = id.split('_');
  return { method: methodPart.toUpperCase(), pathSegments: rest };
}

export function toReplacerFileName(
  reqPath: string,
  type: ReplacerType,
): string {
  const safePath = reqPath.replace(/^\//, '').replaceAll('/', '_') || 'root';
  return `${safePath}_${type}.json`;
}
