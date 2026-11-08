// Cops and jail (SPEC §6.7, §4.7, §14): heat, arrests at 40/70/100%, run_cops, getaway rolls, fines, star reset.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { season, place, hour, entry, events } from './helpers.mjs';

// Arrest rate for an agent left at `stars` on a cop's block, over many seeds.
function arrestRate(stars, copHere = true, seeds = 300) {
  let n = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const state = season({ seed, n: 2, sets: { 'cops.speed': 0 } });
    place(state, 'a01', 'bar', { stars });
    state.cops.forEach(c => { c.block = copHere ? 'bar' : 'docks'; });
    state.cops.length = 1;
    const line = hour(state, {});
    if (events(line, 'arrest').some(e => e.agent === 'a01')) n++;
  }
  return n / seeds;
}

test('a cop on the block arrests at 3 stars ~40% and 4 stars ~70%; none below 3', () => {
  const r3 = arrestRate(3);
  const r4 = arrestRate(4);
  assert.ok(r3 > 0.32 && r3 < 0.48, `3 stars: ${r3}`);
  assert.ok(r4 > 0.62 && r4 < 0.78, `4 stars: ${r4}`);
  assert.equal(arrestRate(2, true, 50), 0);
  assert.equal(arrestRate(4, false, 50), 0);
});

test('5 stars is arrested at the end of the hour anywhere; jail = fine 50%, stars 0, cops.jailHours (4), released at the precinct', () => {
  const state = season({ n: 2 });
  const a = place(state, 'a01', 'park', { stars: 5, cash: 200 });
  state.cops.forEach(c => { c.block = 'docks'; });
  const line = hour(state, {});
  const ev = events(line, 'arrest')[0];
  assert.equal(ev.agent, 'a01');
  assert.equal(ev.fine, 100);
  assert.equal(a.cash, 100);
  assert.equal(a.stars, 0);
  assert.equal(a.state, 'jail');
  assert.equal(a.block, 'jail');
  assert.equal(entry(line, 'a01').state, 'jail');
  const jailedAt = line.t;
  assert.equal(a.until, jailedAt + state.cfg.cops.jailHours);
  let hours = 0;
  while (a.state === 'jail') { hour(state, {}); hours++; }
  assert.equal(hours, state.cfg.cops.jailHours);
  assert.equal(state.cfg.cops.jailHours, 4);
  assert.equal(a.block, 'precinct');
});

test('jailed agents get a talk-only view and can still message', () => {
  const state = season({ n: 2 });
  place(state, 'a01', 'park', { stars: 5 });
  hour(state, {});
  const line = hour(state, { a01: { move: null, say: 'let me out', message: { to: 'a02', text: 'bail me', cash: 0, item: null, promise: null } } });
  assert.equal(line.views.a01.talkOnly, true);
  assert.deepEqual(line.views.a01.menu, []);
  assert.equal(entry(line, 'a01').say, 'let me out');
  assert.equal(events(line, 'message').length, 1);
});

test('run_cops: legal only when wanted with a cop here (or at 5 stars); success escapes, failure adds 3 jail hours', () => {
  const s0 = season({ n: 2 });
  place(s0, 'a01', 'bar', { stars: 2 });
  s0.cops.forEach(c => { c.block = 'bar'; });
  assert.ok(!hour(s0, {}).views.a01.menu.some(l => l.id === 'run_cops'));

  const win = season({ n: 2, sets: { 'actions.run_cops.odds': 1 } });
  place(win, 'a01', 'bar', { stars: 4 });
  win.cops.forEach(c => { c.block = 'bar'; });
  let line = hour(win, { a01: { move: 'run_cops' } });
  assert.ok(line.views.a01.menu.some(l => l.id === 'run_cops'));
  assert.equal(entry(line, 'a01').ok, true);
  assert.equal(events(line, 'arrest').length, 0);
  assert.notEqual(win.agents.a01.block, 'bar');

  const lose = season({ n: 2, sets: { 'actions.run_cops.odds': 0, 'actions.run_cops.carBonus': 0 } });
  place(lose, 'a01', 'bar', { stars: 4 });
  lose.cops.forEach(c => { c.block = 'bar'; });
  line = hour(lose, { a01: { move: 'run_cops' } });
  const ev = events(line, 'arrest')[0];
  assert.equal(ev.cause, 'run_cops');
  assert.equal(lose.agents.a01.until, line.t + 4 + 3);
});

test('getaway rolls: a bank job winner with a car is arrested unless the getaway succeeds', () => {
  for (const [base, arrested] of [[1, false], [0, true]]) {
    const state = season({ n: 2, sets: { 'actions.bank_job.odds': 1, 'cops.getawayBase': base } });
    const a = place(state, 'a01', 'bank');
    a.stock.guns = 1;
    a.gear.car = 1;
    const line = hour(state, { a01: { move: 'bank_job' } });
    assert.equal(entry(line, 'a01').ok, true);
    assert.equal(events(line, 'getaway').length, 1);
    assert.equal(events(line, 'arrest').some(e => e.agent === 'a01'), arrested, `getaway base ${base}`);
  }
});

test('a drive-by gets a free getaway roll with +0.5', () => {
  const state = season({ n: 2, sets: { 'actions.drive_by.odds': 1, 'cops.getawayBase': 0.5 } });
  const a = place(state, 'a01', 'bar', { stars: 3 });
  a.stock.guns = 1;
  a.gear.car = 1;
  place(state, 'a02', 'park');
  state.cops.forEach(c => { c.block = 'bar'; });
  const line = hour(state, { a01: { move: 'drive_by', target: 'a02' } });
  const g = events(line, 'getaway')[0];
  assert.equal(g.ok, true, 'base 0.5 + 0.5 = 1');
  assert.equal(events(line, 'arrest').length, 0, 'a successful getaway means no arrest even at 5 stars');
});

test('cops move toward the block with the most new stars; heat decays at day end with no crime', () => {
  const state = season({ n: 2, sets: { 'actions.pickpocket.odds': 0 } });
  place(state, 'a01', 'park');
  state.cops.forEach(c => { c.block = 'market'; });
  const line = hour(state, { a01: { move: 'pickpocket' } });
  assert.ok(state.cops.every(c => c.block === 'park'), JSON.stringify(state.cops), 'two blocks a turn reaches the park from the market');
  assert.ok(events(line, 'cop_move').length >= 1);
  // Heat decay: a02 with 2 stars and no crime loses one at midnight.
  const s2 = season({ n: 2 });
  place(s2, 'a02', 'market', { stars: 2 });
  s2.cops.forEach(c => { c.block = 'docks'; });
  for (let i = 0; i < 18; i++) hour(s2, {});
  assert.equal(s2.agents.a02.stars, 1);
});
