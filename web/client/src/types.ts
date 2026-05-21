export type ReplacerType = 'request' | 'response';

export interface EndpointSummary {
  id: string;
  method: string;
  path: string;
  hasRequestReplacer: boolean;
  hasResponseReplacer: boolean;
}

export interface StoredRequest {
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: unknown;
}

export interface StoredResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface StoredRecord {
  request: StoredRequest;
  response: StoredResponse;
}

export interface Replacer {
  matchPath: string;
  matchMethod: string;
  type: ReplacerType;
  content: Record<string, unknown>;
}

export type Tab = 'request' | 'response';
