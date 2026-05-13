const RESET  = '\x1b[0m';
const DIM    = '\x1b[2m';
const BOLD   = '\x1b[1m';
const CYAN   = '\x1b[36m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';

function statusColor(status) {
  if (status >= 500) return RED;
  if (status >= 400) return YELLOW;
  if (status >= 300) return CYAN;
  return GREEN;
}

function safeHeaders(headers) {
  const out = { ...headers };
  if (!process.env.LOG_AUTH || process.env.LOG_AUTH === 'false') {
    if (out['authorization']) {
      const parts = out['authorization'].split(' ');
      out['authorization'] = parts.length > 1
        ? `${parts[0]} [REDACTED]`
        : '[REDACTED]';
    }
  }
  return out;
}

function bodyPreview(data) {
  if (!data) return '(empty)';
  let str;
  if (Buffer.isBuffer(data)) {
    str = data.toString('utf8');
  } else if (typeof data === 'object') {
    str = JSON.stringify(data);
  } else {
    str = String(data);
  }
  return str.length > 500 ? str.slice(0, 500) + '… (truncated)' : str;
}

function hasBody(data) {
  if (data === undefined || data === null) return false;
  if (Buffer.isBuffer(data)) return data.length > 0;
  if (typeof data === 'string') return data.length > 0;
  if (typeof data === 'object') return Object.keys(data).length > 0;
  return true;
}

export function logPair(req, requestData, upstreamRes, durationMs) {
  const ts      = new Date().toISOString();
  const status  = upstreamRes.status;
  const color   = statusColor(status);
  const reqHdrs = safeHeaders(req.headers);
  const resHdrs = safeHeaders(upstreamRes.headers);

  const lines = [
    '',
    `${BOLD}${DIM}────────────────────────────────────────${RESET}`,
    `${BOLD}${CYAN}[${ts}]${RESET} ${BOLD}${req.method}${RESET} ${req.originalUrl}`,
    `${DIM}duration:${RESET} ${durationMs}ms`,
    '',
    `${BOLD}→ REQUEST HEADERS${RESET}`,
    ...Object.entries(reqHdrs).map(([k, v]) => `  ${DIM}${k}:${RESET} ${v}`),
    ...(hasBody(requestData) ? [
      '',
      `${BOLD}→ REQUEST BODY${RESET}`,
      `  ${bodyPreview(requestData)}`,
    ] : []),
    '',
    `${BOLD}← RESPONSE ${color}${status}${RESET}`,
    `${BOLD}← RESPONSE HEADERS${RESET}`,
    ...Object.entries(resHdrs).map(([k, v]) => `  ${DIM}${k}:${RESET} ${v}`),
    '',
    `${BOLD}← RESPONSE BODY${RESET}`,
    `  ${bodyPreview(upstreamRes.data)}`,
    `${DIM}────────────────────────────────────────${RESET}`,
    '',
  ];

  console.log(lines.join('\n'));
}
