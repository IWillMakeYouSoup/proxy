import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { Router } from 'express';

import { REPLACERS_DIR } from '../../../src/paths.ts';
import { toReplacerFileName } from '../../../src/fileNames.ts';
import type { Replacer, ReplacerType } from '../../../src/types.ts';

export const replacersRouter = Router();

mkdirSync(REPLACERS_DIR, { recursive: true });

function isReplacerType(value: string): value is ReplacerType {
  return value === 'request' || value === 'response';
}

function resolveFile(method: string, encodedPath: string, type: ReplacerType): {
  path: string;
  file: string;
  method: string;
} {
  const path = decodeURIComponent(encodedPath);
  const file = join(REPLACERS_DIR, toReplacerFileName(path, type));
  return { path, file, method: method.toUpperCase() };
}

function validateContent(type: ReplacerType, content: unknown): string | null {
  if (!content || typeof content !== 'object') return 'content must be an object';
  const c = content as Record<string, unknown>;
  if (type === 'response') {
    if (typeof c.status !== 'number') return 'content.status must be a number';
    if (!c.headers || typeof c.headers !== 'object') return 'content.headers must be an object';
    if (!('body' in c)) return 'content.body is required';
  } else {
    if (typeof c.method !== 'string') return 'content.method must be a string';
    if (typeof c.path !== 'string') return 'content.path must be a string';
    if (c.query !== undefined && (typeof c.query !== 'object' || c.query === null))
      return 'content.query must be an object when present';
    if (!c.headers || typeof c.headers !== 'object') return 'content.headers must be an object';
    if (!('body' in c)) return 'content.body is required';
  }
  return null;
}

replacersRouter.get('/:method/:encodedPath/:type', (req, res) => {
  const { type } = req.params;
  if (!isReplacerType(type)) {
    res.status(400).json({ error: 'type must be request or response' });
    return;
  }
  const { file } = resolveFile(req.params.method, req.params.encodedPath, type);
  if (!existsSync(file)) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  res.json(JSON.parse(readFileSync(file, 'utf8')));
});

replacersRouter.put('/:method/:encodedPath/:type', (req, res) => {
  const { type } = req.params;
  if (!isReplacerType(type)) {
    res.status(400).json({ error: 'type must be request or response' });
    return;
  }
  const content = (req.body as { content?: unknown })?.content;
  const validationError = validateContent(type, content);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const { path, file, method } = resolveFile(req.params.method, req.params.encodedPath, type);
  const replacer: Replacer = {
    matchPath: path,
    matchMethod: method,
    type,
    content: content as any,
  };
  writeFileSync(file, JSON.stringify(replacer, null, 2));
  res.json(replacer);
});

replacersRouter.delete('/:method/:encodedPath/:type', (req, res) => {
  const { type } = req.params;
  if (!isReplacerType(type)) {
    res.status(400).json({ error: 'type must be request or response' });
    return;
  }
  const { file } = resolveFile(req.params.method, req.params.encodedPath, type);
  if (existsSync(file)) unlinkSync(file);
  res.status(204).end();
});
