// The menu (SPEC §7): only legal actions, each line with live numbers (odds, pays, fans after crowding, boredom and
// novelty, heat), valid targets and an args spec. Lines with choices carry `options`: one entry per concrete choice
// (target, item, destination) with its own numbers, and the line's top-level numbers are its best option's.
// `pays` is what the line is worth to you in dollars: cash, plus goods and gear at the menu's typical value.
import { rng } from './rng.mjs';
import { GROUPS, GEAR, JOB_ACTION } from './config.mjs';
import { adjacent, reachable, WALKABLE } from './world.mjs';
import { outcomePoints, kingslayerMult } from './audience.mjs';
import { presentOn, hasGun, hasCar, hasArmor, flashValueOf, copsOn, partyOn, totalViewers, round2, zeroGroups } from './state.mjs';
import { levelOf } from './style.mjs';

export const ACTIONS = [
  'shift', 'run', 'cook', 'deal', 'build', 'pickpocket', 'mug', 'steal_car', 'scout', 'bank_job',
  'buy',
  'push_npc', 'crip_walk', 'drip_check', 'party', 'battle', 'call_out', 'bounty',
  'fistfight', 'crate', 'shoot', 'drive_by', 'kill_king', 'run_cops',
  'move', 'rest', 'lay_low',
];
// Agent-vs-agent actions (SPEC §6.4), resolved in the seeded order.
export const AVA = new Set(['mug', 'steal_car', 'fistfight', 'shoot', 'drive_by', 'kill_king', 'battle', 'call_out', 'bounty']);
// Hostile actions (for grudges and rivalries).
export const HOSTILE = new Set(['mug', 'steal_car', 'fistfight', 'shoot', 'drive_by', 'kill_king', 'call_out', 'bounty']);
// Dealt-hand weights: risk weights crime and violence, clout weights the show.
export const RISKY = new Set(['run', 'cook', 'deal', 'build', 'pickpocket', 'mug', 'steal_car', 'scout', 'bank_job', 'fistfight', 'crate', 'shoot', 'drive_by', 'kill_king', 'run_cops', 'push_npc', 'bounty']);
export const SHOWY = new Set(['drip_check', 'party', 'battle', 'call_out', 'crip_walk']);
// Always in a dealt hand when legal, besides move, rest and the job action (SPEC §7, orchestrator 2026-11-07).
export const ALWAYS_DEALT = ['kill_king', 'run_cops', 'crate'];
// "at home" / "at the bar".
export const at = block => (block === 'home' ? 'at home' : `at the ${block}`);
export const the = block => (block === 'home' ? 'home' : `the ${block}`);

const LABELS = {
  shift: 'Work a straight shift', run: 'Smuggling run', cook: 'Cook product', deal: 'Deal product here', build: 'Build a gun',
  pickpocket: 'Pickpocket the crowd', mug: 'Mug someone here', steal_car: 'Steal a car', scout: 'Scout the bank',
  bank_job: 'Daylight bank job', buy: 'Buy', push_npc: 'Push an NPC around', crip_walk: 'Crip walk', drip_check: 'Drip check',
  party: 'Throw a party', battle: 'Dance or rap battle', call_out: 'Call someone out', bounty: 'Put a bounty on someone',
  fistfight: 'Start a fistfight', crate: 'Fight over the crate', shoot: 'Shoot someone', drive_by: 'Drive-by', kill_king: 'Kill the king',
  run_cops: 'Run from the cops', move: 'Move', rest: 'Rest', lay_low: 'Lay low',
};

const clampOdds = (cfg, x) => Math.max(cfg.odds.clamp[0], Math.min(cfg.odds.clamp[1], x));
const sumFans = f => GROUPS.reduce((s, g) => s + f[g], 0);
const roundFans = f => Object.fromEntries(GROUPS.map(g => [g, round2(f[g])]));

export function crowdOf(cfg, viewers) {
  const c = cfg.audience.crowd;
  return viewers < c.none ? 'none' : viewers < c.some ? 'some' : viewers < c.big ? 'big' : 'city';
}

export const isFlashing = (state, a) => state.cfg.systems.flash && a.flashingUntil >= state.t;
export const gunVisible = (state, a) => hasGun(a) && a.gunSeenUntil >= state.t;

// What others can see on an agent (roster `visible`).
export function visibleItems(state, a) {
  const out = [];
  if (gunVisible(state, a)) out.push('gun');
  if (hasCar(a)) out.push('car');
  if (hasArmor(a)) out.push('armor');
  if (state.cfg.systems.flash) for (const f of ['chain', 'grill', 'fit']) if (a.gear[f] > 0) out.push(f);
  return out;
}

// The lone-worker rule: nobody else on the block but the two of them, and never at a party.
export function aloneWith(state, actorId, targetId, block) {
  if (partyOn(state, block)) return false;
  const here = presentOn(state, block).filter(id => id !== actorId && id !== targetId);
  return here.length === 0;
}

// The greedy value of a line or option (SPEC §8 formula plus the steal term; see notes/engine.md). The menu shows raw
// expected stars in heatRisk; only this score weights stars that land at the wanted level (`stars` = the agent's now).
export function lineValue(cfg, o, stars = 0) {
  const w = cfg.bots.greedy;
  return o.odds * (o.pays + w.k * sumFans(o.fans) + w.v * (o.steals ?? 0)) - w.e * o.energy - w.h * weightHeat(cfg, stars, o.heatRisk ?? 0);
}

function stealEst(state, targetId, pct, cause) {
  const cfg = state.cfg;
  if (!cfg.systems.steals) return 0;
  const t = state.agents[targetId];
  const mid = cfg.audience.crowdMid[crowdOf(cfg, totalViewers(t))];
  const k = targetId === state.king ? kingslayerMult(cfg, cause) : 1;
  return round2(mid * Math.min(1, pct * k));
}

function fansFor(S, key, move, { scale = 1, win = true, target = null } = {}) {
  return roundFans(outcomePoints(S.state, null, S.a, key, { move, scale, win, target, novelSet: S.state.lastMoves }).points);
}

function activeCallShot(state, a, move, target) {
  if (!state.cfg.systems.callShot) return false;
  return state.callShots.some(c => c.agent === a.id && c.move === move && (!c.target || c.target === target) && c.until >= state.t && !c.used);
}

// Greedy's heat cost: expected stars added, each counted `wantedWeight` times when it lands at the wanted level (3+),
// where cops arrest; lay_low's −1 is weighted the same way. Used only in lineValue, never shown on the menu.
export function weightHeat(cfg, s, x) {
  const W = cfg.heat.wanted;
  const k = cfg.menu.wantedWeight;
  if (x < 0) return -(s >= W ? k : 1) * Math.min(1, -x);
  let r = 0;
  for (let i = 1; x - (i - 1) > 1e-9; i++) r += (Math.min(cfg.heat.max, s + i) >= W ? k : 1) * Math.min(1, x - (i - 1));
  return r;
}

function mk(S, id, o) {
  const energy = o.energy ?? S.cfg.actions[id].energy;
  return {
    id,
    label: o.label ?? LABELS[id],
    energy,
    cash: o.cash ?? 0,
    odds: round2(o.odds ?? 1),
    pays: Math.round(o.pays ?? 0),
    fans: o.fans ?? zeroGroups(),
    heat: o.heat ?? 'none',
    heatRisk: round2(o.heatRisk ?? 0), // raw expected stars added
    steals: o.steals ?? 0,
    why: o.why ?? '',
    targets: o.targets ?? null,
    args: o.args ?? null,
    ...(o.options ? { options: o.options } : {}),
  };
}

// A line with choices: its top-level numbers are its first option's, in the options' own neutral order (targets by id,
// items in list order, destinations in grid order) — never the greedy pick, so the headline isn't a hidden ranking.
// One deliberate exception (round 3, R3.1): a reckless or show-off agent's buy line lists its style's gear first
// (shopOrder). That is the owner's own setting, and you.style says so.
function withOptions(S, id, base, options) {
  if (!options.length) return null;
  for (const op of options) op.heatRisk = round2(op.heatRisk ?? 0);
  const first = options[0];
  return mk(S, id, { ...base, odds: first.odds, pays: first.pays, fans: first.fans, heatRisk: first.heatRisk, steals: first.steals, cash: first.cash ?? base.cash, energy: first.energy ?? base.energy, why: base.why ?? first.note, options });
}

const enoughEnergy = (S, id) => S.a.energy >= S.cfg.actions[id].energy;

const BUILDERS = {
  shift(S) {
    const A = S.cfg.actions.shift;
    if (!A.where.includes(S.block) || !enoughEnergy(S, 'shift')) return null;
    return mk(S, 'shift', { pays: A.pays, fans: fansFor(S, 'shift', 'shift'), why: `+$${A.pays}, no heat` });
  },
  run(S) {
    const A = S.cfg.actions.run;
    if (S.a.job !== 'smuggler' || !A.where.includes(S.block) || !enoughEnergy(S, 'run')) return null;
    const fans = fansFor(S, 'run', 'run');
    const options = ['chems', 'parts'].map(good => {
      const unit = saleValue(S.state, good, S.a.id);
      return { args: { good }, odds: 1, pays: A.yields[good] * unit, fans, heatRisk: A.heatChance, energy: A.energy, note: `${A.yields[good]} ${good} (~$${unit} each: just under the board's best ask)` };
    });
    return withOptions(S, 'run', { heat: `${pct(A.heatChance)} chance of +1 star`, args: { good: ['chems', 'parts'] }, why: `bring in ${A.yields.chems} chems or ${A.yields.parts} parts to sell` }, options);
  },
  cook(S) {
    const A = S.cfg.actions.cook;
    if (S.a.job !== 'chemist' || !A.where.includes(S.block) || S.a.evicted || S.a.stock.chems < A.input.chems || !enoughEnergy(S, 'cook')) return null;
    const v = S.cfg.board.typical;
    return mk(S, 'cook', { pays: A.output.product * v.product - A.input.chems * v.chems, fans: fansFor(S, 'cook', 'cook'), heat: `${pct(A.heatChance)} chance of +1 star`, heatRisk: A.heatChance, why: `${A.input.chems} chems become ${A.output.product} product (~$${v.product} each)` });
  },
  deal(S) {
    const A = S.cfg.actions.deal;
    if (S.a.job !== 'dealer' || !A.where.includes(S.block) || S.a.stock.product < 1 || !enoughEnergy(S, 'deal')) return null;
    const others = (S.state.dealtLastHour[S.block] ?? []).filter(id => id !== S.a.id).length;
    const factor = Math.max(A.crowdFloor, 1 - A.crowdCut * others);
    const qty = Math.min(A.maxQty, S.a.stock.product);
    const cops = copsOn(S.state, S.block);
    return mk(S, 'deal', {
      pays: qty * A.price * factor,
      fans: fansFor(S, 'deal', 'deal'),
      heat: cops ? '+1 star: a cop is here' : `+1 star if a cop is here (none now); else ${pct(A.heatChance)}`,
      heatRisk: cops ? A.copStars : A.heatChance,
      why: `sell ${qty} product at $${A.price}; ${others} other dealer${others === 1 ? '' : 's'} here last hour: price at ${Math.round(factor * 100)}%`,
    });
  },
  build(S) {
    const A = S.cfg.actions.build;
    if (S.a.job !== 'gunrunner' || !A.where.includes(S.block) || S.a.evicted || S.a.stock.parts < A.input.parts || !enoughEnergy(S, 'build')) return null;
    const v = S.cfg.board.typical;
    return mk(S, 'build', { pays: v.guns - A.input.parts * v.parts, fans: fansFor(S, 'build', 'build'), heat: `${pct(A.heatChance)} chance of +1 star`, heatRisk: A.heatChance, why: `${A.input.parts} parts become 1 gun (~$${v.guns} on the board)` });
  },
  pickpocket(S) {
    const A = S.cfg.actions.pickpocket;
    if (!A.where.includes(S.block) || !enoughEnergy(S, 'pickpocket')) return null;
    const odds = clampOdds(S.cfg, A.odds);
    return mk(S, 'pickpocket', { odds, pays: (A.cashMin + A.cashMax) / 2, fans: fansFor(S, 'pickpocket_win', 'pickpocket'), heat: `win: ${pct(A.winHeatChance)} chance of +1 star; fail: +1 star`, heatRisk: odds * A.winHeatChance + (1 - odds) * A.failStars, why: `$${A.cashMin}-${A.cashMax} from the crowd` });
  },
  mug(S) {
    const A = S.cfg.actions.mug;
    if (!S.cfg.systems.mugging || !enoughEnergy(S, 'mug') || !S.here.length) return null;
    const armed = hasGun(S.a);
    const options = S.here.map(tid => {
      const t = S.state.agents[tid];
      let odds = A.odds + (armed ? A.gunBonus : 0) + (aloneWith(S.state, S.a.id, tid, S.block) ? A.loneWorker : 0) + (gunVisible(S.state, t) ? A.targetGun : 0) + (isFlashing(S.state, t) ? S.cfg.odds.flashingTarget : 0) - (activeCallShot(S.state, S.a, 'mug', tid) ? S.cfg.odds.callShotPenalty : 0);
      odds = clampOdds(S.cfg, odds);
      return { target: tid, odds: round2(odds), pays: A.takeMin, fans: fansFor(S, 'mug_win', 'mug', { target: tid }), heatRisk: A.stars + (armed ? A.armedExtraStars : 0), steals: stealEst(S.state, tid, A.steal, 'mug'), energy: A.energy, note: `${t.name}: ${visibleItems(S.state, t).join(', ') || 'nothing visible'}` };
    });
    return withOptions(S, 'mug', { targets: S.here.slice(), args: { take: ['cash', ...GEAR.filter(g => g !== 'car'), null] }, heat: `+${A.stars} star${armed ? ' (+1 armed)' : ''}`, why: `win: 40% of their cash (min $${A.takeMin}) or the item you name, and ${pct(A.steal)} of their viewers; lose: -${A.loseEnergy} energy and they take ${pct(A.loseSteal)} of yours` }, options);
  },
  steal_car(S) {
    const A = S.cfg.actions.steal_car;
    if (!S.cfg.systems.carTheft || !enoughEnergy(S, 'steal_car')) return null;
    const worth = hasCar(S.a) ? S.cfg.menu.gearWorth.car * 0.25 : S.cfg.menu.gearWorth.car;
    const owners = S.here.filter(id => hasCar(S.state.agents[id]));
    if (owners.length) {
      const options = owners.map(tid => {
        const odds = clampOdds(S.cfg, A.agentOdds + (aloneWith(S.state, S.a.id, tid, S.block) ? A.loneWorker : 0) - (activeCallShot(S.state, S.a, 'steal_car', tid) ? S.cfg.odds.callShotPenalty : 0));
        return { target: tid, odds: round2(odds), pays: worth, fans: fansFor(S, 'steal_car_win', 'steal_car', { target: tid }), heatRisk: A.agentStars, steals: 0, energy: A.energy, note: `take ${S.state.agents[tid].name}'s car` };
      });
      return withOptions(S, 'steal_car', { targets: owners, heat: `+${A.agentStars} stars`, why: 'take a car from someone here (they lose it)' }, options);
    }
    if (!A.streetWhere.includes(S.block)) return null;
    const odds = clampOdds(S.cfg, A.streetOdds);
    return mk(S, 'steal_car', { odds, pays: worth, fans: fansFor(S, 'steal_car_win', 'steal_car'), heat: `win +${A.streetWinStars} stars; fail +${A.streetFailStars}`, heatRisk: odds * A.streetWinStars + (1 - odds) * A.streetFailStars, why: 'boost a car off the street: drive 2 blocks, drive-bys, getaways, the bank job' });
  },
  scout(S) {
    const A = S.cfg.actions.scout;
    if (!S.cfg.systems.bankJob || !A.where.includes(S.block) || S.a.scouting >= A.max - 1e-9 || !enoughEnergy(S, 'scout')) return null;
    const B = S.cfg.actions.bank_job;
    // Scouting is worth a share of the job only once you could pull it: full with a gun and a car, a quarter with one.
    const ready = (hasGun(S.a) ? 1 : 0) + (hasCar(S.a) ? 1 : 0);
    return mk(S, 'scout', { pays: A.bonus * ((B.cashMin + B.cashMax) / 2) * [0, 0.25, 1][ready], why: `+${A.bonus} on your next bank job (now +${round2(S.a.scouting)}, max +${A.max})` });
  },
  bank_job(S) {
    const A = S.cfg.actions.bank_job;
    if (!S.cfg.systems.bankJob || !A.where.includes(S.block) || !hasGun(S.a) || !hasCar(S.a) || !enoughEnergy(S, 'bank_job')) return null;
    const odds = clampOdds(S.cfg, A.odds + S.a.scouting);
    return mk(S, 'bank_job', { odds, pays: (A.cashMin + A.cashMax) / 2, fans: fansFor(S, 'bank_job_win', 'bank_job'), heat: `+${A.stars} stars either way; fail: ${pct(A.failArrestChance)} arrest roll; a car getaway roll decides an arrest this hour`, heatRisk: A.stars, why: `$${A.cashMin}-${A.cashMax}` });
  },
  buy(S) {
    if (!enoughEnergy(S, 'buy')) return null;
    const options = buyOptions(S);
    if (!options.length) return null;
    const items = [...new Set(options.map(o => o.args.item))];
    const froms = [...new Set(options.map(o => o.args.from))];
    // Each item has exactly one source (gear from the shop, goods and "guns" from the board), listed in `combos`;
    // `from` may be left out and is filled from it.
    const line = withOptions(S, 'buy', { args: { item: items, qty: `int 1-${S.cfg.actions.buy.maxQty}`, from: [...froms, null] }, why: 'shop items (gun, car, armor, chain, grill, fit) at the market; board goods (chems, parts, product, guns) anywhere by phone. Only the item + source pairs in combos are valid' }, options);
    line.combos = options.map(o => ({ item: o.args.item, from: o.args.from }));
    return line;
  },
  push_npc(S) {
    const A = S.cfg.actions.push_npc;
    if (A.notWhere.includes(S.block) || !enoughEnergy(S, 'push_npc')) return null;
    return mk(S, 'push_npc', { fans: fansFor(S, 'push_npc', 'push_npc'), heat: `${pct(A.heatChance)} chance of +1 star`, heatRisk: A.heatChance, why: 'cheap and loud' });
  },
  crip_walk(S) {
    const A = S.cfg.actions.crip_walk;
    if (!A.where.includes(S.block) || !enoughEnergy(S, 'crip_walk')) return null;
    return mk(S, 'crip_walk', { fans: fansFor(S, 'crip_walk', 'crip_walk'), why: 'dance in the street, no heat' });
  },
  drip_check(S) {
    // Round 2: only while you wear flash (a chain, grill or fit).
    const fv = flashValueOf(S.cfg, S.a);
    if (fv <= 0 || !enoughEnergy(S, 'drip_check')) return null;
    return mk(S, 'drip_check', { fans: fansFor(S, 'drip_check', 'drip_check', { scale: fv / 100 }), why: `points scale with your flash (${fv}); you show as flashing this hour and next` });
  },
  party(S) {
    const A = S.cfg.actions.party;
    if (!S.cfg.systems.parties || !A.where.includes(S.block) || S.a.cash < A.cost || partyOn(S.state, S.block) || !enoughEnergy(S, 'party')) return null;
    const guests = S.here.length;
    const perHour = fansFor(S, 'party_hour', 'party');
    const perGuest = fansFor(S, 'party_attendee', 'party', { scale: guests });
    const fans = Object.fromEntries(GROUPS.map(g => [g, round2((perHour[g] + perGuest[g]) * A.hours)]));
    return mk(S, 'party', { cash: A.cost, pays: -A.cost, fans, why: `host for ${A.hours} hours (you can only talk while hosting); your block shows as a hotspot; ${guests} here now; guests get +${S.cfg.energy.partyGuest} energy` });
  },
  battle(S) {
    const A = S.cfg.actions.battle;
    if (!S.cfg.systems.battles || !enoughEnergy(S, 'battle') || !S.here.length) return null;
    const mine = battleBonus(S.cfg, S.a);
    const options = S.here.map(tid => {
      const t = S.state.agents[tid];
      const odds = winChance(mine - battleBonus(S.cfg, t));
      return { target: tid, odds: round2(odds), pays: 0, fans: fansFor(S, 'battle_win', 'battle', { target: tid }), heatRisk: 0, steals: stealEst(S.state, tid, A.steal, 'battle'), energy: A.energy, note: `${t.name}` };
    });
    return withOptions(S, 'battle', { targets: S.here.slice(), why: `seeded roll + flash + energy; the winner takes ${pct(A.steal)} of the loser's viewers; no heat` }, options);
  },
  call_out(S) {
    const A = S.cfg.actions.call_out;
    if (!S.cfg.systems.callOuts || !enoughEnergy(S, 'call_out')) return null;
    // One open call-out per caller (round 3, R3.3): no farming the king with a call-out every hour.
    if (S.state.callOuts.some(c => c.caller === S.a.id && c.status === 'open')) return null;
    const targets = S.state.ids.filter(id => id !== S.a.id && ['free', 'partying'].includes(S.state.agents[id].state));
    if (!targets.length) return null;
    const options = targets.map(tid => {
      const t = S.state.agents[tid];
      const block = WALKABLE.includes(t.block) ? t.block : S.block;
      return { target: tid, args: { block }, odds: 1, pays: 0, fans: fansFor(S, 'call_out', 'call_out', { target: tid }), heatRisk: 0, steals: 0, energy: A.energy, note: `${t.name} is ${at(t.block)}` };
    });
    const F = S.cfg.actions.fistfight;
    return withOptions(S, 'call_out', { targets, args: { block: WALKABLE.slice() }, why: `public now. For the next ${A.hours} hours (not this one), any hour you are both at that block you fight: fistfight odds, each of you pays ${F.energy} energy, the loser loses ${F.loseEnergy} more and ${pct(F.steal)} of their viewers to the winner. If they never show while free, ${S.cfg.systems.duckWalkAway ? `${pct(A.duckSteal)} of their viewers walk away (not to you)` : `they lose ${pct(A.duckSteal)} of their viewers to you`} and the whole town hears they ducked. If only you skip it, nothing happens. One open call-out at a time.` }, options);
  },
  bounty(S) {
    const A = S.cfg.actions.bounty;
    if (!S.cfg.systems.bounties || Math.floor(S.a.cash) < A.min || !enoughEnergy(S, 'bounty')) return null;
    const targets = S.state.ids.filter(id => id !== S.a.id && S.state.agents[id].state !== 'dead');
    if (!targets.length) return null;
    const fans = fansFor(S, 'bounty_posted', 'bounty');
    const options = targets.map(tid => ({ target: tid, args: { amount: A.min }, odds: 1, pays: -A.min, fans, heatRisk: 0, steals: 0, energy: A.energy, cash: A.min }));
    return withOptions(S, 'bounty', { targets, args: { amount: `int ${A.min}-${Math.floor(S.a.cash)}` }, why: `the game holds the cash; public now; whoever next beats them in a fight, mugs, shoots or kills them collects; you are revealed ${A.revealHours} hours later` }, options);
  },
  fistfight(S) {
    const A = S.cfg.actions.fistfight;
    if (!S.cfg.systems.fistfights || !enoughEnergy(S, 'fistfight') || !S.here.length) return null;
    const options = S.here.map(tid => {
      const t = S.state.agents[tid];
      const odds = clampOdds(S.cfg, A.odds + (S.a.energy - t.energy) / A.energyDiffDiv + (aloneWith(S.state, S.a.id, tid, S.block) ? A.loneWorker : 0) - (activeCallShot(S.state, S.a, 'fistfight', tid) ? S.cfg.odds.callShotPenalty : 0));
      return { target: tid, odds: round2(odds), pays: bountyOn(S.state, tid, S.a.id), fans: fansFor(S, 'fistfight_win', 'fistfight', { target: tid }), heatRisk: A.stars, steals: stealEst(S.state, tid, A.steal, 'fistfight'), energy: A.energy, note: t.name };
    });
    return withOptions(S, 'fistfight', { targets: S.here.slice(), heat: `+${A.stars} star`, why: `winner takes ${pct(A.steal)} of the loser's viewers; loser -${A.loseEnergy} energy` }, options);
  },
  crate(S) {
    const A = S.cfg.actions.crate;
    const c = S.state.crate;
    if (!S.cfg.systems.crate || !c || c.block !== S.block || c.until < S.state.t || !enoughEnergy(S, 'crate')) return null;
    const mine = 1 + (hasGun(S.a) ? A.gunWeight : 0) + S.a.energy / A.energyDiv;
    const rivals = S.here.length * 0.5 * (1 + 80 / A.energyDiv);
    const odds = mine / (mine + rivals);
    const C = S.cfg.crate;
    const worth = C.contents.cash * (C.cashMin + C.cashMax) / 2 + C.contents.gun * S.cfg.menu.gearWorth.gun;
    return mk(S, 'crate', { energy: A.energy + A.contestEnergy, odds, pays: worth, fans: fansFor(S, 'crate_win', 'crate'), heat: `+${A.stars} star for every contestant`, heatRisk: A.stars, why: `everyone here who picks this contests (weighted draw: gun +${A.gunWeight}, energy); ${S.here.length} others here; $${C.cashMin}-${C.cashMax}, a gun or flash` });
  },
  shoot(S) {
    const A = S.cfg.actions.shoot;
    if (!S.cfg.systems.shooting || !hasGun(S.a) || !enoughEnergy(S, 'shoot') || !S.here.length) return null;
    const options = S.here.map(tid => {
      const t = S.state.agents[tid];
      const odds = clampOdds(S.cfg, A.odds + (hasArmor(t) ? A.armor : 0) + (aloneWith(S.state, S.a.id, tid, S.block) ? A.loneWorker : 0) - (activeCallShot(S.state, S.a, 'shoot', tid) ? S.cfg.odds.callShotPenalty : 0));
      return { target: tid, odds: round2(odds), pays: bountyOn(S.state, tid, S.a.id), fans: fansFor(S, 'shoot_hit', 'shoot', { target: tid }), heatRisk: round2(odds * A.hitStars + (1 - odds) * A.missStars), steals: stealEst(S.state, tid, A.steal, 'shoot'), energy: A.energy, note: `${t.name}${hasArmor(t) ? ' (armor)' : ''}` };
    });
    return withOptions(S, 'shoot', { targets: S.here.slice(), heat: `hit +${A.hitStars} stars; miss +${A.missStars}`, why: `hit: they go to hospital for ${S.cfg.hospital.hours} hours and you take ${pct(A.steal)} of their viewers` }, options);
  },
  drive_by(S) {
    const A = S.cfg.actions.drive_by;
    if (!S.cfg.systems.shooting || !hasGun(S.a) || !hasCar(S.a) || !enoughEnergy(S, 'drive_by')) return null;
    const targets = adjacent(S.block).flatMap(b => presentOn(S.state, b)).filter(id => id !== S.a.id).sort();
    if (!targets.length) return null;
    const options = targets.map(tid => {
      const t = S.state.agents[tid];
      const odds = clampOdds(S.cfg, A.odds + (hasArmor(t) ? A.armor : 0) - (activeCallShot(S.state, S.a, 'drive_by', tid) ? S.cfg.odds.callShotPenalty : 0));
      return { target: tid, odds: round2(odds), pays: bountyOn(S.state, tid, S.a.id), fans: fansFor(S, 'drive_by_hit', 'drive_by', { target: tid }), heatRisk: A.stars, steals: stealEst(S.state, tid, A.steal, 'drive_by'), energy: A.energy, note: `${t.name} ${at(t.block)}` };
    });
    return withOptions(S, 'drive_by', { targets, heat: `+${A.stars} stars; a free getaway roll (+${S.cfg.cops.getawayDriveBy})`, why: `hit: hospital ${S.cfg.hospital.hours} hours, you take ${pct(A.steal)} of their viewers` }, options);
  },
  kill_king(S) {
    const A = S.cfg.actions.kill_king;
    const king = S.state.king;
    if (!S.cfg.systems.king || !hasGun(S.a) || !king || king === S.a.id || !S.here.includes(king) || !enoughEnergy(S, 'kill_king')) return null;
    const t = S.state.agents[king];
    const odds = clampOdds(S.cfg, A.odds + (hasArmor(t) ? A.armor : 0) + (aloneWith(S.state, S.a.id, king, S.block) ? A.alone : 0) - (activeCallShot(S.state, S.a, 'kill_king', king) ? S.cfg.odds.callShotPenalty : 0));
    const option = { target: king, odds: round2(odds), pays: bountyOn(S.state, king, S.a.id), fans: fansFor(S, 'kill_king_win', 'kill_king', { target: king }), heatRisk: A.stars, steals: stealEst(S.state, king, A.steal, 'kill_king'), energy: A.energy, note: `${t.name} is the king` };
    return withOptions(S, 'kill_king', { targets: [king], args: { take: [...GEAR.filter(g => g !== 'car'), null] }, heat: `win +${A.stars} stars (arrest this hour unless your car gets away); fail +${A.failStars}`, why: `the king dies until revived; you take ${pct(A.steal)} of their viewers, one item and any bounty on them` }, [option]);
  },
  run_cops(S) {
    const A = S.cfg.actions.run_cops;
    const cops = copsOn(S.state, S.block);
    const wanted = S.a.stars >= S.cfg.heat.wanted;
    if (!S.cfg.systems.cops || !((wanted && cops) || S.a.stars >= S.cfg.heat.max) || !enoughEnergy(S, 'run_cops')) return null;
    const odds = clampOdds(S.cfg, A.odds + (hasCar(S.a) ? A.carBonus : 0));
    const arrest = S.a.stars >= S.cfg.heat.max ? 1 : cops ? (S.cfg.cops.arrest[S.a.stars] ?? 0) : 0;
    return mk(S, 'run_cops', { odds, pays: arrest * S.a.cash * S.cfg.cops.fine, fans: fansFor(S, 'run_cops_win', 'run_cops'), heat: `fail: arrested with +${A.extraJail} jail hours`, why: `arrest chance now ${pct(arrest)}; success: no arrest this hour and you slip to a random next block` });
  },
  move(S) {
    if (S.preview) return null;
    const steps = hasCar(S.a) ? S.cfg.actions.move.carSteps : 1;
    const dests = reachable(S.block, steps);
    if (!dests.length) return null;
    const options = dests.map(to => {
      const lines = legalLines(S.state, S.a, to, { preview: true });
      // `next` (the greedy bots' pick there) stays in the view for bots; the AI prompt doesn't print it.
      let best = null, bestV = -Infinity;
      for (const l of lines) {
        if (l.id === 'rest' || l.id === 'lay_low') continue;
        for (const o of l.options?.length ? l.options : [l]) {
          const v = lineValue(S.cfg, o, S.a.stars);
          if (v > bestV) { best = { ...o, id: l.id }; bestV = v; }
        }
      }
      const here = presentOn(S.state, to).filter(id => id !== S.a.id);
      // An open call-out of yours: being at its block is worth a shot at the fight, and for its target, not ducking.
      const co = callOutsOf(S.state, S.a.id);
      const stakeAt = blk => co.filter(c => c.block === blk).reduce((sum, c) => sum + callOutStake(S, c), 0);
      const stakes = stakeAt(to) - stakeAt(S.block);
      const value = round2((best ? bestV : 0) + stakes);
      return {
        args: { to }, odds: 1, pays: 0, fans: zeroGroups(), heatRisk: 0, steals: 0, energy: S.cfg.actions.move.energy,
        next: best || stakes ? { id: best?.id ?? null, odds: best?.odds ?? 1, pays: best?.pays ?? 0, fans: best?.fans ?? zeroGroups(), heatRisk: best?.heatRisk ?? 0, steals: best?.steals ?? 0, energy: best?.energy ?? 0, value } : null,
        available: lines.map(l => l.id).filter(id => id !== 'rest' && id !== 'lay_low'),
        ...(co.some(c => c.block === to) ? { callOut: co.filter(c => c.block === to).map(c => c.id) } : {}),
        note: `${to}: ${here.length} here${copsOn(S.state, to) ? ', a cop' : ''}${co.some(c => c.block === to) ? ', your call-out' : ''}`,
      };
    });
    return mk(S, 'move', { args: { to: dests }, options, why: `${steps === 2 ? 'with your car, up to 2 blocks' : 'one block'}; each option lists what you could do there right now` });
  },
  rest(S) {
    return mk(S, 'rest', { why: `+${S.cfg.energy.rest} energy on top of regen (now ${Math.round(S.a.energy)})` });
  },
  lay_low(S) {
    const ok = S.a.stars > 0 && S.state.t - S.a.lastLayLow >= S.cfg.heat.layLowCooldown;
    return mk(S, 'lay_low', { heatRisk: ok ? -S.cfg.actions.lay_low.stars : 0, heat: ok ? '-1 star' : 'none', why: ok ? '-1 star; no fans, your viewers drift' : S.a.stars ? 'you laid low last hour: no star off this time' : 'no stars to lose; no fans' });
  },
};

// Open call-outs where the agent is the caller or the target.
function callOutsOf(state, id) {
  return state.cfg.systems.callOuts ? state.callOuts.filter(c => c.status === 'open' && (c.caller === id || c.target === id) && c.until >= state.t) : [];
}
// What being at a call-out's block is worth (greedy's value units): half a fistfight win's fans, plus, for the target,
// not losing the duck steal. Only the target can duck.
function callOutStake(S, c) {
  const w = S.cfg.bots.greedy;
  const fight = GROUPS.reduce((s, g) => s + (S.cfg.points.fistfight_win[g] ?? 0), 0) * 0.5;
  const duck = c.target === S.a.id ? w.v * S.cfg.actions.call_out.duckSteal * totalViewers(S.a) : 0;
  return duck + w.k * fight;
}

// Open bounties on a target that `me` could collect (never its own).
function bountyOn(state, tid, me = null) {
  return state.cfg.systems.bounties ? state.bounties.filter(b => b.target === tid && b.status === 'open' && b.poster !== me).reduce((s, b) => s + b.amount, 0) : 0;
}

function battleBonus(cfg, a) {
  return (flashValueOf(cfg, a) / 100) * cfg.actions.battle.flashBonusPer100 + a.energy / 100;
}
// P(U1 + d > U2) for two uniform [0,1) rolls.
function winChance(d) {
  const x = -d;
  if (x <= -1) return 1;
  if (x >= 1) return 0;
  return x <= 0 ? 1 - (1 + x) ** 2 / 2 : (1 - x) ** 2 / 2;
}

// Board: the best asks for a good (agent listings that aren't yours, then the NPC supplier).
export function bestAsk(state, good, buyerId) {
  const listings = state.cfg.systems.board ? state.board.listings.filter(l => l.good === good && l.seller !== buyerId && l.qty > 0) : [];
  const best = listings.reduce((m, l) => (!m || l.price < m.price ? l : m), null);
  const npc = state.cfg.board.supplier[good];
  return best && best.price <= npc ? { price: best.price, seller: best.seller } : { price: npc, seller: 'npc' };
}

export function wholesaleBid(state, good) {
  const B = state.cfg.board;
  return round2(B.wholesaler[good] * Math.max(B.wholesaleFloor, 1 - B.wholesaleDecay * state.wholesaleSold[good]));
}

// What a unit sells for right now: just under the cheapest ask on the board (another agent's or the supplier's), and
// never below the wholesaler's bid. A live number, so smugglers see which good is scarce.
export function saleValue(state, good, sellerId) {
  return Math.max(wholesaleBid(state, good), bestAsk(state, good, sellerId).price - 1);
}

const JOB_INPUT = { chemist: ['chems', 2], gunrunner: ['parts', 2], dealer: ['product', 3] };

function buyOptions(S) {
  const cfg = S.cfg;
  const a = S.a;
  const v = cfg.board.typical;
  const worth = cfg.menu.gearWorth;
  const out = [];
  const opt = (item, from, price, qty, pays, fans, note) => {
    const q = Math.min(qty, Math.floor(a.cash / price));
    if (q < 1) return;
    out.push({ args: { item, qty: q, from }, odds: 1, cash: Math.round(price * q), pays: round2(pays(q)), fans: fans ?? zeroGroups(), heatRisk: 0, steals: 0, energy: cfg.actions.buy.energy, note });
  };
  for (const good of ['chems', 'parts', 'product', 'guns']) {
    const ask = bestAsk(S.state, good, a.id);
    const [inputGood, need] = JOB_INPUT[a.job] ?? [];
    if (good === 'guns') {
      const unit = hasGun(a) ? cfg.board.wholesaler.guns : worth.gun;
      opt('guns', 'board', ask.price, 1, q => q * (unit - ask.price), null, `gun from ${ask.seller === 'npc' ? 'the supplier' : 'an agent'} at $${ask.price}`);
      continue;
    }
    const isInput = inputGood === good;
    const qty = isInput ? need : 1;
    opt(good, 'board', ask.price, qty, q => q * (v[good] - ask.price) + (isInput && a.stock[good] < need && q + a.stock[good] >= need ? cfg.menu.jobMargin[a.job] : 0), null, `${good} from ${ask.seller === 'npc' ? 'the supplier' : 'an agent'} at $${ask.price}`);
  }
  if (S.block === 'market') {
    const hoursLeft = Math.min(18, Math.max(0, S.state.seasonLength - S.state.t));
    for (const item of GEAR) {
      const price = cfg.shop[item];
      if (item === 'gun') opt('gun', 'shop', price, 1, () => (hasGun(a) ? cfg.board.wholesaler.guns : worth.gun) - price, null, `gun $${price}`);
      else if (['car', 'armor'].includes(item)) opt(item, 'shop', price, 1, () => (a.gear[item] ? 0 : worth[item]) - price, null, `${item} $${price}`);
      else if (cfg.systems.flash) {
        const per = (cfg.flashValue[item] / 100) * cfg.audience.passiveFlash;
        const fans = zeroGroups();
        if (!a.gear[item]) { fans.weird = round2(per * hoursLeft); fans.feelgood = round2(per * hoursLeft); }
        opt(item, 'shop', price, 1, () => -price, cfg.systems.audienceTastes ? fans : flatFans(fans), `${item} $${price}: flash ${cfg.flashValue[item]}`);
      }
    }
  }
  return shopOrder(cfg, a, out);
}

// The buy line in the owner's style order (round 3, R3.1): high risk lists gun, car and armor first (a board gun right
// after the shop gun), high clout chain, fit and grill; both high, risk's first. Otherwise the neutral order.
function shopOrder(cfg, a, options) {
  if (!cfg.systems.style) return options;
  const first = [
    ...(levelOf(a.sliders?.risk, cfg) === 'high' ? cfg.style.riskShop : []),
    ...(levelOf(a.sliders?.clout, cfg) === 'high' ? cfg.style.cloutShop : []),
  ];
  if (!first.length) return options;
  const rank = o => {
    const k = first.indexOf(o.args.item === 'guns' ? 'gun' : o.args.item);
    return k < 0 ? first.length : k + (o.args.from === 'board' ? 0.5 : 0);
  };
  return options.map((o, i) => ({ o, i })).sort((x, y) => rank(x.o) - rank(y.o) || x.i - y.i).map(x => x.o);
}

const flatFans = f => { const s = sumFans(f) / GROUPS.length; return Object.fromEntries(GROUPS.map(g => [g, round2(s)])); };
const pct = x => `${Math.round(x * 100)}%`;

// Every legal line for agent `a` as if it stood on `block` (its own block by default), in ACTIONS order.
export function legalLines(state, a, block = a.block, { preview = false } = {}) {
  const S = { state, cfg: state.cfg, a, block, preview, here: presentOn(state, block).filter(id => id !== a.id) };
  const out = [];
  for (const id of ACTIONS) {
    const zeroOk = id === 'move' || id === 'rest' || id === 'lay_low';
    if (a.energy <= 0 && !zeroOk) continue;
    const l = BUILDERS[id](S);
    if (l) out.push(l);
  }
  return out;
}

// The menu an agent sees this hour: the legal lines, or its dealt hand (SPEC §7).
export function buildMenu(state, a) {
  const lines = legalLines(state, a);
  if (!state.cfg.systems.dealtHands) return lines;
  return dealHand(state, a, lines);
}

export function dealHand(state, a, lines) {
  const V = state.cfg.view;
  const size = V.handSize;
  if (lines.length <= size) return lines;
  // Also the line the agent moved here for last hour (round 1): a move's promise is kept on arrival.
  const movedFor = a.movedFor && a.movedFor.t === state.t - 1 ? [a.movedFor.id] : [];
  const always = new Set(['move', 'rest', JOB_ACTION[a.job], ...ALWAYS_DEALT, ...movedFor]);
  const keep = new Set(lines.filter(l => always.has(l.id)).map(l => l.id));
  // The owner's style (round 3, R3.1): a reckless agent is always dealt its legal big risk plays, a show-off its show.
  // They may grow the hand past handSize, up to handMax; the draw below only fills a hand that is still short.
  const legal = new Set(lines.map(l => l.id));
  for (const id of styleDealt(state.cfg, a)) if (legal.has(id) && !keep.has(id) && keep.size < V.handMax) keep.add(id);
  const pool = lines.filter(l => !keep.has(l.id));
  const r = rng(state.seed, 'hand', a.id, state.t);
  const weight = l => 1 * (RISKY.has(l.id) ? 1 + V.handRiskWeight * a.sliders.risk : 1) * (SHOWY.has(l.id) ? 1 + V.handCloutWeight * a.sliders.clout : 1);
  while (keep.size < size && pool.length) {
    const ws = pool.map(weight);
    let x = r() * ws.reduce((s, w) => s + w, 0);
    let k = 0;
    while (k < pool.length - 1 && x >= ws[k]) { x -= ws[k]; k++; }
    keep.add(pool[k].id);
    pool.splice(k, 1);
  }
  return lines.filter(l => keep.has(l.id));
}

// The lines a style always deals, risk's first. Nothing is ever hidden because a slider is low.
export function styleDealt(cfg, a) {
  if (!cfg.systems.style) return [];
  return [
    ...(levelOf(a.sliders?.risk, cfg) === 'high' ? cfg.style.riskHand : []),
    ...(levelOf(a.sliders?.clout, cfg) === 'high' ? cfg.style.cloutHand : []),
  ];
}
