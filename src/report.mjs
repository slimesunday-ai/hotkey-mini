// The report (SPEC §11): slime's three questions, the economy, and AI-only numbers, aggregated over seeds from the
// per-season stats. report.json carries every number; report.md renders it with the TUNING.md marks up front.
import { mean, round } from './stats.mjs';
import { LABELS } from './style.mjs';

const JOBS = ['smuggler', 'chemist', 'dealer', 'gunrunner'];
// Style labels in a fixed order (round 3); 'mid' is an agent with no label.
const STYLES = [...Object.values(LABELS).flatMap(l => [l.high, l.low]), 'mid'];
const pct = x => (x === null || x === undefined || Number.isNaN(x) ? 'n/a' : `${Math.round(x * 100)}%`);
const share = (xs, f) => (xs.length ? xs.filter(f).length / xs.length : 0);
const sumBy = (xs, f) => xs.reduce((s, x) => s + f(x), 0);

function meanObj(list) {
  const keys = new Set(list.flatMap(o => Object.keys(o)));
  return Object.fromEntries([...keys].sort().map(k => [k, round(mean(list.map(o => o[k] ?? 0)))]));
}

export function aggregate(stats, meta = {}) {
  const S = stats;
  const n = S[0]?.n ?? 0;
  const topK = Math.round(n / 3);
  // Top-third repeat: the seat that won seed s finishes in the top third of the other seeds.
  const repeats = [];
  for (const s of S) {
    const w = s.winner.id;
    for (const o of S) if (o !== s) repeats.push(o.ranks[w] < topK ? 1 : 0);
  }
  const turtleRanks = S.flatMap(s => s.agents.filter(a => a.brain === 'turtle').map(a => a.rank));
  const winsByJob = Object.fromEntries(JOBS.map(j => [j, share(S, s => s.winner.job === j)]));
  const brains = [...new Set(S.flatMap(s => s.agents.map(a => (a.brain === 'ai' ? `ai:${a.model}` : a.brain))))].sort();
  const winsByBrain = Object.fromEntries(brains.map(b => [b, round(share(S, s => (s.winner.brain === 'ai' ? `ai:${s.winner.model}` : s.winner.brain) === b))]));
  // Wins by style (round 3, R3.8): the share of seasons whose winner wears the label, against the label's share of seats.
  // An agent can wear several labels (reckless and snake), so the win shares don't sum to 1.
  const has = (a, l) => (a.styles ?? ['mid']).includes(l);
  const styles = STYLES.filter(l => S.some(s => s.agents.some(a => has(a, l))));
  const styleSeats = Object.fromEntries(styles.map(l => [l, round(mean(S.map(s => share(s.agents, a => has(a, l)))))]));
  const winsByStyle = Object.fromEntries(styles.map(l => [l, round(share(S, s => (s.winner.styles ?? ['mid']).includes(l)))]));
  const mixTotals = {};
  for (const s of S) for (const [k, v] of Object.entries(s.interesting.actionMix)) mixTotals[k] = (mixTotals[k] ?? 0) + v;
  const mixSum = Object.values(mixTotals).reduce((a, b) => a + b, 0);
  const actionMix = Object.fromEntries(Object.entries(mixTotals).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, round(v / mixSum)]));
  const topAction = Object.entries(actionMix)[0] ?? ['none', 0];
  const hours = S[0]?.hours ?? 0;
  const curve = Array.from({ length: hours }, (_, t) => round(mean(S.map(s => s.watch.audienceCurve[t]))));
  const watching = Array.from({ length: hours }, (_, t) => round(mean(S.map(s => s.watch.watchingCurve[t]))));
  const seatVH = {};
  for (const s of S) for (const a of s.agents) (seatVH[a.id] ??= { id: a.id, name: a.name, brains: new Set(), vh: [] }).vh.push(a.viewerHours), seatVH[a.id].brains.add(a.brain === 'ai' ? `ai:${a.model}` : a.brain);
  const brainVH = {};
  for (const s of S) for (const a of s.agents) (brainVH[a.brain === 'ai' ? `ai:${a.model}` : a.brain] ??= []).push(a.viewerHours);
  const jobVH = {};
  for (const s of S) for (const a of s.agents) (jobVH[a.job] ??= []).push(a.viewerHours);
  const cashDays = Array.from({ length: Math.max(...S.map(s => s.economy.cashByDay.length)) }, (_, d) => round(mean(S.map(s => s.economy.cashByDay[d] ?? 0))));
  const momentsByType = meanObj(S.map(s => s.interesting.momentsByType));
  const priceGoods = ['chems', 'parts', 'product', 'guns'];
  const boardPrices = Object.fromEntries(priceGoods.map(g => {
    const xs = S.map(s => s.economy.boardPrices[g]).filter(x => x !== undefined);
    return [g, xs.length ? round(mean(xs)) : null];
  }));
  const r = {
    meta,
    seeds: S.map(s => s.seed),
    seasons: S.length,
    interacting: {
      interactionsPerAgentPerDay: round(mean(S.map(s => s.interacting.perAgentPerDay))),
      involvedShare: round(mean(S.map(s => s.interacting.involvedShare))),
      uniquePairs: round(mean(S.map(s => s.interacting.uniquePairs))),
      possiblePairs: S[0]?.interacting.possiblePairs ?? 0,
      everyoneMet4: round(share(S, s => s.interacting.minPartners >= 4)),
      minPartners: round(mean(S.map(s => s.interacting.minPartners))),
      rivalries: round(mean(S.map(s => s.interacting.rivalries))),
      seasonsWith2Rivalries: round(share(S, s => s.interacting.rivalries >= 2)),
      alliances: round(mean(S.map(s => s.interacting.alliances))),
      kinds: meanObj(S.map(s => s.interacting.kinds)),
      messagesSent: round(mean(S.map(s => s.interacting.messagesSent))),
      messagesAnswered: round(mean(S.map(s => s.interacting.messagesAnswered))),
      promisesMade: round(mean(S.map(s => s.interacting.promises.made))),
      promisesKept: round(mean(S.map(s => s.interacting.promises.kept))),
      promisesBroken: round(mean(S.map(s => s.interacting.promises.broken))),
      tradesAgentAgent: round(mean(S.map(s => s.interacting.trades.agentAgent))),
      tradesBoughtFromNpc: round(mean(S.map(s => s.interacting.trades.boughtFromNpc))),
      tradesSoldToNpc: round(mean(S.map(s => s.interacting.trades.soldToNpc))),
    },
    interesting: {
      momentsPerSeason: round(mean(S.map(s => s.interesting.moments))),
      momentsByType,
      leadChanges: round(mean(S.map(s => s.interesting.leadChanges))),
      seasonsWithBetrayalAnd2LeadChanges: round(share(S, s => (s.interesting.momentsByType.promise_broken ?? 0) >= 1 && s.interesting.leadChanges >= 2)),
      seasonsWithBetrayal: round(share(S, s => (s.interesting.momentsByType.promise_broken ?? 0) >= 1)),
      seasonsWithKingAttempt: round(share(S, s => s.interesting.kingAttempts >= 1)),
      topThirdRepeat: round(mean(repeats)),
      turtle: turtleRanks.length ? { meanPlace: round(mean(turtleRanks) + 1), bottomThird: round(share(turtleRanks, x => x >= n - topK)), places: turtleRanks.map(x => x + 1) } : null,
      winsByJob: Object.fromEntries(Object.entries(winsByJob).map(([k, v]) => [k, round(v)])),
      winsByBrain,
      winsByStyle,
      styleSeats,
      actionMix,
      topAction: { id: topAction[0], share: topAction[1] },
      copycatTopShare: round(mean(S.map(s => s.interesting.copycatTopShare))),
      greedySimilarity: S.some(s => s.interesting.greedySimilarity !== null) ? round(mean(S.map(s => s.interesting.greedySimilarity).filter(x => x !== null))) : null,
    },
    watch: {
      minutesWatched: Math.round(mean(S.map(s => s.watch.minutesWatched))),
      viewerHours: Math.round(mean(S.map(s => s.watch.viewerHours))),
      startPool: S[0]?.watch.startPool ?? 0,
      audienceEnd: round(mean(S.map(s => s.watch.audienceEnd))),
      audienceEndRatio: round(mean(S.map(s => s.watch.audienceEnd / s.watch.startPool))),
      seasonsGrowing: round(share(S, s => s.watch.audienceEnd >= s.watch.startPool)),
      curve,
      watching,
      longestDull: round(mean(S.map(s => s.watch.longestDull))),
      longestDullMax: Math.max(...S.map(s => s.watch.longestDull)),
      seasonsDullAtMost3: round(share(S, s => s.watch.longestDull <= 3)),
      longestStrongDull: round(mean(S.map(s => s.watch.longestStrongDull))),
      longestStrongDullMax: Math.max(...S.map(s => s.watch.longestStrongDull)),
      seasonsStrongDullAtMost3: round(share(S, s => s.watch.longestStrongDull <= 3)),
      viewerHoursBySeat: Object.values(seatVH).map(x => ({ id: x.id, name: x.name, brains: [...x.brains].join('/'), viewerHours: Math.round(mean(x.vh)) })),
      viewerHoursByBrain: Object.fromEntries(Object.entries(brainVH).sort().map(([k, v]) => [k, Math.round(mean(v))])),
      viewerHoursByJob: Object.fromEntries(Object.entries(jobVH).sort().map(([k, v]) => [k, Math.round(mean(v))])),
    },
    economy: {
      chemsSmuggled: round(mean(S.map(s => s.economy.chemsSmuggled))),
      partsSmuggled: round(mean(S.map(s => s.economy.partsSmuggled))),
      productCooked: round(mean(S.map(s => s.economy.productCooked))),
      productDealt: round(mean(S.map(s => s.economy.productDealt))),
      dealCash: round(mean(S.map(s => s.economy.dealCash))),
      gunsBuilt: round(mean(S.map(s => s.economy.gunsBuilt))),
      gunsSoldAgent: round(mean(S.map(s => s.economy.gunsSoldAgent))),
      gunsSoldNpc: round(mean(S.map(s => s.economy.gunsSoldNpc))),
      cashByDay: cashDays,
      rentPaid: round(mean(S.map(s => s.economy.rentPaid))),
      evictions: round(mean(S.map(s => s.economy.evictions))),
      evictionsDay1: round(mean(S.map(s => s.economy.evictionsDay1))),
      rehoused: round(mean(S.map(s => s.economy.rehoused))),
      nightThefts: round(mean(S.map(s => s.economy.nightThefts))),
      gearBought: meanObj(S.map(s => s.economy.gear)),
      seasonsWithAGun: round(share(S, s => (s.economy.gear.gun ?? 0) + s.economy.gunsBuilt > 0)),
      arrests: round(mean(S.map(s => s.economy.arrests))),
      jailShare: round(mean(S.map(s => s.economy.jailHours / (s.hours * s.n)))),
      hospitalShare: round(mean(S.map(s => s.economy.hospitalHours / (s.hours * s.n)))),
      deaths: round(mean(S.map(s => s.economy.deaths))),
      boardPrices,
    },
  };
  // AI runs (R3.8): per seat and seed, what the agent did with its style, to read whether a setting changed its play.
  if (S.some(s => s.agents.some(a => a.brain === 'ai'))) {
    r.styleActs = S.flatMap(s => s.agents.map(a => ({
      seed: s.seed, id: a.id, name: a.name, brain: a.brain === 'ai' ? `ai:${a.model}` : a.brain, styles: a.styles ?? ['mid'], sliders: a.sliders ?? null,
      riskMoves: a.riskMoves ?? 0, cloutMoves: a.cloutMoves ?? 0, gearBought: a.gearBought ?? {}, promises: a.promises ?? { made: 0, kept: 0, broken: 0 },
    })));
  }
  r.marks = marks(r, meta, S);
  return r;
}

// TUNING.md's marks, each with its number and a pass/fail.
function marks(r, meta, seasons) {
  const I = r.interacting, X = r.interesting, W = r.watch;
  const betrayalShare = share(seasons, s => (s.interesting.momentsByType.promise_broken ?? 0) >= 1);
  const leadChangeShare = share(seasons, s => s.interesting.leadChanges >= 1);
  const seats = seasons[0]?.jobs ?? [];
  const jobs = [...new Set(seats)].map(job => ({
    job, seatShare: share(seats, j => j === job), winShare: share(seasons, s => s.winner.job === job),
  }));
  const within = ({ winShare, seatShare }) => {
    const ratio = winShare / seatShare;
    return ratio >= 0.5 - 1e-9 && ratio <= 1.5 + 1e-9;
  };
  const jobsOk = jobs.length > 0 && jobs.every(within);
  // Styles (round 3): judged on bot runs only; an AI run's few seeds can't say.
  const styles = Object.keys(X.styleSeats ?? {}).filter(l => X.styleSeats[l] > 0).map(l => ({ label: l, seatShare: X.styleSeats[l], winShare: X.winsByStyle[l] }));
  const botRun = !meta.mode || meta.mode === 'bots';
  const stylesOk = botRun ? styles.length > 0 && styles.every(within) : null;
  const list = [
    { q: 1, mark: 'At least 40% of acting hours involve another agent', value: pct(I.involvedShare), pass: I.involvedShare >= 0.4 },
    { q: 1, mark: 'Every agent interacts with at least 4 others per season', value: `${pct(I.everyoneMet4)} of seasons (mean fewest partners ${I.minPartners})`, pass: I.everyoneMet4 >= 0.999 },
    { q: 1, mark: 'At least 2 rivalries per season', value: `mean ${I.rivalries}; ${pct(I.seasonsWith2Rivalries)} of seasons`, pass: I.seasonsWith2Rivalries >= 0.999 },
    { q: 2, mark: 'At least 1 broken promise per season, and a lead change in most seasons', value: `broken promise in ${pct(betrayalShare)} of seasons; lead change in ${pct(leadChangeShare)} of seasons`, pass: betrayalShare >= 0.8 && leadChangeShare > 0.5 },
    { q: 2, mark: 'At least 1 king attempt in most seasons', value: `${pct(X.seasonsWithKingAttempt)} of seasons`, pass: X.seasonsWithKingAttempt > 0.5 },
    { q: 2, mark: 'Top agent finishes top third again in 50-70% of seeds', value: pct(X.topThirdRepeat), pass: X.topThirdRepeat >= 0.5 && X.topThirdRepeat <= 0.7 },
    { q: 2, mark: 'Turtle finishes in the bottom third in at least 80% of seeds', value: X.turtle ? `${pct(X.turtle.bottomThird)} (mean place ${X.turtle.meanPlace})` : 'no turtle in this lineup', pass: X.turtle ? X.turtle.bottomThird >= 0.8 : null },
    { q: 2, mark: 'Each job wins between 0.5x and 1.5x its share of seats', value: jobs.map(({ job, winShare, seatShare }) => `${job} ${pct(winShare)} (${pct(seatShare)})`).join(', '), pass: jobsOk },
    { q: 2, mark: 'Each style wins between 0.5x and 1.5x its share of seats', value: styles.map(({ label, winShare, seatShare }) => `${label} ${pct(winShare)} (${pct(seatShare)})`).join(', ') || 'no seats', pass: stylesOk },
    { q: 2, mark: 'Copycat: most common action takes 40% or less of acting hours (all-greedy lineup)', value: `top share per hour ${pct(X.copycatTopShare)}; overall top action ${X.topAction.id} ${pct(X.topAction.share)}`, pass: meta.lineup === 'all-greedy' ? X.copycatTopShare <= 0.4 : null },
    { q: 3, mark: 'The audience ends the season at least as big as it started', value: `end/start ${r.watch.audienceEndRatio}x; ${pct(W.seasonsGrowing)} of seasons`, pass: W.audienceEndRatio >= 1 },
    // Same title as v1 so tools/compare.mjs lines the mark up across runs; since round 1 it counts strong moments only.
    { q: 3, mark: 'Longest dull stretch is 3 acting hours or less', value: `strong moments only: mean ${W.longestStrongDull}, worst ${W.longestStrongDullMax}, ${pct(W.seasonsStrongDullAtMost3)} of seasons; any moment: mean ${W.longestDull}, worst ${W.longestDullMax}`, pass: W.seasonsStrongDullAtMost3 >= 0.999 },
  ];
  return list;
}

// AI seats vs their bot twins (same seed, same seat).
export function aiComparison(aiStats, twinStats) {
  const rows = [];
  for (const s of aiStats) {
    const twin = twinStats.find(x => x.seed === s.seed);
    if (!twin) continue;
    for (const a of s.agents.filter(x => x.brain === 'ai')) {
      const b = twin.agents.find(x => x.id === a.id);
      rows.push({ seed: s.seed, id: a.id, model: a.model, job: a.job, ai: { viewerHours: a.viewerHours, interactions: a.interactions, moments: a.moments, rank: a.rank + 1, failed: a.failed }, twin: { brain: b.brain, viewerHours: b.viewerHours, interactions: b.interactions, moments: b.moments, rank: b.rank + 1 } });
    }
  }
  return rows;
}

export function aiTotals(aiStats) {
  const out = {};
  for (const s of aiStats) for (const [m, v] of Object.entries(s.ai)) {
    const o = (out[m] ??= { calls: 0, failed: 0, in: 0, out: 0, cost: 0, capped: 0 });
    for (const k of Object.keys(o)) o[k] += v[k] ?? 0;
  }
  for (const o of Object.values(out)) o.cost = Math.round(o.cost * 10000) / 10000;
  return out;
}

const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
const fmtMix = mix => Object.entries(mix).map(([k, v]) => `${k} ${pct(v)}`).join(', ');

export function renderMarkdown(r, { links = [], ai = null } = {}) {
  const I = r.interacting, X = r.interesting, W = r.watch, E = r.economy;
  const meta = r.meta;
  const curvePts = (c, step) => c.filter((_, i) => i % step === 0 || i === c.length - 1).map((v, i, arr) => `${Math.round(v)}`).join(' → ');
  const lines = [];
  lines.push(`# hotkey mini report: ${meta.run ?? ''}`);
  lines.push('');
  lines.push(`${r.seasons} season${r.seasons === 1 ? '' : 's'} · lineup \`${meta.lineup}\` · seeds ${r.seeds[0]}–${r.seeds[r.seeds.length - 1]} · systems off: ${meta.off?.length ? meta.off.join(', ') : 'none'} · config ${meta.configHash}${meta.sets?.length ? ` · sets: ${meta.sets.join(', ')}` : ''}${meta.ai ? ` · AI: ${meta.ai}` : ''}`);
  lines.push('');
  lines.push('## Marks (TUNING.md)');
  lines.push('');
  lines.push(table(['Q', 'Mark', 'Value', 'Pass'], r.marks.map(m => [m.q, m.mark, m.value, m.pass === null ? 'n/a' : m.pass ? 'yes' : '**no**'])));
  lines.push('');
  lines.push('## 1. Are they interacting?');
  lines.push('');
  lines.push(table(['Metric', 'Per season (mean)'], [
    ['Interactions per agent per day', I.interactionsPerAgentPerDay],
    ['Share of acting hours that involve another agent', pct(I.involvedShare)],
    ['Unique pairs that interacted', `${I.uniquePairs} of ${I.possiblePairs}`],
    ['Fewest partners any agent had', I.minPartners],
    ['Rivalries (pairs with 3+ hostile interactions)', I.rivalries],
    ['Alliances (pairs with 2+ friendly interactions)', I.alliances],
    ['Interactions by kind', Object.entries(I.kinds).map(([k, v]) => `${k} ${v}`).join(', ')],
    ['Messages sent / answered', `${I.messagesSent} / ${I.messagesAnswered}`],
    ['Promises made / kept / broken', `${I.promisesMade} / ${I.promisesKept} / ${I.promisesBroken}`],
    ['Board trades agent-to-agent / bought from NPC / sold to NPC', `${I.tradesAgentAgent} / ${I.tradesBoughtFromNpc} / ${I.tradesSoldToNpc}`],
  ]));
  lines.push('');
  lines.push('## 2. Is anything interesting happening?');
  lines.push('');
  lines.push(table(['Metric', 'Value'], [
    ['Moments per season', X.momentsPerSeason],
    ['Lead changes per season', X.leadChanges],
    ['Seasons with a king attempt', pct(X.seasonsWithKingAttempt)],
    ['Seasons with a betrayal (broken promise)', pct(X.seasonsWithBetrayal)],
    ['Top-third repeat rate (target 50-70%)', pct(X.topThirdRepeat)],
    ['Turtle', X.turtle ? `mean place ${X.turtle.meanPlace} of ${r.watch.viewerHoursBySeat.length}; bottom third ${pct(X.turtle.bottomThird)}` : 'not in lineup'],
    ['Copycat: mean share of the most common action per hour', pct(X.copycatTopShare)],
    ['Copycat: mean pairwise similarity of greedy action mixes', X.greedySimilarity === null ? 'n/a (under 2 greedy seats)' : X.greedySimilarity],
  ]));
  lines.push('');
  lines.push('**Moments by type (per season):** ' + Object.entries(X.momentsByType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
  lines.push('');
  lines.push('**Wins by job:** ' + Object.entries(X.winsByJob).map(([k, v]) => `${k} ${pct(v)}`).join(', '));
  lines.push('');
  lines.push('**Wins by character type:** ' + Object.entries(X.winsByBrain).map(([k, v]) => `${k} ${pct(v)}`).join(', '));
  lines.push('');
  if (X.winsByStyle) {
    lines.push('**Wins by style** (share of seats in brackets; an agent can wear two labels, mid = none): ' + Object.entries(X.winsByStyle).map(([k, v]) => `${k} ${pct(v)} (${pct(X.styleSeats[k])})`).join(', '));
    lines.push('');
  }
  lines.push('**Action mix:** ' + fmtMix(X.actionMix));
  lines.push('');
  lines.push('## 3. Would people watch?');
  lines.push('');
  lines.push(table(['Metric', 'Value'], [
    ['Minutes watched per season (viewer-hours × 60)', W.minutesWatched.toLocaleString('en-US')],
    ['Audience pool: start → end', `${W.startPool} → ${W.audienceEnd} (${W.audienceEndRatio}x; growing in ${pct(W.seasonsGrowing)} of seasons)`],
    ['Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don\'t count)', `mean ${W.longestStrongDull}, worst ${W.longestStrongDullMax}`],
    ['Longest dull stretch (no moment of any kind)', `mean ${W.longestDull}, worst ${W.longestDullMax}`],
  ]));
  lines.push('');
  lines.push(`**Audience curve** (whole pool, every 6 acting hours): ${curvePts(W.curve, 6)}`);
  lines.push('');
  lines.push(`**Watching curve** (viewers assigned to agents, every 6 acting hours): ${curvePts(W.watching, 6)}`);
  lines.push('');
  lines.push('**Viewer-hours per agent (mean per season):**');
  lines.push('');
  lines.push(table(['Seat', 'Name', 'Brain', 'Viewer-hours'], W.viewerHoursBySeat.map(s => [s.id, s.name, s.brains, s.viewerHours])));
  lines.push('');
  lines.push('By brain: ' + Object.entries(W.viewerHoursByBrain).map(([k, v]) => `${k} ${v}`).join(', ') + '. By job: ' + Object.entries(W.viewerHoursByJob).map(([k, v]) => `${k} ${v}`).join(', ') + '.');
  lines.push('');
  if (links.length) {
    lines.push('**Play-by-plays:** ' + links.map(l => `[seed ${l.seed}](${l.path})`).join(' · '));
    lines.push('');
  }
  lines.push('## Economy health');
  lines.push('');
  lines.push(table(['Metric', 'Per season (mean)'], [
    ['Chain flow', `chems smuggled ${E.chemsSmuggled}, parts smuggled ${E.partsSmuggled}, product cooked ${E.productCooked}, product dealt ${E.productDealt} ($${E.dealCash}), guns built ${E.gunsBuilt}, guns sold to agents ${E.gunsSoldAgent} / to NPC ${E.gunsSoldNpc}`],
    ['Mean cash at the end of each day', E.cashByDay.map((c, i) => `day ${i + 1}: $${Math.round(c)}`).join(', ')],
    ['Rent paid / evictions (day 1) / re-housed / night thefts', `${E.rentPaid} / ${E.evictions} (${E.evictionsDay1}) / ${E.rehoused} / ${E.nightThefts}`],
    ['Gear bought or taken', Object.entries(E.gearBought).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'],
    ['Seasons where a gun entered play', pct(E.seasonsWithAGun)],
    ['Arrests / share of agent-hours in jail / in hospital / deaths', `${E.arrests} / ${pct(E.jailShare)} / ${pct(E.hospitalShare)} / ${E.deaths}`],
    ['Board prices (agent-to-agent mean)', Object.entries(E.boardPrices).map(([k, v]) => `${k} ${v === null ? 'no trades' : `$${v}`}`).join(', ')],
  ]));
  lines.push('');
  if (ai) {
    lines.push('## AI runs');
    lines.push('');
    lines.push(table(['Model', 'Calls', 'Failed', 'Tokens in', 'Tokens out', 'Cost', 'Capped turns'], Object.entries(ai.totals).map(([m, v]) => [m, v.calls, v.failed, v.in, v.out, `$${v.cost}`, v.capped])));
    lines.push('');
    lines.push(`Run ${ai.capped ? '**capped**: the spend cap was reached and greedy bots finished the season' : 'not capped'}. Spend: $${ai.spend?.cost ?? 0} over ${ai.spend?.calls ?? 0} calls.`);
    lines.push('');
    lines.push('**Each AI seat vs its bot-twin seat (same seed):**');
    lines.push('');
    lines.push(table(['Seed', 'Seat', 'Model', 'Job', 'AI viewer-h', 'Twin viewer-h', 'AI interactions', 'Twin interactions', 'AI moments', 'Twin moments', 'AI place', 'Twin place', 'AI failed turns'],
      ai.compare.map(c => [c.seed, c.id, c.model, c.job, c.ai.viewerHours, c.twin.viewerHours, c.ai.interactions, c.twin.interactions, c.ai.moments, c.twin.moments, c.ai.rank, c.twin.rank, c.ai.failed])));
    lines.push('');
  }
  if (r.styleActs) {
    lines.push('**Styles in play** (did the owner\'s setting change what the agent did?):');
    lines.push('');
    const sl = x => (x ? ['risk', 'clout', 'loyalty'].map(k => (x[k] ?? 0).toFixed(2)).join(' / ') : 'n/a');
    lines.push(table(['Seed', 'Seat', 'Name', 'Brain', 'Style', 'Risk / clout / loyalty', 'Risk moves', 'Clout moves', 'Gear bought', 'Promises made / kept / broken'],
      r.styleActs.map(x => [x.seed, x.id, x.name, x.brain, x.styles.join(', '), sl(x.sliders), x.riskMoves, x.cloutMoves, Object.entries(x.gearBought).map(([k, v]) => `${k} ${v}`).join(', ') || 'none', `${x.promises.made} / ${x.promises.kept} / ${x.promises.broken}`])));
    lines.push('');
  }
  return lines.join('\n') + '\n';
}
