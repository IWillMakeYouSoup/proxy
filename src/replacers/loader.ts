import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import chokidar from 'chokidar';

import { REPLACERS_DIR } from '../paths.ts';
import type { Replacer, ReplacerType } from '../types.ts';

mkdirSync(REPLACERS_DIR, { recursive: true });

const index = new Map<string, Replacer>();

function keyOf(type: ReplacerType, method: string, path: string): string {
  return `${type}:${method.toUpperCase()}:${path}`;
}

function isValidReplacer(value: unknown): value is Replacer {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  if (typeof r.matchPath !== 'string') return false;
  if (typeof r.matchMethod !== 'string') return false;
  if (r.type !== 'request' && r.type !== 'response') return false;
  if (!r.content || typeof r.content !== 'object') return false;
  return true;
}

function loadFile(filePath: string): Replacer | null {
  try {
    const raw = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!isValidReplacer(parsed)) {
      console.warn(`[replacers] invalid shape: ${filePath}`);
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn(`[replacers] failed to load ${filePath}: ${(err as Error).message}`);
    return null;
  }
}

function loadAll(): void {
  index.clear();
  if (!existsSync(REPLACERS_DIR)) return;
  const files = readdirSync(REPLACERS_DIR).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const replacer = loadFile(join(REPLACERS_DIR, f));
    if (replacer) {
      index.set(keyOf(replacer.type, replacer.matchMethod, replacer.matchPath), replacer);
    }
  }
  console.log(`[replacers] loaded ${index.size} replacer(s) from ${REPLACERS_DIR}`);
}

loadAll();

const watcher = chokidar.watch(REPLACERS_DIR, {
  ignoreInitial: true,
  persistent: true,
});

watcher.on('add', (filePath) => {
  if (!filePath.endsWith('.json')) return;
  const replacer = loadFile(filePath);
  if (replacer) {
    index.set(keyOf(replacer.type, replacer.matchMethod, replacer.matchPath), replacer);
    console.log(`[replacers] added: ${replacer.type} ${replacer.matchMethod} ${replacer.matchPath}`);
  }
});

watcher.on('change', (filePath) => {
  if (!filePath.endsWith('.json')) return;
  const replacer = loadFile(filePath);
  if (replacer) {
    index.set(keyOf(replacer.type, replacer.matchMethod, replacer.matchPath), replacer);
    console.log(`[replacers] updated: ${replacer.type} ${replacer.matchMethod} ${replacer.matchPath}`);
  }
});

watcher.on('unlink', () => {
  // Re-scan: removing by filename alone is fragile because we don't store the
  // file→key mapping. Reloading the small directory is cheap and correct.
  loadAll();
});

export function getRequestReplacer(method: string, path: string): Replacer | undefined {
  return index.get(keyOf('request', method, path));
}

export function getResponseReplacer(method: string, path: string): Replacer | undefined {
  return index.get(keyOf('response', method, path));
}
