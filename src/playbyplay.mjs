// The per-seed play-by-play (SPEC §10): every moment in order, plus the top 3 agents' notable hours, with what each agent
// did, said out loud, messaged (and to whom) and thought side by side, so lies are visible. Reads typed feed fields.
// Round 3 (R3.7): a cast list with style labels up top, the race for total watch time every 6 acting hours and at
// each day's end, failed turns as plain lines, one revenge note per agent per hour, and one line per fight when an
// hour has several. The final standings close the page, so the race carries the suspense.
import { styleLabels } from './style.mjs';

const QUIET = new Set(['move', 'rest', 'lay_low', 'shift']);
const RACE_EVERY = 6; // default race spacing when no cfg is given (cfg.report.raceEvery), plus one at each day's end
const pad = n => String(n).padStart(2, '0');
const num = n => Math.round(n).toLocaleString('en-US');

// "hothead bot", or the model's short name for an AI seat ("openai/gpt-6.1-sol" -> "gpt-6.1-sol").
const brainOf = agent => (agent.brain === 'ai' ? (agent.model ?? 'ai').split('/').pop() : `${agent.brain} bot`);

function who(agent) {
  return `${agent.name} (${agent.job}, ${brainOf(agent)})`;
}

// A cast line: "Juno: claude-sonnet-5-5 · chemist · reckless, snake". Viewers see every agent's style as labels,
// never the slider numbers. Seasons from before the rename call the clout slider flash.
function castLine(agent, cfg) {
  const s = agent.sliders ? { ...agent.sliders, clout: agent.sliders.clout ?? agent.sliders.flash } : null;
  const labels = styleLabels(s, cfg);
  return `${agent.name}: ${brainOf(agent)} · ${agent.job}${labels.length ? ` · ${labels.join(', ')}` : ''}`;
}

const STATE_WORDS = { jail: 'in jail', hospital: 'in hospital', partying: 'hosting a party', dead: 'dead' };

// What others did to this agent this hour, in plain words (typed `incoming` entries).
const INCOMING = {
  battle: (by, o) => `was challenged to a dance/rap battle (no violence) by ${by} and ${o === 'won' ? 'won' : 'lost'}`,
  fistfight: (by, o) => (o === 'won' ? `was jumped by ${by} and won the fight` : `was jumped by ${by} and lost the fight`),
  mug: (by, o) => (o === 'won' ? `fought off a mugging by ${by}` : `was mugged by ${by}`),
  steal_car: (by, o) => (o === 'won' ? `kept their car from ${by}` : `had their car stolen by ${by}`),
  shoot: (by, o) => (o === 'won' ? `was shot at by ${by}, who missed` : `was shot by ${by}`),
  drive_by: (by, o) => (o === 'won' ? `survived a drive-by from ${by}` : `was hit in a drive-by by ${by}`),
  kill_king: (by, o) => (o === 'won' ? `survived ${by}'s attempt on their life` : `was killed by ${by}`),
  call_out: (by, o) => `answered ${by}'s call-out and ${o === 'won' ? 'won' : 'lost'} the fight`,
  call_out_answered: (by, o) => `fought ${by}, who answered their call-out, and ${o === 'won' ? 'won' : 'lost'}`,
  call_out_made: by => `was called out by ${by}`,
};
// The incoming entries that are a contest's result; an hour with a fight card carries them there instead.
const CONTEST_INCOMING = new Set(['battle', 'fistfight', 'mug', 'steal_car', 'shoot', 'drive_by', 'kill_king', 'call_out', 'call_out_answered']);

// A targeted move that found nobody to hit, in plain words (the typed why, never the code itself).
const WENT_FOR = {
  mug: n => `went to mug ${n}`,
  steal_car: n => `went for ${n}'s car`,
  fistfight: n => `looked for a fight with ${n}`,
  shoot: n => `came to shoot ${n}`,
  drive_by: n => `rolled past for ${n}`,
  kill_king: n => `hunted the king, ${n},`,
  battle: n => `called a battle with ${n}`,
};
const GONE = {
  target_left_block: n => `${n} wasn't there`,
  target_in_hospital: n => `${n} was in hospital`,
  target_in_jail: n => `${n} was in jail`,
  target_dead: n => `${n} was dead`,
  no_such_target: () => 'nobody was there',
};

// "Day 2 14:00" for an acting hour t. Viewers never see t numbers (round 2).
export function dayLabel(setup, t) {
  const per = setup.perDay ?? 18;
  return `Day ${Math.floor(t / per) + 1} ${pad((setup.firstHour ?? 6) + (t % per))}:00`;
}

const SHOT_WORDS = { mug: 'mug', fistfight: 'fight', shoot: 'shoot', drive_by: 'drive by on', kill_king: 'kill', battle: 'battle', steal_car: 'steal the car of', call_out: 'call out', bounty: 'put a bounty on' };

// card: this hour has a fight card, so contest results stay off the agent lines (one fight per line, R3.7).
function did(e, names, line, card) {
  let text;
  if (!e.move) {
    text = STATE_WORDS[e.why] ?? STATE_WORDS[e.state] ?? 'sat the hour out';
    // Released or revived at the end of this hour: say so, rather than "dead" next to "back from the dead".
    const ev = line.events.find(x => (x.type === 'revive' || x.type === 'release') && x.agent === e.id);
    if (ev?.type === 'revive') text = 'came back from the dead, at home';
    else if (ev?.type === 'release') text = `${STATE_WORDS[ev.from] ?? 'away'}, out at the end of the hour`;
  }
  else {
    const tn = names[e.target] ?? 'them';
    // A failed turn (no reply, a cut-off or unreadable reply, a move off the menu) reads as a person standing around.
    // Why it failed stays in run.json and the report.
    if (e.failed) text = e.say || e.message ? 'stood around' : 'stood around, saying nothing';
    else if (!e.ok && GONE[e.why] && WENT_FOR[e.move]) text = `${WENT_FOR[e.move](tn)} but ${GONE[e.why](tn)}`;
    else text = e.result?.text ?? `went to ${e.move.replace(/_/g, ' ')}`;
  }
  const inc = (e.incoming ?? []).filter(x => !card || !CONTEST_INCOMING.has(x.move)).map(x => INCOMING[x.move]?.(names[x.by] ?? x.by, x.outcome)).filter(Boolean);
  return inc.length ? `${text}; ${inc.join('; ')}` : text;
}

const giveText = g => (g.cash ? `$${g.cash}` : `the ${g.item}`);
// "1 gun", "3 guns" ("product" has no plural).
const goods = (qty, good) => `${qty} ${qty === 1 ? good.replace(/s$/, '') : good}`;

function talkLine(e, names, setup) {
  const parts = [];
  if (e.say) parts.push(`says: "${e.say}"`);
  if (e.message) {
    const m = e.message;
    const extras = [
      m.cash ? `+$${m.cash}` : null,
      m.item ? `+${m.item}` : null,
      ...(m.keeps ?? []).map(k => `paying the ${giveText(k.give)} promised ${dayLabel(setup, k.made)}`),
      m.promise ? `promises ${giveText(m.promise.give)} by ${dayLabel(setup, m.promise.by)}` : null,
    ].filter(Boolean);
    parts.push(`messages ${names[m.to] ?? m.to}${extras.length ? ` (${extras.join(', ')})` : ''}: "${m.text}"`);
  }
  if (e.sell) parts.push(e.sell.to === 'npc' ? `sells ${goods(e.sell.qty, e.sell.good)} to the wholesaler for $${e.sell.cash}` : `lists ${goods(e.sell.qty, e.sell.good)} at $${e.sell.price}`);
  if (e.callShot) parts.push(`called their shot: will ${SHOT_WORDS[e.callShot.move] ?? e.callShot.move.replace(/_/g, ' ')} ${names[e.callShot.target] ?? e.callShot.target}`);
  if (e.thought) parts.push(`thinks: "${e.thought}"`);
  return parts.join('   ');
}

// A moment's line for the play-by-play, with typed extras the public line leaves out (an arrest's fine, the
// crown race's totals).
function momentLine(m, names) {
  if (m.type === 'arrest' && m.fine !== undefined) return `${m.line} (${m.fine > 0 ? `fined $${m.fine}` : 'broke, no fine'})`;
  if (m.type === 'lead_change' && m.leader) {
    return `${m.line} (total watch time: ${names[m.leader.id]} ${m.leader.viewerHours.toLocaleString('en-US')} viewer-hours, ${names[m.previous.id]} ${m.previous.viewerHours.toLocaleString('en-US')})`;
  }
  return m.line;
}

// One revenge note per agent per hour (R3.7): a win that pays revenge twice in an hour (a fight, then a mugging) is one
// note. Revenge on two different rivals in the same hour shares the note, built from the typed fields.
function oneRevengeEach(moments, names, setup) {
  const out = [];
  const byAgent = new Map();
  for (const m of moments) {
    if (m.type !== 'revenge') { out.push(m); continue; }
    const note = byAgent.get(m.agents[0]);
    if (!note) { const n = { ...m, all: [m] }; byAgent.set(m.agents[0], n); out.push(n); continue; }
    if (!note.all.some(x => x.agents[1] === m.agents[1])) note.all.push(m);
  }
  for (const n of byAgent.values()) {
    if (n.all.length < 2) continue;
    const on = n.all.map(x => `${names[x.agents[1]]}${x.for ? ` for the ${dayLabel(setup, x.for.hour)} ${x.for.kind}` : ''}`);
    n.line = `${names[n.agents[0]]} got revenge on ${on.join(' and on ')}`;
  }
  return out;
}

// The hour's contests, one agent against another, in resolution order (the typed events' order): fistfights, met
// call-outs, battles, muggings, car thefts, shootings, drive-bys and attempts on the king. Unknown events are skipped.
const ATTACKS = new Set(['mug', 'steal_car', 'shoot', 'drive_by', 'kill_king']);
function contests(line) {
  const out = [];
  for (const ev of line.events) {
    if (ev.type === 'fight') out.push({ move: ev.cause === 'call_out' ? 'call_out' : 'fistfight', a: ev.a, b: ev.b, winner: ev.winner, mutual: ev.mode === 'mutual' });
    else if (ev.type === 'battle') out.push({ move: 'battle', a: ev.a, b: ev.b, winner: ev.winner, mutual: !!ev.mutual });
    else if (ev.type === 'interaction' && ev.kind === 'hostile' && ATTACKS.has(ev.cause)) {
      const e = line.agents.find(x => x.id === ev.a);
      out.push({ move: ev.cause, a: ev.a, b: ev.b, winner: e?.ok ? ev.a : ev.b, result: e?.result ?? null });
    }
  }
  return out;
}

// Moments that already tell a contest's result: on a fight card the moment stands in the contest's place.
const CONTEST_MOMENTS = { call_out: ['callout_answered'], shoot: ['shooting'], drive_by: ['drive_by'], kill_king: ['king_killed', 'king_attempt'] };

// One contest in plain words, from typed fields only: who did what to whom, and who came out on top.
function contestText(c, names) {
  const A = names[c.a], B = names[c.b], W = names[c.winner];
  const won = c.winner === c.a;
  const r = c.result;
  switch (c.move) {
    case 'fistfight': return c.mutual ? `${A} and ${B} went looking for each other: ${W} won the fight` : `${A} jumped ${B}: ${W} won the fight`;
    case 'call_out': return `${B} answered ${A}'s call-out: ${W} won the fight`;
    case 'battle': return `${c.mutual ? `${A} and ${B} called a dance/rap battle on each other` : `${A} challenged ${B} to a dance/rap battle`} (no violence): ${W} won`;
    case 'mug': return won ? `${A} mugged ${B}${r?.cash ? ` for $${r.cash}` : r?.item ? ` for their ${r.item}` : ''}` : `${A} tried to mug ${B}: ${B} fought them off`;
    case 'steal_car': return won ? `${A} stole ${B}'s car` : `${A} tried to steal ${B}'s car: ${B} kept it`;
    case 'shoot': return won ? `${A} shot ${B}` : `${A} shot at ${B} and missed`;
    case 'drive_by': return won ? `${A} hit ${B} in a drive-by` : `${A}'s drive-by on ${B} missed`;
    case 'kill_king': return won ? `${A} killed the king, ${B}` : `${A} tried to kill the king, ${B}, and failed`;
    default: return `${A} took on ${B}: ${W} came out on top`;
  }
}

// Typed events worth a line of their own: promises as they're made, the first king.
function eventNotes(line, names, setup) {
  const out = [];
  for (const ev of line.events) {
    if (ev.type === 'promise_made') out.push(`- ✎ ${names[ev.from]} promised ${names[ev.to]} ${giveText(ev.give)} by ${dayLabel(setup, ev.by)}`);
    if (ev.type === 'first_king') out.push(`- ♛ ${names[ev.agent]} is the first king: the most total watch time so far`);
  }
  return out;
}

// " (in jail)" when an agent ends the hour away.
function state(line, id) {
  const e = line.agents.find(x => x.id === id);
  return e && ['jail', 'hospital', 'dead'].includes(e.state) ? ` (${STATE_WORDS[e.state]})` : '';
}

// The race (R3.7): the top 3 by total watch time so far, with each one's gap to the leader. Viewer-hours are scored
// as in audience.mjs: every agent's viewers at the end of each acting hour, added up. The feed's typed
// meters.viewerHours is used when present; otherwise the hourly viewers are summed, which can drift a few viewer-hours
// from the engine's unrounded total, so the season's last race line reads the final standings themselves.
// Ties: the standings' own order on the last line (they break ties on the unrounded totals), else current viewers,
// then id, as the standings do.
function raceLine(rows, names, label) {
  const top = rows.slice().sort((x, y) => y.vh - x.vh || (x.rank ?? 0) - (y.rank ?? 0) || y.now - x.now || (x.id < y.id ? -1 : 1)).slice(0, 3);
  const lead = top[0]?.vh ?? 0;
  const parts = top.map((r, i) => `${names[r.id]} ${num(r.vh)}${i === 0 ? '' : Math.round(lead) === Math.round(r.vh) ? ' (tied)' : ` (−${num(lead - r.vh)})`}`);
  return `**${label}:** ${parts.join(' · ')}`;
}

export function renderPlayByPlay({ feed, setup, standings, run, cfg }) {
  const agents = Object.fromEntries(setup.agents.map(a => [a.id, a]));
  const names = Object.fromEntries(setup.agents.map(a => [a.id, a.name]));
  const top3 = new Set(standings.slice(0, 3).map(s => s.id));
  const raceEvery = cfg?.report?.raceEvery ?? RACE_EVERY;
  const per = setup.perDay ?? 18;
  const firstHour = setup.firstHour ?? 6;
  const out = [];
  const w = standings[0];
  out.push(`# Play-by-play: seed ${setup.seed}`);
  out.push('');
  out.push(`${run ? `Run \`${run}\` · ` : ''}lineup \`${setup.lineup}\` · ${setup.days} days, ${setup.hours} acting hours`);
  out.push('');
  out.push('**Winner: most total watch time. The king is whoever leads that total right now.** Only the king can be killed.');
  out.push('');
  out.push('## Cast');
  out.push('');
  for (const a of setup.agents) out.push(`- ${castLine(a, cfg)}`);
  out.push('');
  out.push('Every moment in order, plus the notable hours of the three agents who finish on top. Each line: what they did, what they said out loud, what they messaged and to whom, and what they were thinking. When an hour has several fights, each gets its own ⚔ line, in the order they happened. **The race** shows the top 3 by total watch time (viewer-hours) so far.');
  const vh = Object.fromEntries(setup.agents.map(a => [a.id, 0]));
  let day = 0;
  feed.forEach((line, i) => {
    if (line.day !== day) {
      day = line.day;
      out.push('');
      out.push(`## Day ${day}`);
    }
    for (const e of line.agents) vh[e.id] = Number.isFinite(e.meters?.viewerHours) ? e.meters.viewerHours : (vh[e.id] ?? 0) + (e.meters?.viewers ?? 0);
    const inMoment = new Set(line.moments.flatMap(m => m.agents));
    const first = new Set(line.agents.filter(e => {
      if (inMoment.has(e.id)) return true;
      if (!top3.has(e.id)) return false;
      return (e.move && !QUIET.has(e.move)) || e.message || e.callShot || (!e.move && (e.say || e.message));
    }).map(e => e.id));
    // The other side of a shown agent's action shows too, so a battle's target sees it on its own line.
    const full = new Set(first);
    for (const e of line.agents) if ((e.incoming ?? []).some(x => full.has(x.by)) || (e.target && full.has(e.target) && full.has(e.id))) full.add(e.id);
    for (const e of line.agents) if (full.has(e.id) && e.target && line.agents.find(x => x.id === e.target)?.incoming?.some(x => x.by === e.id)) full.add(e.target);
    // A fight card when 2+ contests touch the agents shown: one line each, in resolution order, and the agent lines keep
    // only their own action's result, so no line says "won the fight" and "lost the fight" about the same hour. The
    // card names both sides, so the other sides don't get lines of their own. With one contest, nothing can clash.
    const fights = contests(line).filter(c => full.has(c.a) || full.has(c.b));
    const card = fights.length >= 2;
    const moments = oneRevengeEach(line.moments, names, setup);
    const used = new Set();
    const cardLines = card ? fights.map(c => {
      const m = moments.find(x => !used.has(x) && CONTEST_MOMENTS[c.move]?.includes(x.type) && x.agents[0] === c.a && x.agents[1] === c.b);
      if (m) { used.add(m); return `- ★ ${momentLine(m, names)}`; }
      return `- ⚔ ${contestText(c, names)}`;
    }) : [];
    const shown = line.agents.filter(e => (card ? first : full).has(e.id));
    // Every hour gets its header with the king, even a quiet one (round 2: no hour silently skipped).
    out.push('');
    const king = line.king ? state(line, line.king) : '';
    out.push(`**Day ${line.day} ${pad(line.hour)}:00**${line.king ? ` · king: ${names[line.king]}${king}` : ' · no king yet'}`);
    const notes = eventNotes(line, names, setup);
    // The ★ marks a moment; its type stays in the feed (round 3: no snake_case tags for viewers).
    for (const m of moments) if (!used.has(m)) out.push(`- ★ ${momentLine(m, names)}`);
    for (const n of notes) out.push(n);
    for (const c of cardLines) out.push(c);
    if (!line.moments.length && !notes.length && !shown.length && !cardLines.length) out.push('- a quiet hour');
    for (const e of shown) {
      const delta = e.delta ? ` (${e.delta > 0 ? '+' : ''}${e.delta} viewers)` : '';
      out.push('');
      const talk = talkLine(e, names, setup);
      // A trailing double space is a markdown line break, so the talk line sits under its action line.
      out.push(`Day ${line.day} ${pad(line.hour)}:00 · ${who(agents[e.id])} · ${did(e, names, line, card)}${delta}${talk ? '  ' : ''}`);
      if (talk) out.push(`  ${talk}`);
    }
    // The race: every RACE_EVERY acting hours of the day, at its end, and after the feed's last hour (from the final
    // standings, so the last race line and the standings agree).
    const idx = line.hour - firstHour;
    const last = i === feed.length - 1;
    const dayEnd = idx === per - 1;
    if (last || dayEnd || (idx + 1) % raceEvery === 0) {
      const now = Object.fromEntries(line.agents.map(e => [e.id, e.meters?.viewers ?? 0]));
      const rows = last
        ? standings.map((s, k) => ({ id: s.id, vh: s.viewerHours, rank: k, now: s.finalViewers ?? 0 }))
        : Object.keys(vh).map(id => ({ id, vh: vh[id], now: now[id] ?? 0 }));
      const label = dayEnd ? `The race after Day ${line.day}${last && feed.length >= setup.hours ? ' (final)' : ''}` : 'The race';
      out.push('');
      out.push(raceLine(rows, names, label));
    }
  });
  out.push('');
  out.push('## Final standings');
  out.push('');
  const second = standings[1];
  const margin = second ? `, ${num(w.viewerHours - second.viewerHours)} ahead of ${second.name}` : '';
  out.push(`**Winner: ${w.name}** (${w.job}, ${brainOf(agents[w.id])}) with ${num(w.viewerHours)} viewer-hours${margin}.`);
  out.push('');
  // Names, not seat ids: viewers know the agents by name.
  out.push('| Place | Name | Job | Brain | Viewer-hours | Final viewers | Peak | Cash |');
  out.push('|---|---|---|---|---|---|---|---|');
  for (const s of standings) {
    const a = agents[s.id];
    out.push(`| ${s.rank + 1} | ${a.name} | ${a.job} | ${a.brain === 'ai' ? a.model : a.brain} | ${s.viewerHours} | ${s.finalViewers} | ${s.peak} | $${s.cash} |`);
  }
  out.push('');
  return out.join('\n');
}
