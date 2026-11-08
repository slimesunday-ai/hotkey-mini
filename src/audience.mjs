// The fake audience (SPEC §5): fan points per outcome with multipliers, viewer steals, the hourly churn/browse/
// reallocation/pool-size update, and the king. Viewers are conserved except through pool growth and shrinkage.
import { GROUPS } from './config.mjs';
import { totalViewers, zeroGroups, flashValueOf } from './state.mjs';
import { brandMult } from './style.mjs';

// The base points of an outcome key, scaled. With audienceTastes off every group likes every outcome equally.
export function basePoints(cfg, key, scale = 1) {
  const row = cfg.points[key];
  if (!row) throw new Error(`no points row ${key}`);
  const out = zeroGroups();
  for (const g of GROUPS) out[g] = (row[g] ?? 0) * scale;
  return cfg.systems.audienceTastes ? out : flatten(out);
}

export function flatten(p) {
  const sum = GROUPS.reduce((s, g) => s + p[g], 0);
  return Object.fromEntries(GROUPS.map(g => [g, sum / GROUPS.length]));
}

// How many times the agent did `move` in the boredom window before this hour.
export function repeats(state, agent, move) {
  const w = state.cfg.audience.boredomWindow;
  return agent.history.filter(h => h.move === move && h.t >= state.t - w && h.t < state.t).length;
}

// Multipliers for an agent's own action outcome. `ctx.movesThisHour` (id -> move) feeds novelty.
// Returns { points, mult: { boredom, novelty, callShot, revenge, brand } }. The menu's fans and the award both come
// from here, so they always match.
export function outcomePoints(state, ctx, agent, key, { move, scale = 1, win = false, target = null, novelSet = null } = {}) {
  const cfg = state.cfg;
  const sys = cfg.systems;
  const p = basePoints(cfg, key, scale);
  const mult = { boredom: 1, novelty: 1, callShot: 1, revenge: 1, brand: 1 };
  // Round 3 (R3.1): the owner's style brands its own style moves (src/style.mjs). Only an agent's own move carries a
  // `move`; victim and passive points never do, and steals don't come through here.
  if (move) mult.brand = brandMult(cfg, agent.sliders, move);
  if (move && sys.boredom) {
    const n = repeats(state, agent, move);
    mult.boredom = Math.pow(cfg.audience.boredom, n);
  }
  if (move && sys.novelty) {
    const others = novelSet ?? ctx?.movesThisHour;
    const nobodyElse = others ? !Object.entries(others).some(([id, m]) => id !== agent.id && m === move) : false;
    if (nobodyElse) mult.novelty = cfg.audience.novelty;
  }
  if (win && move && sys.callShot) {
    const shot = state.callShots.find(c => c.agent === agent.id && c.move === move && (!c.target || c.target === target) && c.until >= state.t && !c.used);
    if (shot) {
      mult.callShot = cfg.audience.callShotMult;
      if (ctx) shot.used = true;
    }
  }
  // Revenge counts only grudges from earlier hours (round 2: an ambush and its "revenge" can't share an hour).
  if (win && target && sys.revenge && agent.grudges.some(g => g.who === target && g.hour < state.t)) mult.revenge = cfg.audience.revenge;
  const m = mult.boredom * mult.callShot * mult.revenge * mult.brand;
  for (const g of GROUPS) p[g] *= m * (g === 'weird' ? mult.novelty : 1);
  return { points: p, mult };
}

export function addPoints(ctx, id, points) {
  const acc = ctx.points[id] ?? (ctx.points[id] = zeroGroups());
  for (const g of GROUPS) acc[g] += points[g];
}

// Kingslayer: a win against the king (at the start of the hour) steals more: ×1.5, or ×2 for kill_king (round 1).
// A duck isn't a win, so it never gets the bonus.
export function kingslayerMult(cfg, cause) {
  if (!cfg.systems.kingslayer || cause === 'ducked' || cause === 'mug_defend') return 1;
  return cause === 'kill_king' ? cfg.audience.kingslayerKill : cfg.audience.kingslayer;
}

// Move pct of `from`'s viewers to `to`, in each group in proportion, with the kingslayer bonus when `from` was the
// king at the start of the hour. Returns the viewers moved.
export function steal(state, ctx, fromId, toId, pct, cause) {
  const cfg = state.cfg;
  if (!cfg.systems.steals || fromId === toId) return 0;
  let p = pct;
  if (fromId === ctx.kingAtStart) p = Math.min(1, p * kingslayerMult(cfg, cause));
  const from = state.agents[fromId];
  const to = state.agents[toId];
  let moved = 0;
  for (const g of GROUPS) {
    const amt = from.viewers[g] * p;
    from.viewers[g] -= amt;
    to.viewers[g] += amt;
    moved += amt;
  }
  ctx.events.push({ type: 'steal', from: fromId, to: toId, pct: p, viewers: round(moved), cause });
  (ctx.stolen[toId] ??= 0);
  ctx.stolen[toId] += moved;
  (ctx.stolen[fromId] ??= 0);
  ctx.stolen[fromId] -= moved;
  return moved;
}

// Round 3 (R3.3): pct of an agent's viewers walk away into the unassigned pool (a ducked call-out with
// systems.duckWalkAway). Nobody gains them, and viewers are conserved. Returns the viewers who left.
export function walkAway(state, ctx, fromId, pct, cause) {
  if (!state.cfg.systems.steals) return 0;
  const from = state.agents[fromId];
  let moved = 0;
  for (const g of GROUPS) {
    const amt = from.viewers[g] * pct;
    from.viewers[g] -= amt;
    state.unassigned[g] += amt;
    moved += amt;
  }
  ctx.events.push({ type: 'walk_away', from: fromId, pct, viewers: round(moved), cause });
  (ctx.stolen[fromId] ??= 0);
  ctx.stolen[fromId] -= moved;
  return moved;
}

const round = x => Math.round(x * 100) / 100;

// The hourly update, SPEC §5 steps 1-5, for every group. ctx.points holds this hour's points per agent.
export function audienceUpdate(state, ctx) {
  const cfg = state.cfg;
  const A = cfg.audience;
  // Passive flash (step 4) counts as this hour's points.
  if (cfg.systems.flash) {
    for (const id of state.ids) {
      const a = state.agents[id];
      if (a.state === 'dead') continue;
      const fv = flashValueOf(cfg, a);
      if (fv > 0) {
        const pts = zeroGroups();
        pts.weird = (fv / 100) * A.passiveFlash;
        pts.feelgood = (fv / 100) * A.passiveFlash;
        addPoints(ctx, id, cfg.systems.audienceTastes ? pts : flatten(pts));
      }
    }
  }
  const served = zeroGroups();
  for (const g of GROUPS) {
    // 1. churn
    let released = 0;
    for (const id of state.ids) {
      const a = state.agents[id];
      const mult = A.stateChurn[a.state] ?? 1;
      const r = Math.min(a.viewers[g], a.viewers[g] * A.churn * mult);
      a.viewers[g] -= r;
      released += r;
    }
    // 2. browsing
    const browse = state.unassigned[g] * A.browse;
    state.unassigned[g] -= browse;
    const pot = released + browse;
    // 3. reallocation by this hour's points. Only min(1, points / growthFull) of the pot is handed out (round 1:
    // a quiet hour doesn't pour every released viewer onto whoever scored a point); the rest stays unassigned.
    let total = 0;
    for (const id of state.ids) total += Math.max(0, ctx.points[id]?.[g] ?? 0);
    served[g] = total;
    const handed = total > 0 ? pot * (cfg.systems.smoothAudience ? Math.min(1, total / A.growthFull) : 1) : 0;
    if (handed > 0) {
      for (const id of state.ids) {
        const p = Math.max(0, ctx.points[id]?.[g] ?? 0);
        if (p > 0) state.agents[id].viewers[g] += (handed * p) / total;
      }
    }
    state.unassigned[g] += pot - handed;
    // 5. pool size
    if (cfg.systems.audienceGrowth) {
      const start = state.startPools[g];
      const factor = 1 + A.growthRate * Math.max(0, Math.min(1, total / A.growthFull)) - A.decayRate;
      const next = Math.max(start * A.poolMin, Math.min(start * A.poolMax, state.pools[g] * factor));
      const delta = next - state.pools[g];
      if (delta >= 0) state.unassigned[g] += delta;
      else {
        let take = -delta;
        const fromU = Math.min(take, state.unassigned[g]);
        state.unassigned[g] -= fromU;
        take -= fromU;
        if (take > 0) {
          const held = state.ids.reduce((s, id) => s + state.agents[id].viewers[g], 0);
          if (held > 0) for (const id of state.ids) state.agents[id].viewers[g] -= (state.agents[id].viewers[g] / held) * take;
        }
      }
      state.pools[g] = next;
    }
  }
  state.servedLastHour = served;
  for (const id of state.ids) {
    const a = state.agents[id];
    for (const g of GROUPS) if (a.viewers[g] < 1e-9) a.viewers[g] = 0;
    const tv = totalViewers(a);
    a.viewerHours += tv;
    if (tv > a.peakViewers) a.peakViewers = tv;
    a.fansLastHour = ctx.points[id] ? { ...ctx.points[id] } : zeroGroups();
  }
}

// The king (round 1): the season leader by viewer-hours so far (ties: current viewers, then id), so the crown means
// something and the final king is the winner. Null until somebody has been watched.
export function computeKing(state) {
  if (!state.cfg.systems.leaderKing) {
    const now = rankByViewers(state)[0];
    return now && totalViewers(state.agents[now]) > 0 ? now : null;
  }
  const top = rankAgents(state)[0];
  return top && state.agents[top].viewerHours > 0 ? top : null;
}

// Season standings: viewer-hours, then current viewers, then id.
export function rankAgents(state) {
  return state.ids.slice().sort((x, y) => {
    const a = state.agents[x], b = state.agents[y];
    return b.viewerHours - a.viewerHours || totalViewers(b) - totalViewers(a) || (x < y ? -1 : 1);
  });
}

// Right now: current viewers, then viewer-hours, then id (the attention energy bonus, SPEC §3).
export function rankByViewers(state) {
  return state.ids.slice().sort((x, y) => {
    const a = state.agents[x], b = state.agents[y];
    return totalViewers(b) - totalViewers(a) || b.viewerHours - a.viewerHours || (x < y ? -1 : 1);
  });
}
