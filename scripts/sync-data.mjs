import { readFileSync, writeFileSync } from 'node:fs';

const json = new URL('../app/data/trophies.json', import.meta.url);
const script = new URL('../app/data/trophies.js', import.meta.url);
const output = '/* Generated from trophies.json by scripts/sync-data.mjs. */\nconst trophyData = ' +
  readFileSync(json, 'utf8').trimEnd() + ';\n';

if (process.argv.includes('--check')) {
  if (readFileSync(script, 'utf8') !== output) {
    throw new Error('Trophy data is stale. Run node scripts/sync-data.mjs.');
  }
} else {
  writeFileSync(script, output);
}
