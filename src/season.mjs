// The season loop (SPEC §6, §10): views -> replies (bots synchronously, AI seats in parallel through createAiSeats)
// -> runHour -> day end -> one typed feed line per acting hour.
import { createSeason, clockOf, totalViewers, actingHoursPerDay } from './state.mjs';
import { buildBrief, buildViews } from './view.mjs';
import { runHour, dayEnd, seasonEnd } from './resolve.mjs';
import { decideBot } from './bots.mjs';
import { rankAgents } from './audience.mjs';
import { styleLabels } from './style.mjs';

// The season loop is the single owner of time: it sets state.t, runs the hour, then finishHour() runs the day end
// (rent, heat decay, sleep) after each day's last hour and advances the clock. Bots and AI seats share this loop.
// ai: null, or { seats: createAiSeats(...) result, maxCost }. AI seats are the lineup's 'ai' brains. Once the AI layer
// halts (spend cap, no credit, refused key), its seats are played by their bot twins for the rest of the run.
// maxHours: stop early (the dry run plays 1 acting hour).
export async function runSeason({ seed, config, lineup, ai = null, onLine = null, maxHours = Infinity }) {
  const cfg = config;
  const state = createSeason({ seed, config: cfg, lineup });
  const brief = buildBrief(cfg);
  const aiIds = state.ids.filter(id => state.agents[id].brain === 'ai');
  const aiTurns = [];
  let halted = null;
  const feed = [];
  const per = actingHoursPerDay(cfg);
  const twin = id => state.agents[id].twinBrain ?? 'greedy';
  while (state.t < state.seasonLength && feed.length < maxHours) {
    const t = state.t;
    const { views, hashes } = buildViews(state, brief);
    const replies = {};
    if (ai && !halted && ai.seats.halted) halted = ai.seats.halted;
    const useAi = ai && aiIds.length && !halted;
    for (const id of state.ids) {
      const v = views[id];
      if (!v) continue;
      const a = state.agents[id];
      if (a.brain === 'ai' && useAi) continue;
      const brain = a.brain === 'ai' ? twin(id) : a.brain;
      replies[id] = { ok: true, reply: decideBot(v, { brain, cfg, seed }), by: a.brain === 'ai' ? 'bot-halted' : 'bot' };
    }
    if (useAi) {
      const batch = aiIds.filter(id => views[id]).map(id => ({ agentId: id, view: views[id] }));
      if (batch.length) {
        const res = await ai.seats.decide(batch);
        for (const { agentId, view } of batch) {
          const r = res?.get?.(agentId) ?? null;
          const stopped = r && !r.ok && /^(capped|halted)/.test(String(r.why ?? ''));
          if (stopped) replies[agentId] = { ok: true, reply: decideBot(view, { brain: twin(agentId), cfg, seed }), by: 'bot-halted' };
          else replies[agentId] = r ? { ...r, by: 'ai' } : { ok: false, why: 'no reply from the AI layer', by: 'ai' };
          aiTurns.push({
            t, agentId, model: state.agents[agentId].model, ok: !!r?.ok, why: r?.why ?? (r ? null : 'no reply'),
            usage: r?.usage ?? null, ms: r?.ms ?? null, tries: r?.tries ?? null, capped: !!stopped,
          });
        }
        if (ai.seats.halted) halted = ai.seats.halted;
        const spend = ai.seats.spend;
        if (!halted && ai.maxCost && spend && spend.cost >= ai.maxCost) halted = { kind: 'cap', why: 'spend reached maxCost' };
      }
    }
    const line = runHour(state, replies, views, hashes);
    for (const e of line.agents) {
      const rep = replies[e.id];
      if (rep) e.by = rep.by;
    }
    finishHour(state, line);
    feed.push(line);
    if (onLine) onLine(line);
  }
  const ranked = rankByScore(state);
  const standings = ranked.map((id, i) => {
    const a = state.agents[id];
    return { id, name: a.name, job: a.job, brain: a.brain, model: a.model, rank: i, viewerHours: Math.round(a.viewerHours), finalViewers: Math.round(totalViewers(a)), peak: Math.round(a.peakViewers), cash: Math.round(a.cash) };
  });
  const setup = {
    seed,
    lineup: state.lineupName,
    hours: state.seasonLength,
    days: cfg.season.days,
    perDay: per,
    firstHour: cfg.season.firstHour,
    agents: state.ids.map(id => {
      const a = state.agents[id];
      return { id, name: a.name, job: a.job, brain: a.brain, twinBrain: a.twinBrain, model: a.model, persona: a.persona, sliders: a.sliders, labels: styleLabels(a.sliders, cfg) };
    }),
    startPools: state.startPools,
  };
  return { state, feed, setup, standings, aiTurns, capped: !!halted, halted };
}

// After an hour: the day end after each day's last acting hour (not after the season's last), the season end, and
// the clock advances. The only place state.t moves.
export function finishHour(state, line) {
  const cfg = state.cfg;
  const clock = clockOf(cfg, state.t);
  if (clock.hour === cfg.season.lastHour && clock.day < cfg.season.days) dayEnd(state, line);
  if (state.t === state.seasonLength - 1) seasonEnd(state, line);
  state.t += 1;
}

export function rankByScore(state) {
  const mode = state.cfg.scoring.win;
  const score = a => (mode === 'final' ? totalViewers(a) : mode === 'peak' ? a.peakViewers : a.viewerHours);
  return rankAgents(state).sort((x, y) => score(state.agents[y]) - score(state.agents[x]) || totalViewers(state.agents[y]) - totalViewers(state.agents[x]) || (x < y ? -1 : 1));
}
