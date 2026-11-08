// Engine test helpers (not a test file). Tests build a small season, place agents, give scripted replies for one hour
// and read the typed feed line. Odds are unclamped ([0, 1]) so a test can force an outcome with odds 0 or 1.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { defaultConfig, setPath } from '../src/config.mjs';
import { createSeason } from '../src/state.mjs';
import { buildBrief, buildViews } from '../src/view.mjs';
import { runHour } from '../src/resolve.mjs';
import { finishHour } from '../src/season.mjs';

export function config(sets = {}, off = []) {
  const cfg = defaultConfig();
  cfg.odds.clamp = [0, 1];
  cfg.systems.dealtHands = false;
  for (const [k, v] of Object.entries(sets)) setPath(cfg, k, v);
  for (const o of off) cfg.systems[o] = false;
  return cfg;
}

// A season with `n` seats (greedy brains; tests script the replies), jobs as given (seat order) or the default deck.
// Seats sit at neutral sliders (round 3: the style brand is x1 there), so point tests read the bare table; a test that
// is about style passes `sliders` (one set for every seat, or an array by seat).
export const NEUTRAL = { risk: 0.5, clout: 0.5, loyalty: 0.5 };
export function season({ seed = 1, n = 4, jobs = null, sets = {}, off = [], sliders = NEUTRAL } = {}) {
  const cfg = config(sets, off);
  const sl = i => ({ ...(Array.isArray(sliders) ? sliders[i] ?? NEUTRAL : sliders) });
  const seats = Array.from({ length: n }, (_, i) => ({ brain: 'greedy', sliders: sl(i), ...(jobs ? { job: jobs[i] } : {}) }));
  const state = createSeason({ seed, config: cfg, lineup: { name: 'test', seats } });
  state.brief = buildBrief(cfg);
  return state;
}

export function place(state, id, block, more = {}) {
  Object.assign(state.agents[id], { block, ...more });
  return state.agents[id];
}

// One hour: every agent rests unless `replies` names its move. replies: { a01: { move, target, args, message, ... } }.
// Returns the feed line; the clock advances like the season loop.
export function hour(state, replies = {}, { finish = true } = {}) {
  const { views, hashes } = buildViews(state, state.brief ?? buildBrief(state.cfg));
  const reps = {};
  for (const id of state.ids) {
    if (!views[id]) continue;
    const r = replies[id] ?? (views[id].talkOnly ? { move: null } : { move: 'rest' });
    reps[id] = { ok: true, reply: { target: null, args: {}, thought: '', say: '', message: null, sell: null, callShot: null, ...r } };
  }
  const line = runHour(state, reps, views, hashes);
  line.views = views;
  if (finish) finishHour(state, line);
  return line;
}

export const views = state => buildViews(state, state.brief ?? buildBrief(state.cfg)).views;
export const entry = (line, id) => line.agents.find(e => e.id === id);
export const events = (line, type) => line.events.filter(e => e.type === type);
export const moments = (line, type) => line.moments.filter(m => m.type === type);
export const giveViewers = (state, id, v) => { for (const [g, n] of Object.entries(v)) { state.agents[id].viewers[g] += n; state.unassigned[g] -= n; } };

export function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hkmini-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
