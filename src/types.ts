export type ReplacerType = 'request' | 'response';

export interface ReplacerRequestContent {
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: unknown;
}

export interface ReplacerResponseContent {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface RequestReplacer {
  matchPath: string;
  matchMethod: string;
  type: 'request';
  content: ReplacerRequestContent;
}

export interface ResponseReplacer {
  matchPath: string;
  matchMethod: string;
  type: 'response';
  content: ReplacerResponseContent;
}

export type Replacer = RequestReplacer | ResponseReplacer;

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

export interface EndpointSummary {
  id: string;
  method: string;
  path: string;
  hasRequestReplacer: boolean;
  hasResponseReplacer: boolean;
}
