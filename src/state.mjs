// Season state (SPEC §2-§3): agents, cops, audience pools, the board, and every open public record.
// Time: `t` counts acting hours from 0 (day 1 06:00) to days*18-1 (last day 23:00). Every duration in the game
// (jail, hospital, call-outs, promises, crates, boredom) counts acting hours, so nothing expires during sleep.
import { rng, shuffle } from './rng.mjs';
import { GROUPS, GOODS } from './config.mjs';
import { BRAINS } from './lineups.mjs';

export const actingHoursPerDay = cfg => cfg.season.lastHour - cfg.season.firstHour + 1;
export const seasonHours = cfg => cfg.season.days * actingHoursPerDay(cfg);
export const clockOf = (cfg, t) => {
  const per = actingHoursPerDay(cfg);
  return { day: Math.floor(t / per) + 1, hour: cfg.season.firstHour + (t % per) };
};
// "Day 2 14:00" for an acting hour t: what viewers (and, since round 3, agents) read.
export const clockLabel = (cfg, t) => {
  const c = clockOf(cfg, t);
  return `Day ${c.day} ${String(c.hour).padStart(2, '0')}:00`;
};
export const zeroGroups = () => Object.fromEntries(GROUPS.map(g => [g, 0]));
export const totalViewers = a => GROUPS.reduce((s, g) => s + a.viewers[g], 0);
export const agentId = i => `a${String(i + 1).padStart(2, '0')}`;

const clamp01 = x => Math.max(0, Math.min(1, x));

export function createSeason({ seed, config, lineup }) {
  const cfg = config;
  const seats = lineup.seats;
  const count = seats.length;
  const jobPool = Array.from({ length: count }, (_, i) => cfg.agents.jobs[i % cfg.agents.jobs.length]);
  // Seats with a fixed job keep it; the rest get the remaining jobs in a seeded shuffle.
  const fixed = seats.map(s => s.job ?? null);
  const remaining = jobPool.slice();
  for (const j of fixed) if (j) { const k = remaining.indexOf(j); if (k >= 0) remaining.splice(k, 1); }
  const shuffled = shuffle(rng(seed, 'jobs'), remaining);
  let si = 0;
  const agents = {};
  const ids = [];
  seats.forEach((seat, i) => {
    const id = agentId(i);
    ids.push(id);
    const brainKey = seat.brain === 'ai' ? seat.twinBrain ?? 'greedy' : seat.brain;
    const preset = BRAINS[brainKey] ?? BRAINS.greedy;
    const r = rng(seed, 'sliders', id);
    const j = cfg.agents.sliderJitter;
    const sliders = seat.sliders ?? {
      risk: round2(clamp01(preset.sliders.risk + (r() * 2 - 1) * j)),
      clout: round2(clamp01(preset.sliders.clout + (r() * 2 - 1) * j)),
      loyalty: round2(clamp01(preset.sliders.loyalty + (r() * 2 - 1) * j)),
    };
    agents[id] = {
      id,
      name: seat.name ?? cfg.agents.names[i % cfg.agents.names.length] ?? id,
      persona: seat.persona ?? preset.persona,
      job: fixed[i] ?? shuffled[si++],
      brain: seat.brain,
      twinBrain: seat.twinBrain ?? null,
      model: seat.model ?? null,
      sliders,
      block: 'home',
      energy: cfg.agents.startEnergy,
      cash: cfg.agents.startCash,
      stars: 0,
      state: 'free', // free | hospital | dead | jail | partying
      until: null, // the hour a timed state ends (released at the end of that hour)
      evicted: false,
      backRent: 0,
      stock: Object.fromEntries(GOODS.map(g => [g, 0])),
      gear: { car: 0, armor: 0, chain: 0, grill: 0, fit: 0 },
      viewers: zeroGroups(),
      viewerHours: 0,
      peakViewers: 0,
      scouting: 0,
      lastLayLow: -99,
      gunSeenUntil: -1,
      flashingUntil: -1,
      history: [], // [{ t, move }] actions that resolved, for boredom
      grudges: [], // [{ who, what, hour }]
      results: [], // [{ hour, move, ok, text }]
      conversations: {}, // other id -> [{ hour, from, text }]
      inbox: [], // messages delivered at the start of this hour
      crimeToday: false,
      last: null, // { move, ok, result, why }
      lastMove: null,
      lastSay: '',
      lastSayBlock: null,
      fansLastHour: zeroGroups(),
      alerts: [], // round 3 (R3.2): last hour's acts against this agent, plain lines for the next view
      trustedBy: {}, // round 3: other id -> { n, cash, last: { kind, hour, cash, item, give } }, friendly acts toward this agent
    };
  });
  const pools = { ...cfg.audience.pools };
  return {
    seed,
    cfg,
    lineupName: lineup.name ?? 'custom',
    t: 0,
    seasonLength: seasonHours(cfg),
    ids,
    agents,
    cops: Array.from({ length: cfg.cops.count }, (_, i) => ({ id: `c${i + 1}`, block: cfg.cops.start })),
    pools,
    startPools: { ...pools },
    unassigned: { ...pools },
    board: { listings: [], nextId: 1 },
    wholesaleSold: Object.fromEntries(GOODS.map(g => [g, 0])),
    bounties: [],
    callOuts: [],
    promises: [],
    outbox: [], // messages sent this hour, delivered next hour
    crate: null,
    nextCrate: cfg.crate.every + Math.floor(rng(seed, 'crate', 'first')() * (2 * cfg.crate.jitter + 1)) - cfg.crate.jitter,
    parties: [],
    heatLog: [], // [{ t, block, stars }] stars added, for cop movement
    callShots: [], // [{ agent, move, target, until, announced }]
    king: null,
    lastMoves: {}, // id -> move last hour (novelty and crowding forecasts)
    dealtLastHour: {}, // block -> count of agents who dealt there last hour
    servedLastHour: zeroGroups(),
    headlines: [],
    rankHistory: [], // per hour: { id: rank } (0 = top)
    lastComeback: {},
    seq: { promise: 1, bounty: 1, callOut: 1 },
    feed: [],
  };
}

export const round2 = x => Math.round(x * 100) / 100;
export const round1 = x => Math.round(x * 10) / 10;

// Agents physically on a block and able to be met there (free or hosting a party).
export const presentOn = (state, block) => state.ids.filter(id => {
  const a = state.agents[id];
  return a.block === block && (a.state === 'free' || a.state === 'partying');
});

export const hasGun = a => a.stock.guns > 0;
export const hasCar = a => a.gear.car > 0;
export const hasArmor = a => a.gear.armor > 0;
export const flashValueOf = (cfg, a) => (cfg.systems.flash ? ['chain', 'grill', 'fit'].reduce((s, f) => s + (a.gear[f] > 0 ? cfg.flashValue[f] : 0), 0) : 0);
export const copsOn = (state, block) => state.cops.filter(c => c.block === block).length;
export const partyOn = (state, block) => state.parties.find(p => p.block === block && p.active) ?? null;
