import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';

import { mocks } from './rules.ts';
import { proxyHandler } from './proxy.ts';

const PORT = process.env.PORT || 3333;
const BASE_URL = process.env.BASE_URL;

if (!BASE_URL) {
  console.error('[server] BASE_URL is not set. Copy .env.example to .env and configure it.');
  process.exit(1);
}

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.raw({ type: '*/*', limit: '10mb' }));

app.use(morgan(':method :url :status :res[content-length] bytes - :response-time ms'));

for (const mock of mocks) {
  const method = (mock.method || '*').toLowerCase();
  const path = mock.path;

  if (method === '*') {
    app.all(path, mock.handler);
  } else {
    (app as any)[method]?.(path, mock.handler);
  }

  console.log(`[server] mock registered: ${(mock.method || '*').toUpperCase()} ${path}`);
}

app.all('*', proxyHandler);

app.listen(PORT, () => {
  console.log(`[server] proxy listening on http://localhost:${PORT}`);
  console.log(`[server] forwarding to ${BASE_URL}`);
  if (mocks.length === 0) {
    console.log('[server] no mocks configured (edit rules.ts to add some)');
  }
});
