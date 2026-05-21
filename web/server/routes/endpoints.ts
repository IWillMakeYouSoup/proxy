import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Router } from 'express';

import { ORIGINAL_DIR, REPLACERS_DIR } from '../../../src/paths.ts';
import { toReplacerFileName } from '../../../src/fileNames.ts';
import type { EndpointSummary, StoredRecord } from '../../../src/types.ts';

export const endpointsRouter = Router();

function readRecord(file: string): StoredRecord | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as StoredRecord;
  } catch {
    return null;
  }
}

endpointsRouter.get('/', (_req, res) => {
  if (!existsSync(ORIGINAL_DIR)) {
    res.json([]);
    return;
  }
  const files = readdirSync(ORIGINAL_DIR).filter((f) => f.endsWith('.json'));
  const summaries: EndpointSummary[] = [];
  for (const f of files) {
    const record = readRecord(join(ORIGINAL_DIR, f));
    if (!record) continue;
    const { method, path } = record.request;
    summaries.push({
      id: f.replace(/\.json$/, ''),
      method,
      path,
      hasRequestReplacer: existsSync(
        join(REPLACERS_DIR, toReplacerFileName(path, 'request')),
      ),
      hasResponseReplacer: existsSync(
        join(REPLACERS_DIR, toReplacerFileName(path, 'response')),
      ),
    });
  }
  summaries.sort((a, b) =>
    `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`),
  );
  res.json(summaries);
});

endpointsRouter.get('/:id', (req, res) => {
  const file = join(ORIGINAL_DIR, `${req.params.id}.json`);
  if (!existsSync(file)) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const record = readRecord(file);
  if (!record) {
    res.status(500).json({ error: 'failed to read record' });
    return;
  }
  res.json(record);
});
