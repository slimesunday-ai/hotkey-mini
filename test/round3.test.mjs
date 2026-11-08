// Round 3 (SPEC §0.1, R3.1-R3.3, R3.8): the owner sliders bite (brand, style hands, shop order, you.style), alerts,
// one open call-out per caller with ducked viewers walking away, and wins by style in the report.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS } from '../src/config.mjs';
import { totalViewers } from '../src/state.mjs';
import { buildBrief } from '../src/view.mjs';
import { RISK_MOVES } from '../src/style.mjs';
import { runSeason } from '../src/season.mjs';
import { seasonStats } from '../src/stats.mjs';
import { aggregate, renderMarkdown } from '../src/report.mjs';
import { loadLineup } from '../src/lineups.mjs';
import { defaultConfig } from '../src/config.mjs';
import { season, place, hour, entry, events, giveViewers, views, NEUTRAL } from './helpers.mjs';

const near = (a, b) => Math.abs(a - b) < 1e-9;
const sum = f => GROUPS.reduce((s, g) => s + f[g], 0);
const msg = (to, text, extra = {}) => ({ to, text, cash: 0, item: null, promise: null, ...extra });
const RECKLESS = { risk: 1, clout: 0.5, loyalty: 0.5 };
const SHOWOFF = { risk: 0.5, clout: 1, loyalty: 0.5 };
const SNAKE = { risk: 1, clout: 0.5, loyalty: 0 };
const LOYAL = { risk: 0.5, clout: 0.5, loyalty: 1 };

// ---------- R3.1 brand ----------

// Risk and clout ship with no bonus (style.brandRisk/brandClout 0); these tests check the mechanism at 0.5.
test('R3.1 brand: a mug win pays x1.5 at risk 1, the menu shows exactly what is awarded, and the steal is untouched', () => {
  const got = {};
  for (const [k, sl] of [['neutral', NEUTRAL], ['reckless', RECKLESS]]) {
    const state = season({ n: 2, sliders: [sl, NEUTRAL], sets: { 'actions.mug.odds': 5, 'style.brandRisk': 0.5, 'style.brandClout': 0.5 } });
    place(state, 'a01', 'bar');
    place(state, 'a02', 'bar');
    giveViewers(state, 'a02', { action: 100 });
    const menu = views(state).a01.menu.find(l => l.id === 'mug').options.find(o => o.target === 'a02').fans;
    const l = hour(state, { a01: { move: 'mug', target: 'a02', args: { take: 'cash' } } });
    assert.equal(entry(l, 'a01').ok, true);
    for (const g of GROUPS) assert.ok(near(entry(l, 'a01').fans[g], menu[g]), `${k} ${g}: menu ${menu[g]} vs awarded ${entry(l, 'a01').fans[g]}`);
    got[k] = { fans: entry(l, 'a01').fans, steal: events(l, 'steal').find(e => e.cause === 'mug').viewers };
  }
  assert.ok(near(got.reckless.fans.action, 1.5 * got.neutral.fans.action) && near(got.reckless.fans.drama, 1.5 * got.neutral.fans.drama));
  assert.equal(got.reckless.steal, got.neutral.steal, 'steals never carry the brand');
});

test('R3.1 brand: never on victim points: a jumped reckless target and a challenged show-off score the bare table', () => {
  const state = season({ n: 4, sliders: [NEUTRAL, RECKLESS, SHOWOFF, NEUTRAL], sets: { 'actions.fistfight.odds': 5 } });
  place(state, 'a01', 'bar');
  place(state, 'a02', 'bar');
  place(state, 'a03', 'park');
  place(state, 'a04', 'park');
  const l = hour(state, { a01: { move: 'fistfight', target: 'a02' }, a04: { move: 'battle', target: 'a03' } });
  assert.ok(near(entry(l, 'a02').fans.action, 1), `fistfight_lose base 1, got ${entry(l, 'a02').fans.action}`);
  const b = entry(l, 'a03').fans;
  const won = events(l, 'battle')[0].winner === 'a03';
  assert.ok(near(sum(b), won ? 4 : 1), `battle ${won ? 'win' : 'lose'} at base, got ${sum(b)}`);
});

test('R3.1 brand: a snake breaking a promise scores x1.5 (the victim at base), a ride-or-die keeping one x1.5', () => {
  const state = season({ n: 2, sliders: [SNAKE, SNAKE] });
  place(state, 'a01', 'bar', { cash: 200 });
  hour(state, { a01: { move: 'rest', message: msg('a02', 'trust me', { promise: { give: { cash: 100 }, by: 2 } }) } });
  hour(state, {});
  const l = hour(state, {});
  assert.equal(events(l, 'promise_broken').length, 1);
  assert.ok(near(entry(l, 'a01').fans.drama, 4 * 1.5), `breaker ${entry(l, 'a01').fans.drama}`);
  assert.ok(near(entry(l, 'a02').fans.drama, 2) && near(entry(l, 'a02').fans.feelgood, 1), 'the victim is never branded');

  const s2 = season({ n: 2, sliders: [LOYAL, NEUTRAL] });
  place(s2, 'a01', 'bar', { cash: 200 });
  hour(s2, { a01: { move: 'rest', message: msg('a02', 'on my word', { promise: { give: { cash: 100 }, by: 3 } }) } });
  const k = hour(s2, { a01: { move: 'rest', message: msg('a02', 'as promised', { cash: 100 }) } });
  assert.equal(events(k, 'promise_kept').length, 1);
  assert.ok(near(entry(k, 'a01').fans.drama, 1.5) && near(entry(k, 'a01').fans.feelgood, 1.5), JSON.stringify(entry(k, 'a01').fans));
});

test('R3.1 brand: a show-off host is branded on every party hour and its guests, as the menu line promises', () => {
  const run = sl => {
    const state = season({ n: 2, sliders: [sl, NEUTRAL], sets: { 'style.brandRisk': 0.5, 'style.brandClout': 0.5 } });
    place(state, 'a01', 'bar', { cash: 200 });
    place(state, 'a02', 'bar');
    const menu = sum(views(state).a01.menu.find(l => l.id === 'party').fans);
    let total = 0;
    for (let h = 0; h < 3; h++) {
      const l = hour(state, h === 0 ? { a01: { move: 'party' } } : {});
      total += sum(entry(l, 'a01').fans);
    }
    return { menu, total };
  };
  const base = run(NEUTRAL), show = run(SHOWOFF);
  assert.ok(base.total > 0);
  assert.ok(near(show.menu, 1.5 * base.menu), `menu ${show.menu} vs ${base.menu}`);
  assert.ok(near(show.total, 1.5 * base.total), `awarded ${show.total} vs ${base.total}`);
});

// ---------- R3.1 hand ----------

function armed(sliders, { handSize = 8, handMax = 11 } = {}) {
  const state = season({ n: 4, sliders: [sliders, NEUTRAL, NEUTRAL, NEUTRAL], sets: { 'view.handSize': handSize, 'view.handMax': handMax } });
  state.cfg.systems.dealtHands = true;
  const a = place(state, 'a01', 'bank', { energy: 100, cash: 300 });
  a.stock.guns = 1;
  a.gear.car = 1;
  place(state, 'a02', 'bank');
  place(state, 'a03', 'park'); // next to the bank: a drive-by target
  place(state, 'a04', 'home');
  return state;
}
const BIG = ['shoot', 'drive_by', 'bank_job', 'steal_car', 'mug'];

test('R3.1 hand: a reckless agent is always dealt its legal shoot, drive-by, bank job, steal car and mug', () => {
  let missedAtMid = 0;
  for (let t = 0; t < 12; t++) {
    const hi = armed(RECKLESS);
    hi.t = t;
    const v = views(hi).a01;
    for (const id of BIG) assert.ok(v.menu.some(l => l.id === id), `t${t} reckless hand missing ${id}: ${v.menu.map(l => l.id)}`);
    assert.ok(v.menu.length <= hi.cfg.view.handMax);
    const mid = armed(NEUTRAL);
    mid.t = t;
    const m = views(mid).a01.menu;
    assert.equal(m.length, mid.cfg.view.handSize, 'a mid agent keeps the normal hand size');
    if (!BIG.every(id => m.some(l => l.id === id))) missedAtMid++;
  }
  assert.ok(missedAtMid > 0, 'at mid risk the big plays are only drawn, not guaranteed');
});

test('R3.1 hand: style lines may grow the hand past handSize, never past handMax; a show-off gets party, drip check and battle', () => {
  const grown = views(armed(RECKLESS, { handSize: 3 })).a01.menu.map(l => l.id);
  assert.deepEqual(grown, ['mug', 'steal_car', 'bank_job', 'shoot', 'drive_by', 'move', 'rest'], 'move, rest and the five, in menu order');
  const capped = views(armed(RECKLESS, { handSize: 3, handMax: 5 })).a01.menu.map(l => l.id);
  assert.equal(capped.length, 5);
  assert.ok(capped.includes('shoot') && capped.includes('drive_by') && capped.includes('move') && capped.includes('rest'));

  const state = season({ n: 3, sliders: [SHOWOFF, NEUTRAL, NEUTRAL], sets: { 'view.handSize': 4 } });
  state.cfg.systems.dealtHands = true;
  const a = place(state, 'a01', 'bar', { cash: 300, energy: 100 });
  a.gear.chain = 1;
  place(state, 'a02', 'bar');
  for (let t = 0; t < 6; t++) {
    state.t = t;
    const ids = views(state).a01.menu.map(l => l.id);
    for (const id of ['party', 'drip_check', 'battle']) assert.ok(ids.includes(id), `t${t} show-off missing ${id}: ${ids}`);
  }
  // With the style system off, the hand is the normal draw again.
  const off = armed(RECKLESS, { handSize: 3 });
  off.cfg.systems.style = false;
  assert.equal(views(off).a01.menu.length, 3);
});

// ---------- R3.1 shop ----------

test('R3.1 shop: the buy line lists the style\'s gear first; the line\'s numbers are its first option\'s', () => {
  const order = sl => {
    const state = season({ n: 2, sliders: [sl, NEUTRAL] });
    place(state, 'a01', 'market', { cash: 3000 });
    const line = views(state).a01.menu.find(l => l.id === 'buy');
    assert.equal(line.cash, line.options[0].cash);
    assert.equal(line.pays, Math.round(line.options[0].pays));
    assert.deepEqual(line.args.item, [...new Set(line.options.map(o => o.args.item))]);
    return line.options.map(o => o.args.item);
  };
  assert.deepEqual(order(NEUTRAL), ['chems', 'parts', 'product', 'guns', 'gun', 'car', 'armor', 'chain', 'grill', 'fit']);
  assert.deepEqual(order(RECKLESS), ['gun', 'guns', 'car', 'armor', 'chems', 'parts', 'product', 'chain', 'grill', 'fit']);
  assert.deepEqual(order(SHOWOFF), ['chain', 'fit', 'grill', 'chems', 'parts', 'product', 'guns', 'gun', 'car', 'armor']);
  assert.deepEqual(order({ risk: 0.9, clout: 0.9, loyalty: 0.5 }), ['gun', 'guns', 'car', 'armor', 'chain', 'fit', 'grill', 'chems', 'parts', 'product']);
  assert.deepEqual(order({ risk: 0, clout: 0, loyalty: 0 }), order(NEUTRAL), 'low sliders keep the neutral order');
  // Away from the market a reckless agent still sees the board gun first; with style off, the neutral order.
  const state = season({ n: 2, sliders: [RECKLESS, NEUTRAL] });
  place(state, 'a01', 'bar', { cash: 3000 });
  assert.equal(views(state).a01.menu.find(l => l.id === 'buy').options[0].args.item, 'guns');
  state.cfg.systems.style = false;
  assert.equal(views(state).a01.menu.find(l => l.id === 'buy').options[0].args.item, 'chems');
});

// ---------- R3.1 view ----------

test('R3.1 view: you.style has levels, labels, pays (only multipliers that are not 1) and deals; you.sliders stays', () => {
  const state = season({ n: 4, sliders: [SNAKE, NEUTRAL, LOYAL, NEUTRAL], sets: { 'style.brandRisk': 0.5, 'style.brandClout': 0.5 } });
  const v = views(state);
  const s = v.a01.you.style;
  assert.deepEqual(s.levels, { risk: 'high', clout: 'mid', loyalty: 'low' });
  assert.deepEqual(s.labels, ['reckless', 'snake']);
  assert.deepEqual(s.pays, [
    { what: 'risk moves', moves: RISK_MOVES, mult: 1.5 },
    { what: 'breaking a promise', mult: 1.5 },
    { what: 'keeping a promise', mult: 0.5 },
  ]);
  assert.deepEqual(s.deals, ['Nobody trusts you yet.']);
  assert.deepEqual(v.a01.you.sliders, SNAKE, 'bots still read the sliders');
  assert.deepEqual(v.a02.you.style, { levels: { risk: 'mid', clout: 'mid', loyalty: 'mid' }, labels: [], pays: [], deals: [] });
  assert.deepEqual(v.a03.you.style.labels, ['ride-or-die']);
  assert.deepEqual(v.a03.you.style.deals, []);
  // The brief tells every agent what its style does.
  assert.ok(buildBrief(state.cfg).rules.some(r => r.startsWith('Style: your owner set your style')));
  const off = season({ n: 2, sliders: [SNAKE, NEUTRAL], off: ['style'] });
  const o = views(off).a01.you.style;
  assert.deepEqual(o.labels, ['reckless', 'snake']);
  assert.deepEqual([o.pays, o.deals], [[], []], 'style off: no pays and no deals');
  assert.ok(!buildBrief(off.cfg).rules.some(r => r.startsWith('Style: your owner set your style')));
});

test('R3.1 deals: a snake sees who trusts it (until it wrongs them); a ride-or-die its debts, what it is owed and its allies', () => {
  const state = season({ n: 4, sliders: [SNAKE, NEUTRAL, LOYAL, NEUTRAL], sets: { 'actions.mug.odds': 5 } });
  for (const id of state.ids) place(state, id, 'bar', { cash: 200 });
  hour(state, { a02: { move: 'rest', message: msg('a01', 'for you', { cash: 20 }) }, a03: { move: 'rest', message: msg('a04', 'a little help', { cash: 5 }) } });
  assert.deepEqual(views(state).a01.you.style.deals, ['Kim (a02) trusts you: sent you $20 at Day 1 06:00.']);
  hour(state, { a01: { move: 'mug', target: 'a02', args: { take: 'cash' } } });
  assert.deepEqual(views(state).a01.you.style.deals, ['Nobody trusts you yet.'], 'a mugged friend stops trusting you');

  // a03 (ride-or-die) promises a02 $40 and a04 promises a03 $30; a03 and a04 trade favours twice.
  const t = state.t;
  hour(state, {
    a03: { move: 'rest', message: msg('a02', 'you will get it', { promise: { give: { cash: 40 }, by: t + 4 } }) },
    a04: { move: 'rest', message: msg('a03', 'I owe you', { cash: 5, promise: { give: { cash: 30 }, by: t + 3 } }) },
  });
  const deals = views(state).a03.you.style.deals;
  assert.equal(deals.length, 3);
  assert.equal(deals[0], `You owe Kim (a02) $40 by Day 1 ${String(6 + t + 4).padStart(2, '0')}:00.`);
  assert.equal(deals[1], `Dutch (a04) owes you $30 by Day 1 ${String(6 + t + 3).padStart(2, '0')}:00.`);
  assert.equal(deals[2], 'Dutch (a04) is your ally: 2 friendly acts between you.');
});

// ---------- R3.2 alerts ----------

test('R3.2 alerts: last hour\'s acts against you, most serious first, with names, ids, outcome and cost; [] after a quiet hour', () => {
  const state = season({ n: 5, sets: { 'actions.shoot.odds': -5, 'actions.mug.odds': -5 } });
  for (const id of state.ids) place(state, id, 'bar', { cash: 200 });
  state.agents.a01.stock.guns = 1;
  assert.deepEqual(views(state).a02.alerts, []);
  hour(state, {
    a03: { move: 'mug', target: 'a02', args: { take: 'cash' } },
    a05: { move: 'call_out', target: 'a02', args: { block: 'park' } },
    a01: { move: 'shoot', target: 'a02' },
    a04: { move: 'bounty', target: 'a02', args: { amount: 60 } },
  });
  const v = views(state);
  assert.deepEqual(v.a02.alerts, [
    'Vex (a01) shot at you and missed.',
    'Someone put a $60 bounty on you.',
    'Penny (a03) tried to mug you and failed.',
    'Moss (a05) called you out to a fight at the park, any hour until Day 1 09:00; if you never show, 15% of your viewers walk away.',
  ]);
  assert.deepEqual(v.a01.alerts, []);
  // Memory says what happened: a failed mug and a miss read as attempts.
  const what = state.agents.a02.grudges.map(g => g.what);
  assert.ok(what.includes('tried to mug you and failed') && what.includes('shot at you and missed'), what.join(' | '));
  assert.ok(!what.includes('mugged you'));
  hour(state, {});
  assert.deepEqual(views(state).a02.alerts, []);
});

test('R3.2 alerts: a landed mug names the take and the viewers lost; a broken promise; the list is capped', () => {
  const state = season({ n: 3, sets: { 'actions.mug.odds': 5 } });
  for (const id of state.ids) place(state, id, 'bar', { cash: 100 });
  giveViewers(state, 'a02', { action: 100 });
  hour(state, { a01: { move: 'mug', target: 'a02', args: { take: 'cash' } }, a03: { move: 'rest', message: msg('a02', 'soon', { promise: { give: { cash: 50 }, by: 2 } }) } });
  assert.deepEqual(views(state).a02.alerts, ['Vex (a01) mugged you for $40: you lost 10 viewers.']);
  assert.ok(state.agents.a02.grudges.some(g => g.what === 'mugged you for $40'));
  hour(state, {});
  hour(state, {});
  assert.deepEqual(views(state).a02.alerts, ['Penny (a03) broke a promise to give you $50 by Day 1 08:00.']);
  // At most view.alerts lines.
  const s2 = season({ n: 4, sets: { 'actions.mug.odds': -5, 'view.alerts': 2 } });
  for (const id of s2.ids) place(s2, id, 'bar', { cash: 200 });
  hour(s2, { a01: { move: 'mug', target: 'a04' }, a02: { move: 'mug', target: 'a04' }, a03: { move: 'bounty', target: 'a04', args: { amount: 50 } } });
  assert.deepEqual(views(s2).a04.alerts, ['Someone put a $50 bounty on you.', 'Vex (a01) tried to mug you and failed.']);
});

// ---------- R3.3 call-outs ----------

test('R3.3: one open call-out per caller; call_out comes back once it resolves', () => {
  const state = season({ n: 3 });
  place(state, 'a01', 'park');
  place(state, 'a02', 'docks');
  place(state, 'a03', 'bar');
  hour(state, { a01: { move: 'call_out', target: 'a02', args: { block: 'park' } } });
  let v = views(state);
  assert.ok(!v.a01.menu.some(l => l.id === 'call_out'), 'not while your call-out is open');
  assert.ok(v.a03.menu.some(l => l.id === 'call_out'), 'others still can');
  while (state.callOuts[0].status === 'open') {
    place(state, 'a02', 'docks');
    hour(state, {});
  }
  v = views(state);
  assert.ok(v.a01.menu.some(l => l.id === 'call_out'));
});

test('R3.3: a duck sends duckSteal of the target\'s viewers to the unassigned pool, viewers stay conserved, the caller keeps its points', () => {
  const state = season({ n: 3 });
  place(state, 'a01', 'park');
  place(state, 'a02', 'docks');
  giveViewers(state, 'a02', { action: 100, drama: 40 });
  const why = views(state).a01.menu.find(l => l.id === 'call_out').why;
  assert.match(why, /15% of their viewers walk away \(not to you\)/);
  const l0 = hour(state, { a01: { move: 'call_out', target: 'a02', args: { block: 'park' } } });
  assert.ok(near(entry(l0, 'a01').fans.drama, 2), 'the caller keeps its call_out points');
  let ducked = null;
  while (!ducked) {
    place(state, 'a02', 'docks');
    place(state, 'a01', 'park');
    const before = totalViewers(state.agents.a02);
    const l = hour(state, {});
    for (const g of GROUPS) {
      const held = state.ids.reduce((s, id) => s + state.agents[id].viewers[g], 0);
      assert.ok(Math.abs(held + state.unassigned[g] - state.pools[g]) < 1e-6, `t${l.t} ${g} conserved`);
    }
    if (events(l, 'callout_ducked').length) ducked = { l, before };
  }
  const { l, before } = ducked;
  assert.equal(events(l, 'steal').filter(e => e.cause === 'ducked').length, 0, 'nobody gains a duck');
  const w = events(l, 'walk_away')[0];
  assert.equal(w.from, 'a02');
  assert.equal(w.pct, 0.15);
  assert.ok(Math.abs(w.viewers - 0.15 * before) < 0.01, `${w.viewers} vs ${0.15 * before}`);
  assert.equal(events(l, 'callout_ducked')[0].walkAway, true);
  assert.deepEqual(views(state).a02.alerts, [`You ducked Vex (a01)'s call-out at the park: ${Math.round(w.viewers)} viewers walked away.`]);
});

// ---------- R3.8 stats and report ----------

test('R3.8: wins by style, the style mark, per-agent style numbers, and the AI table', async () => {
  const cfg = defaultConfig();
  const stats = [];
  for (const seed of [1, 2, 3, 4]) {
    const res = await runSeason({ seed, config: cfg, lineup: loadLineup('default') });
    stats.push(seasonStats({ feed: res.feed, setup: res.setup, standings: res.standings, cfg }));
  }
  for (const s of stats) {
    for (const a of s.agents) {
      assert.ok(a.styles.length >= 1);
      assert.equal(a.riskMoves, RISK_MOVES.reduce((n, m) => n + (a.actions[m] ?? 0), 0));
    }
    const w = s.agents.find(a => a.id === s.winner.id);
    assert.deepEqual(s.winner.styles, w.styles);
  }
  // The greedy seats sit at mid; the turtle is safe, lowkey and ride-or-die.
  assert.ok(stats[0].agents.filter(a => a.brain === 'greedy').every(a => a.styles.join() === 'mid'));
  assert.deepEqual(stats[0].agents.find(a => a.brain === 'turtle').styles.slice(0, 2), ['safe', 'lowkey']);
  const r = aggregate(stats, { lineup: 'default', mode: 'bots' });
  for (const [label, v] of Object.entries(r.interesting.winsByStyle)) {
    assert.equal(v, Math.round((stats.filter(s => s.winner.styles.includes(label)).length / stats.length) * 100) / 100, label);
    assert.ok(r.interesting.styleSeats[label] > 0);
  }
  const mark = r.marks.find(m => m.mark === 'Each style wins between 0.5x and 1.5x its share of seats');
  assert.ok(mark && typeof mark.pass === 'boolean');
  assert.equal(r.styleActs, undefined, 'the per-agent style table is for AI runs');
  // A season whose winner is the only reckless agent every time fails the mark.
  const rigged = stats.map(s => ({ ...s, winner: { ...s.winner, styles: ['reckless'] } }));
  assert.equal(aggregate(rigged, { lineup: 'default', mode: 'bots' }).marks.find(m => m.mark === mark.mark).pass, false);
  // An AI run: the table appears, and the style mark isn't judged on so few seeds.
  const ai = stats.map(s => ({ ...s, agents: s.agents.map(a => (a.brain === 'greedy' ? { ...a, brain: 'ai', model: 'fake/model' } : a)) }));
  const ra = aggregate(ai, { lineup: 'default', mode: 'ai-fake' });
  assert.equal(ra.marks.find(m => m.mark === mark.mark).pass, null);
  assert.equal(ra.styleActs.length, 40);
  const row = ra.styleActs.find(x => x.brain === 'ai:fake/model');
  for (const k of ['riskMoves', 'cloutMoves', 'gearBought', 'promises', 'styles']) assert.ok(k in row, k);
  const md = renderMarkdown(ra, {});
  assert.ok(md.includes('**Wins by style**') && md.includes('**Styles in play**'));
  assert.ok(md.includes('| Promises made / kept / broken |'));
});

// ---------- plain story in the feed (orchestrator, round 3 audit) ----------

test('feed texts read as story: no codes or non-money numbers, windows clamp to the season\'s end, exact viewer-hours', async () => {
  const state = season({ n: 3 });
  place(state, 'a01', 'bar');
  place(state, 'a02', 'park');
  place(state, 'a03', 'bank');
  const l = hour(state, { a01: { move: 'call_out', target: 'a02', args: { block: 'park' } }, a03: { move: 'scout' } });
  assert.equal(entry(l, 'a03').result.text, 'scouted the bank for the next job');
  assert.match(entry(l, 'a01').result.text, /^called out Kim to a fight at the park, any hour from Day 1 07:00 until Day 1 09:00$/);
  assert.equal(entry(l, 'a01').meters.viewerHours, Math.round(state.agents.a01.viewerHours));
  // A target that left: the story, not "target left block".
  const s2 = season({ n: 2 });
  place(s2, 'a01', 'bar');
  place(s2, 'a02', 'bar');
  const v = views(s2);
  place(s2, 'a02', 'park');
  const reps = { a01: { ok: true, reply: { move: 'mug', target: 'a02', args: { take: 'cash' } } }, a02: { ok: true, reply: { move: 'rest' } } };
  const { runHour } = await import('../src/resolve.mjs');
  const m = runHour(s2, reps, v);
  assert.equal(entry(m, 'a01').result.text, 'went to mug Kim, but Kim had left');
  assert.equal(s2.agents.a01.last.why, 'they had left');
  // A failed reply explains itself in words.
  const s3 = season({ n: 2 });
  hour(s3, { a01: { move: 'teleport' } });
  assert.equal(s3.agents.a01.last.why, 'that move was not on your menu, so you rested');
  assert.equal(s3.agents.a01.last.result, 'stood around');
  // A call-out near the end: its window says the season ends.
  const s4 = season({ n: 2 });
  s4.t = s4.seasonLength - 2;
  const e = hour(s4, { a01: { move: 'call_out', target: 'a02', args: { block: 'park' } } });
  assert.match(entry(e, 'a01').result.text, /, any hour from Day 3 23:00 until the season ends$/);
  // Greedy bots think in words, never in scores or move ids.
  const res = await runSeason({ seed: 4, config: defaultConfig(), lineup: loadLineup('all-greedy') });
  const thoughts = new Set(res.feed.flatMap(x => x.agents.map(a => a.thought)).filter(Boolean));
  assert.ok(thoughts.size > 5);
  for (const t of thoughts) assert.match(t, /^[A-Z][^0-9_]*$/, t);
});
