// Rent (SPEC §3, §14): eviction at midnight, sleeping in the park, no cooking at home, re-housing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { season, place, hour, events, moments } from './helpers.mjs';

function toMidnight(state, replies = {}) {
  let last = null;
  const day = Math.floor(state.t / 18);
  while (Math.floor(state.t / 18) === day) last = hour(state, replies);
  return last;
}

test('no rent money at midnight: evicted, sleeps in the park, cannot cook at home', () => {
  const state = season({ n: 2, jobs: ['chemist', 'chemist'], sets: { 'rent.nightTheftChance': 1 } });
  const a = place(state, 'a01', 'home', { cash: 30 });
  place(state, 'a02', 'home', { cash: 100 });
  const line = toMidnight(state);
  assert.equal(events(line, 'eviction').length, 1);
  assert.equal(moments(line, 'eviction')[0].agents[0], 'a01');
  assert.equal(a.evicted, true);
  assert.equal(a.block, 'park');
  assert.equal(state.agents.a02.block, 'home');
  assert.equal(state.agents.a02.cash, 60);
  assert.equal(a.cash, 30 - Math.floor(30 * 0.2), 'park thieves took 20%');
  // Back home with chems: still can't cook while evicted.
  a.stock.chems = 2;
  place(state, 'a01', 'home');
  const v = hour(state, {}).views;
  assert.ok(!v.a01.menu.some(l => l.id === 'cook'));
  assert.equal(v.a01.you.home, 'evicted');
  assert.equal(v.a01.you.rentDue, 40 + 40 + 20, 'back rent, tonight and the fee');
});

test('back rent accrues every night evicted; re-housing pays it all, tonight and $20; evicted sleep is +20', () => {
  const state = season({ n: 1, off: ['nightThieves'] });
  const a = place(state, 'a01', 'home', { cash: 10, energy: 10 });
  toMidnight(state);
  assert.equal(a.evicted, true);
  assert.equal(a.backRent, 40);
  // Night 2: $90 is short of 40 + 40 + 20 = 100, so the debt grows to $80.
  a.cash = 90;
  let line = toMidnight(state);
  assert.equal(events(line, 'rehoused').length, 0);
  assert.equal(a.backRent, 80);
  assert.equal(events(line, 'rent_owed')[0].backRent, 80);
});

test('an evicted agent is re-housed when it can pay the back rent, tonight\'s rent and $20', () => {
  const state = season({ n: 1, off: ['nightThieves'] });
  const a = place(state, 'a01', 'home', { cash: 10 });
  toMidnight(state);
  a.cash = 110;
  const line = toMidnight(state);
  assert.equal(events(line, 'rehoused')[0].paid, 100);
  assert.equal(a.evicted, false);
  assert.equal(a.cash, 10);
  assert.equal(a.block, 'home');
});

test('sleeping rough in the park gives +20 energy instead of +40', () => {
  const state = season({ n: 2, off: ['nightThieves'] });
  place(state, 'a01', 'home', { cash: 0 });
  place(state, 'a02', 'home', { cash: 100 });
  while (state.t < 17) hour(state, {});
  state.agents.a01.energy = 10;
  state.agents.a02.energy = 10;
  const l = hour(state, {});
  assert.equal(l.dayEnd, true);
  assert.equal(state.agents.a01.evicted, true);
  assert.equal(state.agents.a02.energy - state.agents.a01.energy, 20);
});
