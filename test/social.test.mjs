// Promises, messages, bounties, call-outs and the crate (SPEC §4.3-§4.6, §6.6, §6.8, §14).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { season, place, hour, entry, events, moments } from './helpers.mjs';

const msg = (to, text, more = {}) => ({ to, text, cash: 0, item: null, promise: null, ...more });

test('a promise is recorded in both memories, never enforced, and breaks at its deadline', () => {
  const state = season({ n: 2 });
  place(state, 'a01', 'bar', { cash: 500 });
  const line = hour(state, { a01: { move: 'rest', message: msg('a02', 'I owe you', { promise: { give: { cash: 50 }, by: 3 } }) } });
  assert.equal(events(line, 'promise_made').length, 1);
  const v = hour(state, {}).views;
  for (const id of ['a01', 'a02']) assert.ok(v[id].memory.some(m => m.kind === 'promise' && m.status === 'open' && m.give.cash === 50 && m.by === 3), id);
  assert.equal(v.a02.inbox[0].text, 'I owe you');
  assert.equal(v.a01.inbox.length, 0, 'messages reach only their recipient');
  // Nothing forces payment: a01 keeps its cash.
  let broken = null;
  while (state.t <= 3) { const l = hour(state, {}); broken = broken ?? moments(l, 'promise_broken')[0] ?? null; }
  assert.equal(state.agents.a01.cash >= 500 - 0, true);
  assert.ok(broken, 'broken at the deadline');
  assert.equal(broken.hour, 3);
  assert.equal(state.promises[0].status, 'broken');
  assert.ok(state.agents.a02.grudges.some(g => g.who === 'a01'));
});

test('a cash attachment keeps a promise; attachments move only what the sender holds', () => {
  const state = season({ n: 2 });
  const a = place(state, 'a01', 'bar', { cash: 30 });
  const b = place(state, 'a02', 'bar', { cash: 0 });
  hour(state, { a01: { move: 'rest', message: msg('a02', 'later', { promise: { give: { cash: 20 }, by: 5 } }) } });
  const line = hour(state, { a01: { move: 'rest', message: msg('a02', 'here', { cash: 500 }) } });
  assert.equal(events(line, 'transfer')[0].cash, 30);
  assert.equal(a.cash, 0);
  assert.equal(b.cash, 30);
  assert.equal(state.promises[0].status, 'kept');
  assert.equal(moments(line, 'promise_kept').length, 1);
  // An item the sender doesn't hold doesn't move.
  const l2 = hour(state, { a01: { move: 'rest', message: msg('a02', 'take my gun', { item: 'gun' }) } });
  assert.equal(events(l2, 'transfer').length, 0);
});

test('bounties: cash is held, paid to whoever beats the target, and the poster is revealed 12 hours later', () => {
  const state = season({ n: 3, sets: { 'actions.fistfight.odds': 5 } });
  const poster = place(state, 'a01', 'market', { cash: 200 });
  place(state, 'a02', 'bar');
  const hunter = place(state, 'a03', 'bar', { cash: 0 });
  const l0 = hour(state, { a01: { move: 'bounty', target: 'a02', args: { amount: 80 } } });
  assert.equal(poster.cash, 120);
  assert.equal(moments(l0, 'bounty_posted').length, 1);
  const v = hour(state, {}).views;
  assert.deepEqual(v.a03.bounties, [{ target: 'a02', amount: 80, poster: null }]);
  place(state, 'a02', 'bar');
  place(state, 'a03', 'bar');
  const l2 = hour(state, { a03: { move: 'fistfight', target: 'a02' } });
  assert.equal(entry(l2, 'a03').ok, true);
  assert.equal(hunter.cash, 80);
  assert.equal(events(l2, 'bounty_collected')[0].amount, 80);
  let revealed = null;
  while (!revealed && state.t < 20) revealed = moments(hour(state, {}), 'bounty_revealed')[0] ?? null;
  assert.equal(revealed.hour, 12);
});

test('uncollected bounties are refunded at season end', async () => {
  const state = season({ n: 2 });
  const p = place(state, 'a01', 'market', { cash: 200 });
  hour(state, { a01: { move: 'bounty', target: 'a02', args: { amount: 60 } } });
  while (state.t < state.seasonLength) hour(state, {});
  assert.equal(state.bounties[0].status, 'refunded');
  assert.ok(p.cash >= 140 + 60 - 2 * 40, 'refund returned (rent may have been paid)');
});

test('call-outs: both on the block -> an automatic fistfight; a no-show target ducks and loses call_out.duckSteal (15%) to the caller', () => {
  const state = season({ n: 3 });
  place(state, 'a01', 'park');
  place(state, 'a02', 'bar');
  hour(state, { a01: { move: 'call_out', target: 'a02', args: { block: 'park' } } });
  place(state, 'a02', 'park');
  const met = hour(state, {});
  assert.equal(moments(met, 'callout_answered').length, 1);
  assert.equal(events(met, 'fight')[0].cause, 'call_out');

  // Round 3 sends ducked viewers to the unassigned pool (systems.duckWalkAway, test/round3.test.mjs); this is the
  // round 2 rule with that switch off.
  const s2 = season({ n: 3, off: ['duckWalkAway'] });
  place(s2, 'a01', 'park');
  place(s2, 'a02', 'docks');
  s2.agents.a02.viewers.action = 100;
  s2.unassigned.action -= 100;
  const l0 = hour(s2, { a01: { move: 'call_out', target: 'a02', args: { block: 'park' } } });
  const until = events(l0, 'call_out')[0].until;
  let ducked = null;
  while (!ducked && s2.t <= until) {
    place(s2, 'a02', 'docks');
    place(s2, 'a01', 'park');
    const l = hour(s2, {});
    ducked = moments(l, 'callout_ducked')[0] ?? null;
    if (ducked) {
      const st = l.events.find(e => e.type === 'steal' && e.cause === 'ducked');
      assert.equal(st.from, 'a02');
      assert.equal(st.to, 'a01');
      assert.equal(st.pct, s2.cfg.actions.call_out.duckSteal);
    }
  }
  assert.ok(ducked);
  assert.equal(ducked.hour, until);
});

test('the crate: contestants all pay energy and take a star; one weighted winner takes the contents', () => {
  const state = season({ n: 4 });
  for (const id of state.ids) place(state, id, 'docks');
  state.crate = { block: 'docks', until: 2, contents: { kind: 'cash', cash: 250 }, dropped: 0, won: false };
  const energy = Object.fromEntries(state.ids.map(id => [id, state.agents[id].energy]));
  const line = hour(state, { a01: { move: 'crate' }, a02: { move: 'crate' }, a03: { move: 'crate' } });
  const won = events(line, 'crate_won')[0];
  assert.deepEqual(won.contestants, ['a01', 'a02', 'a03']);
  assert.equal(moments(line, 'crate_brawl').length, 1);
  for (const id of ['a01', 'a02', 'a03']) {
    assert.equal(state.agents[id].stars, 1);
    assert.equal(entry(line, id).ok, id === won.agent);
    assert.ok(state.agents[id].energy <= energy[id] - 20 + 6, 'paid 10 + 10 (regen at most +6)');
  }
  assert.equal(state.agents[won.agent].cash, state.cfg.agents.startCash + 250);
  assert.equal(state.crate, null);
  // The draw is weighted: a gun adds 0.5, so across seeds the armed contestant wins more often.
  let armedWins = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const s = season({ seed, n: 2 });
    for (const id of s.ids) place(s, id, 'docks', { energy: 0 + 50 });
    s.agents.a01.stock.guns = 1;
    s.crate = { block: 'docks', until: 2, contents: { kind: 'gun' }, dropped: 0, won: false };
    const l = hour(s, { a01: { move: 'crate' }, a02: { move: 'crate' } });
    if (events(l, 'crate_won')[0].agent === 'a01') armedWins++;
  }
  // Weights 1.75 vs 1.25: about 58%.
  assert.ok(armedWins > 95 && armedWins < 140, `armed won ${armedWins}/200`);
});

test('the crate drops on schedule, is announced in every view, and expires after 2 hours', () => {
  const state = season({ n: 2 });
  let drop = null;
  while (!drop && state.t < 20) {
    const l = hour(state, {});
    drop = events(l, 'crate_drop')[0] ?? null;
    if (drop) {
      assert.ok(l.t >= 6 && l.t <= 10, `first drop at ${l.t}`);
      const v = hour(state, {}).views;
      assert.deepEqual(v.a01.crate, { block: drop.block, untilHour: drop.until });
    }
  }
  while (state.t <= drop.until) hour(state, {});
  assert.equal(state.crate, null);
});

test('parties: the host pays $80, hosts 3 hours, attendees get +5 energy', () => {
  const state = season({ n: 5 });
  for (const id of state.ids) place(state, id, 'bar', { energy: 50 });
  const line = hour(state, { a01: { move: 'party' } });
  assert.equal(state.agents.a01.cash, state.cfg.agents.startCash - 80);
  assert.equal(state.agents.a01.state, 'partying');
  assert.equal(moments(line, 'party').length, 1);
  assert.equal(state.agents.a02.energy, 50 + 5 + 4 + 15, 'party +5, regen +4, rest +15');
  hour(state, {});
  const last = hour(state, {});
  assert.equal(state.agents.a01.state, 'free');
  assert.equal(events(last, 'party_end').length, 1);
});
