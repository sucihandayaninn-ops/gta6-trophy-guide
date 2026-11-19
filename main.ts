// Package the offline guide, browser captures and the scorer's canonical dossier.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const app = join(here, 'app');
const canonical = readFileSync(join(app, 'data/trophies.json'), 'utf8').trimEnd();
const offline = readFileSync(join(app, 'data/trophies.js'), 'utf8');

if (offline !== '/* Generated from trophies.json by scripts/sync-data.mjs. */\nconst trophyData = ' + canonical + ';\n') {
  throw new Error('Trophy data is stale. Run node scripts/sync-data.mjs.');
}

mkdirSync(out, { recursive: true });
cpSync(app, join(out, 'app'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(out, 'dossier.json'), dossier);
