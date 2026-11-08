import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../../src/seats/prompt.mjs';
import { REPLY_FORMAT } from '../../src/seats/reply.mjs';
import { loadFixture, fixtureNames, atHour } from './helpers.mjs';

test('render is deterministic: the same view gives the same strings', () => {
  for (const name of fixtureNames()) {
    const view = loadFixture(name);
    const a = render(view);
    const b = render(loadFixture(name));
    const c = render(structuredClone(view));
    assert.equal(a.system, b.system, name);
    assert.equal(a.user, b.user, name);
    assert.equal(a.system, c.system, name);
    assert.equal(a.user, c.user, name);
    assert.ok(a.system.length > 0 && a.user.length > 0, name);
  }
});

test('the system part is byte-identical across hours (and seats); the user part changes', () => {
  const view = loadFixture('free-dealer');
  const h14 = render(view);
  const h15 = render(atHour(view, 2, 15));
  const d3 = render(atHour(view, 3, 7));
  assert.equal(h15.system, h14.system);
  assert.equal(d3.system, h14.system);
  assert.notEqual(h15.user, h14.user);
  assert.match(h15.user, /^Day 2 15:00\./m);
  // Every fixture shares the brief, so every seat gets the same system text.
  for (const name of fixtureNames()) assert.equal(render(loadFixture(name)).system, h14.system, name);
  // Nothing hour- or seat-specific leaks into the system part.
  assert.doesNotMatch(h14.system, /Vex|a03|14:00|Day 2|reckless|lowkey/);
});

test('the system part carries the brief and the reply format with its limits', () => {
  const { system } = render(loadFixture('free-dealer'));
  for (const s of ['TOWN', 'GOAL', 'VIEWER GROUPS', 'JOBS', 'GEAR', 'RULES', 'MENU FORMAT', 'REPLY']) assert.match(system, new RegExp(`^${s}$`, 'm'), s);
  assert.match(system, /Each shows only the numbers that differ from its MENU line/);
  assert.ok(system.includes(REPLY_FORMAT));
  assert.ok(system.endsWith(REPLY_FORMAT));
  assert.match(system, /thought: up to 30 words\. Private/);
  assert.match(system, /say: up to 20 words, or ""\. Spoken out loud to everyone on your block, in your own voice/);
  assert.match(system, /never quotes menu numbers, odds, percentages or agent ids/);
  assert.match(system, /up to 30 words/);
  assert.match(system, /never enforces it/);
  assert.match(system, /gun \(\$150\)/);
  assert.match(system, /- feelgood: likes parties, gifts, kept promises, battles/);
});

test('the user part has every section in order, and every menu line its live numbers, targets and args', () => {
  const { user } = render(loadFixture('free-dealer'));
  const order = ['ALERTS', 'NOW', 'YOU', 'LAST HOUR', 'MEMORY', 'CONVERSATIONS', 'ROSTER', 'ON YOUR BLOCK', 'AUDIENCE', 'MARKET BOARD', 'BOUNTIES', 'CALL-OUTS', 'CRATE', 'HEADLINES', 'INBOX', 'MENU'];
  let at = -1;
  for (const s of order) {
    const i = user.search(new RegExp(`^${s}`, 'm'));
    assert.ok(i > at, `${s} comes after the section before it`);
    at = i;
  }
  assert.match(user, /^- deal: Deal product here \| energy 10 \| cost \$0 \| odds 100% \| pays \$43 \| fans drama 1 \| heat \+1 star if a cop is here \(none now\); else 15% \| heat risk 0\.15 stars \| why: 3 other dealers here last hour: price at 58%$/m);
  assert.match(user, /- mug: .*odds 55% .*steals ~15 viewers .*targets: a05 \(Rook\), a07 \(Kim\) \| args: \{"take":\["cash","chain","car",null\]\}/);
  assert.match(user, /- bounty: .*args: \{"amount":"int 50-140"\}/);
  assert.match(user, /Vex \(a03\), dealer\. Persona: Talks fast/);
  assert.match(user, /Cash \$140\. Heat 2 stars\./);
  assert.match(user, /- grudge: who a07 \(Kim\); what mugged you for \$60; at Day 2 10:00/);
  assert.match(user, /a09 \(Moss\) called out a03 \(you\) at park; through Day 2 21:00/);
  assert.match(user, /on a05 \(Rook\): \$200; poster not revealed/);
  assert.match(user, /from a02 \(Penny\), Day 2 13:00: "Where's my 50\?"/);
  assert.match(user, /At docks through Day 2 19:00\./);
});

test('target objects show their names; a menu line keeps a target list of objects', () => {
  const { user } = render(loadFixture('armed-gunrunner'));
  assert.match(user, /- kill_king: .*targets: a05 \(Rook\) \| args: \{"take":\["gun","armor","chain","grill","fit",null\]\}/);
  assert.match(user, /- steal_car: .*targets: a06 \(Tess\)/);
  assert.match(user, /"Give me a ride and I will pay 40\."; promise: give \$40 by Day 3 23:00$/m);
  assert.match(user, /poster a10 \(Wren\)/);
});

test('a talk-only view says there are no moves and move must be null', () => {
  const { user } = render(loadFixture('jail-talk-only'));
  assert.match(user, /^MENU\nNo moves this hour \(state: jail\)\. "move" must be null\.$/m);
  assert.match(user, /^CRATE\nnone$/m);
});

test('facts only: no advice wording in either part', () => {
  for (const name of fixtureNames()) {
    const { system, user } = render(loadFixture(name));
    for (const text of [system, user]) {
      assert.doesNotMatch(text, /\byou should\b|\bshould\b|\bbest move\b|\bwe recommend\b|\btry to\b|\bconsider\b/i, name);
    }
  }
});

test('fields the renderer does not know still reach the model, in a stable order', () => {
  const view = loadFixture('zero-energy');
  view.weather = 'rain';
  view.you.mood = 'tired';
  view.clock.abs = 6;
  view.menu[0].crowding = 0.5;
  view.brief.extra = ['one more fact'];
  const { system, user } = render(view);
  assert.match(user, /^WEATHER\nrain$/m);
  assert.match(user, /^mood: tired$/m);
  assert.match(user, /abs: 6\./);
  assert.match(user, /\| crowding: 0\.5$/m);
  assert.match(system, /^EXTRA\n- one more fact$/m);
  // Key order in the view object doesn't change the text.
  const shuffled = Object.fromEntries(Object.entries(view).reverse());
  shuffled.you = Object.fromEntries(Object.entries(view.you).reverse());
  assert.equal(render(shuffled).user, user);
  assert.equal(render(shuffled).system, system);
});

test("the engine's added fields: the clock, per-choice options, cops, parties and called shots", () => {
  const { user } = render(loadFixture('free-dealer'));
  assert.match(user, /^NOW\nDay 2 14:00\. Acting hours left this season: 28\.$/m);
  // One sub-line per concrete choice, under its menu line.
  // A choice prints only the numbers that differ from its line (a05 is the line's best choice: only its note).
  assert.match(user, /\| args: \{"take":\["cash","chain","car",null\]\}\n    · a05 \(Rook\): Rook: chain\n    · a07 \(Kim\): odds 70%; steals ~12 viewers; Kim: car, chain\n/);
  // A destination lists what can be done there; the greedy pick (`next`) is never printed (round 1).
  assert.match(user, /^    · to bar: can do there: deal, crip_walk, push_npc; bar: 1 here, a cop$/m);
  assert.doesNotMatch(user, /best there/);
  assert.match(user, /^    · to docks: docks: 2 here$/m);
  assert.match(user, /^    · a05 \(Rook\), amount 50: pays -\$50; cost \$50$/m);
  // The engine's own score of a line is not shown; neither is the audience's `likes` (the brief has it).
  assert.doesNotMatch(user, /7\.25|value/);
  assert.doesNotMatch(user, /likes/);
  assert.match(user, /^COPS\nAt: precinct, bar\.$/m);
  assert.match(user, /^PARTIES\nnone$/m);
  assert.match(user, /^CALLED SHOTS\n- a07 \(Kim\) called mug on a03 \(you\); through Day 2 16:00$/m);
  assert.match(user, /^- callout: caller a09 \(Moss\); target a03 \(you\); block park; through Day 2 21:00; status open$/m);
  assert.match(user, /^- a05 Rook; dealer at corner; 3 stars \(wanted\); /m);
  assert.match(user, /^- product: best ask \$14 from a02 \(Penny\); best bid \$10; 3 listings; NPC supplier ask \$18$/m);
  const gun = render(loadFixture('armed-gunrunner')).user;
  assert.match(gun, /^PARTIES\n- a04 \(Lux\) hosts at bar; through Day 3 22:00$/m);
  assert.match(gun, /^- bounty: on you; amount 150; poster none; at Day 3 17:00$/m);
});
