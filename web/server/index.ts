import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { PROJECT_ROOT } from '../../src/paths.ts';
import { endpointsRouter } from './routes/endpoints.ts';
import { replacersRouter } from './routes/replacers.ts';

const PORT = process.env.WEB_PORT || 3334;
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/endpoints', endpointsRouter);
app.use('/api/replacers', replacersRouter);

const clientDist = join(PROJECT_ROOT, 'web/client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[web] UI API listening on http://localhost:${PORT}`);
  if (existsSync(clientDist)) {
    console.log(`[web] serving built client from ${clientDist}`);
  } else {
    console.log('[web] no built client found; run `vite` for dev or `npm run build:client` for prod');
  }
});
