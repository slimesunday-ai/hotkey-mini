// Round 1 regression tests: the exploits the mechanics review found (A1-A9), the crown and audience rule changes
// (B1-B3), and the play-by-play and report wording (D, E).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { season, place, hour, entry, events, moments, giveViewers, views, config } from './helpers.mjs';
import { defaultConfig } from '../src/config.mjs';
import { createSeason, totalViewers } from '../src/state.mjs';
import { buildBrief, buildViews } from '../src/view.mjs';
import { runHour } from '../src/resolve.mjs';
import { finishHour, rankByScore, runSeason } from '../src/season.mjs';
import { decideBot } from '../src/bots.mjs';
import { loadLineup } from '../src/lineups.mjs';
import { renderPlayByPlay } from '../src/playbyplay.mjs';
import { seasonStats } from '../src/stats.mjs';
import { aggregate } from '../src/report.mjs';
import { legalLines } from '../src/menu.mjs';

const legalIds = (state, a) => legalLines(state, a).map(l => l.id);

const msg = (to, text, more = {}) => ({ to, text, cash: 0, item: null, promise: null, ...more });
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));

// The reviewer's harness: a default-lineup season where a hook can rewrite one agent's reply each hour.
function play(seed, hook) {
  const cfg = defaultConfig();
  const state = createSeason({ seed, config: cfg, lineup: loadLineup('default') });
  const brief = buildBrief(cfg);
  while (state.t < state.seasonLength) {
    const { views: vs, hashes } = buildViews(state, brief);
    const replies = {};
    for (const id of state.ids) {
      const v = vs[id];
      if (!v) continue;
      let rep = decideBot(v, { brain: state.agents[id].brain, cfg, seed });
      if (hook) rep = hook({ id, view: v, reply: rep }) ?? rep;
      replies[id] = { ok: true, reply: rep };
    }
    const line = runHour(state, replies, vs, hashes);
    finishHour(state, line);
  }
  const ranked = rankByScore(state);
  return id => ranked.indexOf(id) + 1;
}

// ---------- A1: the promise farm ----------

test('A1 regression: the turtle spamming promises stays in the bottom half on average', () => {
  const who = 'a06'; // the turtle in the default lineup
  const N = 12;
  const modes = {
    // The reviewer's three exploits, then the legal versions of them.
    break: (t, to) => ({ to, text: 'I got you.', promise: { give: { cash: 500 }, by: 0 } }),
    next: (t, to) => ({ to, text: 'soon', promise: { give: { cash: 500 }, by: t + 1 } }),
    keep: (t, to) => ({ to, text: 'here', cash: 1, promise: { give: { cash: 1 }, by: 0 } }),
    legalBreak: (t, to, v) => ({ to, text: 'trust me', promise: { give: { cash: Math.max(1, Math.min(100, v.you.cash)) }, by: t + 2 } }),
    legalKeep: (t, to, v) => {
      const due = v.memory.find(m => m.kind === 'promise' && m.from === v.you.id && m.status === 'open' && m.by - t <= 1);
      if (due) return { to: due.to, text: 'as promised', cash: due.give.cash };
      return { to, text: 'later', promise: { give: { cash: Math.max(1, Math.min(100, v.you.cash)) }, by: t + 2 } };
    },
  };
  for (const [mode, make] of Object.entries(modes)) {
    let places = 0;
    for (let seed = 1; seed <= N; seed++) {
      const place = play(seed, ({ id, view, reply }) => {
        if (id !== who) return reply;
        const t = view.clock.t;
        const victims = view.roster.filter(r => r.state !== 'dead').map(r => r.id);
        return { ...reply, message: { cash: 0, item: null, promise: null, ...make(t, victims[t % victims.length], view) } };
      });
      places += place(who);
    }
    assert.ok(places / N > 5, `${mode}: mean place ${places / N}`);
  }
});

test('A1: promises must fall due 2+ hours ahead, one per recipient, two open in all, within what you hold', () => {
  const state = season({ n: 4 });
  place(state, 'a01', 'bar', { cash: 100 });
  state.agents.a01.gear.chain = 1;
  const line = hour(state, { a01: { move: 'rest', message: msg('a02', 'soon', { promise: { give: { cash: 10 }, by: 1 } }) } });
  assert.equal(events(line, 'promise_rejected')[0].why, 'too_soon');
  assert.equal(events(line, 'promise_made').length, 0);
  const tries = [
    [msg('a02', 'a', { promise: { give: { cash: 10 }, by: 20 } }), null],
    [msg('a02', 'b', { promise: { give: { cash: 10 }, by: 20 } }), 'already_promised_them'],
    [msg('a03', 'c', { promise: { give: { cash: 500 }, by: 20 } }), 'more_cash_than_held'],
    [msg('a03', 'd', { promise: { give: { item: 'gun' }, by: 20 } }), 'item_not_held'],
    [msg('a03', 'e', { promise: { give: { item: 'chain' }, by: 20 } }), null],
    [msg('a04', 'f', { promise: { give: { cash: 10 }, by: 20 } }), 'too_many_open'],
  ];
  for (const [m, why] of tries) {
    const l = hour(state, { a01: { move: 'rest', message: m } });
    if (why) assert.equal(events(l, 'promise_rejected')[0]?.why, why, m.text);
    else assert.equal(events(l, 'promise_made').length, 1, m.text);
  }
});

test('A1: breaking scales with the stake (drama 4 per $100) and gets boredom; paying in the same hour keeps nothing', () => {
  const state = season({ n: 3 });
  place(state, 'a01', 'bar', { cash: 200 });
  // $50 promise to a02 and a $50 promise to a03, both due at t3.
  hour(state, { a01: { move: 'rest', message: msg('a02', 'x', { promise: { give: { cash: 50 }, by: 3 } }) } });
  hour(state, { a01: { move: 'rest', message: msg('a03', 'y', { promise: { give: { cash: 50 }, by: 3 } }) } });
  hour(state, {});
  const l = hour(state, {});
  const broken = moments(l, 'promise_broken');
  assert.equal(broken.length, 2);
  // Each break: 4 x 0.5 = 2 drama; boredom only counts earlier hours, so two in one hour make 4.
  assert.ok(near(entry(l, 'a01').fans.drama, 4), `two $50 breaks in one hour: ${entry(l, 'a01').fans.drama}`);
  // Another break within 6 hours: x0.5 per earlier break (2 earlier -> x0.25).
  hour(state, { a01: { move: 'rest', message: msg('a02', 'z', { promise: { give: { cash: 100 }, by: 6 } }) } });
  hour(state, {});
  const l2 = hour(state, {});
  assert.equal(moments(l2, 'promise_broken').length, 1);
  assert.ok(near(entry(l2, 'a01').fans.drama, 4 * 1 * 0.25), String(entry(l2, 'a01').fans.drama));
  // Same-hour payment: a promise with its cash attached in the same message stays open.
  const s2 = season({ n: 2 });
  place(s2, 'a01', 'bar', { cash: 100 });
  const l3 = hour(s2, { a01: { move: 'rest', message: msg('a02', 'here and promised', { cash: 30, promise: { give: { cash: 30 }, by: 3 } }) } });
  assert.equal(events(l3, 'promise_kept').length, 0);
  assert.equal(s2.promises[0].status, 'open');
  // Paying in a later hour keeps it.
  const l4 = hour(s2, { a01: { move: 'rest', message: msg('a02', 'as promised', { cash: 30 }) } });
  assert.equal(events(l4, 'promise_kept').length, 1);
  assert.ok(near(entry(l4, 'a01').fans.drama, 0.3) && near(entry(l4, 'a01').fans.feelgood, 0.3), 'kept: x min(1, 30/100)');
});

// ---------- A2: call-outs ----------

test('A2: no meeting in the hour of the call-out; a met fight costs both the fistfight energy and scores as one', () => {
  const state = season({ n: 3 });
  place(state, 'a01', 'park', { energy: 80 });
  place(state, 'a02', 'park', { energy: 80 });
  const l0 = hour(state, { a01: { move: 'call_out', target: 'a02', args: { block: 'park' } } });
  assert.equal(moments(l0, 'callout_answered').length, 0, 'not in the hour it was made');
  const e1 = state.agents.a01.energy, e2 = state.agents.a02.energy;
  const l1 = hour(state, {});
  assert.equal(moments(l1, 'callout_answered').length, 1);
  const f = events(l1, 'fight')[0];
  assert.equal(f.mode, 'callout');
  const loser = f.winner === 'a01' ? 'a02' : 'a01';
  const winner = f.winner;
  // Each paid 15; the loser 15 more; both rested (+15) and regen (+4, maybe +1/+2 attention).
  const after = { a01: state.agents.a01.energy, a02: state.agents.a02.energy };
  const start = { a01: e1, a02: e2 };
  assert.ok(start[winner] - 15 + 15 + 4 <= after[winner] && after[winner] <= start[winner] - 15 + 15 + 6, `winner energy ${after[winner]}`);
  assert.ok(after[loser] <= start[loser] - 30 + 15 + 6, `loser energy ${after[loser]}`);
  assert.ok(entry(l1, winner).fans.action >= 3 - 1e-9, 'the winner scores a fistfight win');
});

test('A2: only the target ducks; a caller who never comes lets it lapse; a jailed target is not a duck', () => {
  const state = season({ n: 3 });
  place(state, 'a01', 'docks');
  place(state, 'a02', 'park');
  giveViewers(state, 'a01', { action: 100 });
  const l0 = hour(state, { a01: { move: 'call_out', target: 'a02', args: { block: 'park' } } });
  const until = events(l0, 'call_out')[0].until;
  let lapsed = null;
  while (state.t <= until) {
    place(state, 'a01', 'docks');
    place(state, 'a02', 'park');
    const l = hour(state, {});
    assert.equal(moments(l, 'callout_ducked').length, 0);
    lapsed = lapsed ?? events(l, 'callout_lapsed')[0] ?? null;
  }
  assert.ok(lapsed && lapsed.targetShowed && !lapsed.callerShowed);

  const s2 = season({ n: 3 });
  place(s2, 'a01', 'docks');
  place(s2, 'a02', 'park', { stars: 5 });
  s2.cops.forEach(c => { c.block = 'docks'; });
  const m0 = hour(s2, { a01: { move: 'call_out', target: 'a02', args: { block: 'bank' } } });
  assert.equal(s2.agents.a02.state, 'jail', 'arrested at 5 stars');
  const u2 = events(m0, 'call_out')[0].until;
  let ducked = 0;
  while (s2.t <= u2) ducked += moments(hour(s2, {}), 'callout_ducked').length;
  assert.equal(ducked, 0);
});

test('A2: the call-out line states the real outcomes', () => {
  const state = season({ n: 2 });
  const why = views(state).a01.menu.find(l => l.id === 'call_out').why;
  assert.match(why, /not this one/);
  assert.match(why, /each of you pays 15 energy/);
  assert.match(why, /If only you skip it, nothing happens/);
});

// ---------- A3: dealt hands keep the advertised line ----------

test('A3: the line an agent moved for is dealt on arrival', () => {
  const cfg = config({ 'view.handSize': 3 });
  cfg.systems.dealtHands = true;
  let checked = 0;
  for (let seed = 1; seed <= 30 && checked < 10; seed++) {
    const state = createSeason({ seed, config: cfg, lineup: { name: 't', seats: Array.from({ length: 6 }, () => ({ brain: 'greedy' })) } });
    const brief = buildBrief(cfg);
    for (let h = 0; h < 10; h++) {
      const { views: vs, hashes } = buildViews(state, brief);
      const replies = {};
      for (const id of state.ids) if (vs[id]) replies[id] = { ok: true, reply: decideBot(vs[id], { brain: 'greedy', cfg, seed }) };
      const line = runHour(state, replies, vs, hashes);
      finishHour(state, line);
      const next = buildViews(state, brief).views;
      for (const e of line.agents) {
        if (e.move !== 'move' || !e.ok) continue;
        const a = state.agents[e.id];
        if (!a.movedFor || a.state !== 'free' || !next[e.id]) continue;
        const full = legalIds(state, a);
        if (!full.includes(a.movedFor.id)) continue;
        assert.ok(next[e.id].menu.some(l => l.id === a.movedFor.id), `${e.id} moved for ${a.movedFor.id}`);
        checked++;
      }
    }
  }
  assert.ok(checked >= 10, `checked ${checked}`);
});

// ---------- A5: killing the king pays more than shooting it ----------

test('A5: kill_king expects to steal more of the king than shooting it', () => {
  const state = season({ n: 3 });
  const a = place(state, 'a01', 'bar');
  a.stock.guns = 1;
  place(state, 'a02', 'bar');
  place(state, 'a03', 'bar');
  giveViewers(state, 'a02', { action: 300 });
  state.agents.a02.viewerHours = 1000;
  state.king = 'a02';
  const v = views(state).a01;
  const kk = v.menu.find(l => l.id === 'kill_king').options[0];
  const sh = v.menu.find(l => l.id === 'shoot').options.find(o => o.target === 'a02');
  assert.ok(kk.odds * kk.steals > sh.odds * sh.steals, `kill ${kk.odds}x${kk.steals} vs shoot ${sh.odds}x${sh.steals}`);
  assert.equal(kk.steals, 400 * 0.8, 'city crowd mid 400 x 0.8');
  assert.equal(sh.steals, 400 * 0.25 * 1.5);
});

// ---------- A6: menu honesty ----------

test('A6: heatRisk shows raw expected stars', () => {
  const state = season({ n: 2 });
  place(state, 'a01', 'bar', { stars: 2 });
  place(state, 'a02', 'bar');
  const mug = views(state).a01.menu.find(l => l.id === 'mug');
  assert.equal(mug.heatRisk, 1);
});

test('A6: battle and fistfight menu odds are the realized odds', () => {
  for (const move of ['battle', 'fistfight']) {
    for (const [ea, eb] of [[60, 60], [80, 40]]) {
      let wins = 0, menuOdds = null;
      const N = 400;
      for (let seed = 1; seed <= N; seed++) {
        const state = season({ seed, n: 3 });
        place(state, 'a01', 'bar', { energy: ea });
        place(state, 'a02', 'bar', { energy: eb });
        place(state, 'a03', 'bar');
        const line = hour(state, { a01: { move, target: 'a02' } });
        menuOdds = line.views.a01.menu.find(l => l.id === move).options.find(o => o.target === 'a02').odds;
        if (entry(line, 'a01').ok) wins++;
      }
      assert.ok(Math.abs(wins / N - menuOdds) < 0.06, `${move} ${ea} vs ${eb}: menu ${menuOdds}, realized ${wins / N}`);
    }
  }
});

test('A6: your own bounty is not in your pays, and you can never collect it', () => {
  const state = season({ n: 2, sets: { 'actions.fistfight.odds': 5 } });
  place(state, 'a01', 'bar', { cash: 300 });
  place(state, 'a02', 'bar');
  hour(state, { a01: { move: 'bounty', target: 'a02', args: { amount: 100 } } });
  place(state, 'a01', 'bar');
  place(state, 'a02', 'bar');
  const l = hour(state, { a01: { move: 'fistfight', target: 'a02' } });
  assert.equal(l.views.a01.menu.find(x => x.id === 'fistfight').options[0].pays, 0);
  assert.equal(entry(l, 'a01').ok, true);
  assert.equal(events(l, 'bounty_collected').length, 0);
  assert.equal(state.bounties[0].status, 'open');
});

// ---------- A7: privacy ----------

test('A7: arrest headlines never show the fine', () => {
  const state = season({ n: 2 });
  place(state, 'a01', 'park', { stars: 5, cash: 333 });
  const l = hour(state, {});
  const m = moments(l, 'arrest')[0];
  assert.ok(!m.line.includes('$'), m.line);
  assert.equal(m.fine, 166);
  const v = hour(state, {}).views.a02;
  assert.ok(!JSON.stringify(v.headlines).includes('166'));
});

// ---------- A8: callShot ----------

test('A8: a called shot pulls a cop only when that move on that target is on the caller\'s menu', () => {
  const s1 = season({ n: 3 });
  place(s1, 'a01', 'market');
  place(s1, 'a02', 'docks', { stars: 4 });
  s1.cops.forEach(c => { c.block = 'home'; });
  const l1 = hour(s1, { a01: { move: 'rest', callShot: { move: 'mug', target: 'a02' } } });
  assert.equal(events(l1, 'call_shot')[0].pull, false);
  assert.ok(!l1.events.some(e => e.type === 'cop_move' && e.why === 'call_shot'));
  const s2 = season({ n: 3 });
  place(s2, 'a01', 'docks');
  place(s2, 'a02', 'docks');
  s2.cops.forEach(c => { c.block = 'home'; });
  const l2 = hour(s2, { a01: { move: 'rest', callShot: { move: 'mug', target: 'a02' } } });
  assert.equal(events(l2, 'call_shot')[0].pull, true);
  assert.ok(l2.events.some(e => e.type === 'cop_move' && e.why === 'call_shot'));
});

// ---------- A9: LLM hazards ----------

test('A9: a line\'s headline numbers are its first option\'s (targets by id), not the greedy pick', () => {
  const state = season({ n: 4 });
  place(state, 'a01', 'bar', { energy: 90 });
  place(state, 'a02', 'bar', { energy: 90 });
  place(state, 'a03', 'bar', { energy: 10 });
  const ff = views(state).a01.menu.find(l => l.id === 'fistfight');
  assert.deepEqual(ff.options.map(o => o.target), ['a02', 'a03']);
  assert.equal(ff.odds, ff.options[0].odds);
});

test('A9: buy lists valid item + source pairs; a bad pair fails; a buy that cannot resolve costs no energy', () => {
  const state = season({ n: 2 });
  place(state, 'a01', 'market', { cash: 1000 });
  const buy = views(state).a01.menu.find(l => l.id === 'buy');
  assert.ok(buy.combos.some(c => c.item === 'car' && c.from === 'shop'));
  assert.ok(!buy.combos.some(c => c.item === 'car' && c.from === 'board'));
  const l = hour(state, { a01: { move: 'buy', args: { item: 'car', qty: 1, from: 'board' } } });
  assert.equal(entry(l, 'a01').failed, true);
  assert.equal(entry(l, 'a01').why, 'bad_combo');
  // Leaving `from` out is fine.
  const l2 = hour(state, { a01: { move: 'buy', args: { item: 'chems', qty: 1 } } });
  assert.equal(entry(l2, 'a01').ok, true);
  // Can't afford anything after the menu was built: no energy spent.
  const s2 = season({ n: 2 });
  const b = place(s2, 'a01', 'market', { cash: 100 });
  const { views: vs, hashes } = buildViews(s2, buildBrief(s2.cfg));
  b.cash = 0;
  const e0 = b.energy;
  const l3 = runHour(s2, { a01: { ok: true, reply: { move: 'buy', target: null, args: { item: 'chems', qty: 1, from: 'board' } } }, a02: { ok: true, reply: { move: 'rest' } } }, vs, hashes);
  assert.equal(entry(l3, 'a01').ok, false);
  assert.ok(b.energy >= e0, 'no buy energy spent');
});

test('A9: a failed AI reply still says, thinks and messages', () => {
  const state = season({ n: 2 });
  const { views: vs, hashes } = buildViews(state, buildBrief(state.cfg));
  const line = runHour(state, {
    a01: { ok: false, why: 'move "teleport" is not on the menu', reply: { move: null, target: null, args: null, thought: 'oops', say: 'hey', message: msg('a02', 'later'), sell: null, callShot: null } },
    a02: { ok: true, reply: { move: 'rest' } },
  }, vs, hashes);
  const e = entry(line, 'a01');
  assert.equal(e.failed, true);
  assert.equal(e.move, 'rest');
  assert.equal(e.say, 'hey');
  assert.equal(e.thought, 'oops');
  assert.equal(e.message.text, 'later');
});

// ---------- B1-B3: the crown, the audience, mutual fights ----------

test('B1: the king is the viewer-hours leader every hour, and the final king is the winner', async () => {
  const res = await runSeason({ seed: 4, config: defaultConfig(), lineup: loadLineup('default') });
  const vh = {};
  for (const line of res.feed) {
    for (const e of line.agents) vh[e.id] = (vh[e.id] ?? 0) + e.meters.viewers;
    if (!line.king) continue;
    // Rounded meters can tie; the leader's hours are within rounding of the top.
    const top = Math.max(...Object.values(vh));
    assert.ok(vh[line.king] >= top - line.t - 1, `t${line.t}`);
  }
  assert.equal(res.feed.at(-1).king, res.standings[0].id);
  const leads = res.feed.flatMap(l => l.moments.filter(m => m.type === 'lead_change')).length;
  assert.ok(leads < 15, `lead changes ${leads}`);
});

test('B2: a quiet group hands out only min(1, points/10) of its released and browsing viewers', () => {
  const state = season({ n: 3 });
  for (const id of state.ids) place(state, id, 'market');
  const pool = state.unassigned.weird;
  const l = hour(state, { a01: { move: 'crip_walk' } });
  const weird = state.agents.a01.viewers.weird;
  const browse = pool * 0.5;
  const pts = entry(l, 'a01').fans.weird; // 1.5 x 1.5 novelty
  assert.ok(near(weird, browse * Math.min(1, pts / 10)), `${weird} vs ${browse * pts / 10}`);
});

test('B3: two agents fighting each other in the same hour is one fight with one winner', () => {
  for (const move of ['fistfight', 'battle']) {
    const state = season({ n: 3 });
    place(state, 'a01', 'bar', { energy: 70 });
    place(state, 'a02', 'bar', { energy: 70 });
    const l = hour(state, { a01: { move, target: 'a02' }, a02: { move, target: 'a01' } });
    const evs = l.events.filter(e => e.type === (move === 'battle' ? 'battle' : 'fight'));
    assert.equal(evs.length, 1, move);
    const a = entry(l, 'a01'), b = entry(l, 'a02');
    assert.notEqual(a.ok, b.ok, `${move}: exactly one winner`);
    assert.equal(a.result.mutual, true);
    assert.equal(b.result.mutual, true);
    const cost = state.cfg.actions[move].energy;
    assert.ok(state.agents.a02.energy <= 70 - cost + 15 + 6, `${move}: the target paid too`);
  }
});

// ---------- D, E: wording and the report ----------

test('D: the play-by-play speaks plainly', async () => {
  const res = await runSeason({ seed: 2, config: defaultConfig(), lineup: loadLineup('default') });
  const pbp = renderPlayByPlay({ feed: res.feed, setup: res.setup, standings: res.standings, run: 't' });
  for (const bad of ['flash 0', 'in free', 'calls the shot', 'ran 2 parts', 'ran 4 chems', 'fine $0']) assert.ok(!pbp.includes(bad), bad);
  if (pbp.includes('got revenge')) assert.match(pbp, /got revenge on \w+ for the Day \d \d\d:00 /);
  // Each bounty reveal is still its own ★ line (round 3: moment lines carry no type tags, so check the typed moments).
  for (const m of res.feed.flatMap(l => l.moments.filter(x => x.type === 'bounty_revealed'))) {
    assert.match(m.line, /The town learns \w+ posted the \$\d+ bounty on \w+/);
    assert.ok(pbp.split('\n').includes(`- ★ ${m.line}`), m.line);
  }
  assert.ok(!/arrested[^\n]*\(fine \$/.test(pbp));
});

test('D: a battle\'s target sees it on its own line', () => {
  const state = season({ n: 3 });
  place(state, 'a01', 'bar');
  place(state, 'a02', 'bar');
  const l = hour(state, { a01: { move: 'battle', target: 'a02' } });
  assert.deepEqual(entry(l, 'a02').incoming.map(x => [x.by, x.move]), [['a01', 'battle']]);
  const setup = { seed: 1, lineup: 't', days: 3, hours: 54, agents: state.ids.map(id => ({ id, name: state.agents[id].name, job: state.agents[id].job, brain: 'greedy' })) };
  const standings = state.ids.map((id, i) => ({ id, name: state.agents[id].name, job: state.agents[id].job, rank: i, viewerHours: 0, finalViewers: 0, peak: 0, cash: 0 }));
  const pbp = renderPlayByPlay({ feed: [l], setup, standings: [standings[0], standings[2], standings[1]], run: 't' });
  assert.match(pbp, new RegExp(`was challenged to a dance/rap battle \\(no violence\\) by ${state.agents.a01.name} and (won|lost)`));
});

test('E: the report has a strong dull-stretch measure and the mark uses it', async () => {
  const cfg = defaultConfig();
  const res = await runSeason({ seed: 3, config: cfg, lineup: loadLineup('default') });
  const st = seasonStats({ feed: res.feed, setup: res.setup, standings: res.standings, cfg });
  assert.ok(st.watch.longestStrongDull >= st.watch.longestDull);
  const r = aggregate([st], { lineup: 'default' });
  const mark = r.marks.find(m => /dull/.test(m.mark));
  assert.match(mark.value, /strong moments only/);
  assert.equal(mark.pass, r.watch.seasonsStrongDullAtMost3 >= 0.999);
  assert.ok(totalViewers(res.state.agents.a01) >= 0);
});

test('E: the promise and lead-change mark checks separate season shares at the exact thresholds', async () => {
  const cfg = defaultConfig();
  const res = await runSeason({ seed: 3, config: cfg, lineup: loadLineup('default'), maxHours: 1 });
  const base = seasonStats({ feed: res.feed, setup: res.setup, standings: res.standings, cfg });
  for (const [n, broken, leads, pass] of [
    [10, 8, 6, true], [10, 8, 5, false], [10, 7, 6, false], [10, 10, 0, false],
    [250, 199, 200, false], [250, 200, 126, true],
  ]) {
    const stats = Array.from({ length: n }, (_, i) => ({
      ...base,
      interesting: { ...base.interesting, momentsByType: i < broken ? { promise_broken: 1 } : {}, leadChanges: i >= n - leads ? 1 : 0 },
    }));
    const mark = aggregate(stats).marks.find(m => m.mark === 'At least 1 broken promise per season, and a lead change in most seasons');
    assert.ok(mark);
    assert.equal(mark.pass, pass, `${broken}/${n} broken, ${leads}/${n} lead changes`);
    if (n === 10 && broken === 8 && leads === 6) {
      assert.equal(mark.value, 'broken promise in 80% of seasons; lead change in 60% of seasons');
    }
  }
});

test('E: job wins are balanced against configured seat shares, including both bounds and zero wins', async () => {
  const cfg = defaultConfig();
  const res = await runSeason({ seed: 3, config: cfg, lineup: loadLineup('default'), maxHours: 1 });
  const jobNames = ['smuggler', 'chemist', 'dealer', 'gunrunner'];
  for (const [jobs, wins, pass] of [
    [cfg.agents.jobs, [2, 9, 5, 4], true],
    [cfg.agents.jobs, [1, 6, 9, 4], false],
    [cfg.agents.jobs, [7, 4, 5, 4], false],
    [cfg.agents.jobs, [6, 7, 7, 0], false],
    [cfg.agents.jobs, [24, 75, 101, 50], false],
    [jobNames, [4, 4, 8, 4], false],
    [jobNames, [3, 3, 7, 7], true],
    [['smuggler', 'smuggler', 'chemist', 'chemist'], [10, 10, 0, 0], true],
  ]) {
    const base = seasonStats({ feed: res.feed, setup: res.setup, standings: res.standings, cfg: { ...cfg, agents: { ...cfg.agents, jobs } } });
    const stats = wins.flatMap((count, i) => Array.from({ length: count }, () => ({ ...base, winner: { ...base.winner, job: jobNames[i] } })));
    const mark = aggregate(stats).marks.find(m => m.mark === 'Each job wins between 0.5x and 1.5x its share of seats');
    assert.ok(mark);
    assert.equal(mark.pass, pass, `seats ${jobs}, wins ${wins}`);
    if (wins[0] === 2) {
      assert.equal(mark.value, 'smuggler 10% (20%), chemist 45% (30%), dealer 25% (30%), gunrunner 20% (20%)');
    }
    if (jobs === jobNames) {
      assert.match(mark.value, /smuggler \d+% \(25%\), chemist \d+% \(25%\), dealer \d+% \(25%\), gunrunner \d+% \(25%\)/);
    }
  }
});
