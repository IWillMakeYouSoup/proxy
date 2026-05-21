import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = join(__dirname, '..');
export const ORIGINAL_DIR = join(PROJECT_ROOT, 'originalRequests');
export const CHANGED_DIR = join(PROJECT_ROOT, 'changedRequest');
export const REPLACERS_DIR = join(PROJECT_ROOT, 'replacers');
export const INTERCEPT_REQUEST_DIR = join(PROJECT_ROOT, 'interceptRequest');
export const INTERCEPT_RESPONSE_DIR = join(PROJECT_ROOT, 'interceptResponse');
