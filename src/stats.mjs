// Per-season numbers for the report (SPEC §11), computed only from typed feed fields and the season setup —
// never from display text.
import { styleLabels, RISK_MOVES, CLOUT_MOVES } from './style.mjs';

const HOSTILE_KINDS = new Set(['hostile']);
const FRIENDLY_KINDS = new Set(['friendly']);
const KING_MOMENTS = new Set(['king_killed', 'king_attempt']);

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const RISK = new Set(RISK_MOVES);
const CLOUT = new Set(CLOUT_MOVES);
// An agent's style labels (round 3); an agent with none counts as 'mid'.
export const styleOf = (a, cfg) => {
  const l = a.labels ?? styleLabels(a.sliders, cfg);
  return l.length ? l.slice() : ['mid'];
};

export function seasonStats({ feed, setup, standings, cfg, aiTurns = [] }) {
  const ids = setup.agents.map(a => a.id);
  const n = ids.length;
  const days = setup.days;
  const agentInfo = Object.fromEntries(setup.agents.map(a => [a.id, a]));
  const rankOf = Object.fromEntries(standings.map(s => [s.id, s.rank]));

  // Interactions.
  const pairs = {};
  const perAgent = Object.fromEntries(ids.map(id => [id, { interactions: 0, partners: new Set(), acting: 0, involved: 0, moments: 0, failed: 0, actions: {}, riskMoves: 0, cloutMoves: 0, gear: {}, promises: { made: 0, kept: 0, broken: 0 } }]));
  const kinds = {};
  let interactionCount = 0;
  const msgs = [];
  const promises = { made: 0, kept: 0, broken: 0 };
  const trades = { agentAgent: 0, boughtFromNpc: 0, soldToNpc: 0, prices: {}, npcPrices: {} };
  const moments = {};
  let leadChanges = 0;
  let kingAttempts = 0;
  const actionMix = {};
  const hourTopShares = [];
  const audienceCurve = [];
  const watchingCurve = [];
  const econ = { chemsSmuggled: 0, partsSmuggled: 0, productCooked: 0, productDealt: 0, dealCash: 0, gunsBuilt: 0, gunsSoldAgent: 0, gunsSoldNpc: 0, evictions: 0, evictionsDay1: 0, rehoused: 0, rentPaid: 0, nightThefts: 0, gear: {}, cashByDay: [], arrests: 0, jailHours: 0, hospitalHours: 0, deaths: 0 };
  let dull = 0, longestDull = 0, strongDull = 0, longestStrongDull = 0;
  const dullRuns = [];
  const weak = new Set(cfg.report.weakMoments ?? []);
  for (const line of feed) {
    // Actions and acting hours.
    const moves = {};
    let acting = 0;
    for (const e of line.agents) {
      const pa = perAgent[e.id];
      if (e.state === 'jail') econ.jailHours++;
      if (e.state === 'hospital') econ.hospitalHours++;
      if (!e.acting) continue;
      acting++;
      pa.acting++;
      if (e.involved) pa.involved++;
      if (e.failed) pa.failed++;
      if (e.move) {
        moves[e.move] = (moves[e.move] ?? 0) + 1;
        actionMix[e.move] = (actionMix[e.move] ?? 0) + 1;
        pa.actions[e.move] = (pa.actions[e.move] ?? 0) + 1;
        if (RISK.has(e.move)) pa.riskMoves++;
        if (CLOUT.has(e.move)) pa.cloutMoves++;
      }
    }
    if (acting) hourTopShares.push(Math.max(...Object.values(moves)) / acting);
    for (const ev of line.events) {
      switch (ev.type) {
        case 'interaction': {
          if (!perAgent[ev.a] || !perAgent[ev.b]) break;
          interactionCount++;
          kinds[ev.kind] = (kinds[ev.kind] ?? 0) + 1;
          perAgent[ev.a].interactions++;
          perAgent[ev.b].interactions++;
          perAgent[ev.a].partners.add(ev.b);
          perAgent[ev.b].partners.add(ev.a);
          const k = pairKey(ev.a, ev.b);
          const p = (pairs[k] ??= { hostile: 0, friendly: 0, other: 0 });
          if (HOSTILE_KINDS.has(ev.kind)) p.hostile++;
          else if (FRIENDLY_KINDS.has(ev.kind)) p.friendly++;
          else p.other++;
          break;
        }
        case 'message': msgs.push({ from: ev.from, to: ev.to, t: line.t }); break;
        case 'promise_made': promises.made++; if (perAgent[ev.from]) perAgent[ev.from].promises.made++; break;
        case 'promise_kept': promises.kept++; if (perAgent[ev.from]) perAgent[ev.from].promises.kept++; break;
        case 'promise_broken': promises.broken++; if (perAgent[ev.from]) perAgent[ev.from].promises.broken++; break;
        case 'trade':
          if (ev.buyer !== 'npc' && ev.seller !== 'npc') {
            trades.agentAgent++;
            (trades.prices[ev.good] ??= []).push(ev.price);
            if (ev.good === 'guns') econ.gunsSoldAgent++;
          } else if (ev.seller === 'npc') {
            trades.boughtFromNpc++;
            (trades.npcPrices[ev.good] ??= []).push(ev.price);
          } else {
            trades.soldToNpc++;
            if (ev.good === 'guns') econ.gunsSoldNpc++;
          }
          break;
        case 'produce':
          if (ev.from === 'run') ev.good === 'chems' ? (econ.chemsSmuggled += ev.qty) : (econ.partsSmuggled += ev.qty);
          if (ev.from === 'cook') econ.productCooked += ev.qty;
          if (ev.from === 'build') econ.gunsBuilt += ev.qty;
          break;
        case 'deal': econ.productDealt += ev.qty; econ.dealCash += ev.cash; break;
        case 'eviction': econ.evictions++; if (ev.day === 1) econ.evictionsDay1++; break;
        case 'rehoused': econ.rehoused++; break;
        case 'rent_paid': econ.rentPaid++; break;
        case 'night_theft': econ.nightThefts++; break;
        case 'gear':
          econ.gear[ev.item] = (econ.gear[ev.item] ?? 0) + 1;
          // Bought (shop, supplier or another agent), not boosted off the street.
          if (ev.from !== 'street' && perAgent[ev.agent]) perAgent[ev.agent].gear[ev.item] = (perAgent[ev.agent].gear[ev.item] ?? 0) + 1;
          break;
        case 'arrest': econ.arrests++; break;
        case 'death': econ.deaths++; break;
        default: break;
      }
    }
    for (const m of line.moments) {
      moments[m.type] = (moments[m.type] ?? 0) + 1;
      for (const id of m.agents) if (perAgent[id]) perAgent[id].moments++;
      if (m.type === 'lead_change') leadChanges++;
      if (KING_MOMENTS.has(m.type)) kingAttempts++;
    }
    if (line.moments.length === 0) { dull++; longestDull = Math.max(longestDull, dull); }
    else { if (dull) dullRuns.push(dull); dull = 0; }
    // The strong measure counts only strong moments (no lead changes, comebacks or ducked call-outs).
    if (!line.moments.some(m => !weak.has(m.type))) { strongDull++; longestStrongDull = Math.max(longestStrongDull, strongDull); }
    else strongDull = 0;
    const pool = Object.values(line.audience.pools).reduce((s, x) => s + x, 0);
    const unassigned = Object.values(line.audience.unassigned).reduce((s, x) => s + x, 0);
    audienceCurve.push(round(pool));
    watchingCurve.push(round(pool - unassigned));
    if (line.dayEnd || line.t === feed.length - 1) econ.cashByDay.push(round(line.agents.reduce((s, e) => s + e.meters.cash, 0) / n));
  }
  if (dull) dullRuns.push(dull);
  // Messages answered: the recipient wrote back within the window after delivery.
  const W = cfg.messages.answeredWithin;
  let answered = 0;
  for (const m of msgs) if (msgs.some(x => x.from === m.to && x.to === m.from && x.t > m.t && x.t <= m.t + W)) answered++;
  const pairList = Object.entries(pairs);
  const rivalries = pairList.filter(([, p]) => p.hostile >= cfg.report.rivalryHostile).length;
  const alliances = pairList.filter(([, p]) => p.friendly >= cfg.report.allianceFriendly).length;
  const actingTotal = ids.reduce((s, id) => s + perAgent[id].acting, 0);
  const involvedTotal = ids.reduce((s, id) => s + perAgent[id].involved, 0);
  // Greedy (and AI) seats' action mixes: mean pairwise cosine similarity.
  const greedyIds = ids.filter(id => agentInfo[id].brain === 'greedy');
  const sims = [];
  for (let i = 0; i < greedyIds.length; i++) for (let j = i + 1; j < greedyIds.length; j++) sims.push(cosine(perAgent[greedyIds[i]].actions, perAgent[greedyIds[j]].actions));
  const winner = standings[0];
  const totalVH = standings.reduce((s, x) => s + x.viewerHours, 0);
  // AI turns.
  const ai = {};
  for (const tr of aiTurns) {
    const m = (ai[tr.model] ??= { calls: 0, failed: 0, in: 0, out: 0, cost: 0, capped: 0 });
    m.calls++;
    if (!tr.ok) m.failed++;
    if (tr.capped) m.capped++;
    m.in += tr.usage?.in ?? 0;
    m.out += tr.usage?.out ?? 0;
    m.cost += tr.usage?.cost ?? 0;
  }
  return {
    seed: setup.seed,
    lineup: setup.lineup,
    jobs: [...cfg.agents.jobs],
    n,
    days,
    hours: feed.length,
    winner: { id: winner.id, job: winner.job, brain: winner.brain, model: winner.model, styles: styleOf(agentInfo[winner.id], cfg) },
    ranks: rankOf,
    agents: ids.map(id => {
      const s = standings.find(x => x.id === id);
      const pa = perAgent[id];
      return {
        id, name: agentInfo[id].name, job: agentInfo[id].job, brain: agentInfo[id].brain, model: agentInfo[id].model,
        rank: s.rank, viewerHours: s.viewerHours, finalViewers: s.finalViewers, peak: s.peak, cash: s.cash,
        interactions: pa.interactions, partners: pa.partners.size, acting: pa.acting, involved: pa.involved,
        moments: pa.moments, failed: pa.failed, actions: pa.actions,
        // Round 3 (R3.8): what the owner's setting did to the agent's play.
        sliders: agentInfo[id].sliders ?? null, styles: styleOf(agentInfo[id], cfg),
        riskMoves: pa.riskMoves, cloutMoves: pa.cloutMoves, gearBought: pa.gear, promises: pa.promises,
      };
    }),
    interacting: {
      interactions: interactionCount,
      perAgentPerDay: round((2 * interactionCount) / (n * days)),
      kinds,
      involvedShare: round(actingTotal ? involvedTotal / actingTotal : 0),
      uniquePairs: pairList.length,
      possiblePairs: (n * (n - 1)) / 2,
      rivalries,
      alliances,
      minPartners: Math.min(...ids.map(id => perAgent[id].partners.size)),
      messagesSent: msgs.length,
      messagesAnswered: answered,
      promises,
      trades: { agentAgent: trades.agentAgent, boughtFromNpc: trades.boughtFromNpc, soldToNpc: trades.soldToNpc },
    },
    interesting: {
      moments: Object.values(moments).reduce((s, x) => s + x, 0),
      momentsByType: moments,
      leadChanges,
      kingAttempts,
      actionMix,
      copycatTopShare: round(mean(hourTopShares)),
      greedySimilarity: sims.length ? round(mean(sims)) : null,
    },
    watch: {
      viewerHours: totalVH,
      minutesWatched: totalVH * 60,
      audienceStart: audienceCurve[0],
      audienceEnd: audienceCurve[audienceCurve.length - 1],
      startPool: Object.values(setup.startPools).reduce((s, x) => s + x, 0),
      audienceCurve,
      watchingCurve,
      longestDull,
      longestStrongDull,
      meanDullRun: round(mean(dullRuns)),
    },
    economy: {
      ...econ,
      boardPrices: Object.fromEntries(Object.entries(trades.prices).map(([g, ps]) => [g, round(mean(ps))])),
      npcPrices: Object.fromEntries(Object.entries(trades.npcPrices).map(([g, ps]) => [g, round(mean(ps))])),
    },
    ai,
  };
}

function cosine(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, na = 0, nb = 0;
  for (const k of keys) {
    const x = a[k] ?? 0, y = b[k] ?? 0;
    dot += x * y; na += x * x; nb += y * y;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export const mean = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
export const round = x => Math.round(x * 100) / 100;
