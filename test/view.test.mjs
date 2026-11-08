// The view and the menu (SPEC §7, §14): legality, privacy, the pinned shape, dealt hands.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { season, place, hour, views, giveViewers, config } from './helpers.mjs';
import { createSeason } from '../src/state.mjs';
import { buildBrief, buildViews } from '../src/view.mjs';
import { runHour } from '../src/resolve.mjs';
import { finishHour } from '../src/season.mjs';
import { decideBot } from '../src/bots.mjs';
import { loadLineup } from '../src/lineups.mjs';
import { JOB_ACTION } from '../src/config.mjs';
import { legalLines } from '../src/menu.mjs';

const ids = (v, who) => v[who].menu.map(l => l.id);

test('the view has every pinned §7 field', () => {
  const state = season({ n: 3 });
  const v = views(state).a01;
  for (const k of ['brief', 'you', 'clock', 'last', 'memory', 'conversations', 'roster', 'here', 'audience', 'board', 'bounties', 'callOuts', 'crate', 'headlines', 'inbox', 'menu']) assert.ok(k in v, k);
  assert.equal(Object.keys(v)[0], 'brief');
  for (const k of ['town', 'goal', 'fans', 'jobs', 'gear', 'rules', 'reply']) assert.ok(k in v.brief, `brief.${k}`);
  for (const k of ['id', 'name', 'job', 'persona', 'sliders', 'block', 'energy', 'cash', 'stars', 'viewers', 'rank', 'items', 'stock', 'car', 'armor', 'home', 'state', 'rentDue', 'scouting']) assert.ok(k in v.you, `you.${k}`);
  for (const k of ['day', 'hour', 'actingHoursLeft']) assert.ok(k in v.clock, `clock.${k}`);
  for (const l of v.menu) for (const k of ['id', 'label', 'energy', 'cash', 'odds', 'pays', 'fans', 'heat', 'why', 'targets', 'args']) assert.ok(k in l, `${l.id}.${k}`);
  for (const r of v.roster) for (const k of ['id', 'name', 'job', 'block', 'stars', 'crowd', 'visible', 'state', 'king', 'bounty', 'flashing']) assert.ok(k in r, `roster.${k}`);
});

test('menu legality: gear, location, energy and target presence', () => {
  const state = season({ n: 3, jobs: ['dealer', 'chemist', 'smuggler'] });
  place(state, 'a01', 'market');
  place(state, 'a02', 'docks');
  place(state, 'a03', 'docks');
  let v = views(state);
  assert.ok(ids(v, 'a01').includes('shift') && ids(v, 'a01').includes('pickpocket'));
  assert.ok(!ids(v, 'a01').includes('shoot'), 'no gun, no shoot');
  assert.ok(!ids(v, 'a01').includes('mug'), 'nobody on the block to mug');
  assert.ok(!ids(v, 'a01').includes('deal'), 'no product, and not a dealing spot');
  assert.ok(ids(v, 'a03').includes('run') && !ids(v, 'a02').includes('run'), 'run is the smuggler\'s, at the docks');
  assert.deepEqual(v.a02.menu.find(l => l.id === 'mug').targets, ['a03']);
  // Gun: shoot appears with the right target.
  state.agents.a02.stock.guns = 1;
  v = views(state);
  assert.deepEqual(v.a02.menu.find(l => l.id === 'shoot').targets, ['a03']);
  // Energy 5: fistfight (15) is gone; move, rest and lay low stay; at 0, only those three.
  place(state, 'a02', 'docks', { energy: 5 });
  v = views(state);
  assert.ok(!ids(v, 'a02').includes('fistfight'));
  assert.ok(ids(v, 'a02').includes('push_npc'), 'push costs 5');
  place(state, 'a02', 'docks', { energy: 0 });
  v = views(state);
  assert.deepEqual(ids(v, 'a02').sort(), ['lay_low', 'move', 'rest']);
  // A car moves up to 2 blocks.
  place(state, 'a01', 'home', { energy: 80 });
  state.agents.a01.gear.car = 1;
  v = views(state);
  assert.deepEqual(v.a01.menu.find(l => l.id === 'move').args.to.sort(), ['bank', 'bar', 'corner', 'docks', 'market']);
});

test('the view never shows other agents\' cash, viewer numbers or thoughts, or messages meant for someone else', () => {
  const state = season({ n: 3 });
  place(state, 'a01', 'bar', { cash: 4321 });
  place(state, 'a02', 'bar', { cash: 777 });
  place(state, 'a03', 'bar');
  giveViewers(state, 'a02', { action: 123.4, drama: 56 });
  const line = hour(state, {
    a02: { move: 'rest', thought: 'secretplanzebra', say: 'hello all', message: { to: 'a03', text: 'privatenoteyak', cash: 0, item: null, promise: null } },
  });
  const v = hour(state, {}).views;
  const mine = JSON.stringify({ ...v.a01, brief: null });
  assert.ok(!mine.includes('secretplanzebra'));
  assert.ok(!mine.includes('privatenoteyak'));
  assert.ok(mine.includes('hello all'), 'say is heard on the block');
  assert.ok(JSON.stringify(v.a03.inbox).includes('privatenoteyak'));
  for (const r of v.a01.roster) {
    assert.ok(!('cash' in r) && !('viewers' in r) && !('thought' in r) && !('energy' in r), JSON.stringify(r));
  }
  assert.ok(!mine.includes('"cash":777'));
  assert.ok(!mine.includes('4321') || v.a01.you.cash === 4321);
  assert.ok(line);
  // Only your own coarse rank, no full ranking.
  assert.ok(['king', 'top 3', 'top half', 'bottom half'].includes(v.a01.you.rank));
});

test('dealt hands always hold move, rest, the job action, kill_king, run_cops and crate when legal', () => {
  const cfg = config();
  cfg.systems.dealtHands = true;
  const state = createSeason({ seed: 5, config: cfg, lineup: loadLineup('default') });
  const brief = buildBrief(cfg);
  let checked = 0;
  const always = id => ['move', 'rest', JOB_ACTION[state.agents[id].job], 'kill_king', 'run_cops', 'crate'];
  while (state.t < state.seasonLength) {
    const { views: vs, hashes } = buildViews(state, brief);
    const replies = {};
    for (const id of state.ids) {
      const v = vs[id];
      if (!v) continue;
      if (v.menu.length) {
        assert.ok(v.menu.length <= cfg.view.handSize + 3);
        // The full legal menu, to compare with the hand.
        const full = legalLines(state, state.agents[id]).map(l => l.id);
        for (const must of always(id)) if (full.includes(must)) { assert.ok(v.menu.some(l => l.id === must), `${id} t${state.t} missing ${must}`); checked++; }
        if (full.length > cfg.view.handSize) assert.ok(v.menu.length < full.length);
      }
      replies[id] = { ok: true, reply: decideBot(v, { brain: state.agents[id].brain, cfg, seed: 5 }) };
    }
    const line = runHour(state, replies, vs, hashes);
    finishHour(state, line);
  }
  assert.ok(checked > 300);
});
