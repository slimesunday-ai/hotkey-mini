// Round 2 regression tests: 4-hour jail, drip checks need flash, revenge only for earlier grudges, public 15% ducks,
// and the play-by-play's time formatting and glitches.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { season, place, hour, entry, events, moments, giveViewers, views } from './helpers.mjs';
import { defaultConfig, setPath } from '../src/config.mjs';
import { buildBrief } from '../src/view.mjs';
import { runSeason } from '../src/season.mjs';
import { loadLineup } from '../src/lineups.mjs';
import { renderPlayByPlay, dayLabel } from '../src/playbyplay.mjs';
import { clockLabel } from '../src/state.mjs';

const near = (a, b) => Math.abs(a - b) < 1e-9;

test('1: jail is cops.jailHours (4) hours, and the brief says what the config says', () => {
  const state = season({ n: 2 });
  const a = place(state, 'a01', 'park', { stars: 5 });
  const l = hour(state, {});
  assert.equal(a.until, l.t + 4);
  let n = 0;
  while (a.state === 'jail') { hour(state, {}); n++; }
  assert.equal(n, 4);
  assert.ok(buildBrief(defaultConfig()).rules.some(r => r.startsWith('Jail: 4 hours (+3 if caught running)')));
  const cfg = defaultConfig();
  setPath(cfg, 'cops.jailHours', 5);
  assert.ok(buildBrief(cfg).rules.some(r => r.startsWith('Jail: 5 hours')));
});

test('2: drip_check is legal only while wearing flash', () => {
  const state = season({ n: 2 });
  place(state, 'a01', 'bar');
  assert.ok(!views(state).a01.menu.some(l => l.id === 'drip_check'), 'no jewelry, no drip check');
  state.agents.a01.gear.chain = 1;
  const v = views(state).a01.menu.find(l => l.id === 'drip_check');
  assert.ok(v);
  assert.ok(near(v.fans.drama, 1), 'chain flash 100 -> 1 drama');
  const l = hour(state, { a01: { move: 'drip_check' } });
  assert.match(entry(l, 'a01').result.text, /showing off their chain/);
  // With the flash system off, nobody wears flash, so nobody can drip check.
  const s2 = season({ n: 2, off: ['flash'] });
  s2.agents.a01.gear.chain = 1;
  assert.ok(!views(s2).a01.menu.some(l => l.id === 'drip_check'));
});

test('3: revenge counts only grudges from earlier hours', () => {
  for (const [ago, revenge] of [[0, false], [1, true]]) {
    const state = season({ n: 2, sets: { 'actions.fistfight.odds': 5 } });
    place(state, 'a01', 'bar');
    place(state, 'a02', 'bar');
    if (ago) hour(state, {});
    place(state, 'a01', 'bar');
    place(state, 'a02', 'bar');
    state.agents.a01.grudges.push({ who: 'a02', what: 'mugged you', kind: 'mugging', hour: state.t - ago });
    const l = hour(state, { a01: { move: 'fistfight', target: 'a02' } });
    assert.equal(entry(l, 'a01').ok, true);
    assert.ok(near(entry(l, 'a01').fans.action, revenge ? 4.5 : 3), `grudge ${ago}h old: ${entry(l, 'a01').fans.action}`);
    assert.equal(moments(l, 'revenge').length, revenge ? 1 : 0);
  }
});

test('3: an ambush and its answer in the same hour is not revenge', () => {
  // a02 mugs a01 and a01 jumps a02 in the same hour, in either resolution order.
  let checked = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const state = season({ seed, n: 2, sets: { 'actions.fistfight.odds': 5, 'actions.mug.odds': 5 } });
    place(state, 'a01', 'bar');
    place(state, 'a02', 'bar');
    const l = hour(state, { a02: { move: 'mug', target: 'a01' }, a01: { move: 'fistfight', target: 'a02' } });
    assert.equal(moments(l, 'revenge').length, 0, `seed ${seed}`);
    checked++;
  }
  assert.equal(checked, 20);
});

test('4: a duck costs the target 15% and makes everyone\'s headlines; the menu line says so', () => {
  // Round 3 sends ducked viewers to the unassigned pool (systems.duckWalkAway, test/round3.test.mjs); this is the
  // round 2 rule with that switch off.
  const state = season({ n: 3, off: ['duckWalkAway'] });
  place(state, 'a01', 'park');
  place(state, 'a02', 'docks');
  giveViewers(state, 'a02', { action: 100 });
  const why = views(state).a01.menu.find(l => l.id === 'call_out').why;
  assert.match(why, /lose 15% of their viewers to you and the whole town hears they ducked/);
  const l0 = hour(state, { a01: { move: 'call_out', target: 'a02', args: { block: 'park' } } });
  const until = events(l0, 'call_out')[0].until;
  let ducked = null;
  while (!ducked && state.t <= until) {
    place(state, 'a02', 'docks');
    const l = hour(state, {});
    if (moments(l, 'callout_ducked').length) ducked = l;
  }
  const st = ducked.events.find(e => e.type === 'steal' && e.cause === 'ducked');
  assert.ok(near(st.pct, 0.15));
  const v = hour(state, {}).views;
  for (const id of ['a01', 'a02', 'a03']) assert.ok(v[id].headlines[0].includes(`${state.agents.a02.name} ducked ${state.agents.a01.name}'s call-out`), id);
});

test('time: viewers read "Day N HH:00", never t numbers', async () => {
  assert.equal(clockLabel(defaultConfig(), 0), 'Day 1 06:00');
  assert.equal(clockLabel(defaultConfig(), 20), 'Day 2 08:00');
  assert.equal(dayLabel({ perDay: 18, firstHour: 6 }, 53), 'Day 3 23:00');
  const res = await runSeason({ seed: 3, config: defaultConfig(), lineup: loadLineup('default') });
  const pbp = renderPlayByPlay({ feed: res.feed, setup: res.setup, standings: res.standings, run: 't' });
  assert.ok(!/\(t\d+\)/.test(pbp), 'no (t12) in hour headers');
  assert.ok(!/\bt\d+\b/.test(pbp), 'no t numbers anywhere');
  assert.ok(!/by hour \d/.test(pbp), 'no "by hour 12" in canned messages');
  assert.match(pbp, /Winner: most total watch time\. The king is whoever leads that total right now\./);
  // Every acting hour has its header, quiet or not (round 2: Day 3 06:00 was being skipped).
  for (const line of res.feed) assert.ok(pbp.includes(`**Day ${line.day} ${String(line.hour).padStart(2, '0')}:00**`), `Day ${line.day} ${line.hour}:00`);
  if (pbp.includes('promised')) assert.match(pbp, /promised \w+ \$\d+ by Day \d \d\d:00/);
  // Round 3: the call-out result reads as a sentence, with its window clamped to the season's end.
  if (pbp.includes('called out')) assert.match(pbp, /called out \w+ to a fight [^\n]*, any hour from Day \d \d\d:00 until (Day \d \d\d:00|the season ends)/);
});

test('glitch: an agent revived this hour is not also listed as dead', async () => {
  const state = season({ n: 3, sets: { 'actions.kill_king.odds': 5 } });
  const a = place(state, 'a01', 'bar');
  a.stock.guns = 1;
  place(state, 'a02', 'bar');
  giveViewers(state, 'a02', { action: 50 });
  state.agents.a02.viewerHours = 500;
  state.king = 'a02';
  const feed = [hour(state, { a01: { move: 'kill_king', target: 'a02' } })];
  while (state.agents.a02.state === 'dead') feed.push(hour(state, {}));
  const revivedLine = feed.at(-1);
  assert.equal(moments(revivedLine, 'revive').length, 1);
  const setup = { seed: 1, lineup: 't', days: 3, hours: 54, perDay: 18, firstHour: 6, agents: state.ids.map(id => ({ id, name: state.agents[id].name, job: state.agents[id].job, brain: 'greedy' })) };
  const standings = ['a02', 'a01', 'a03'].map((id, i) => ({ id, name: state.agents[id].name, job: state.agents[id].job, rank: i, viewerHours: 0, finalViewers: 0, peak: 0, cash: 0 }));
  const pbp = renderPlayByPlay({ feed: [revivedLine], setup, standings, run: 't' });
  const lineFor = pbp.split('\n').find(l => l.includes(`· ${state.agents.a02.name} (`));
  assert.ok(lineFor, pbp);
  assert.match(lineFor, /came back from the dead/);
  assert.ok(!/· dead/.test(lineFor));
});

test('play-by-play: promises show when made, payments say what they keep, reveals say who collected', () => {
  const state = season({ n: 3, sets: { 'actions.fistfight.odds': 5 } });
  place(state, 'a01', 'bar', { cash: 300 });
  place(state, 'a02', 'bar');
  place(state, 'a03', 'bar');
  const l0 = hour(state, {
    a01: { move: 'bounty', target: 'a02', args: { amount: 60 }, message: { to: 'a03', text: 'later', cash: 0, item: null, promise: { give: { cash: 40 }, by: 4 } } },
  });
  const l1 = hour(state, { a01: { move: 'rest', message: { to: 'a03', text: 'here', cash: 40, item: null, promise: null } }, a03: { move: 'fistfight', target: 'a02' } });
  const feed = [l0, l1];
  while (state.t <= 12) feed.push(hour(state, {}));
  const setup = { seed: 1, lineup: 't', days: 3, hours: 54, perDay: 18, firstHour: 6, agents: state.ids.map(id => ({ id, name: state.agents[id].name, job: state.agents[id].job, brain: 'greedy' })) };
  const standings = ['a01', 'a02', 'a03'].map((id, i) => ({ id, name: state.agents[id].name, job: state.agents[id].job, rank: i, viewerHours: 0, finalViewers: 0, peak: 0, cash: 0 }));
  const pbp = renderPlayByPlay({ feed, setup, standings, run: 't' });
  const n = id => state.agents[id].name;
  assert.ok(pbp.includes(`${n('a01')} promised ${n('a03')} $40 by Day 1 10:00`), 'promise noted when made');
  assert.ok(pbp.includes('paying the $40 promised Day 1 06:00'), 'payment says what it keeps');
  assert.ok(pbp.includes(`kept a promise: paid ${n('a03')} $40, promised Day 1 06:00`));
  assert.ok(pbp.includes(`The town learns ${n('a01')} posted the $60 bounty on ${n('a02')}, the one ${n('a03')} collected Day 1 07:00`), 'reveal tied to the payoff');
});

test('play-by-play: crown changes say where the new king is and the totals', async () => {
  const res = await runSeason({ seed: 6, config: defaultConfig(), lineup: loadLineup('default') });
  const pbp = renderPlayByPlay({ feed: res.feed, setup: res.setup, standings: res.standings, run: 't' });
  const changes = res.feed.flatMap(l => l.moments.filter(m => m.type === 'lead_change'));
  for (const m of changes) assert.ok(m.leader && m.previous && Number.isInteger(m.leader.viewerHours));
  if (changes.length) assert.match(pbp, /took the crown from [^\n]*the most total watch time so far \(total watch time: \w+ [\d,]+ viewer-hours, \w+ [\d,]+\)/);
  assert.match(pbp, /is the first king/);
});
