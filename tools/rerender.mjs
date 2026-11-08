#!/usr/bin/env node
// Re-render a play-by-play from a saved season: node tools/rerender.mjs <season-dir> <out-file>
// Reads <season-dir>/feed.jsonl and season.json, plus the run's run.json one folder up (its name, --set and --off) when
// it's there. No season is played and no model is called.
import fs from 'node:fs';
import path from 'node:path';
import { defaultConfig, setPath } from '../src/config.mjs';
import { renderPlayByPlay } from '../src/playbyplay.mjs';

const [dir, outFile] = process.argv.slice(2);
if (!dir || !outFile) {
  console.error('Usage: node tools/rerender.mjs <season-dir> <out-file>');
  process.exit(2);
}
const feed = fs.readFileSync(path.join(dir, 'feed.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const { setup, standings } = JSON.parse(fs.readFileSync(path.join(dir, 'season.json'), 'utf8'));
const runFile = path.join(dir, '..', 'run.json');
const runInfo = fs.existsSync(runFile) ? JSON.parse(fs.readFileSync(runFile, 'utf8')) : null;
// The run's config as far as the play-by-play reads it (style thresholds). Paths an older run set that no longer exist
// are skipped.
const cfg = defaultConfig();
for (const s of runInfo?.sets ?? []) {
  const eq = s.indexOf('=');
  try { setPath(cfg, s.slice(0, eq), s.slice(eq + 1)); } catch { /* an older config path */ }
}
for (const o of runInfo?.off ?? []) if (o in cfg.systems) cfg.systems[o] = false;
const run = runInfo ? path.basename(path.resolve(dir, '..')) : null;
fs.writeFileSync(outFile, renderPlayByPlay({ feed, setup, standings, run, cfg }));
console.log(`wrote ${outFile}`);
