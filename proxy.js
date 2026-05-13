import axios from 'axios';
import { requestTransform, responseTransform } from './rules.js';
import { logPair } from './logger.js';
import { storeRequest } from './store.js';

// Headers that should not be forwarded to the upstream (hop-by-hop).
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host', // we'll let axios set this from the URL
]);

function buildUpstreamHeaders(reqHeaders) {
  const headers = {};
  for (const [key, value] of Object.entries(reqHeaders)) {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers[key] = value;
    }
  }
  return headers;
}

export async function proxyHandler(req, res) {
  let baseUrl = process.env.BASE_URL.replace(/\/$/, '');
  const apiSegment = req.path.split('/').find(Boolean) ?? '';
  baseUrl = baseUrl.replaceAll('<api>', apiSegment);
  const upstreamUrl = baseUrl + req.path.replace('/'+apiSegment, '');
  console.log(upstreamUrl)

  let axiosConfig = {
    method: req.method,
    url: upstreamUrl,
    headers: buildUpstreamHeaders(req.headers),
    params: req.query,
    data: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
    responseType: 'arraybuffer', // handle binary and text uniformly
    validateStatus: () => true,  // never throw on non-2xx
    maxRedirects: 0,             // let the client follow its own redirects
  };

  axiosConfig = requestTransform(axiosConfig);

  const start = Date.now();
  let upstreamRes;

  try {
    upstreamRes = await axios(axiosConfig);
  } catch (err) {
    console.error('[proxy] upstream error:', err.message);
    return res.status(502).json({ error: 'Bad Gateway', message: err.message });
  }

  const durationMs = Date.now() - start;

  upstreamRes = responseTransform(upstreamRes, req);

  logPair(req, axiosConfig.data, upstreamRes, durationMs);
  storeRequest(req, axiosConfig, upstreamRes);

  // Forward response headers (skip hop-by-hop)
  for (const [key, value] of Object.entries(upstreamRes.headers)) {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      res.setHeader(key, value);
    }
  }

  res.status(upstreamRes.status).send(
    Buffer.isBuffer(upstreamRes.data) ? upstreamRes.data : Buffer.from(upstreamRes.data)
  );
}
