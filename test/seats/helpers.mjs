// Shared helpers for the seats tests (not a test file itself).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURES = path.join(here, 'fixtures');
export const fixtureNames = () => fs.readdirSync(FIXTURES).filter(f => f.endsWith('.json')).sort();
// A fresh copy of a §7 view fixture, so a test can change it freely.
export const loadFixture = name => JSON.parse(fs.readFileSync(path.join(FIXTURES, name.endsWith('.json') ? name : `${name}.json`), 'utf8'));

// The view at another hour: the same brief, a moved clock and a few live fields changed.
export function atHour(view, day, hour) {
  const v = structuredClone(view);
  // t counts acting hours from 0 (18 a day, 06:00-23:00), as the engine's clock does.
  const t = (day - 1) * 18 + (hour - 6);
  v.clock = { ...v.clock, day, hour, ...(Object.hasOwn(v.clock, 't') ? { t } : {}), actingHoursLeft: 54 - t };
  v.headlines = [...(v.headlines || []), `Day ${day} ${String(hour).padStart(2, '0')}:00 headline`];
  if (v.you) v.you.energy = Math.max(0, (v.you.energy ?? 0) - 3);
  return v;
}

// A temp dir under os.tmpdir() (SPEC §1), removed by the returned cleanup.
export function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hkmini-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

// A key file for the openrouter-transport tests: a word built at runtime that no scanner reads as a key.
export function fakeKeyFile(dir) {
  const file = path.join(dir, 'or-key');
  fs.writeFileSync(file, ['test', 'only', 'not', 'a', 'key'].join('-'));
  return file;
}

// Moves a manualClock forward in steps until the promise settles (or `max` steps pass), then returns its value.
export async function drive(promise, clock, step = 1000, max = 1000) {
  let settled = false;
  const p = promise.finally(() => {
    settled = true;
  });
  for (let i = 0; i < max && !settled; i++) await clock.advance(step);
  return p;
}
