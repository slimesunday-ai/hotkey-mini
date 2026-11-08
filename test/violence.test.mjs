// Kill the king, hospital and the lone-worker rule (SPEC §4.4, §4.7, §6.4, §14).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { season, place, hour, entry, events, moments, giveViewers, views } from './helpers.mjs';

function armed(state, id, block) {
  const a = place(state, id, block);
  a.stock.guns = 1;
  return a;
}

test('kill_king is only on the menu for the king, on your block, with a gun', () => {
  const state = season({ n: 3 });
  armed(state, 'a01', 'bar');
  place(state, 'a02', 'bar');
  place(state, 'a03', 'bar');
  giveViewers(state, 'a02', { action: 300 });
  state.king = 'a02';
  let v = views(state);
  const kk = v.a01.menu.find(l => l.id === 'kill_king');
  assert.deepEqual(kk.targets, ['a02']);
  assert.ok(!v.a03.menu.some(l => l.id === 'kill_king'), 'no gun, no kill_king');
  state.king = null;
  v = views(state);
  assert.ok(!v.a01.menu.some(l => l.id === 'kill_king'), 'no king, no kill_king');
  state.king = 'a02';
  place(state, 'a02', 'park');
  v = views(state);
  assert.ok(!v.a01.menu.some(l => l.id === 'kill_king'), 'king elsewhere');
});

test('killing the king: dead until max(3, 12 - floor(viewers/100)), 80% steal (40% x kingslayer 2), one item, the bounty; revive at home', () => {
  const state = season({ n: 3, sets: { 'actions.kill_king.odds': 1 } });
  const a = armed(state, 'a01', 'bar');
  a.cash = 200;
  const k = place(state, 'a02', 'bar');
  k.gear.chain = 1;
  giveViewers(state, 'a02', { action: 400, drama: 100 });
  state.king = 'a02';
  // a03 posts a bounty on the king first (bounty is resolved in the same seeded order; post it an hour earlier).
  place(state, 'a03', 'market', { cash: 300 });
  hour(state, { a03: { move: 'bounty', target: 'a02', args: { amount: 120 } } }, { finish: true });
  place(state, 'a01', 'bar');
  place(state, 'a02', 'bar');
  state.king = 'a02';
  const vBefore = state.agents.a02.viewers.action + state.agents.a02.viewers.drama + state.agents.a02.viewers.weird + state.agents.a02.viewers.feelgood;
  const cashBefore = a.cash;
  const line = hour(state, { a01: { move: 'kill_king', target: 'a02', args: { take: 'chain' } } });
  const e = entry(line, 'a01');
  assert.equal(e.ok, true);
  assert.equal(k.state, 'dead');
  assert.equal(a.gear.chain, 1);
  assert.equal(k.gear.chain, 0);
  assert.ok(a.cash >= cashBefore + 120 || state.agents.a01.state === 'jail', 'bounty paid (cash may then be fined on arrest)');
  assert.equal(events(line, 'bounty_collected')[0].amount, 120);
  const st = line.events.find(x => x.type === 'steal' && x.cause === 'kill_king');
  assert.ok(Math.abs(st.viewers - vBefore * 0.8) < 1e-6);
  assert.equal(moments(line, 'king_killed').length, 1);
  const deadFor = k.until - line.t;
  const left = vBefore * 0.2;
  assert.equal(deadFor, Math.max(3, 12 - Math.floor(left / 100)));
  // Dead: no view at all, no talk.
  const next = hour(state, {});
  assert.equal(next.views.a02, null);
  let h = 1;
  while (k.state === 'dead') { hour(state, {}); h++; }
  assert.equal(h, deadFor);
  assert.equal(k.block, 'home');
});

test('a failed kill gives the king a grudge and +4 stars', () => {
  const state = season({ n: 2, sets: { 'actions.kill_king.odds': 0, 'actions.kill_king.alone': 0, 'cops.speed': 0 } });
  armed(state, 'a01', 'bar');
  place(state, 'a02', 'bar');
  giveViewers(state, 'a02', { action: 100 });
  state.king = 'a02';
  state.cops.forEach(c => { c.block = 'docks'; });
  const line = hour(state, { a01: { move: 'kill_king', target: 'a02' } });
  assert.equal(entry(line, 'a01').ok, false);
  assert.equal(state.agents.a01.stars, 4);
  assert.ok(state.agents.a02.grudges.some(g => g.who === 'a01'));
  assert.equal(moments(line, 'king_attempt').length, 1);
});

test('a shot target goes to hospital for 6 hours and loses its pending action (interrupted)', () => {
  const state = season({ n: 2, sets: { 'actions.shoot.odds': 1 } });
  armed(state, 'a01', 'market');
  place(state, 'a02', 'market');
  const line = hour(state, { a01: { move: 'shoot', target: 'a02' }, a02: { move: 'shift' } });
  assert.equal(entry(line, 'a01').ok, true);
  const t = entry(line, 'a02');
  assert.equal(t.why, 'interrupted');
  assert.equal(t.ok, false);
  assert.equal(state.agents.a02.state, 'hospital');
  assert.equal(state.agents.a02.until, line.t + 6);
  assert.equal(state.agents.a01.stars, 3);
  // Talk-only while in hospital.
  const next = hour(state, {});
  assert.equal(next.views.a02.talkOnly, true);
});

test('a target that moved away fails with a typed reason', () => {
  const state = season({ n: 2 });
  place(state, 'a01', 'bar');
  place(state, 'a02', 'bar');
  const line = hour(state, { a01: { move: 'fistfight', target: 'a02' }, a02: { move: 'move', args: { to: 'park' } } });
  assert.equal(entry(line, 'a01').why, 'target_left_block');
});

test('lone-worker rule: +0.15 on a mug when nobody else is on the block, never at a party', () => {
  const state = season({ n: 3 });
  place(state, 'a01', 'corner');
  place(state, 'a02', 'corner');
  place(state, 'a03', 'docks');
  let v = views(state);
  const alone = v.a01.menu.find(l => l.id === 'mug').options.find(o => o.target === 'a02').odds;
  place(state, 'a03', 'corner');
  v = views(state);
  const crowd = v.a01.menu.find(l => l.id === 'mug').options.find(o => o.target === 'a02').odds;
  assert.ok(Math.abs(alone - crowd - 0.15) < 1e-9, `${alone} vs ${crowd}`);
  place(state, 'a03', 'docks');
  state.parties.push({ host: 'a03', block: 'corner', start: 0, until: 5, active: true, guests: [] });
  v = views(state);
  const party = v.a01.menu.find(l => l.id === 'mug').options.find(o => o.target === 'a02').odds;
  assert.ok(Math.abs(party - crowd) < 1e-9);
});
