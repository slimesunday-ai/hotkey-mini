#!/usr/bin/env node
// Rescore saved seasons under candidate win rules: node tools/rescore.mjs <run-dir | season-dir | feed.jsonl> [...]
// Analysis only: the same hourly feed is scored under each rule, no season is played and nothing in src/ is read.
// Each argument is reported on its own. A run folder (out/<run>/) is every numbered season in it (bot twins skipped);
// a season folder or a feed.jsonl is one season. Prints markdown tables to stdout.
import fs from 'node:fs';
import path from 'node:path';

// The rules. A summed rule weights each acting hour's viewers by w(hour, season); C scores daily points instead.
const RULES = [
  { key: 'A', label: 'A: total viewer-hours (today)', w: () => 1 },
  { key: 'B1', label: 'B1: days ×1, ×2, ×3', w: h => h.day },
  { key: 'B2', label: 'B2: last day ×2', w: (h, S) => (h.day === S.days ? 2 : 1) },
  { key: 'C', label: 'C: daily episodes, 5/3/1 points', points: [5, 3, 1] },
  { key: 'D18', label: 'D: recent hours, half-life 18 h', w: (h, S) => 0.5 ** ((S.last - h.t) / 18) },
  { key: 'D9', label: 'D: recent hours, half-life 9 h', w: (h, S) => 0.5 ** ((S.last - h.t) / 9) },
];
// In trouble on day 1: dead or jailed this many acting hours of it, or in the bottom BOTTOM by viewer-hours at its end.
const HELD_HOURS = 6;
const BOTTOM = 3;
// A dead or jailed winner: dead or jailed for at least this many of the season's last acting hours.
const LAST_HOURS = 3;
const HELD = new Set(['dead', 'jail']);
const DEAD = new Set(['dead']);
// A hard tilt: a group's win share at least this many times its seat share, on at least MIN_WINS wins.
const TILT = 2;
const MIN_WINS = 5;

const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : 'n/a');
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
const ord = n => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

// One season from its feed (and season.json beside it, for names, jobs and brains). Each hour's viewers are the step in
// meters.viewerHours when the feed carries it (exact to the standings), else meters.viewers (older feeds, ai-s1).
function loadSeason(feedFile) {
  const feed = fs.readFileSync(feedFile, 'utf8').trim().split('\n').map(l => JSON.parse(l));
  const sfile = path.join(path.dirname(feedFile), 'season.json');
  const season = fs.existsSync(sfile) ? JSON.parse(fs.readFileSync(sfile, 'utf8')) : null;
  const ids = feed[0].agents.map(e => e.id);
  const typed = feed.every(l => l.agents.every(e => Number.isFinite(e.meters?.viewerHours)));
  const prev = Object.fromEntries(ids.map(id => [id, 0]));
  const hours = feed.map(l => {
    const v = {}, state = {}, now = {};
    for (const e of l.agents) {
      v[e.id] = typed ? e.meters.viewerHours - prev[e.id] : e.meters.viewers;
      if (typed) prev[e.id] = e.meters.viewerHours;
      state[e.id] = e.state;
      now[e.id] = e.meters.viewers;
    }
    return { t: l.t, day: l.day, v, state, now };
  });
  const info = Object.fromEntries((season?.setup.agents ?? ids.map(id => ({ id }))).map(a => [a.id, a]));
  return {
    file: feedFile, ids, hours, info, days: Math.max(...hours.map(h => h.day)), last: hours.at(-1).t,
    perDay: hours.filter(h => h.day === 1).length, standings: season?.standings ?? null, lineup: season?.setup.lineup ?? null,
  };
}

// The ranking (ids, best first, with .score) under a rule on the hours up to and including index upto. For C the day in
// progress scores as if it ended now. Ties: total viewer-hours so far, then viewers this hour, then id (as the engine).
function rankAt(S, rule, upto) {
  const hs = S.hours.slice(0, upto + 1);
  const total = Object.fromEntries(S.ids.map(id => [id, 0]));
  const score = Object.fromEntries(S.ids.map(id => [id, 0]));
  for (const h of hs) for (const id of S.ids) total[id] += h.v[id];
  const now = hs.at(-1).now;
  const order = sc => S.ids.slice().sort((x, y) => sc[y] - sc[x] || total[y] - total[x] || now[y] - now[x] || (x < y ? -1 : 1));
  if (rule.points) {
    for (const day of new Set(hs.map(h => h.day))) {
      const dv = Object.fromEntries(S.ids.map(id => [id, 0]));
      for (const h of hs) if (h.day === day) for (const id of S.ids) dv[id] += h.v[id];
      order(dv).slice(0, rule.points.length).forEach((id, i) => { score[id] += rule.points[i]; });
    }
  } else {
    for (const h of hs) for (const id of S.ids) score[id] += rule.w(h, S) * h.v[id];
  }
  return Object.assign(order(score), { score });
}

// Everything the measures need from one season under one rule.
function scoreSeason(S, rule) {
  const final = rankAt(S, rule, S.hours.length - 1);
  // The last day's hours: the lead at its start (end of the day before), then each hour's leader.
  const firstLast = S.hours.findIndex(h => h.day === S.days);
  const startLeader = rankAt(S, rule, firstLast - 1)[0];
  let leader = startLeader, changes = 0;
  for (let i = firstLast; i < S.hours.length; i++) {
    const l = rankAt(S, rule, i)[0];
    if (l !== leader) changes++;
    leader = l;
  }
  return { final, winner: final[0], startLeader, changes, topTie: final.score[final[0]] === final.score[final[1]] };
}

// Day-1 trouble (the same agents under every rule): held hours, and the bottom by raw viewer-hours at day 1's end.
// Killed on day 1 (any dead hour) is kept apart too, since only the king can die and so those are early leaders.
function troubleOf(S) {
  const day1 = S.hours.filter(h => h.day === 1);
  const bottom = new Set(rankAt(S, RULES[0], day1.length - 1).slice(-BOTTOM));
  return S.ids.flatMap(id => {
    const held = day1.filter(h => HELD.has(h.state[id])).length;
    const killed = day1.some(h => h.state[id] === 'dead');
    return held >= HELD_HOURS || bottom.has(id) || killed ? [{ id, held, heldTrouble: held >= HELD_HOURS, killed, counted: held >= HELD_HOURS || bottom.has(id) }] : [];
  });
}

// Dead or jailed (or only dead) through the season's last LAST_HOURS acting hours.
function heldAtEnd(S, id, states = HELD) {
  let run = 0;
  for (let i = S.hours.length - 1; i >= 0 && states.has(S.hours[i].state[id]); i--) run++;
  return run >= LAST_HOURS;
}

// The groups for balance: job, and character (the brain; an AI seat's model; a style when every seat has one brain).
const nameOf = (S, id) => S.info[id]?.name ?? id;
const brainOf = a => (a?.brain === 'ai' ? (a.model ?? 'ai').split('/').pop() : a?.brain ?? '?');
const styleOf = a => (a?.labels?.length ? a.labels.join('+') : 'mid');

function seasonsOf(arg) {
  if (arg.endsWith('.jsonl')) return [arg];
  if (fs.existsSync(path.join(arg, 'feed.jsonl'))) return [path.join(arg, 'feed.jsonl')];
  return fs.readdirSync(arg).filter(d => /^\d+$/.test(d) && fs.existsSync(path.join(arg, d, 'feed.jsonl')))
    .sort((a, b) => a - b).map(d => path.join(arg, d, 'feed.jsonl'));
}

// One season, named: who wins under each rule, and where the day-1 strugglers finish.
function reportOne(S) {
  const out = [];
  const trouble = troubleOf(S);
  const res = Object.fromEntries(RULES.map(r => [r.key, scoreSeason(S, r)]));
  const sw = S.standings?.[0]?.id;
  if (sw && sw !== res.A.winner) out.push(`> Check failed: the feed's A winner (${nameOf(S, res.A.winner)}) is not the standings winner (${nameOf(S, sw)}).\n`);
  out.push(`Day-1 leader by viewer-hours: ${nameOf(S, rankAt(S, RULES[0], S.perDay - 1)[0])}. Day-1 trouble: ${trouble.map(x => `${nameOf(S, x.id)} (${x.heldTrouble ? `held ${x.held} h` : x.counted ? `bottom ${BOTTOM}` : 'killed on day 1'})`).join(', ') || 'none'}.\n`);
  out.push(table(['Rule', 'Winner', 'Differs from A', `Winner dead/jailed last ${LAST_HOURS}+ h`, 'Day-3 start leader', 'Leader at start wins', 'Lead changes, day 3', 'Day-1 trouble finishes'],
    RULES.map(r => {
      const x = res[r.key];
      const a = S.info[x.winner];
      return [r.label, `${nameOf(S, x.winner)} (${a?.job ?? '?'}, ${brainOf(a)})`, x.winner === res.A.winner ? 'no' : '**yes**', heldAtEnd(S, x.winner) ? '**yes**' : 'no',
        nameOf(S, x.startLeader), x.startLeader === x.winner ? 'yes' : 'no', x.changes, trouble.map(t => `${nameOf(S, t.id)} ${ord(x.final.indexOf(t.id) + 1)}`).join(', ')];
    })));
  return out.join('\n');
}

// Many seasons: the five measures per rule, then balance by job and by character.
function reportMany(all) {
  const out = [];
  const oneBrain = new Set(all.flatMap(S => S.ids.map(id => S.info[id]?.brain))).size === 1;
  const charOf = a => (oneBrain ? styleOf(a) : brainOf(a));
  const checks = all.filter(S => S.standings && S.standings[0].id !== rankAt(S, RULES[0], S.hours.length - 1)[0]).length;
  if (checks) out.push(`> Check failed: in ${checks} season(s) the feed's A winner is not the standings winner.\n`);
  const killed = all.map(S => troubleOf(S).filter(t => t.killed));
  const trouble = all.map(S => troubleOf(S).filter(t => t.counted));
  const nTrouble = trouble.flat().length, nHeld = trouble.flat().filter(t => t.heldTrouble).length, nKilled = killed.flat().length;
  const res = all.map(S => Object.fromEntries(RULES.map(r => [r.key, scoreSeason(S, r)])));
  // Day 1 still matters: how often the agent with the most viewer-hours on day 1 takes the season.
  const day1Leader = all.map(S => rankAt(S, RULES[0], S.perDay - 1)[0]);
  out.push(`${all.length} seasons. Day-1 trouble: ${nTrouble} agents (${(nTrouble / all.length).toFixed(1)} a season), ${nHeld} of them dead or jailed ${HELD_HOURS}+ h on day 1. Killed on day 1: ${nKilled} agents. ` +
    `Chance level for one agent of ${all[0].ids.length}: top 3 ${pct(3, all[0].ids.length)}, win ${pct(1, all[0].ids.length)}.\n`);
  const rows = RULES.map(r => {
    let flips = 0, top3 = 0, wins = 0, hTop3 = 0, hWins = 0, open = 0, changes = 0, held = 0, dead = 0, ties = 0, d1 = 0, kTop3 = 0, kWins = 0;
    all.forEach((S, i) => {
      const x = res[i][r.key];
      if (x.winner !== res[i].A.winner) flips++;
      for (const t of trouble[i]) {
        const place = x.final.indexOf(t.id);
        if (place < 3) { top3++; if (t.heldTrouble) hTop3++; }
        if (place === 0) { wins++; if (t.heldTrouble) hWins++; }
      }
      for (const t of killed[i]) {
        const place = x.final.indexOf(t.id);
        if (place < 3) kTop3++;
        if (place === 0) kWins++;
      }
      if (x.startLeader !== x.winner) open++;
      changes += x.changes;
      if (heldAtEnd(S, x.winner)) held++;
      if (heldAtEnd(S, x.winner, DEAD)) dead++;
      if (x.topTie) ties++;
      if (x.winner === day1Leader[i]) d1++;
    });
    return [r.label, pct(flips, all.length), pct(top3, nTrouble), pct(wins, nTrouble), `${pct(hTop3, nHeld)} / ${pct(hWins, nHeld)}`, nKilled ? `${kTop3} / ${kWins} of ${nKilled}` : 'none',
      pct(open, all.length), (changes / all.length).toFixed(2), `${pct(held, all.length)} (dead ${pct(dead, all.length)})`, pct(ties, all.length), pct(d1, all.length)];
  });
  out.push(table(['Rule', 'Winner flips vs A', 'Trouble → top 3', 'Trouble → win', `Held ${HELD_HOURS}+ h → top 3 / win`, 'Killed day 1 → top 3 / win', 'Day-3 start leader loses', 'Lead changes, day 3', `Winner dead/jailed last ${LAST_HOURS}+ h`, 'Top score tied (tiebreak decides)', 'Day-1 leader wins'], rows));
  for (const [title, key] of [['job', a => a?.job ?? '?'], [oneBrain ? 'style' : 'character', charOf]]) {
    const seats = {};
    for (const S of all) for (const id of S.ids) seats[key(S.info[id])] = (seats[key(S.info[id])] ?? 0) + 1;
    const nSeats = Object.values(seats).reduce((s, x) => s + x, 0);
    const groups = Object.keys(seats).sort();
    // One group (all-greedy's styles) has nothing to balance.
    if (groups.length < 2) continue;
    const wins = Object.fromEntries(RULES.map(r => [r.key, {}]));
    all.forEach((S, i) => { for (const r of RULES) { const g = key(S.info[res[i][r.key].winner]); wins[r.key][g] = (wins[r.key][g] ?? 0) + 1; } });
    out.push(`\nWins by ${title} (win share, ×seat share; **bold** = at least ${TILT}× its seat share on ${MIN_WINS}+ wins):\n`);
    out.push(table([title[0].toUpperCase() + title.slice(1), 'Seat share', ...RULES.map(r => r.key)], groups.map(g => [g, pct(seats[g], nSeats), ...RULES.map(r => {
      const w = wins[r.key][g] ?? 0;
      const ratio = w / all.length / (seats[g] / nSeats);
      const cell = `${pct(w, all.length)} (×${ratio.toFixed(1)})`;
      return ratio >= TILT && w >= MIN_WINS ? `**${cell}**` : cell;
    })])));
  }
  return out.join('\n');
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node tools/rescore.mjs <run-dir | season-dir | feed.jsonl> [...]');
  process.exit(2);
}
console.log(`Rules: ${RULES.map(r => r.label).join('; ')}. In trouble on day 1: dead or jailed ${HELD_HOURS}+ acting hours of day 1, or bottom ${BOTTOM} by viewer-hours at its end.\n`);
for (const arg of args) {
  const files = seasonsOf(arg);
  if (!files.length) {
    console.error(`no seasons in ${arg}`);
    process.exitCode = 2;
    continue;
  }
  const all = files.map(loadSeason);
  const lineup = all[0].lineup ? `, lineup ${all[0].lineup}` : '';
  console.log(`## ${arg}${lineup}\n`);
  console.log(all.length === 1 ? reportOne(all[0]) : reportMany(all));
  console.log('');
}
