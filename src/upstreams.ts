// Per-segment upstream overrides. When the first path segment of an incoming
// request matches a key here, the proxy forwards to the mapped base URL and
// drops that segment from the forwarded path — bypassing the BASE_URL +
// `<api>` substitution entirely.
//
//   POST /umbraco              → POST https://graphql.umbraco.io
//   POST /umbraco/graphql      → POST https://graphql.umbraco.io/graphql
export const UPSTREAM_OVERRIDES: Record<string, string> = {
  umbraco: 'https://graphql.umbraco.io',
};
