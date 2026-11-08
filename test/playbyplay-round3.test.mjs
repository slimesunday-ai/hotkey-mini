// Round 3 play-by-play (R3.7): the cast list with style labels, the race for total watch time, failed turns as plain
// lines, one revenge note per agent per hour, and one line per fight when an hour has several.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { season, place, hour, moments } from './helpers.mjs';
import { defaultConfig } from '../src/config.mjs';
import { buildBrief, buildViews } from '../src/view.mjs';
import { runHour } from '../src/resolve.mjs';
import { finishHour, runSeason } from '../src/season.mjs';
import { loadLineup } from '../src/lineups.mjs';
import { renderPlayByPlay } from '../src/playbyplay.mjs';

// A setup and standings for a hand-run test season (seat order is the standings order unless given).
function setupOf(state, more = {}) {
  return {
    seed: 1, lineup: 't', days: 3, hours: 54, perDay: 18, firstHour: 6,
    agents: state.ids.map(id => ({ id, name: state.agents[id].name, job: state.agents[id].job, brain: 'greedy', sliders: state.agents[id].sliders, ...(more[id] ?? {}) })),
  };
}
const standingsOf = (state, ids = state.ids) => ids.map((id, i) => ({ id, name: state.agents[id].name, job: state.agents[id].job, rank: i, viewerHours: 0, finalViewers: 0, peak: 0, cash: 0 }));

// The lines of one hour's block: from its header to the next one.
function block(pbp, label) {
  const lines = pbp.split('\n');
  const i = lines.findIndex(l => l.startsWith(`**${label}**`));
  assert.ok(i >= 0, `no block for ${label}`);
  const j = lines.findIndex((l, k) => k > i && (l.startsWith('**Day ') || l.startsWith('## ')));
  return lines.slice(i, j < 0 ? undefined : j);
}
const agentLine = (lines, name) => lines.find(l => /^Day \d \d\d:00 · /.test(l) && l.includes(`· ${name} (`));

// What somebody else's contest against an agent reads like on its line ("was jumped by Kim and won the fight").
const INCOMING_RESULT = /was jumped by|was challenged to a dance\/rap battle|was mugged by|fought off a mugging|answered \w+'s call-out|who answered their call-out|was shot|survived|was hit in a drive-by|was killed by|car stolen|kept their car/;

test('cast list: name, brain or model, job and style labels; never the slider numbers', () => {
  const sliders = [
    { risk: 0.93, clout: 0.12, loyalty: 0.08 }, // reckless, lowkey, snake
    { risk: 0.5, clout: 0.5, loyalty: 0.5 }, // no labels
    { risk: 0.21, clout: 0.77, loyalty: 0.86 }, // safe, show-off, ride-or-die
  ];
  const state = season({ n: 3, sliders });
  const l = hour(state, {});
  const setup = setupOf(state, { a01: { brain: 'ai', model: 'openai/gpt-6.1-sol' }, a02: { brain: 'hustler' }, a03: { brain: 'saint' } });
  const pbp = renderPlayByPlay({ feed: [l], setup, standings: standingsOf(state), run: 't', cfg: defaultConfig() });
  const n = id => state.agents[id].name, j = id => state.agents[id].job;
  const cast = pbp.split('## Cast')[1].split('\n\n')[1].split('\n');
  assert.deepEqual(cast, [
    `- ${n('a01')}: gpt-6.1-sol · ${j('a01')} · reckless, lowkey, snake`,
    `- ${n('a02')}: hustler bot · ${j('a02')}`,
    `- ${n('a03')}: saint bot · ${j('a03')} · safe, show-off, ride-or-die`,
  ]);
  for (const s of sliders) for (const v of Object.values(s)) if (v !== 0.5) assert.ok(!pbp.includes(String(v)), `slider ${v} leaked`);
  // A season saved before the rename calls the clout slider flash; it still reads as clout.
  const old = setupOf(state, { a02: { brain: 'showboat', sliders: { risk: 0.43, flash: 0.9, loyalty: 0.63 } } });
  const pbp2 = renderPlayByPlay({ feed: [l], setup: old, standings: standingsOf(state), run: 't' });
  assert.ok(pbp2.includes(`- ${n('a02')}: showboat bot · ${j('a02')} · show-off`));
  // The cast list comes before the first hour, and the final standings close the page.
  assert.ok(pbp.indexOf('## Cast') < pbp.indexOf('**Day 1 06:00**'));
  assert.ok(pbp.indexOf('## Final standings') > pbp.indexOf('**Day 1 06:00**'));
});

test('race lines: every 6 acting hours and at each day\'s end, and the last one is the final standings', async () => {
  const res = await runSeason({ seed: 2, config: defaultConfig(), lineup: loadLineup('default') });
  const pbp = renderPlayByPlay({ feed: res.feed, setup: res.setup, standings: res.standings, run: 't' });
  const names = Object.fromEntries(res.setup.agents.map(a => [a.id, a.name]));
  // Which hour each race line closes.
  const at = [];
  let header = null;
  for (const l of pbp.split('\n')) {
    if (l.startsWith('**Day ')) header = l.match(/^\*\*(Day \d \d\d:00)\*\*/)[1];
    if (l.startsWith('**The race')) at.push([header, l]);
  }
  assert.deepEqual(at.map(x => x[0]), [1, 2, 3].flatMap(d => [`Day ${d} 11:00`, `Day ${d} 17:00`, `Day ${d} 23:00`]));
  assert.ok(at.filter(x => x[0].endsWith('23:00')).every(x => x[1].startsWith(`**The race after Day ${x[0][4]}`)));
  // Mid-season lines: the top 3 by viewer-hours so far (the feed's exact running total), leader first, gaps to the leader.
  const line = res.feed[17]; // Day 1 23:00
  const sum = Object.fromEntries(line.agents.map(e => [e.id, e.meters.viewerHours]));
  const now = Object.fromEntries(line.agents.map(e => [e.id, e.meters.viewers]));
  const top = Object.keys(sum).sort((x, y) => sum[y] - sum[x] || now[y] - now[x] || (x < y ? -1 : 1)).slice(0, 3);
  const want = top.map((id, k) => `${names[id]} ${sum[id].toLocaleString('en-US')}${k ? ` (−${(sum[top[0]] - sum[id]).toLocaleString('en-US')})` : ''}`).join(' · ');
  assert.equal(at[2][1], `**The race after Day 1:** ${want}`);
  // The last race line agrees with the final standings: same names, order and viewer-hours.
  const s = res.standings;
  const gap = x => (s[0].viewerHours === x.viewerHours ? ' (tied)' : ` (−${(s[0].viewerHours - x.viewerHours).toLocaleString('en-US')})`);
  assert.equal(at.at(-1)[1], `**The race after Day 3 (final):** ${s[0].name} ${s[0].viewerHours.toLocaleString('en-US')} · ${s[1].name} ${s[1].viewerHours.toLocaleString('en-US')}${gap(s[1])} · ${s[2].name} ${s[2].viewerHours.toLocaleString('en-US')}${gap(s[2])}`);
  assert.ok(pbp.includes(`**Winner: ${s[0].name}**`));
  // Moment lines carry no snake_case type tags, and the final standings name agents, not seats.
  assert.ok(!/_\([a-z_]+\)_/.test(pbp), 'no moment-type tags');
  const table = pbp.split('## Final standings')[1].split('\n').filter(l => l.startsWith('| ') && !l.startsWith('| Place'));
  assert.equal(table.length, s.length);
  for (const [k, row] of table.entries()) {
    assert.ok(row.startsWith(`| ${k + 1} | ${s[k].name} | ${s[k].job} | `), row);
    assert.ok(!/\ba\d\d\b/.test(row), row);
  }
});

test('race lines read the typed viewer-hours when the feed carries them', async () => {
  const res = await runSeason({ seed: 3, config: defaultConfig(), lineup: loadLineup('default'), maxHours: 8 });
  const feed = structuredClone(res.feed);
  // Typed running totals: a03 leads, a07 second, a01 third, everyone else far behind.
  const typed = { a03: 900, a07: 850, a01: 700 };
  for (const line of feed) for (const e of line.agents) e.meters.viewerHours = (typed[e.id] ?? 10) + line.t;
  const pbp = renderPlayByPlay({ feed, setup: res.setup, standings: res.standings, run: 't' });
  const n = Object.fromEntries(res.setup.agents.map(a => [a.id, a.name]));
  assert.ok(pbp.includes(`**The race:** ${n.a03} 905 · ${n.a07} 855 (−50) · ${n.a01} 705 (−200)`), pbp.split('\n').filter(l => l.startsWith('**The race')).join('\n'));
  // A short feed still ends on a race line: the standings at the end of it.
  assert.ok(pbp.trimEnd().split('## Final standings')[0].trimEnd().split('\n').at(-1).startsWith('**The race:**'));
});

test('a failed AI turn reads as a plain line: no error codes, parse reasons or JSON', () => {
  const state = season({ n: 4, off: ['cops'] });
  for (const id of ['a01', 'a02', 'a03', 'a04']) place(state, id, 'bar');
  const { views, hashes } = buildViews(state, buildBrief(state.cfg));
  const base = { target: null, args: {}, thought: '', say: '', message: null, sell: null, callShot: null };
  const replies = {
    // A cut-off reply: nothing parsed at all.
    a01: { ok: false, why: 'cut off: no JSON object in the reply', by: 'ai' },
    // A reply that parsed, with a move that isn't on the menu: it keeps its words.
    a02: { ok: true, by: 'ai', reply: { ...base, move: 'moonwalk_to_the_bank', say: 'Watch this.', message: { to: 'a01', text: 'You next.' } } },
    // A fight with somebody who walks off this hour.
    a03: { ok: true, by: 'ai', reply: { ...base, move: 'fistfight', target: 'a04' } },
    a04: { ok: true, by: 'bot', reply: { ...base, move: 'move', args: { to: 'park' } } },
  };
  const l = runHour(state, replies, views, hashes);
  finishHour(state, l);
  const e = id => l.agents.find(x => x.id === id);
  assert.ok(e('a01').failed && e('a02').failed, 'both turns failed');
  assert.equal(e('a03').why, 'target_left_block');
  const ai = { brain: 'ai', model: 'moonshotai/kimi-k3.1-pro' };
  const setup = setupOf(state, { a01: ai, a02: ai, a03: ai });
  // a01 shows through a moment; a02 (top 3) through its message; a03 (top 3) through its fight.
  l.moments.push({ hour: l.t, type: 'comeback', agents: ['a01'], size: 3, line: `${state.agents.a01.name} climbed from the bottom 3 to the top 3` });
  const pbp = renderPlayByPlay({ feed: [l], setup, standings: standingsOf(state, ['a02', 'a03', 'a01', 'a04']), run: 't' });
  const b = block(pbp, 'Day 1 06:00');
  const n = id => state.agents[id].name;
  assert.match(agentLine(b, n('a01')), /· stood around, saying nothing( \([+-]\d+ viewers\))?$/);
  assert.match(agentLine(b, n('a02')), /· stood around( \([+-]\d+ viewers\))?\s*$/);
  assert.ok(b.some(x => x.includes('says: "Watch this."')), 'a failed move keeps its words');
  assert.match(agentLine(b, n('a03')), new RegExp(`· looked for a fight with ${n('a04')} but ${n('a04')} wasn't there`));
  for (const bad of ['invalid_reply', 'not_on_menu', 'not on menu', 'JSON', 'cut off', 'fumbled', 'turn failed', 'moonwalk', 'target left block', '(t0)']) assert.ok(!pbp.includes(bad), bad);
  for (const x of b) assert.ok(!/\b[a-z]+_[a-z_]+\b/.test(x), `a code in: ${x}`);
});

// Hour 0: a01 and a03 mug a02, so a02 holds grudges on both. Hour 1: a01 and a03 jump a02 and lose (attackers never
// win), and a02 mugs a01: three wins for a02, each paying revenge.
function revengeHour() {
  const state = season({ n: 4, off: ['cops'], sets: { 'actions.mug.odds': 5, 'actions.fistfight.odds': -5 } });
  for (const id of ['a01', 'a02', 'a03']) place(state, id, 'bar', { cash: 200, energy: 90 });
  place(state, 'a04', 'park');
  const l0 = hour(state, { a01: { move: 'mug', target: 'a02', args: { take: 'cash' } }, a03: { move: 'mug', target: 'a02', args: { take: 'cash' } } });
  for (const id of ['a01', 'a02', 'a03']) state.agents[id].energy = 90;
  const l1 = hour(state, { a01: { move: 'fistfight', target: 'a02' }, a03: { move: 'fistfight', target: 'a02' }, a02: { move: 'mug', target: 'a01', args: { take: 'cash' } } });
  return { state, feed: [l0, l1], l1 };
}

test('revenge: one note per agent per hour, naming each rival once', () => {
  const { state, feed, l1 } = revengeHour();
  const n = id => state.agents[id].name;
  assert.ok(moments(l1, 'revenge').filter(m => m.agents[0] === 'a02').length >= 3, 'the engine pays revenge three times');
  const pbp = renderPlayByPlay({ feed, setup: setupOf(state), standings: standingsOf(state, ['a02', 'a01', 'a03', 'a04']), run: 't' });
  const notes = block(pbp, 'Day 1 07:00').filter(l => l.includes('got revenge'));
  assert.equal(notes.length, 1, notes.join('\n'));
  // Rivals in the order the engine paid the revenge.
  const rivals = [...new Set(moments(l1, 'revenge').map(m => m.agents[1]))];
  assert.equal(rivals.length, 2);
  assert.equal(notes[0], `- ★ ${n('a02')} got revenge on ${rivals.map(id => `${n(id)} for the Day 1 06:00 mugging`).join(' and on ')}`);
  // The same rival three times in one hour is one plain note (out/ai-s1 Day 1 13:00).
  const line = structuredClone(l1);
  const m = { hour: line.t, type: 'revenge', agents: ['a02', 'a01'], size: 2, line: `${n('a02')} got revenge on ${n('a01')} for the Day 1 06:00 mugging`, for: { kind: 'mugging', hour: 0 } };
  line.moments = [m, { ...m }, { ...m }];
  const pbp2 = renderPlayByPlay({ feed: [feed[0], line], setup: setupOf(state), standings: standingsOf(state), run: 't' });
  assert.deepEqual(block(pbp2, 'Day 1 07:00').filter(l => l.includes('got revenge')), [`- ★ ${m.line}`]);
});

test('several fights in one hour: one line each, in resolution order, and no agent line carries two results', () => {
  const { state, feed, l1 } = revengeHour();
  const n = id => state.agents[id].name;
  const pbp = renderPlayByPlay({ feed, setup: setupOf(state), standings: standingsOf(state, ['a02', 'a01', 'a03', 'a04']), run: 't' });
  const b = block(pbp, 'Day 1 07:00');
  // The typed contests in event order.
  const want = l1.events.flatMap(ev => {
    if (ev.type === 'fight') return [`- ⚔ ${n(ev.a)} jumped ${n(ev.b)}: ${n(ev.winner)} won the fight`];
    if (ev.type === 'interaction' && ev.cause === 'mug') return [`- ⚔ ${n(ev.a)} mugged ${n(ev.b)} for $${l1.agents.find(e => e.id === ev.a).result.cash}`];
    return [];
  });
  assert.equal(want.length, 3);
  assert.deepEqual(b.filter(l => l.startsWith('- ⚔')), want);
  // Each agent line keeps only its own action's result: the card carries the rest.
  for (const l of b.filter(x => /^Day \d \d\d:00 · /.test(x))) assert.ok(!INCOMING_RESULT.test(l), l);
  assert.ok(!agentLine(b, n('a02')).includes(';'), 'a02 shows only its own mugging');
});

test('several fights between the same two agents never read as won and lost on one line', () => {
  // out/ai-s1 Day 3 13:00: Sable jumps Wren and loses, Wren wins a battle, then two met call-outs go opposite ways.
  const state = season({ n: 3 });
  const l = hour(state, {});
  const [S, W, J] = ['a01', 'a02', 'a03'];
  const n = id => state.agents[id].name;
  const base = { block: 'bar', target: null, args: {}, failed: false, why: null, state: 'free', thought: '', say: '', message: null, sell: null, callShot: null, acting: true, involved: true };
  l.agents = [
    { ...l.agents[0], ...base, id: S, move: 'fistfight', target: W, ok: false, why: 'lost', result: { text: `lost a fight to ${n(W)} at the bar`, outcome: 'lose' }, incoming: [{ by: W, move: 'battle', outcome: 'lost' }, { by: W, move: 'call_out_answered', outcome: 'won' }] },
    { ...l.agents[1], ...base, id: W, move: 'battle', target: S, ok: true, result: { text: `won a dance/rap battle (no violence) against ${n(S)} at the bar`, outcome: 'win' }, incoming: [{ by: S, move: 'fistfight', outcome: 'won' }, { by: J, move: 'call_out', outcome: 'won' }, { by: S, move: 'call_out', outcome: 'lost' }] },
    { ...l.agents[2], ...base, id: J, move: 'move', ok: true, result: { text: 'moved from the corner to the bar' }, incoming: [{ by: W, move: 'call_out_answered', outcome: 'lost' }] },
  ];
  l.events = [
    { type: 'fight', a: S, b: W, winner: W, cause: 'fistfight', mode: 'action' },
    { type: 'battle', a: W, b: S, winner: W, mutual: false },
    { type: 'fight', a: J, b: W, winner: W, cause: 'call_out', mode: 'callout' },
    { type: 'fight', a: S, b: W, winner: S, cause: 'call_out', mode: 'callout' },
  ];
  l.moments = [
    { hour: l.t, type: 'callout_answered', agents: [J, W], size: 3, line: `${n(W)} answered ${n(J)}'s call-out at the bar: ${n(W)} won the fight` },
    { hour: l.t, type: 'callout_answered', agents: [S, W], size: 3, line: `${n(W)} answered ${n(S)}'s call-out at the bar: ${n(S)} won the fight` },
  ];
  const pbp = renderPlayByPlay({ feed: [l], setup: setupOf(state), standings: standingsOf(state), run: 't' });
  const b = block(pbp, 'Day 1 06:00');
  assert.deepEqual(b.filter(x => x.startsWith('- ')), [
    `- ⚔ ${n(S)} jumped ${n(W)}: ${n(W)} won the fight`,
    `- ⚔ ${n(W)} challenged ${n(S)} to a dance/rap battle (no violence): ${n(W)} won`,
    `- ★ ${l.moments[0].line}`,
    `- ★ ${l.moments[1].line}`,
  ]);
  for (const x of b.filter(y => /^Day \d \d\d:00 · /.test(y))) {
    assert.ok(!(/\bwon\b/.test(x) && /\blost\b/.test(x)), x);
    assert.ok(!INCOMING_RESULT.test(x), x);
  }
});
