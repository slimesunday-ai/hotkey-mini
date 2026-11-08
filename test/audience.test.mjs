// The fake audience (SPEC §5, §14): viewer conservation, steal math with kingslayer, and the boredom, novelty and
// callShot multipliers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS } from '../src/config.mjs';
import { createSeason } from '../src/state.mjs';
import { buildBrief, buildViews } from '../src/view.mjs';
import { runHour } from '../src/resolve.mjs';
import { finishHour } from '../src/season.mjs';
import { decideBot } from '../src/bots.mjs';
import { loadLineup } from '../src/lineups.mjs';
import { steal } from '../src/audience.mjs';
import { season, place, hour, entry, giveViewers, config } from './helpers.mjs';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));

function conservationRun(cfg) {
  const state = createSeason({ seed: 11, config: cfg, lineup: loadLineup('default') });
  const brief = buildBrief(cfg);
  while (state.t < state.seasonLength) {
    const { views, hashes } = buildViews(state, brief);
    const replies = {};
    for (const id of state.ids) if (views[id]) replies[id] = { ok: true, reply: decideBot(views[id], { brain: state.agents[id].brain, cfg, seed: 11 }) };
    const line = runHour(state, replies, views, hashes);
    for (const g of GROUPS) {
      const held = state.ids.reduce((s, id) => s + state.agents[id].viewers[g], 0);
      assert.ok(near(held + state.unassigned[g], state.pools[g]), `t${state.t} ${g}: ${held} + ${state.unassigned[g]} != ${state.pools[g]}`);
    }
    finishHour(state, line);
  }
  return state;
}

test('viewers are conserved: agents + unassigned = pool every hour (growth on and off)', () => {
  const on = conservationRun(config({}, []));
  assert.ok(GROUPS.some(g => !near(on.pools[g], on.startPools[g])), 'with growth on, some pool changes size');
  const off = conservationRun(config({}, ['audienceGrowth']));
  for (const g of GROUPS) assert.ok(near(off.pools[g], off.startPools[g]), 'with growth off, pools keep their size');
});

test('steal moves exactly pct of each group; kingslayer: x1.5 against the king, x2 for kill_king', () => {
  const state = season({ n: 3 });
  giveViewers(state, 'a01', { action: 100, drama: 50, weird: 0, feelgood: 10 });
  const ctx = { events: [], stolen: {}, kingAtStart: null };
  const moved = steal(state, ctx, 'a01', 'a02', 0.1, 'mug');
  assert.ok(near(moved, 16));
  assert.ok(near(state.agents['a02'].viewers.action, 10));
  assert.ok(near(state.agents['a01'].viewers.drama, 45));
  const ctx2 = { events: [], stolen: {}, kingAtStart: 'a01' };
  const before = state.agents['a01'].viewers.action;
  steal(state, ctx2, 'a01', 'a03', 0.1, 'mug');
  assert.ok(near(state.agents['a03'].viewers.action, before * 0.15), 'kingslayer: 15% instead of 10%');
  const ctx3 = { events: [], stolen: {}, kingAtStart: 'a01' };
  const b2 = state.agents['a01'].viewers.action;
  steal(state, ctx3, 'a01', 'a02', 0.4, 'kill_king');
  assert.ok(near(state.agents['a02'].viewers.action - 10, b2 * 0.8), "kill_king: 40% x 2 = 80%");
  // A duck is not a win: no bonus.
  const ctx4 = { events: [], stolen: {}, kingAtStart: 'a01' };
  const b3 = state.agents['a01'].viewers.drama;
  steal(state, ctx4, 'a01', 'a03', 0.1, 'ducked');
  assert.ok(near(state.agents['a01'].viewers.drama, b3 * 0.9));
});

test('kingslayer: a won mug against the king steals x1.5 in play', () => {
  const state = season({ n: 3, sets: { 'actions.mug.odds': 1 } });
  giveViewers(state, 'a02', { action: 200 });
  state.king = 'a02';
  place(state, 'a01', 'bar');
  place(state, 'a02', 'bar');
  const line = hour(state, { a01: { move: 'mug', target: 'a02' } });
  const st = line.events.find(e => e.type === 'steal' && e.cause === 'mug');
  assert.ok(near(st.pct, 0.15), String(st.pct));
});

test('boredom halves points per repeat in the window; novelty x1.5 weird when alone', () => {
  const state = season({ n: 3 });
  for (const id of state.ids) place(state, id, 'market');
  // a01 crip walks alone: weird 1.5 x 1.5 novelty, feelgood 1.
  let line = hour(state, { a01: { move: 'crip_walk' } });
  assert.ok(near(entry(line, 'a01').fans.weird, 2.25));
  assert.ok(near(entry(line, 'a01').fans.feelgood, 1));
  // Again, and a02 also crip walks: a01 has 1 repeat (x0.5), no novelty.
  line = hour(state, { a01: { move: 'crip_walk' }, a02: { move: 'crip_walk' } });
  assert.ok(near(entry(line, 'a01').fans.weird, 0.75));
  assert.ok(near(entry(line, 'a01').fans.feelgood, 0.5));
  // A third time: 2 repeats, x0.25 (alone again: novelty back).
  line = hour(state, { a01: { move: 'crip_walk' } });
  assert.ok(near(entry(line, 'a01').fans.feelgood, 0.25));
  assert.ok(Math.abs(entry(line, 'a01').fans.weird - 1.5 * 0.25 * 1.5) < 0.01, 'feed fans are rounded to cents');
});

test('boredom off and novelty off remove those multipliers', () => {
  const state = season({ n: 2, off: ['boredom', 'novelty'] });
  place(state, 'a01', 'market');
  hour(state, { a01: { move: 'crip_walk' } });
  const line = hour(state, { a01: { move: 'crip_walk' } });
  assert.ok(near(entry(line, 'a01').fans.weird, 1.5));
});

test('a called shot that lands scores x2 and the attempt gets -0.15 odds', () => {
  const state = season({ n: 3, sets: { 'actions.fistfight.odds': 0.65, 'actions.fistfight.loneWorker': 0, 'actions.fistfight.energyDiffDiv': 1e9 } });
  place(state, 'a01', 'bar');
  place(state, 'a02', 'bar');
  // With the called shot: odds 0.65 - 0.15 = 0.5, shown on the menu next hour.
  hour(state, { a01: { move: 'rest', callShot: { move: 'fistfight', target: 'a02' } } });
  place(state, 'a01', 'bar');
  place(state, 'a02', 'bar');
  const st = state;
  const line = hour(st, { a01: { move: 'fistfight', target: 'a02' } });
  const menuLine = line.views.a01.menu.find(l => l.id === 'fistfight');
  assert.equal(menuLine.options.find(o => o.target === 'a02').odds, 0.5);
  const e = entry(line, 'a01');
  if (e.ok) assert.ok(near(e.fans.action, 3 * 2) && near(e.fans.drama, 1 * 2), 'won: x2');
  else assert.ok(near(e.fans.action, 1), 'lost: no x2');
  assert.equal(e.result.odds, 0.5);
});

test('a called shot scores x2 on a forced win', () => {
  const state = season({ n: 3, sets: { 'actions.fistfight.odds': 1.5 } });
  place(state, 'a01', 'bar');
  place(state, 'a02', 'bar');
  const line = hour(state, { a01: { move: 'fistfight', target: 'a02', callShot: { move: 'fistfight', target: 'a02' } } });
  const e = entry(line, 'a01');
  assert.equal(e.ok, true);
  assert.ok(near(e.fans.action, 6) && near(e.fans.drama, 2));
});
