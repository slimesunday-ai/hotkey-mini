// Money rules (SPEC §4.1-§4.2, §14): the dealing crowd floor, board atomicity, wholesaler decay, the job chain.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { season, place, hour, entry, events } from './helpers.mjs';

test('dealing: -15% per other dealer on the block this hour, floor 40%', () => {
  const jobs = Array(7).fill('dealer');
  for (const [dealers, factor] of [[1, 1], [2, 0.85], [3, 0.7], [5, 0.4], [7, 0.4]]) {
    const state = season({ n: 7, jobs, sets: { 'actions.deal.heatChance': 0 } });
    const replies = {};
    for (let i = 0; i < dealers; i++) {
      const id = state.ids[i];
      const a = place(state, id, 'corner');
      a.stock.product = 3;
      replies[id] = { move: 'deal' };
    }
    state.cops.forEach(c => { c.block = 'docks'; });
    const line = hour(state, replies);
    const d = events(line, 'deal')[0];
    assert.equal(d.factor, factor, `${dealers} dealers`);
    assert.equal(d.cash, Math.round(3 * 25 * factor));
  }
});

test('a cop on the block at the start of the hour means +1 star for dealing', () => {
  const state = season({ n: 1, jobs: ['dealer'], sets: { 'actions.deal.heatChance': 0 } });
  const a = place(state, 'a01', 'corner');
  a.stock.product = 2;
  state.cops[0].block = 'corner';
  state.cops[1].block = 'docks';
  hour(state, { a01: { move: 'deal' } });
  assert.equal(a.stars, 1);
});

test('board trades are atomic: cash and goods swap together, or nothing moves', () => {
  const state = season({ n: 2, jobs: ['smuggler', 'chemist'] });
  const s = place(state, 'a01', 'docks');
  s.stock.chems = 4;
  const b = place(state, 'a02', 'home', { cash: 15 });
  // a01 lists 4 chems at $9.
  hour(state, { a01: { move: 'rest', sell: { good: 'chems', qty: 4, price: 9 } } });
  assert.equal(s.stock.chems, 0, 'listed goods are held by the board');
  // a02 asks for 3 but can pay for 1: exactly 1 swaps.
  const sellerCash = s.cash;
  const line = hour(state, { a02: { move: 'buy', args: { item: 'chems', qty: 3, from: 'board' } } });
  assert.equal(b.stock.chems, 1);
  assert.equal(b.cash, 6);
  assert.equal(s.cash, sellerCash + 9);
  const trades = events(line, 'trade');
  assert.equal(trades.length, 1);
  assert.equal(trades[0].seller, 'a01');
  assert.equal(state.board.listings[0].qty, 3);
  // A buyer with $5 can't afford a $9 unit: nothing moves.
  b.cash = 5;
  const before = { cash: s.cash, listed: state.board.listings[0].qty };
  const l2 = hour(state, { a02: { move: 'buy', args: { item: 'chems', qty: 1, from: 'board' } } });
  assert.equal(entry(l2, 'a02').ok, false);
  assert.equal(b.cash, 5);
  assert.equal(b.stock.chems, 1);
  assert.equal(s.cash, before.cash);
  assert.equal(state.board.listings[0].qty, before.listed);
});

test('the cheapest ask wins; the NPC supplier backs the board at its markup', () => {
  const state = season({ n: 3, jobs: ['smuggler', 'smuggler', 'chemist'] });
  place(state, 'a01', 'docks').stock.chems = 1;
  place(state, 'a02', 'docks').stock.chems = 1;
  hour(state, { a01: { move: 'rest', sell: { good: 'chems', qty: 1, price: 11 } }, a02: { move: 'rest', sell: { good: 'chems', qty: 1, price: 8 } } });
  const line = hour(state, { a03: { move: 'buy', args: { item: 'chems', qty: 3, from: 'board' } } });
  assert.deepEqual(events(line, 'trade').map(t => [t.seller, t.price]), [['a02', 8], ['a01', 11], ['npc', 12]]);
});

test('the wholesaler pays 5% less per unit sold to it that day, floor 50%, and resets at midnight', () => {
  const state = season({ n: 1, jobs: ['smuggler'] });
  const a = place(state, 'a01', 'docks');
  a.stock.chems = 12;
  const line = hour(state, { a01: { move: 'rest', sell: { good: 'chems', qty: 12, to: 'npc' } } });
  const prices = events(line, 'trade').map(t => t.price);
  assert.deepEqual(prices.slice(0, 3), [5, 4.75, 4.5]);
  assert.equal(prices[10], 2.5);
  assert.equal(prices[11], 2.5);
  assert.equal(state.wholesaleSold.chems, 12);
  while (state.t < 18) hour(state, {});
  assert.equal(state.wholesaleSold.chems, 0);
});

test('the job chain: run, cook, build make goods; cook and build need home and the inputs', () => {
  const state = season({ n: 3, jobs: ['smuggler', 'chemist', 'gunrunner'], sets: { 'actions.run.heatChance': 0, 'actions.cook.heatChance': 0, 'actions.build.heatChance': 0 } });
  place(state, 'a01', 'docks');
  place(state, 'a02', 'home').stock.chems = 2;
  place(state, 'a03', 'home').stock.parts = 2;
  hour(state, { a01: { move: 'run', args: { good: 'parts' } }, a02: { move: 'cook' }, a03: { move: 'build' } });
  assert.equal(state.agents.a01.stock.parts, 2);
  assert.equal(state.agents.a02.stock.product, 3);
  assert.equal(state.agents.a02.stock.chems, 0);
  assert.equal(state.agents.a03.stock.guns, 1);
  const v = hour(state, {}).views;
  assert.ok(!v.a02.menu.some(l => l.id === 'cook'), 'no chems, no cook');
});
