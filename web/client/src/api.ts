import type { EndpointSummary, Replacer, ReplacerType, StoredRecord } from './types';

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function listEndpoints(): Promise<EndpointSummary[]> {
  return fetch('/api/endpoints').then((r) => jsonOrThrow<EndpointSummary[]>(r));
}

export function getEndpoint(id: string): Promise<StoredRecord> {
  return fetch(`/api/endpoints/${encodeURIComponent(id)}`).then((r) =>
    jsonOrThrow<StoredRecord>(r),
  );
}

function replacerUrl(method: string, path: string, type: ReplacerType): string {
  return `/api/replacers/${encodeURIComponent(method)}/${encodeURIComponent(path)}/${type}`;
}

export async function getReplacer(
  method: string,
  path: string,
  type: ReplacerType,
): Promise<Replacer | null> {
  const res = await fetch(replacerUrl(method, path, type));
  if (res.status === 404) return null;
  return jsonOrThrow<Replacer>(res);
}

export function saveReplacer(
  method: string,
  path: string,
  type: ReplacerType,
  content: unknown,
): Promise<Replacer> {
  return fetch(replacerUrl(method, path, type), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).then((r) => jsonOrThrow<Replacer>(r));
}

export async function deleteReplacer(
  method: string,
  path: string,
  type: ReplacerType,
): Promise<void> {
  const res = await fetch(replacerUrl(method, path, type), { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
}
