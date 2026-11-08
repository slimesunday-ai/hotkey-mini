// One hour, step by step (SPEC §6). runHour(state, replies, views) applies the replies to the start-of-hour state in the
// fixed order and returns the hour's typed feed line. dayEnd(state, line) runs rent, heat decay and sleep (§6.11).
// Every fact the report needs is a typed event or a typed field; `line` / `text` strings are display only.
import { rng, shuffle } from './rng.mjs';
import { GROUPS, GOODS, GEAR, FLASH, JOB_ACTION } from './config.mjs';
import { adjacent, reachable, stepToward, WALKABLE, isWalkable, dist } from './world.mjs';
import { basePoints, outcomePoints, addPoints, steal, walkAway, audienceUpdate, computeKing, rankAgents, rankByViewers } from './audience.mjs';
import { AVA, HOSTILE, aloneWith, isFlashing, bestAsk, wholesaleBid, crowdOf, at, the } from './menu.mjs';
import { clockOf, clockLabel, totalViewers, presentOn, hasGun, hasCar, hasArmor, flashValueOf, copsOn, partyOn, round2, zeroGroups, actingHoursPerDay } from './state.mjs';
import { brandMult } from './style.mjs';

const TALKERS = new Set(['free', 'jail', 'hospital', 'partying']);
const WORLD_ORDER = ['run', 'cook', 'deal', 'build', 'shift', 'pickpocket', 'push_npc', 'steal_car', 'scout', 'bank_job', 'buy', 'crip_walk', 'drip_check', 'party', 'rest', 'lay_low'];
const clampOdds = (cfg, x) => Math.max(cfg.odds.clamp[0], Math.min(cfg.odds.clamp[1], x));
const name = (state, id) => state.agents[id]?.name ?? id;
const words = (s, n) => String(s ?? '').trim().split(/\s+/).filter(Boolean).slice(0, n).join(' ');

// ---------- validation (step 2) ----------

// A reply checked against the agent's menu: { move, target, args } or { failed: why }.
export function validateReply(menu, reply) {
  if (!reply || typeof reply !== 'object') return { failed: 'no_reply' };
  const line = menu.find(l => l.id === reply.move);
  if (!line) return { failed: 'not_on_menu' };
  const ids = Array.isArray(line.targets) ? line.targets.map(t => (typeof t === 'object' ? t.id : t)) : [];
  let target = null;
  if (ids.length) {
    if (!ids.includes(reply.target)) return { failed: 'bad_target' };
    target = reply.target;
  }
  const args = {};
  if (line.args) {
    const given = reply.args && typeof reply.args === 'object' ? reply.args : {};
    for (const [k, spec] of Object.entries(line.args)) {
      const v = given[k];
      if (Array.isArray(spec)) {
        if (v === undefined || v === null) {
          if (spec.includes(null)) continue;
          if (line.options?.length) { const d = line.options[0].args?.[k]; if (d !== undefined) { args[k] = d; continue; } }
          return { failed: `missing_arg_${k}` };
        }
        const hit = spec.find(x => x !== null && String(x).toLowerCase() === String(v).toLowerCase());
        if (hit === undefined) return { failed: `bad_arg_${k}` };
        args[k] = hit;
      } else {
        const m = /^int (\d+)-(\d+)$/.exec(String(spec));
        const n = Number(v);
        if (v === undefined || v === null) {
          if (line.options?.length && line.options[0].args?.[k] !== undefined) { args[k] = line.options[0].args[k]; continue; }
          return { failed: `missing_arg_${k}` };
        }
        if (!Number.isInteger(n) || (m && (n < Number(m[1]) || n > Number(m[2])))) return { failed: `bad_arg_${k}` };
        args[k] = n;
      }
    }
  }
  // A buy names a valid item + source combination (round 1: the line lists them in `combos`).
  if (Array.isArray(line.combos)) {
    const c = line.combos.find(x => x.item === args.item && (!args.from || x.from === args.from));
    if (!c) return { failed: 'bad_combo' };
    args.from = c.from;
  }
  return { move: line.id, target, args, line };
}

// ---------- small helpers ----------

function addStars(state, ctx, a, n, cause) {
  if (n <= 0) return;
  const before = a.stars;
  a.stars = Math.min(state.cfg.heat.max, a.stars + n);
  if (state.cfg.heat.crimes.includes(cause)) a.crimeToday = true;
  state.heatLog.push({ t: state.t, block: a.block, stars: n });
  ctx.events.push({ type: 'heat', agent: a.id, stars: a.stars - before, total: a.stars, cause });
}

function chance(state, ctx, key, id, p) {
  const r = rng(state.seed, key, state.t, id)();
  return r < p;
}

function payEnergy(a, n) {
  a.energy = Math.max(0, a.energy - n);
}

// A grudge: who hurt you, how (display text), what kind of hurt (typed: 'mugging', 'fight', 'shooting', ...), when.
function grudge(state, victimId, actorId, what, kind) {
  const v = state.agents[victimId];
  v.grudges.push({ who: actorId, what, kind: kind ?? 'wrong', hour: state.t });
  if (v.grudges.length > 20) v.grudges.shift();
}

function interact(ctx, a, b, kind, cause, { both = false } = {}) {
  ctx.events.push({ type: 'interaction', a, b, kind, cause });
  ctx.involved.add(a);
  if (both) ctx.involved.add(b);
}

// A friendly act toward `toId` (round 3): a gift, a promise, a kept promise or a party visit. The view's deals read these
// (who trusts a snake, a ride-or-die's allies); typed records, never display text.
function trust(state, fromId, toId, rec) {
  const t = (state.agents[toId].trustedBy[fromId] ??= { n: 0, cash: 0, last: null });
  t.n++;
  t.cash += rec.cash ?? 0;
  t.last = { ...rec, hour: state.t };
}

function moment(state, ctx, type, agents, size, line, extra = null) {
  ctx.moments.push({ hour: state.t, type, agents, size, line, ...(extra ?? {}) });
}

const clockText = (cfg, t) => clockLabel(cfg, t);
// A window's end in plain words: "until Day 2 14:00", or "until the season ends" past the last acting hour.
const untilText = (state, t) => (t > state.seasonLength - 1 ? 'until the season ends' : `until ${clockLabel(state.cfg, t)}`);

// Result texts read as story, never codes (round 3): a target that wasn't there, and why an act came to nothing.
const GONE = {
  target_left_block: n => `${n} had left`, target_in_hospital: n => `${n} was in hospital`, target_in_jail: n => `${n} was in jail`,
  target_dead: n => `${n} was dead`, no_such_target: () => 'nobody was there',
};
const gone = (state, id, bad) => (GONE[bad] ? GONE[bad](name(state, id)) : bad.replace(/_/g, ' '));
const WHY_TEXT = {
  target_left_block: 'they had left', target_in_hospital: 'they were in hospital', target_in_jail: 'they were in jail', target_dead: 'they were dead',
  no_such_target: 'nobody was there', lost: 'you lost', missed: 'you missed', caught: 'you got caught', failed: 'it went wrong',
  interrupted: 'you were taken out before you could act', no_cash: 'not enough cash', crate_gone: 'the crate was gone',
  missing_input: 'nothing to work with', not_the_king: 'they were not the king', bad_destination: 'you could not get there',
  party_here: 'a party was already on here', no_flash: 'no jewelry to show', not_in_shop: 'not sold there', not_on_board: 'not sold there',
  no_car: 'they had no car', unresolved: 'nothing happened',
};
const whyText = code => WHY_TEXT[code] ?? String(code).replace(/_/g, ' ');
// Why a reply couldn't be used, for the agent's next view.
function replyWhy(code) {
  const c = String(code ?? '');
  if (c === 'no_reply') return 'no reply came in';
  if (c.startsWith('invalid_reply')) return `your reply couldn't be used${c.includes(': ') ? ` (${c.slice(c.indexOf(': ') + 2)})` : ''}`;
  if (c === 'not_on_menu') return 'that move was not on your menu';
  if (c === 'bad_target') return 'that target was not one of the line\'s targets';
  if (c === 'bad_combo') return 'that item is not sold that way';
  if (c.startsWith('missing_arg_')) return `you left out ${c.slice(12)}`;
  if (c.startsWith('bad_arg_')) return `that ${c.slice(8)} was not one of the choices`;
  return c.replace(/_/g, ' ');
}

// A typed note on the target's own feed line (play-by-play: "was challenged to a battle by Moss and won").
function incoming(ctx, targetId, by, move, outcome) {
  (ctx.incoming[targetId] ??= []).push({ by, move, outcome });
}

function give(ctx, id, key, opts) {
  // Points for an agent: its own action's outcome (with multipliers) or a passive outcome (base only).
  const state = ctx.state;
  const a = state.agents[id];
  const p = opts ? outcomePoints(state, ctx, a, key, opts) : { points: basePoints(state.cfg, key), mult: {} };
  addPoints(ctx, id, p.points);
  if (p.mult.revenge > 1 && opts?.target) {
    const g = a.grudges.filter(x => x.who === opts.target && x.hour < state.t).at(-1);
    const why = g ? ` for the ${clockText(state.cfg, g.hour)} ${g.kind}` : '';
    moment(state, ctx, 'revenge', [id, opts.target], 2, `${a.name} got revenge on ${name(state, opts.target)}${why}`, g ? { for: { kind: g.kind, hour: g.hour } } : null);
  }
  return p;
}

function collectBounties(state, ctx, collectorId, targetId, how) {
  if (!state.cfg.systems.bounties) return 0;
  let total = 0;
  for (const b of state.bounties) {
    if (b.target === targetId && b.status === 'open' && b.poster !== collectorId) {
      b.status = 'collected';
      b.collector = collectorId;
      b.collectedAt = state.t;
      total += b.amount;
      ctx.events.push({ type: 'bounty_collected', id: b.id, collector: collectorId, target: targetId, poster: b.poster, amount: b.amount, how });
    }
  }
  if (total > 0) {
    state.agents[collectorId].cash += total;
    give(ctx, collectorId, 'bounty_collected');
    moment(state, ctx, 'bounty_collected', [collectorId, targetId], Math.min(5, Math.ceil(total / 100)), `${name(state, collectorId)} collected $${total} in bounties on ${name(state, targetId)}`);
  }
  return total;
}

function hospitalize(state, ctx, id, by) {
  const a = state.agents[id];
  endHosting(state, ctx, id);
  a.state = 'hospital';
  a.until = state.t + state.cfg.hospital.hours;
  ctx.events.push({ type: 'hospital', agent: id, by, until: a.until });
  interruptPending(ctx, id);
}

function interruptPending(ctx, id) {
  const act = ctx.acts[id];
  if (act && act.status === 'pending') {
    act.status = 'interrupted';
    act.ok = false;
    act.why = 'interrupted';
    act.result = { text: 'never got to act: taken out first' };
  }
}

function endHosting(state, ctx, id) {
  for (const p of state.parties) {
    if (p.host === id && p.active) {
      p.active = false;
      ctx.events.push({ type: 'party_end', host: id, block: p.block, guests: p.guests.length });
    }
  }
  const a = state.agents[id];
  if (a.state === 'partying') { a.state = 'free'; a.until = null; }
}

function takeItem(state, from, to, item) {
  if (item === 'gun' || item === 'guns') {
    if (from.stock.guns < 1) return false;
    from.stock.guns -= 1;
    to.stock.guns += 1;
    return true;
  }
  if (GOODS.includes(item)) {
    if (from.stock[item] < 1) return false;
    from.stock[item] -= 1;
    to.stock[item] += 1;
    return true;
  }
  if (from.gear[item] > 0) {
    from.gear[item] -= 1;
    to.gear[item] += 1;
    return true;
  }
  return false;
}

// ---------- the hour ----------

export function runHour(state, replies, views, hashes = null) {
  const cfg = state.cfg;
  const sys = cfg.systems;
  const t = state.t;
  const ctx = {
    state, t, events: [], moments: [], points: {}, stolen: {}, kingAtStart: state.king,
    acts: {}, movesThisHour: {}, involved: new Set(), getaway: {}, safe: new Set(), forceArrest: {}, arrested: new Set(),
    talk: {}, startBlock: {}, startCops: {}, startViewers: {}, startEnergy: {}, startState: {}, incoming: {}, settled: {}, views: views ?? {},
  };
  for (const b of WALKABLE) ctx.startCops[b] = copsOn(state, b);
  for (const id of state.ids) {
    const a = state.agents[id];
    ctx.startBlock[id] = a.block;
    ctx.startViewers[id] = totalViewers(a);
    ctx.startEnergy[id] = a.energy;
    ctx.startState[id] = a.state;
  }

  // Step 2: replies -> actions (invalid, illegal or missing -> rest, flagged failed).
  for (const id of state.ids) {
    const a = state.agents[id];
    const view = views?.[id];
    const rep = replies?.[id];
    const reply = rep?.reply ?? null;
    if (a.state === 'dead' || !view) { ctx.acts[id] = null; continue; }
    ctx.talk[id] = {
      thought: words(reply?.thought, cfg.talk.thoughtWords),
      say: words(reply?.say, cfg.talk.sayWords),
      message: reply?.message ?? null,
      sell: reply?.sell ?? null,
      callShot: reply?.callShot ?? null,
    };
    if (a.state !== 'free') { ctx.acts[id] = null; continue; }
    let v;
    if (!rep) v = { failed: 'no_reply' };
    else if (rep.ok === false) v = { failed: rep.why ? `invalid_reply: ${String(rep.why).slice(0, 120)}` : 'invalid_reply' };
    else v = validateReply(view.menu, reply);
    if (v.failed) {
      ctx.acts[id] = { move: 'rest', target: null, args: {}, status: 'pending', failed: true, failWhy: v.failed, asked: reply?.move ?? null };
    } else {
      ctx.acts[id] = { move: v.move, target: v.target, args: v.args, status: 'pending', failed: false };
    }
    ctx.movesThisHour[id] = ctx.acts[id].move;
  }

  // Step 3: extras.
  for (const id of state.ids) {
    const a = state.agents[id];
    const tk = ctx.talk[id];
    if (!tk || !TALKERS.has(a.state)) continue;
    if (tk.say) { a.lastSay = tk.say; } else a.lastSay = '';
    if (tk.message && sys.messages) applyMessage(state, ctx, a, tk.message);
    else if (tk.message) tk.message = null;
    if (a.state === 'free') {
      if (tk.sell) applySell(state, ctx, a, tk.sell);
      if (tk.callShot && sys.callShot) applyCallShot(state, ctx, a, tk.callShot, views?.[id]?.menu ?? []);
      else tk.callShot = null;
    } else {
      tk.sell = null;
      tk.callShot = null;
    }
  }

  // Step 4a: movement.
  for (const id of state.ids) {
    const act = ctx.acts[id];
    if (!act || act.move !== 'move') continue;
    const a = state.agents[id];
    const steps = hasCar(a) ? cfg.actions.move.carSteps : 1;
    const to = act.args.to;
    if (!to || !reachable(a.block, steps).includes(to)) { done(state, ctx, id, false, 'bad_destination', { text: 'could not get there' }); continue; }
    const from = a.block;
    a.block = to;
    payEnergy(a, cfg.actions.move.energy);
    // The line the move was advertised for is dealt next hour (round 1: dealt hands keep that promise).
    const opt = views?.[id]?.menu?.find(l => l.id === 'move')?.options?.find(o => o.args?.to === to);
    a.movedFor = opt?.next?.id ? { id: opt.next.id, t: state.t } : null;
    ctx.events.push({ type: 'move', agent: id, from, to });
    done(state, ctx, id, true, null, { text: `moved from ${the(from)} to ${the(to)}`, from, to });
  }

  // Step 4b: agent vs agent, in the seeded order.
  const order = shuffle(rng(state.seed, 'order', t), state.ids);
  for (const id of order) {
    const act = ctx.acts[id];
    if (!act || act.status !== 'pending' || !AVA.has(act.move)) continue;
    if (act.move === 'steal_car' && !act.target) continue; // street theft is agent-vs-world
    const a = state.agents[id];
    if (a.state !== 'free') { interruptPending(ctx, id); continue; }
    AVA_RESOLVERS[act.move](state, ctx, id, act);
  }
  // Crate contest: one per crate block.
  resolveCrate(state, ctx);

  // Step 5: agent vs world, in the fixed order.
  const dealersOn = {};
  for (const id of state.ids) {
    const act = ctx.acts[id];
    if (act && act.status === 'pending' && act.move === 'deal' && state.agents[id].state === 'free') (dealersOn[state.agents[id].block] ??= []).push(id);
  }
  ctx.dealersOn = dealersOn;
  for (const move of WORLD_ORDER) {
    let ids = state.ids.filter(id => ctx.acts[id]?.move === move && ctx.acts[id].status === 'pending');
    if (move === 'buy') ids = shuffle(rng(state.seed, 'buy-order', t), ids);
    for (const id of ids) {
      const a = state.agents[id];
      if (a.state !== 'free') { interruptPending(ctx, id); continue; }
      WORLD_RESOLVERS[move](state, ctx, id, ctx.acts[id]);
    }
    if (move === 'party') partyTicks(state, ctx);
  }

  // Step 6: call-outs met or ducked.
  resolveCallOuts(state, ctx);

  // Step 7: cops.
  resolveCops(state, ctx);

  // Step 8: world events.
  worldEvents(state, ctx);

  // Step 9: audience, the king, lead changes, comebacks.
  audienceUpdate(state, ctx);
  const newKing = computeKing(state);
  if (newKing && ctx.kingAtStart && newKing !== ctx.kingAtStart) {
    const nk = state.agents[newKing], ok = state.agents[ctx.kingAtStart];
    const where = { jail: ' while sitting in jail', hospital: ' from a hospital bed', dead: ' while dead' }[nk.state] ?? '';
    const old = { jail: ', who is in jail', hospital: ', who is in hospital', dead: ', who is dead' }[ok.state] ?? '';
    moment(state, ctx, 'lead_change', [newKing, ctx.kingAtStart], 2, `${nk.name} took the crown from ${ok.name}${old}${where}: the most total watch time so far`, {
      leader: { id: newKing, viewerHours: Math.round(nk.viewerHours), state: nk.state },
      previous: { id: ctx.kingAtStart, viewerHours: Math.round(ok.viewerHours), state: ok.state },
    });
  }
  if (newKing && !ctx.kingAtStart) ctx.events.push({ type: 'first_king', agent: newKing, viewerHours: Math.round(state.agents[newKing].viewerHours) });
  state.king = newKing;
  const ranks = Object.fromEntries(rankAgents(state).map((id, i) => [id, i]));
  state.rankHistory.push(ranks);
  detectComebacks(state, ctx, ranks);

  // Step 10: energy regen (the attention bonus goes by current viewers).
  const byViewers = Object.fromEntries(rankByViewers(state).map((id, i) => [id, i]));
  for (const id of state.ids) {
    const a = state.agents[id];
    if (a.state === 'dead') continue;
    let gain = cfg.energy.regen;
    if (sys.attentionEnergy && totalViewers(a) > 0) {
      const r = byViewers[id];
      gain += r < 3 ? cfg.energy.bonusTop3 : r < state.ids.length / 2 ? cfg.energy.bonusTopHalf : 0;
    }
    a.energy = Math.min(cfg.energy.max, a.energy + gain);
  }

  // Step 12: wrap-up: memory, the feed line, next hour's public facts, message delivery.
  return wrapUp(state, ctx, hashes);
}

function done(state, ctx, id, ok, why, result) {
  const act = ctx.acts[id];
  act.status = 'done';
  act.ok = ok;
  act.why = why;
  act.result = result;
  const a = state.agents[id];
  a.history.push({ t: state.t, move: act.move });
  if (a.history.length > 30) a.history.shift();
}

// A target still valid at its turn: free (or hosting) and on the block (SPEC §6.4 target check).
function targetCheck(state, actorId, targetId, blocks) {
  const t = state.agents[targetId];
  if (!t) return 'no_such_target';
  if (t.state === 'dead') return 'target_dead';
  if (t.state === 'hospital') return 'target_in_hospital';
  if (t.state === 'jail') return 'target_in_jail';
  if (!blocks.includes(t.block)) return 'target_left_block';
  return null;
}

const callShotPenalty = (state, id, move, target) => (state.cfg.systems.callShot && state.callShots.some(c => c.agent === id && c.move === move && (!c.target || c.target === target) && c.until >= state.t && !c.used) ? state.cfg.odds.callShotPenalty : 0);

// ---------- step 3: extras ----------

function applyMessage(state, ctx, a, m) {
  const cfg = state.cfg;
  const to = state.agents[m.to];
  if (!to || to.id === a.id) { ctx.talk[a.id].message = null; return; }
  const text = words(m.text, 30);
  let cash = 0, item = null;
  const before = { cash: a.cash, holds: it => holds(a, it) }; // promises are judged on what the sender held when it wrote
  if (m.cash > 0) {
    cash = Math.max(0, Math.min(Math.floor(m.cash), Math.floor(a.cash)));
    if (cash > 0) {
      a.cash -= cash;
      to.cash += cash;
      ctx.events.push({ type: 'transfer', from: a.id, to: to.id, cash, item: null, cause: 'message' });
    }
  }
  if (m.item) {
    const it = m.item === 'gun' ? 'guns' : m.item;
    if (takeItem(state, a, to, it)) {
      item = m.item;
      ctx.events.push({ type: 'transfer', from: a.id, to: to.id, cash: 0, item, cause: 'message' });
    }
  }
  let promise = null;
  if (m.promise && cfg.systems.promises) {
    const why = promiseProblem(state, a, to.id, m.promise, before);
    if (why) ctx.events.push({ type: 'promise_rejected', from: a.id, to: to.id, why });
    else {
      const g = m.promise.give;
      const give = g.cash > 0 ? { cash: Math.floor(g.cash) } : { item: String(g.item) };
      promise = { id: `p${state.seq.promise++}`, from: a.id, to: to.id, give, by: m.promise.by, made: state.t, status: 'open', paid: 0 };
      state.promises.push(promise);
      ctx.events.push({ type: 'promise_made', id: promise.id, from: a.id, to: to.id, give, by: promise.by });
    }
  }
  if (cash > 0 || item) trust(state, a.id, to.id, { kind: 'gift', cash, item });
  else if (promise) trust(state, a.id, to.id, { kind: 'promise', give: promise.give });
  // Attachments count toward open promises from the sender to the recipient.
  if (cash > 0 || item) settlePromises(state, ctx, a.id, to.id, cash, item);
  state.outbox.push({ from: a.id, to: to.id, text, cash, item, promise: promise ? { id: promise.id, give: promise.give, by: promise.by } : null, hour: state.t });
  ctx.events.push({ type: 'message', from: a.id, to: to.id, cash, item, promise: !!promise, words: text ? text.split(' ').length : 0 });
  const kind = cash > 0 || item ? 'friendly' : promise ? 'friendly' : 'talk';
  interact(ctx, a.id, to.id, kind, 'message');
  ctx.talk[a.id].message = { to: to.id, text, cash, item, promise: promise ? { give: promise.give, by: promise.by } : null, ...(ctx.settled[a.id]?.length ? { keeps: ctx.settled[a.id].map(x => ({ give: x.give, made: x.made })) } : {}) };
}

// Why a promise can't be made (round 1), or null. A promise must fall due at least `minLead` hours ahead, the sender
// may hold one open promise per recipient and `maxOpenPerSender` in all, and it can't promise more cash than it holds
// or an item it doesn't have.
export function promiseProblem(state, a, toId, pr, before = { cash: a.cash, holds: it => holds(a, it) }) {
  const P = state.cfg.promises;
  const g = pr?.give;
  if (!g || !Number.isInteger(pr.by)) return 'malformed';
  if (!(g.cash > 0) && !(typeof g.item === 'string' && g.item)) return 'malformed';
  if (pr.by < state.t + P.minLead) return 'too_soon';
  const open = state.promises.filter(p => p.from === a.id && p.status === 'open');
  if (open.filter(p => p.to === toId).length >= P.maxOpenPerPair) return 'already_promised_them';
  if (open.length >= P.maxOpenPerSender) return 'too_many_open';
  if (g.cash > 0 && Math.floor(g.cash) > Math.floor(before.cash)) return 'more_cash_than_held';
  if (!(g.cash > 0) && !before.holds(g.item)) return 'item_not_held';
  return null;
}

export function holds(a, item) {
  const it = item === 'gun' ? 'guns' : item;
  if (GOODS.includes(it)) return a.stock[it] > 0;
  return (a.gear[it] ?? 0) > 0;
}

// What a promise puts at stake, in dollars: the unpaid cash, or the item at its shop (or typical board) price.
function stakeOf(cfg, p) {
  if (p.give.cash) return Math.max(0, p.give.cash - p.paid);
  const it = p.give.item === 'guns' ? 'gun' : p.give.item;
  return cfg.shop[it] ?? cfg.board.typical[it] ?? cfg.board.typical[`${it}s`] ?? 0;
}

// Where an item is bought: gear at the market shop, goods (and 'guns') on the board.
export const buyFrom = item => (GOODS.includes(item) ? 'board' : 'shop');

function pushHistory(a, t, move) {
  a.history.push({ t, move });
  if (a.history.length > 30) a.history.shift();
}

function settlePromises(state, ctx, fromId, toId, cash, item) {
  let left = cash;
  for (const p of state.promises) {
    // Paid in the hour it was made doesn't count (round 1): a promise is kept only in a later hour.
    if (p.from !== fromId || p.to !== toId || p.status !== 'open' || p.made === state.t) continue;
    if (p.give.cash && left > 0) {
      const need = p.give.cash - p.paid;
      const pay = Math.min(need, left);
      p.paid += pay;
      left -= pay;
      if (p.paid >= p.give.cash) keepPromise(state, ctx, p);
    } else if (p.give.item && item && (p.give.item === item || (p.give.item === 'guns' && item === 'gun') || (p.give.item === 'gun' && item === 'guns'))) {
      p.paid = 1;
      item = null;
      keepPromise(state, ctx, p);
    }
  }
}

function keepPromise(state, ctx, p) {
  p.status = 'kept';
  p.settled = state.t;
  const stake = p.give.cash ? p.give.cash : stakeOf(state.cfg, p);
  give(ctx, p.from, 'promise_kept', { move: 'promise_kept', scale: Math.min(1, stake / state.cfg.promises.stakeUnit) });
  pushHistory(state.agents[p.from], state.t, 'promise_kept');
  ctx.events.push({ type: 'promise_kept', id: p.id, from: p.from, to: p.to, give: p.give, made: p.made });
  interact(ctx, p.from, p.to, 'friendly', 'promise_kept');
  trust(state, p.from, p.to, { kind: 'kept', give: p.give });
  const what = p.give.cash ? `$${p.give.cash}` : `the ${p.give.item}`;
  moment(state, ctx, 'promise_kept', [p.from, p.to], 1, `${name(state, p.from)} kept a promise: paid ${name(state, p.to)} ${what}, promised ${clockText(state.cfg, p.made)}`, { give: p.give, made: p.made });
  (ctx.settled[p.from] ??= []).push({ to: p.to, give: p.give, made: p.made });
}

function applySell(state, ctx, a, s) {
  const cfg = state.cfg;
  const good = s.good === 'gun' ? 'guns' : s.good;
  if (!GOODS.includes(good)) { ctx.talk[a.id].sell = null; return; }
  const qty = Math.min(Math.floor(s.qty ?? 0), a.stock[good]);
  if (qty < 1) { ctx.talk[a.id].sell = null; return; }
  if (s.to === 'npc') {
    let cash = 0;
    for (let i = 0; i < qty; i++) {
      const bid = wholesaleBid(state, good);
      cash += bid;
      state.wholesaleSold[good] += 1;
      ctx.events.push({ type: 'trade', buyer: 'npc', seller: a.id, good, qty: 1, price: bid });
    }
    a.stock[good] -= qty;
    a.cash += round2(cash);
    ctx.talk[a.id].sell = { good, qty, to: 'npc', cash: round2(cash) };
    return;
  }
  if (!cfg.systems.board) { ctx.talk[a.id].sell = null; return; }
  const price = Math.max(1, Math.round(Number(s.price) || 0));
  a.stock[good] -= qty;
  const l = { id: state.board.nextId++, seller: a.id, good, qty, price, listed: state.t, expires: state.t + cfg.board.listingHours };
  state.board.listings.push(l);
  ctx.events.push({ type: 'listing', id: l.id, seller: a.id, good, qty, price });
  ctx.talk[a.id].sell = { good, qty, price };
}

// A called shot is recorded whatever the menu says (×2 fans and −0.15 odds within the window), but it pulls a cop
// only when that move against that target is on the caller's menu this hour (round 1: no free snitching).
function applyCallShot(state, ctx, a, c, menu) {
  const target = state.agents[c.target];
  if (!target || target.id === a.id || typeof c.move !== 'string') { ctx.talk[a.id].callShot = null; return; }
  const line = menu.find(l => l.id === c.move);
  const ids = line ? (Array.isArray(line.targets) ? line.targets.map(x => (typeof x === 'object' ? x.id : x)) : []) : [];
  const pull = !!line && ids.includes(c.target);
  const shot = { agent: a.id, move: c.move, target: c.target, until: state.t + state.cfg.audience.callShotHours - 1, announced: state.t, used: false, pull };
  state.callShots.push(shot);
  ctx.events.push({ type: 'call_shot', agent: a.id, move: c.move, target: c.target, until: shot.until, pull });
  ctx.talk[a.id].callShot = { move: c.move, target: c.target };
}

// ---------- step 4: agent vs agent ----------

const AVA_RESOLVERS = {
  mug(state, ctx, id, act) {
    const cfg = state.cfg;
    const A = cfg.actions.mug;
    const a = state.agents[id];
    const bad = targetCheck(state, id, act.target, [a.block]);
    payEnergy(a, A.energy);
    if (bad) return done(state, ctx, id, false, bad, { text: `went to mug ${name(state, act.target)}, but ${gone(state, act.target, bad)}` });
    const tg = state.agents[act.target];
    const armed = hasGun(a);
    const odds = clampOdds(cfg, A.odds + (armed ? A.gunBonus : 0) + (aloneWith(state, id, tg.id, a.block) ? A.loneWorker : 0) + (hasGun(tg) ? A.targetGun : 0) + (isFlashing(state, tg) ? cfg.odds.flashingTarget : 0) - callShotPenalty(state, id, 'mug', tg.id));
    if (armed) a.gunSeenUntil = state.t + cfg.gunVisibleHours - 1;
    const win = chance(state, ctx, 'mug', id, odds);
    addStars(state, ctx, a, A.stars + (armed ? A.armedExtraStars : 0), 'mug');
    interact(ctx, id, tg.id, 'hostile', 'mug');
    incoming(ctx, tg.id, id, 'mug', win ? 'lost' : 'won');
    if (win) {
      let took = null, cash = 0;
      const want = act.args?.take;
      if (want && want !== 'cash' && takeItem(state, tg, a, want === 'gun' ? 'guns' : want)) took = want;
      else {
        cash = Math.min(Math.floor(tg.cash), Math.max(A.takeMin, Math.floor(tg.cash * A.takePct)));
        tg.cash -= cash;
        a.cash += cash;
      }
      ctx.events.push({ type: 'transfer', from: tg.id, to: id, cash, item: took, cause: 'mug' });
      // Memory says exactly what happened (round 3): a failed mug never reads "mugged you".
      grudge(state, tg.id, id, took ? `mugged you and took your ${took}` : `mugged you for $${cash}`, 'mugging');
      const v = steal(state, ctx, tg.id, id, A.steal, 'mug');
      give(ctx, id, 'mug_win', { move: 'mug', win: true, target: tg.id });
      const bounty = collectBounties(state, ctx, id, tg.id, 'mug');
      return done(state, ctx, id, true, null, { text: `mugged ${tg.name} ${at(a.block)}: took ${took ? `their ${took}` : `$${cash}`}`, outcome: 'win', cash, item: took, viewers: round2(v), bounty, odds: round2(odds) });
    }
    payEnergy(a, A.loseEnergy);
    grudge(state, tg.id, id, 'tried to mug you and failed', 'mugging');
    const v = steal(state, ctx, id, tg.id, A.loseSteal, 'mug_defend');
    give(ctx, id, 'mug_lose', { move: 'mug', target: tg.id });
    return done(state, ctx, id, false, 'lost', { text: `tried to mug ${tg.name} ${at(a.block)} and got beaten off`, outcome: 'lose', viewers: -round2(v), odds: round2(odds) });
  },

  steal_car(state, ctx, id, act) {
    const cfg = state.cfg;
    const A = cfg.actions.steal_car;
    const a = state.agents[id];
    const bad = targetCheck(state, id, act.target, [a.block]);
    payEnergy(a, A.energy);
    if (bad) return done(state, ctx, id, false, bad, { text: `went for ${name(state, act.target)}'s car, but ${gone(state, act.target, bad)}` });
    const tg = state.agents[act.target];
    if (!hasCar(tg)) return done(state, ctx, id, false, 'no_car', { text: `went for ${tg.name}'s car, but they had no car` });
    const odds = clampOdds(cfg, A.agentOdds + (aloneWith(state, id, tg.id, a.block) ? A.loneWorker : 0) - callShotPenalty(state, id, 'steal_car', tg.id));
    const win = chance(state, ctx, 'steal_car', id, odds);
    addStars(state, ctx, a, A.agentStars, 'steal_car');
    grudge(state, tg.id, id, win ? 'stole your car' : 'tried to steal your car and failed', 'car theft');
    interact(ctx, id, tg.id, 'hostile', 'steal_car');
    incoming(ctx, tg.id, id, 'steal_car', win ? 'lost' : 'won');
    if (win) {
      tg.gear.car -= 1;
      a.gear.car += 1;
      ctx.events.push({ type: 'transfer', from: tg.id, to: id, cash: 0, item: 'car', cause: 'steal_car' });
      give(ctx, id, 'steal_car_win', { move: 'steal_car', win: true, target: tg.id });
      return done(state, ctx, id, true, null, { text: `stole ${tg.name}'s car ${at(a.block)}`, outcome: 'win', item: 'car', odds: round2(odds) });
    }
    return done(state, ctx, id, false, 'lost', { text: `tried to steal ${tg.name}'s car and failed`, outcome: 'fail', odds: round2(odds) });
  },

  fistfight(state, ctx, id, act) {
    const A = state.cfg.actions.fistfight;
    const a = state.agents[id];
    const bad = targetCheck(state, id, act.target, [a.block]);
    if (bad) {
      payEnergy(a, A.energy);
      return done(state, ctx, id, false, bad, { text: `looked for a fight with ${name(state, act.target)}, but ${gone(state, act.target, bad)}` });
    }
    // Both picked a fistfight against each other this hour: one fight, resolved once (round 1).
    const mutual = isMutual(ctx, id, act.target, 'fistfight');
    const r = fight(state, ctx, id, act.target, mutual ? 'mutual' : 'action');
    if (mutual) {
      const tg = state.agents[act.target];
      done(state, ctx, tg.id, !r.win, r.win ? 'lost' : null, { text: `${r.win ? 'lost a fight to' : 'beat'} ${a.name} ${at(tg.block)} (both came looking for it)`, outcome: r.win ? 'lose' : 'win', mutual: true, viewers: -r.result.viewers, odds: round2(1 - r.result.odds) });
    } else incoming(ctx, act.target, id, 'fistfight', r.win ? 'lost' : 'won');
    return done(state, ctx, id, r.win, r.win ? null : 'lost', { ...r.result, ...(mutual ? { mutual: true, text: `${r.result.text} (both came looking for it)` } : {}) });
  },

  shoot(state, ctx, id, act) {
    const cfg = state.cfg;
    const A = cfg.actions.shoot;
    const a = state.agents[id];
    const bad = targetCheck(state, id, act.target, [a.block]);
    payEnergy(a, A.energy);
    a.gunSeenUntil = state.t + cfg.gunVisibleHours - 1;
    if (bad) return done(state, ctx, id, false, bad, { text: `came to shoot ${name(state, act.target)}, but ${gone(state, act.target, bad)}` });
    const tg = state.agents[act.target];
    const odds = clampOdds(cfg, A.odds + (hasArmor(tg) ? A.armor : 0) + (aloneWith(state, id, tg.id, a.block) ? A.loneWorker : 0) - callShotPenalty(state, id, 'shoot', tg.id));
    const hit = chance(state, ctx, 'shoot', id, odds);
    grudge(state, tg.id, id, hit ? 'shot you' : 'shot at you and missed', 'shooting');
    interact(ctx, id, tg.id, 'hostile', 'shoot');
    incoming(ctx, tg.id, id, 'shoot', hit ? 'lost' : 'won');
    if (hit) {
      addStars(state, ctx, a, A.hitStars, 'shoot');
      const v = steal(state, ctx, tg.id, id, A.steal, 'shoot');
      hospitalize(state, ctx, tg.id, id);
      give(ctx, id, 'shoot_hit', { move: 'shoot', win: true, target: tg.id });
      const bounty = collectBounties(state, ctx, id, tg.id, 'shoot');
      moment(state, ctx, 'shooting', [id, tg.id], 3, `${a.name} shot ${tg.name} ${at(a.block)}`);
      return done(state, ctx, id, true, null, { text: `shot ${tg.name} ${at(a.block)} and put them in hospital`, outcome: 'hit', viewers: round2(v), bounty, odds: round2(odds) });
    }
    addStars(state, ctx, a, A.missStars, 'shoot');
    give(ctx, id, 'shoot_miss', { move: 'shoot', target: tg.id });
    moment(state, ctx, 'shooting', [id, tg.id], 2, `${a.name} shot at ${tg.name} ${at(a.block)} and missed`);
    return done(state, ctx, id, false, 'missed', { text: `shot at ${tg.name} and missed`, outcome: 'miss', odds: round2(odds) });
  },

  drive_by(state, ctx, id, act) {
    const cfg = state.cfg;
    const A = cfg.actions.drive_by;
    const a = state.agents[id];
    const bad = targetCheck(state, id, act.target, adjacent(a.block));
    payEnergy(a, A.energy);
    a.gunSeenUntil = state.t + cfg.gunVisibleHours - 1;
    if (bad) return done(state, ctx, id, false, bad, { text: `rolled past for ${name(state, act.target)}, but ${gone(state, act.target, bad)}` });
    const tg = state.agents[act.target];
    const odds = clampOdds(cfg, A.odds + (hasArmor(tg) ? A.armor : 0) - callShotPenalty(state, id, 'drive_by', tg.id));
    const hit = chance(state, ctx, 'drive_by', id, odds);
    addStars(state, ctx, a, A.stars, 'drive_by');
    ctx.getaway[id] = { bonus: cfg.cops.getawayDriveBy, force: false };
    grudge(state, tg.id, id, hit ? 'drove by and shot you' : 'drove by shooting at you and missed', 'drive-by');
    interact(ctx, id, tg.id, 'hostile', 'drive_by');
    incoming(ctx, tg.id, id, 'drive_by', hit ? 'lost' : 'won');
    if (hit) {
      const v = steal(state, ctx, tg.id, id, A.steal, 'drive_by');
      hospitalize(state, ctx, tg.id, id);
      give(ctx, id, 'drive_by_hit', { move: 'drive_by', win: true, target: tg.id });
      const bounty = collectBounties(state, ctx, id, tg.id, 'drive_by');
      moment(state, ctx, 'drive_by', [id, tg.id], 3, `${a.name} hit ${tg.name} in a drive-by ${at(tg.block)}`);
      return done(state, ctx, id, true, null, { text: `hit ${tg.name} in a drive-by ${at(tg.block)}`, outcome: 'hit', viewers: round2(v), bounty, odds: round2(odds) });
    }
    moment(state, ctx, 'drive_by', [id, tg.id], 2, `${a.name} sprayed ${the(tg.block)} at ${tg.name} and missed`);
    return done(state, ctx, id, false, 'missed', { text: `missed ${tg.name} in a drive-by ${at(tg.block)}`, outcome: 'miss', odds: round2(odds) });
  },

  kill_king(state, ctx, id, act) {
    const cfg = state.cfg;
    const A = cfg.actions.kill_king;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    a.gunSeenUntil = state.t + cfg.gunVisibleHours - 1;
    if (act.target !== ctx.kingAtStart) return done(state, ctx, id, false, 'not_the_king', { text: `went for ${name(state, act.target)}, but they weren't the king` });
    const bad = targetCheck(state, id, act.target, [a.block]);
    if (bad) return done(state, ctx, id, false, bad, { text: `hunted the king, ${name(state, act.target)}, but ${gone(state, act.target, bad)}` });
    const tg = state.agents[act.target];
    const odds = clampOdds(cfg, A.odds + (hasArmor(tg) ? A.armor : 0) + (aloneWith(state, id, tg.id, a.block) ? A.alone : 0) - callShotPenalty(state, id, 'kill_king', tg.id));
    const win = chance(state, ctx, 'kill_king', id, odds);
    interact(ctx, id, tg.id, 'hostile', 'kill_king');
    incoming(ctx, tg.id, id, 'kill_king', win ? 'lost' : 'won');
    if (hasCar(a)) ctx.getaway[id] = { bonus: 0, force: win };
    else if (win) ctx.forceArrest[id] = 'kill_king';
    if (win) {
      addStars(state, ctx, a, A.stars, 'kill_king');
      const v = steal(state, ctx, tg.id, id, A.steal, 'kill_king');
      const want = act.args?.take;
      const order = [want, 'gun', 'fit', 'chain', 'grill', 'armor'].filter(Boolean);
      let took = null;
      for (const it of order) if (takeItem(state, tg, a, it === 'gun' ? 'guns' : it)) { took = it; break; }
      if (took) ctx.events.push({ type: 'transfer', from: tg.id, to: id, cash: 0, item: took, cause: 'kill_king' });
      const bounty = collectBounties(state, ctx, id, tg.id, 'kill_king');
      endHosting(state, ctx, tg.id);
      tg.state = 'dead';
      const R = cfg.revive;
      tg.until = state.t + Math.max(R.min, R.base - Math.floor(totalViewers(tg) / R.perViewers));
      ctx.events.push({ type: 'death', agent: tg.id, by: id, until: tg.until });
      interruptPending(ctx, tg.id);
      grudge(state, tg.id, id, 'killed you', 'killing');
      give(ctx, id, 'kill_king_win', { move: 'kill_king', win: true, target: tg.id });
      moment(state, ctx, 'king_killed', [id, tg.id], 5, `${a.name} killed the king, ${tg.name}, ${at(a.block)}`);
      return done(state, ctx, id, true, null, { text: `killed the king, ${tg.name}, ${at(a.block)}${took ? ` and took their ${took}` : ''}`, outcome: 'win', viewers: round2(v), item: took, bounty, odds: round2(odds) });
    }
    addStars(state, ctx, a, A.failStars, 'kill_king');
    grudge(state, tg.id, id, 'tried to kill you and missed', 'attempt on your life');
    give(ctx, id, 'kill_king_fail', { move: 'kill_king', target: tg.id });
    moment(state, ctx, 'king_attempt', [id, tg.id], 4, `${a.name} tried to kill the king, ${tg.name}, and failed`);
    return done(state, ctx, id, false, 'failed', { text: `tried to kill the king, ${tg.name}, and failed`, outcome: 'fail', odds: round2(odds) });
  },

  battle(state, ctx, id, act) {
    const cfg = state.cfg;
    const A = cfg.actions.battle;
    const a = state.agents[id];
    const bad = targetCheck(state, id, act.target, [a.block]);
    if (bad) {
      payEnergy(a, A.energy);
      return done(state, ctx, id, false, bad, { text: `called a battle with ${name(state, act.target)}, but ${gone(state, act.target, bad)}` });
    }
    const tg = state.agents[act.target];
    const mutual = isMutual(ctx, id, tg.id, 'battle');
    // Rolled on the start-of-hour energies, before anyone pays, so the menu's odds are the real odds.
    const r = rng(state.seed, 'battle', state.t, id);
    const score = x => r() + (flashValueOf(cfg, x) / 100) * A.flashBonusPer100 + ctx.startEnergy[x.id] / 100;
    const sa = score(a), st = score(tg);
    const win = sa >= st;
    payEnergy(a, A.energy);
    if (mutual) payEnergy(tg, A.energy);
    const [w, l] = win ? [a, tg] : [tg, a];
    const v = steal(state, ctx, l.id, w.id, A.steal, 'battle');
    give(ctx, id, win ? 'battle_win' : 'battle_lose', { move: 'battle', win, target: tg.id });
    give(ctx, tg.id, win ? 'battle_lose' : 'battle_win', mutual ? { move: 'battle', win: !win, target: id } : { win: !win, target: id });
    interact(ctx, id, tg.id, 'rival', 'battle', { both: mutual });
    ctx.events.push({ type: 'battle', a: id, b: tg.id, winner: w.id, mutual });
    if (mutual) done(state, ctx, tg.id, !win, win ? 'lost' : null, { text: `${win ? 'lost' : 'won'} a dance/rap battle (no violence) against ${a.name} ${at(tg.block)} (both called it)`, outcome: win ? 'lose' : 'win', mutual: true, viewers: round2(win ? -v : v) });
    else incoming(ctx, tg.id, id, 'battle', win ? 'lost' : 'won');
    return done(state, ctx, id, win, win ? null : 'lost', { text: `${win ? 'won' : 'lost'} a dance/rap battle (no violence) against ${tg.name} ${at(a.block)}${mutual ? ' (both called it)' : ''}`, outcome: win ? 'win' : 'lose', viewers: round2(win ? v : -v), ...(mutual ? { mutual: true } : {}) });
  },

  call_out(state, ctx, id, act) {
    const cfg = state.cfg;
    const A = cfg.actions.call_out;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    const tg = state.agents[act.target];
    if (!tg || tg.state === 'dead') return done(state, ctx, id, false, 'target_dead', { text: 'nobody to call out' });
    const block = act.args?.block && isWalkable(act.args.block) ? act.args.block : a.block;
    const c = { id: `c${state.seq.callOut++}`, caller: id, target: tg.id, block, made: state.t, until: state.t + A.hours, status: 'open', targetShowed: false, callerShowed: false };
    state.callOuts.push(c);
    give(ctx, id, 'call_out', { move: 'call_out', target: tg.id });
    interact(ctx, id, tg.id, 'hostile', 'call_out');
    incoming(ctx, tg.id, id, 'call_out_made', 'open');
    ctx.events.push({ type: 'call_out', id: c.id, caller: id, target: tg.id, block, until: c.until });
    const when = c.made + 1 > state.seasonLength - 1 ? ', but the season ends first' : `, any hour from ${clockText(cfg, c.made + 1)} ${untilText(state, c.until)}`;
    return done(state, ctx, id, true, null, { text: `called out ${tg.name} to a fight ${at(block)}${when}`, block, until: c.until });
  },

  bounty(state, ctx, id, act) {
    const cfg = state.cfg;
    const A = cfg.actions.bounty;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    const tg = state.agents[act.target];
    const amount = Math.min(Math.floor(a.cash), Math.max(A.min, Math.floor(act.args?.amount ?? A.min)));
    if (!tg || tg.state === 'dead') return done(state, ctx, id, false, 'target_dead', { text: 'no bounty: the target is dead' });
    if (amount < A.min) return done(state, ctx, id, false, 'no_cash', { text: `couldn't cover a $${A.min} bounty` });
    a.cash -= amount;
    const b = { id: `b${state.seq.bounty++}`, poster: id, target: tg.id, amount, posted: state.t, revealAt: state.t + A.revealHours, status: 'open', revealed: false };
    state.bounties.push(b);
    give(ctx, id, 'bounty_posted', { move: 'bounty', target: tg.id });
    interact(ctx, id, tg.id, 'hostile', 'bounty');
    ctx.events.push({ type: 'bounty_posted', id: b.id, poster: id, target: tg.id, amount });
    moment(state, ctx, 'bounty_posted', [tg.id], Math.min(5, Math.ceil(amount / 100)), `A $${amount} bounty went up on ${tg.name}`);
    return done(state, ctx, id, true, null, { text: `put a $${amount} bounty on ${tg.name}`, cash: -amount, amount });
  },
};

// Did the target pick the same move against the actor this hour (still pending)? Then it's one mutual fight.
function isMutual(ctx, id, targetId, move) {
  const t = ctx.acts[targetId];
  return !!t && t.status === 'pending' && t.move === move && t.target === id && !t.failed;
}

// A fistfight: an action ('action'), both picked it against each other ('mutual'), or a met call-out ('callout').
// The odds use the start-of-hour energies and are rolled before anyone pays energy, so the menu's odds are the real
// odds. The attacker always pays the fistfight's energy; in a mutual fight or a met call-out both do. Both sides score
// through outcomePoints as a fistfight (boredom and revenge apply). Returns { win, result }.
function fight(state, ctx, id, targetId, mode) {
  const cfg = state.cfg;
  const A = cfg.actions.fistfight;
  const a = state.agents[id];
  const tg = state.agents[targetId];
  const odds = clampOdds(cfg, A.odds + (ctx.startEnergy[id] - ctx.startEnergy[targetId]) / A.energyDiffDiv + (aloneWith(state, id, tg.id, a.block) ? A.loneWorker : 0) - callShotPenalty(state, id, 'fistfight', tg.id));
  const win = chance(state, ctx, `fight-${mode}`, id, odds);
  const [w, l] = win ? [a, tg] : [tg, a];
  payEnergy(a, A.energy);
  if (mode !== 'action') payEnergy(tg, A.energy);
  payEnergy(l, A.loseEnergy);
  const cause = mode === 'callout' ? 'call_out' : 'fistfight';
  const v = steal(state, ctx, l.id, w.id, A.steal, cause);
  addStars(state, ctx, a, A.stars, 'fistfight');
  if (mode === 'mutual') addStars(state, ctx, tg, A.stars, 'fistfight');
  if (mode === 'action') grudge(state, tg.id, id, win ? 'jumped you' : 'jumped you and lost the fight', 'ambush');
  grudge(state, l.id, w.id, 'beat you in a fight', 'fight');
  interact(ctx, id, tg.id, 'hostile', cause, { both: mode !== 'action' });
  give(ctx, id, win ? 'fistfight_win' : 'fistfight_lose', { move: 'fistfight', win, target: tg.id });
  give(ctx, tg.id, win ? 'fistfight_lose' : 'fistfight_win', mode === 'action' ? { win: !win, target: id } : { move: 'fistfight', win: !win, target: id });
  if (mode === 'callout') {
    // Neither picked the fight as this hour's action, but both fought: it counts toward boredom.
    for (const x of [a, tg]) { x.history.push({ t: state.t, move: 'fistfight' }); if (x.history.length > 30) x.history.shift(); }
  }
  const bounty = collectBounties(state, ctx, w.id, l.id, 'fistfight');
  ctx.events.push({ type: 'fight', a: id, b: tg.id, winner: w.id, cause, mode });
  return { win, result: { text: `${win ? 'beat' : 'lost a fight to'} ${tg.name} ${at(a.block)}`, outcome: win ? 'win' : 'lose', viewers: round2(win ? v : -v), bounty: win ? bounty : 0, odds: round2(odds) } };
}

function resolveCrate(state, ctx) {
  const cfg = state.cfg;
  const c = state.crate;
  const contestants = state.ids.filter(id => ctx.acts[id]?.move === 'crate' && ctx.acts[id].status === 'pending');
  if (!contestants.length) return;
  const valid = [];
  for (const id of contestants) {
    const a = state.agents[id];
    if (a.state !== 'free') { interruptPending(ctx, id); continue; }
    if (!c || c.block !== a.block || c.won) { payEnergy(a, cfg.actions.crate.energy); done(state, ctx, id, false, 'crate_gone', { text: 'the crate was gone' }); continue; }
    valid.push(id);
  }
  if (!valid.length) return;
  const A = cfg.actions.crate;
  const weights = valid.map(id => { const a = state.agents[id]; return 1 + (hasGun(a) ? A.gunWeight : 0) + a.energy / A.energyDiv; });
  const r = rng(state.seed, 'crate-draw', state.t)();
  let x = r * weights.reduce((s, w) => s + w, 0);
  let k = 0;
  while (k < valid.length - 1 && x >= weights[k]) { x -= weights[k]; k++; }
  const winner = valid[k];
  for (const id of valid) {
    const a = state.agents[id];
    payEnergy(a, A.energy + A.contestEnergy);
    addStars(state, ctx, a, A.stars, 'crate');
  }
  const w = state.agents[winner];
  const got = c.contents;
  if (got.kind === 'cash') w.cash += got.cash;
  else if (got.kind === 'gun') w.stock.guns += 1;
  else w.gear[got.item] += 1;
  c.won = true;
  ctx.events.push({ type: 'crate_won', agent: winner, contents: got, contestants: valid.slice(), block: c.block });
  for (const id of valid) {
    if (id === winner) give(ctx, id, 'crate_win', { move: 'crate', win: true });
    else give(ctx, id, 'crate_contest', { move: 'crate' });
    if (id !== winner) interact(ctx, id, winner, 'hostile', 'crate');
  }
  const what = got.kind === 'cash' ? `$${got.cash}` : got.kind === 'gun' ? 'a gun' : `a ${got.item}`;
  if (valid.length >= 3) moment(state, ctx, 'crate_brawl', valid.slice(), Math.min(5, valid.length), `${valid.length}-way brawl over the crate ${at(c.block)}; ${w.name} walked off with ${what}`);
  for (const id of valid) {
    const won = id === winner;
    done(state, ctx, id, won, won ? null : 'lost', { text: won ? `won the crate ${at(c.block)}: ${what}` : `lost the crate brawl to ${w.name}`, outcome: won ? 'win' : 'lose', contestants: valid.length, ...(won ? { contents: got } : {}) });
  }
}

// ---------- step 5: agent vs world ----------

const WORLD_RESOLVERS = {
  run(state, ctx, id, act) {
    const A = state.cfg.actions.run;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    const good = act.args?.good === 'parts' ? 'parts' : 'chems';
    a.stock[good] += A.yields[good];
    if (chance(state, ctx, 'run-heat', id, A.heatChance)) addStars(state, ctx, a, 1, 'run');
    else a.crimeToday = true;
    give(ctx, id, 'run', { move: 'run' });
    ctx.events.push({ type: 'produce', agent: id, good, qty: A.yields[good], from: 'run' });
    done(state, ctx, id, true, null, { text: `smuggled ${A.yields[good]} ${good} in at the docks`, good, qty: A.yields[good] });
  },
  cook(state, ctx, id) {
    const A = state.cfg.actions.cook;
    const a = state.agents[id];
    if (a.stock.chems < A.input.chems || a.evicted || a.block !== 'home') { payEnergy(a, A.energy); return done(state, ctx, id, false, 'missing_input', { text: 'nothing to cook' }); }
    payEnergy(a, A.energy);
    a.stock.chems -= A.input.chems;
    a.stock.product += A.output.product;
    if (chance(state, ctx, 'cook-heat', id, A.heatChance)) addStars(state, ctx, a, 1, 'cook');
    else a.crimeToday = true;
    give(ctx, id, 'cook', { move: 'cook' });
    ctx.events.push({ type: 'produce', agent: id, good: 'product', qty: A.output.product, from: 'cook', used: { chems: A.input.chems } });
    done(state, ctx, id, true, null, { text: `cooked ${A.output.product} product`, good: 'product', qty: A.output.product });
  },
  deal(state, ctx, id) {
    const A = state.cfg.actions.deal;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    if (a.stock.product < 1) return done(state, ctx, id, false, 'missing_input', { text: 'nothing to deal' });
    const n = (ctx.dealersOn[a.block] ?? []).filter(o => state.agents[o].state === 'free' && state.agents[o].block === a.block).length;
    const others = Math.max(0, n - 1);
    const factor = Math.max(A.crowdFloor, 1 - A.crowdCut * others);
    const qty = Math.min(A.maxQty, a.stock.product);
    const cash = Math.round(qty * A.price * factor);
    a.stock.product -= qty;
    a.cash += cash;
    const cop = ctx.startCops[a.block] > 0;
    if (cop) addStars(state, ctx, a, A.copStars, 'deal');
    else if (chance(state, ctx, 'deal-heat', id, A.heatChance)) addStars(state, ctx, a, 1, 'deal');
    else a.crimeToday = true;
    give(ctx, id, 'deal', { move: 'deal' });
    ctx.events.push({ type: 'deal', agent: id, block: a.block, qty, cash, factor: round2(factor), others });
    done(state, ctx, id, true, null, { text: `sold ${qty} product for $${cash}`, why: others ? `${others} other dealer${others > 1 ? 's' : ''} here: $${round2(A.price * factor)} a unit instead of $${A.price}` : 'nobody else dealing here', qty, cash, factor: round2(factor) });
  },
  build(state, ctx, id) {
    const A = state.cfg.actions.build;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    if (a.stock.parts < A.input.parts || a.evicted || a.block !== 'home') return done(state, ctx, id, false, 'missing_input', { text: 'nothing to build' });
    a.stock.parts -= A.input.parts;
    a.stock.guns += 1;
    if (chance(state, ctx, 'build-heat', id, A.heatChance)) addStars(state, ctx, a, 1, 'build');
    else a.crimeToday = true;
    give(ctx, id, 'build', { move: 'build' });
    ctx.events.push({ type: 'produce', agent: id, good: 'guns', qty: 1, from: 'build', used: { parts: A.input.parts } });
    done(state, ctx, id, true, null, { text: 'built a gun', good: 'guns', qty: 1 });
  },
  shift(state, ctx, id) {
    const A = state.cfg.actions.shift;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    a.cash += A.pays;
    give(ctx, id, 'shift', { move: 'shift' });
    done(state, ctx, id, true, null, { text: `worked a shift ${at(a.block)}: +$${A.pays}`, cash: A.pays });
  },
  pickpocket(state, ctx, id) {
    const cfg = state.cfg;
    const A = cfg.actions.pickpocket;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    const odds = clampOdds(cfg, A.odds);
    const r = rng(state.seed, 'pickpocket', state.t, id);
    const win = r() < odds;
    a.crimeToday = true;
    if (win) {
      const cash = A.cashMin + Math.floor(r() * (A.cashMax - A.cashMin + 1));
      a.cash += cash;
      if (r() < A.winHeatChance) addStars(state, ctx, a, 1, 'pickpocket');
      give(ctx, id, 'pickpocket_win', { move: 'pickpocket', win: true });
      return done(state, ctx, id, true, null, { text: `lifted $${cash} ${at(a.block)}`, outcome: 'win', cash });
    }
    addStars(state, ctx, a, A.failStars, 'pickpocket');
    give(ctx, id, 'pickpocket_fail', { move: 'pickpocket' });
    done(state, ctx, id, false, 'caught', { text: `got caught with a hand in a pocket ${at(a.block)}`, outcome: 'fail' });
  },
  push_npc(state, ctx, id) {
    const A = state.cfg.actions.push_npc;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    a.crimeToday = true;
    if (chance(state, ctx, 'push-heat', id, A.heatChance)) addStars(state, ctx, a, 1, 'push_npc');
    give(ctx, id, 'push_npc', { move: 'push_npc' });
    done(state, ctx, id, true, null, { text: `shoved a stranger around ${at(a.block)}` });
  },
  steal_car(state, ctx, id) {
    const cfg = state.cfg;
    const A = cfg.actions.steal_car;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    const odds = clampOdds(cfg, A.streetOdds);
    const win = chance(state, ctx, 'steal_car_street', id, odds);
    if (win) {
      a.gear.car += 1;
      addStars(state, ctx, a, A.streetWinStars, 'steal_car');
      give(ctx, id, 'steal_car_win', { move: 'steal_car', win: true });
      ctx.events.push({ type: 'gear', agent: id, item: 'car', from: 'street', price: 0 });
      return done(state, ctx, id, true, null, { text: `boosted a car off the street ${at(a.block)}`, outcome: 'win', item: 'car' });
    }
    addStars(state, ctx, a, A.streetFailStars, 'steal_car');
    done(state, ctx, id, false, 'failed', { text: 'tried to boost a car and set off the alarm', outcome: 'fail' });
  },
  scout(state, ctx, id) {
    const A = state.cfg.actions.scout;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    a.scouting = Math.min(A.max, round2(a.scouting + A.bonus));
    done(state, ctx, id, true, null, { text: 'scouted the bank for the next job', scouting: a.scouting });
  },
  bank_job(state, ctx, id) {
    const cfg = state.cfg;
    const A = cfg.actions.bank_job;
    const a = state.agents[id];
    payEnergy(a, A.energy);
    a.gunSeenUntil = state.t + cfg.gunVisibleHours - 1;
    const odds = clampOdds(cfg, A.odds + a.scouting);
    a.scouting = 0;
    const r = rng(state.seed, 'bank', state.t, id);
    const win = r() < odds;
    addStars(state, ctx, a, A.stars, 'bank_job');
    if (hasCar(a)) ctx.getaway[id] = { bonus: 0, force: win, failRoll: win ? 0 : A.failArrestChance };
    else if (win) ctx.forceArrest[id] = 'bank_job';
    if (win) {
      const cash = A.cashMin + Math.floor(r() * (A.cashMax - A.cashMin + 1));
      a.cash += cash;
      give(ctx, id, 'bank_job_win', { move: 'bank_job', win: true });
      moment(state, ctx, 'bank_job_win', [id], 4, `${a.name} hit the bank for $${cash}`);
      return done(state, ctx, id, true, null, { text: `robbed the bank: $${cash}`, outcome: 'win', cash, odds: round2(odds) });
    }
    give(ctx, id, 'bank_job_fail', { move: 'bank_job' });
    moment(state, ctx, 'bank_job_fail', [id], 3, `${a.name}'s bank job went wrong`);
    done(state, ctx, id, false, 'failed', { text: 'botched the bank job', outcome: 'fail', odds: round2(odds) });
  },
  buy(state, ctx, id, act) {
    // A buy that can't resolve costs no energy (round 1); energy is paid only when something changes hands.
    const cfg = state.cfg;
    const a = state.agents[id];
    const item = act.args?.item;
    const from = act.args?.from ?? buyFrom(item);
    let qty = Math.max(1, Math.min(cfg.actions.buy.maxQty, Math.floor(act.args?.qty ?? 1)));
    if (from === 'shop') {
      if (a.block !== 'market' || !GEAR.includes(item)) return done(state, ctx, id, false, 'not_in_shop', { text: `the shop doesn't sell ${item}` });
      if (FLASH.includes(item) && !cfg.systems.flash) return done(state, ctx, id, false, 'not_in_shop', { text: 'no flash for sale' });
      const price = cfg.shop[item];
      if (item !== 'gun') qty = 1;
      if (a.cash >= price) payEnergy(a, cfg.actions.buy.energy);
      let bought = 0;
      for (let i = 0; i < qty && a.cash >= price; i++) {
        a.cash -= price;
        if (item === 'gun') a.stock.guns += 1;
        else a.gear[item] += 1;
        bought++;
        ctx.events.push({ type: 'gear', agent: id, item, from: 'shop', price });
      }
      if (!bought) return done(state, ctx, id, false, 'no_cash', { text: `couldn't afford a ${item}` });
      return done(state, ctx, id, true, null, { text: `bought ${bought > 1 ? `${bought} ${item}s` : `a ${item}`} at the shop for $${price * bought}`, item, qty: bought, cash: -price * bought });
    }
    const good = item === 'gun' ? 'guns' : item;
    if (!GOODS.includes(good)) return done(state, ctx, id, false, 'not_on_board', { text: `${item} isn't sold on the board` });
    if (a.cash >= bestAsk(state, good, id).price) payEnergy(a, cfg.actions.buy.energy);
    let bought = 0, spent = 0;
    const sellers = new Set();
    for (let i = 0; i < qty; i++) {
      const ask = bestAsk(state, good, id);
      if (a.cash < ask.price) break;
      // Atomic swap: cash and goods move together, or nothing moves.
      if (ask.seller === 'npc') {
        a.cash -= ask.price;
        a.stock[good] += 1;
      } else {
        const listing = state.board.listings.filter(l => l.good === good && l.seller === ask.seller && l.price === ask.price && l.qty > 0).sort((x, y) => x.id - y.id)[0];
        const seller = state.agents[listing.seller];
        a.cash -= ask.price;
        seller.cash += ask.price;
        listing.qty -= 1;
        a.stock[good] += 1;
        sellers.add(seller.id);
      }
      spent += ask.price;
      bought++;
      ctx.events.push({ type: 'trade', buyer: id, seller: ask.seller, good, qty: 1, price: ask.price });
      if (good === 'guns') ctx.events.push({ type: 'gear', agent: id, item: 'gun', from: ask.seller === 'npc' ? 'supplier' : 'agent', price: ask.price });
    }
    state.board.listings = state.board.listings.filter(l => l.qty > 0);
    for (const s of [...sellers].sort()) interact(ctx, id, s, 'trade', 'board', { both: true });
    if (!bought) return done(state, ctx, id, false, 'no_cash', { text: `couldn't afford ${good}` });
    done(state, ctx, id, true, null, { text: `bought ${bought} ${good} on the board for $${spent}${sellers.size ? ` from ${[...sellers].map(s => name(state, s)).join(', ')}` : ''}`, item: good, qty: bought, cash: -spent, sellers: [...sellers].sort() });
  },
  crip_walk(state, ctx, id) {
    const a = state.agents[id];
    payEnergy(a, state.cfg.actions.crip_walk.energy);
    give(ctx, id, 'crip_walk', { move: 'crip_walk' });
    done(state, ctx, id, true, null, { text: `crip walked through ${the(a.block)}` });
  },
  drip_check(state, ctx, id) {
    const cfg = state.cfg;
    const a = state.agents[id];
    const fv = flashValueOf(cfg, a);
    if (fv <= 0) return done(state, ctx, id, false, 'no_flash', { text: 'had no jewelry to show off' });
    payEnergy(a, cfg.actions.drip_check.energy);
    give(ctx, id, 'drip_check', { move: 'drip_check', scale: fv / 100 });
    a.flashingUntil = state.t + 1;
    const fvNow = flashValueOf(cfg, a);
    done(state, ctx, id, true, null, { text: `ran a drip check ${at(a.block)}, showing off their ${['chain', 'grill', 'fit'].filter(f => a.gear[f] > 0).join(' and ')}`, flash: fvNow });
  },
  party(state, ctx, id) {
    const cfg = state.cfg;
    const A = cfg.actions.party;
    const a = state.agents[id];
    if (a.cash < A.cost || partyOn(state, a.block)) { payEnergy(a, A.energy); return done(state, ctx, id, false, a.cash < A.cost ? 'no_cash' : 'party_here', { text: 'the party fell through' }); }
    payEnergy(a, A.energy);
    a.cash -= A.cost;
    a.state = 'partying';
    a.until = state.t + A.hours - 1;
    const p = { host: id, block: a.block, start: state.t, until: a.until, active: true, guests: [], momentDone: false };
    state.parties.push(p);
    ctx.events.push({ type: 'party_start', host: id, block: a.block, until: p.until });
    done(state, ctx, id, true, null, { text: `threw a party ${at(a.block)}`, cash: -A.cost });
  },
  rest(state, ctx, id) {
    const a = state.agents[id];
    a.energy = Math.min(state.cfg.energy.max, a.energy + state.cfg.energy.rest);
    const act = ctx.acts[id];
    if (act.failed) {
      act.status = 'done';
      act.ok = false;
      act.why = act.failWhy;
      act.result = { text: 'stood around' };
      return;
    }
    done(state, ctx, id, true, null, { text: 'rested' });
  },
  lay_low(state, ctx, id) {
    const cfg = state.cfg;
    const a = state.agents[id];
    if (a.stars > 0 && state.t - a.lastLayLow >= cfg.heat.layLowCooldown) {
      a.stars -= cfg.actions.lay_low.stars;
      a.lastLayLow = state.t;
      ctx.events.push({ type: 'heat', agent: id, stars: -1, total: a.stars, cause: 'lay_low' });
      return done(state, ctx, id, true, null, { text: 'laid low and shook off a star', stars: -1 });
    }
    done(state, ctx, id, true, null, { text: 'laid low' });
  },
};

function partyTicks(state, ctx) {
  const cfg = state.cfg;
  for (const p of state.parties) {
    if (!p.active) continue;
    const host = state.agents[p.host];
    if (host.state !== 'partying' || host.block !== p.block) { p.active = false; continue; }
    const guests = presentOn(state, p.block).filter(id => id !== p.host);
    const first = p.start === state.t;
    // The host's brand (round 3) reaches every hour of the party and its guests, as the menu's party fans promise.
    const brand = brandMult(cfg, host.sliders, 'party');
    const branded = pts => Object.fromEntries(GROUPS.map(g => [g, pts[g] * brand]));
    const hourPts = first ? outcomePoints(state, ctx, host, 'party_hour', { move: 'party' }).points : branded(basePoints(cfg, 'party_hour'));
    addPoints(ctx, p.host, hourPts);
    if (guests.length) addPoints(ctx, p.host, branded(basePoints(cfg, 'party_attendee', guests.length)));
    for (const g of guests) {
      const a = state.agents[g];
      a.energy = Math.min(cfg.energy.max, a.energy + cfg.energy.partyGuest);
      if (!p.guests.includes(g)) {
        p.guests.push(g);
        interact(ctx, g, p.host, 'friendly', 'party', { both: false });
        trust(state, g, p.host, { kind: 'party' });
      }
    }
    ctx.events.push({ type: 'party_tick', host: p.host, block: p.block, guests: guests.slice() });
    if (!p.momentDone && guests.length >= cfg.actions.party.momentGuests) {
      p.momentDone = true;
      moment(state, ctx, 'party', [p.host, ...guests], Math.min(5, guests.length), `${host.name}'s party ${at(p.block)} pulled ${guests.length} guests`);
    }
  }
}

// ---------- step 6: call-outs ----------

function resolveCallOuts(state, ctx) {
  const cfg = state.cfg;
  for (const c of state.callOuts) {
    if (c.status !== 'open' || c.made === state.t) continue; // the window starts the hour after the call-out
    const caller = state.agents[c.caller];
    const target = state.agents[c.target];
    const here = x => (x.state === 'free' || x.state === 'partying') && x.block === c.block;
    const callerHere = here(caller);
    const targetHere = here(target);
    if (targetHere) c.targetShowed = true;
    if (callerHere) c.callerShowed = true;
    if (callerHere && targetHere) {
      c.status = 'met';
      const r = fight(state, ctx, c.caller, c.target, 'callout');
      const winner = r.win ? c.caller : c.target;
      ctx.events.push({ type: 'callout_met', id: c.id, caller: c.caller, target: c.target, block: c.block, winner });
      incoming(ctx, c.target, c.caller, 'call_out', r.win ? 'lost' : 'won');
      incoming(ctx, c.caller, c.target, 'call_out_answered', r.win ? 'won' : 'lost');
      moment(state, ctx, 'callout_answered', [c.caller, c.target], 3, `${target.name} answered ${caller.name}'s call-out ${at(c.block)}: ${name(state, winner)} won the fight`);
      continue;
    }
    if (state.t >= c.until) {
      // Only the target can duck (SPEC §4.3): it never showed, though it was free to. A target in jail, in hospital or
      // dead at the deadline couldn't come; a caller who never came just lets the call-out lapse.
      if (!c.targetShowed && target.state === 'free') {
        c.status = 'ducked';
        c.ducker = c.target;
        // Round 3 (R3.3): the ducked viewers walk away to the unassigned pool, so calling out the king every hour no
        // longer farms them; the caller keeps only its call_out points. Off: they go to the caller (round 2).
        const away = cfg.systems.duckWalkAway;
        if (away) walkAway(state, ctx, c.target, cfg.actions.call_out.duckSteal, 'ducked');
        else if (caller.state !== 'dead') steal(state, ctx, c.target, c.caller, cfg.actions.call_out.duckSteal, 'ducked');
        ctx.events.push({ type: 'callout_ducked', id: c.id, caller: c.caller, target: c.target, ducker: c.target, block: c.block, walkAway: !!away });
        moment(state, ctx, 'callout_ducked', [c.target, c.caller], 2, `${target.name} ducked ${caller.name}'s call-out ${at(c.block)}`, { block: c.block, made: c.made });
      } else {
        c.status = 'lapsed';
        ctx.events.push({ type: 'callout_lapsed', id: c.id, caller: c.caller, target: c.target, block: c.block, targetShowed: c.targetShowed, callerShowed: c.callerShowed });
      }
    }
  }
}

// ---------- step 7: cops ----------

function resolveCops(state, ctx) {
  const cfg = state.cfg;
  const C = cfg.cops;
  const t = state.t;
  // run_cops
  for (const id of state.ids) {
    const act = ctx.acts[id];
    if (!act || act.move !== 'run_cops' || act.status !== 'pending') continue;
    const a = state.agents[id];
    if (a.state !== 'free') { interruptPending(ctx, id); continue; }
    payEnergy(a, cfg.actions.run_cops.energy);
    const odds = clampOdds(cfg, cfg.actions.run_cops.odds + (hasCar(a) ? cfg.actions.run_cops.carBonus : 0));
    const r = rng(state.seed, 'run_cops', t, id);
    a.crimeToday = true;
    if (r() < odds) {
      ctx.safe.add(id);
      const opts = adjacent(a.block);
      const to = opts[Math.floor(r() * opts.length)] ?? a.block;
      const from = a.block;
      a.block = to;
      give(ctx, id, 'run_cops_win', { move: 'run_cops', win: true });
      moment(state, ctx, 'escape', [id], 2, `${a.name} ran from the cops ${at(from)} and got away`);
      done(state, ctx, id, true, null, { text: `outran the cops: slipped from ${the(from)} to ${the(to)}`, outcome: 'win', from, to });
    } else {
      give(ctx, id, 'run_cops_fail', { move: 'run_cops' });
      done(state, ctx, id, false, 'caught', { text: 'ran from the cops and got caught', outcome: 'fail' });
      if (cfg.systems.cops) arrest(state, ctx, id, cfg.actions.run_cops.extraJail, 'run_cops');
    }
  }
  // getaway rolls
  const forced = { ...ctx.forceArrest };
  for (const id of Object.keys(ctx.getaway).sort()) {
    const g = ctx.getaway[id];
    const a = state.agents[id];
    if (a.state !== 'free') continue;
    let ok = false;
    if (cfg.systems.getaway && hasCar(a)) {
      ok = rng(state.seed, 'getaway', t, id)() < clampOdds(cfg, C.getawayBase + g.bonus);
      ctx.events.push({ type: 'getaway', agent: id, ok });
    }
    if (ok) ctx.safe.add(id);
    else if (g.force) forced[id] = 'no_getaway';
    else if (g.failRoll && rng(state.seed, 'bank-arrest', t, id)() < g.failRoll) forced[id] = 'bank_job';
  }
  if (!cfg.systems.cops) return;
  // cop movement
  const lookFrom = t - C.lookback + 1;
  const heat = {};
  for (const h of state.heatLog) if (h.t >= lookFrom && h.t <= t && isWalkable(h.block)) heat[h.block] = (heat[h.block] ?? 0) + h.stars;
  state.heatLog = state.heatLog.filter(h => h.t >= t - C.lookback);
  const r = rng(state.seed, 'cops', t);
  const hot = shuffle(r, WALKABLE).filter(b => heat[b] > 0).sort((x, y) => heat[y] - heat[x]);
  const pulled = new Set();
  for (const shot of state.callShots.filter(c => c.announced === t && c.pull)) {
    const tb = state.agents[shot.target]?.block;
    if (!tb || !isWalkable(tb)) continue;
    const free = state.cops.filter(c => !pulled.has(c.id)).sort((x, y) => dist(x.block, tb) - dist(y.block, tb) || (x.id < y.id ? -1 : 1));
    if (!free.length) break;
    const cop = free[0];
    pulled.add(cop.id);
    const from = cop.block;
    cop.block = stepToward(cop.block, tb, C.speed);
    ctx.events.push({ type: 'cop_move', cop: cop.id, from, to: cop.block, why: 'call_shot' });
  }
  let i = 0;
  for (const cop of state.cops) {
    if (pulled.has(cop.id)) continue;
    const from = cop.block;
    if (hot.length) cop.block = stepToward(cop.block, hot[Math.min(i++, hot.length - 1)], C.speed);
    else if (C.speed >= 1) {
      const opts = adjacent(cop.block);
      cop.block = opts[Math.floor(r() * opts.length)] ?? cop.block;
    }
    if (cop.block !== from) ctx.events.push({ type: 'cop_move', cop: cop.id, from, to: cop.block, why: hot.length ? 'heat' : 'patrol' });
  }
  // arrests
  for (const id of state.ids) {
    const a = state.agents[id];
    if ((a.state !== 'free' && a.state !== 'partying') || ctx.safe.has(id) || ctx.arrested.has(id)) continue;
    if (forced[id]) { arrest(state, ctx, id, 0, forced[id]); continue; }
    if (a.stars >= cfg.heat.max) { arrest(state, ctx, id, 0, 'five_stars'); continue; }
    if (a.stars >= cfg.heat.wanted && copsOn(state, a.block) > 0) {
      const p = C.arrest[a.stars] ?? 0;
      if (rng(state.seed, 'arrest', t, id)() < p) arrest(state, ctx, id, 0, 'cop_on_block');
    }
  }
}

function arrest(state, ctx, id, extra, cause) {
  const cfg = state.cfg;
  const a = state.agents[id];
  endHosting(state, ctx, id);
  const fine = Math.floor(a.cash * cfg.cops.fine);
  a.cash -= fine;
  const stars = a.stars;
  a.stars = 0;
  a.state = 'jail';
  a.until = state.t + cfg.cops.jailHours + extra;
  const from = a.block;
  a.block = 'jail';
  ctx.arrested.add(id);
  interruptPending(ctx, id);
  give(ctx, id, 'arrested');
  ctx.events.push({ type: 'arrest', agent: id, stars, fine, until: a.until, cause, block: from });
  // The public line never shows the fine (it would leak the agent's cash); the typed fine is for the play-by-play.
  moment(state, ctx, 'arrest', [id], Math.min(5, stars || 3), `${a.name} was arrested ${at(from)}${stars ? ` with ${stars} stars` : ''}`, { fine, stars, cause });
}

// ---------- step 8: world events ----------

function worldEvents(state, ctx) {
  const cfg = state.cfg;
  const t = state.t;
  // The crate.
  if (state.crate && (state.crate.won || state.crate.until <= t)) {
    if (!state.crate.won) ctx.events.push({ type: 'crate_expired', block: state.crate.block });
    state.crate = null;
  }
  if (cfg.systems.crate && !state.crate && t >= state.nextCrate && t < state.seasonLength - 1) {
    const r = rng(state.seed, 'crate', t);
    const blocks = WALKABLE.slice();
    const ws = blocks.map(b => cfg.crate.weights[b] ?? 1);
    let x = r() * ws.reduce((s, w) => s + w, 0);
    let k = 0;
    while (k < blocks.length - 1 && x >= ws[k]) { x -= ws[k]; k++; }
    const roll = r();
    const C = cfg.crate;
    let contents;
    if (roll < C.contents.cash) contents = { kind: 'cash', cash: C.cashMin + Math.floor(r() * (C.cashMax - C.cashMin + 1)) };
    else if (roll < C.contents.cash + C.contents.gun) contents = { kind: 'gun' };
    else contents = { kind: 'flash', item: FLASH[Math.floor(r() * FLASH.length)] };
    state.crate = { block: blocks[k], until: t + C.stays, contents, dropped: t, won: false };
    state.nextCrate = t + C.every + Math.floor(r() * (2 * C.jitter + 1)) - C.jitter;
    ctx.events.push({ type: 'crate_drop', block: blocks[k], until: state.crate.until, contents });
  }
  // Parties end.
  for (const p of state.parties) {
    if (p.active && p.until <= t) {
      p.active = false;
      const host = state.agents[p.host];
      if (host.state === 'partying') { host.state = 'free'; host.until = null; }
      ctx.events.push({ type: 'party_end', host: p.host, block: p.block, guests: p.guests.length });
    }
  }
  state.parties = state.parties.filter(p => p.active || p.start >= t - 24);
  // Releases and revives.
  for (const id of state.ids) {
    const a = state.agents[id];
    if ((a.state === 'hospital' || a.state === 'jail') && a.until <= t) {
      const from = a.state;
      a.state = 'free';
      a.until = null;
      a.block = from === 'jail' ? 'precinct' : 'home';
      ctx.events.push({ type: 'release', agent: id, from });
    } else if (a.state === 'dead' && a.until <= t) {
      a.state = 'free';
      a.until = null;
      a.block = 'home';
      ctx.events.push({ type: 'revive', agent: id });
      moment(state, ctx, 'revive', [id], 3, `${a.name} is back from the dead`);
    }
  }
  // Bounty posters revealed.
  for (const b of state.bounties) {
    if (!b.revealed && b.revealAt <= t) {
      b.revealed = true;
      ctx.events.push({ type: 'bounty_revealed', id: b.id, poster: b.poster, target: b.target, amount: b.amount });
      grudge(state, b.target, b.poster, `put a $${b.amount} bounty on you`, 'bounty');
      const fate = b.status === 'collected' ? `, the one ${name(state, b.collector)} collected ${clockText(cfg, b.collectedAt)}` : ', still uncollected';
      moment(state, ctx, 'bounty_revealed', [b.poster, b.target], 2, `The town learns ${name(state, b.poster)} posted the $${b.amount} bounty on ${name(state, b.target)}${fate}`, { amount: b.amount, posted: b.posted, collector: b.collector ?? null, collectedAt: b.collectedAt ?? null });
    }
  }
  // Promise deadlines.
  for (const p of state.promises) {
    if (p.status === 'open' && p.by <= t) {
      p.status = 'broken';
      p.settled = t;
      // The breaker's points scale with the stake (drama 4 per $100) and get boredom like an action (round 1).
      const stake = stakeOf(cfg, p);
      const unit = cfg.promises.stakeUnit;
      give(ctx, p.from, 'promise_broken_breaker', { move: 'promise_broken', scale: Math.min(cfg.promises.breakerMaxScale, stake / unit) });
      pushHistory(state.agents[p.from], t, 'promise_broken');
      give(ctx, p.to, 'promise_broken_victim', { scale: Math.min(1, stake / unit) });
      grudge(state, p.to, p.from, `broke a promise (${p.give.cash ? `$${p.give.cash}` : p.give.item})`, 'broken promise');
      ctx.events.push({ type: 'promise_broken', id: p.id, from: p.from, to: p.to, give: p.give, paid: p.paid });
      ctx.events.push({ type: 'interaction', a: p.from, b: p.to, kind: 'hostile', cause: 'promise_broken' });
      moment(state, ctx, 'promise_broken', [p.from, p.to], 3, `${name(state, p.from)} broke a promise to ${name(state, p.to)}`);
    }
  }
  // Board listings expire back to the seller.
  for (const l of state.board.listings) {
    if (l.expires <= t && l.qty > 0) {
      state.agents[l.seller].stock[l.good] += l.qty;
      ctx.events.push({ type: 'listing_expired', id: l.id, seller: l.seller, good: l.good, qty: l.qty });
      l.qty = 0;
    }
  }
  state.board.listings = state.board.listings.filter(l => l.qty > 0);
  state.callShots = state.callShots.filter(c => c.until > t && !c.used);
}

// ---------- step 9 extras ----------

function detectComebacks(state, ctx, ranks) {
  const n = state.ids.length;
  const W = state.cfg.report.comebackWindow;
  const hist = state.rankHistory;
  for (const id of state.ids) {
    if (ranks[id] >= 3 || totalViewers(state.agents[id]) <= 0) continue;
    if ((state.lastComeback[id] ?? -999) > state.t - W) continue;
    const from = Math.max(0, hist.length - 1 - W);
    let was = false;
    for (let i = from; i < hist.length - 1; i++) if (hist[i][id] >= n - 3) { was = true; break; }
    if (was) {
      state.lastComeback[id] = state.t;
      moment(state, ctx, 'comeback', [id], 3, `${name(state, id)} climbed from the bottom 3 to the top 3`);
    }
  }
}

// ---------- step 12: wrap-up ----------

function wrapUp(state, ctx, hashes) {
  const cfg = state.cfg;
  const t = state.t;
  const clock = clockOf(cfg, t);
  const agents = [];
  const dealt = {};
  for (const id of state.ids) {
    const a = state.agents[id];
    const act = ctx.acts[id];
    const tk = ctx.talk[id];
    let entry;
    if (act) {
      if (act.status === 'pending') { act.status = 'done'; act.ok = false; act.why = act.why ?? 'unresolved'; act.result = act.result ?? { text: 'nothing happened' }; }
      const why = act.failed ? act.failWhy : act.why ?? null;
      entry = { id, block: a.block, move: act.move, target: act.target ?? null, args: act.args ?? {}, ok: !!act.ok, failed: !!act.failed, why, result: act.result ?? null };
      if (act.failed && act.asked) entry.asked = act.asked;
      a.lastMove = act.move;
      a.last = { move: act.move, ok: !!act.ok, result: act.result?.text ?? '', why: act.failed ? `${replyWhy(act.failWhy)}, so you rested` : act.result?.why ?? (act.why ? whyText(act.why) : '') };
      a.results.push({ hour: t, move: act.move, ok: !!act.ok, text: act.result?.text ?? '' });
      if (a.results.length > 10) a.results.shift();
      if (act.move === 'deal' && act.ok) (dealt[a.block] ??= []).push(id);
      if (act.target && act.status === 'done' && !act.failed) ctx.involved.add(id);
    } else {
      // No action this hour: the state it started the hour in (jail, hospital, dead, hosting a party).
      entry = { id, block: a.block, move: null, target: null, args: {}, ok: false, failed: false, why: ctx.startState[id], result: null };
      a.lastMove = null;
    }
    const tv = totalViewers(a);
    entry.meters = { energy: Math.round(a.energy), cash: Math.round(a.cash), stars: a.stars, viewers: Math.round(tv), byGroup: Object.fromEntries(GROUPS.map(g => [g, Math.round(a.viewers[g])])), viewerHours: Math.round(a.viewerHours) };
    entry.state = a.state;
    entry.thought = tk?.thought ?? '';
    entry.say = tk?.say ?? '';
    entry.message = tk?.message ?? null;
    entry.sell = tk?.sell ?? null;
    entry.callShot = tk?.callShot ?? null;
    entry.fans = Object.fromEntries(GROUPS.map(g => [g, round2(ctx.points[id]?.[g] ?? 0)]));
    entry.delta = Math.round(tv - ctx.startViewers[id]);
    entry.acting = !!act; // a free agent with a menu this hour
    if (ctx.incoming[id]) entry.incoming = ctx.incoming[id]; // what others did to this agent this hour
    entry.involved = ctx.involved.has(id);
    entry.viewHash = hashes?.[id] ?? null;
    a.lastSayBlock = a.block;
    if (!tk) a.lastSay = '';
    agents.push(entry);
  }
  state.dealtLastHour = dealt;
  buildAlerts(state, ctx);
  state.lastMoves = Object.fromEntries(state.ids.map(id => [id, ctx.acts[id]?.move ?? null]));
  // Messages sent this hour are delivered at the start of the next.
  for (const id of state.ids) state.agents[id].inbox = [];
  for (const m of state.outbox) {
    const to = state.agents[m.to];
    to.inbox.push({ from: m.from, text: m.text, cash: m.cash, item: m.item, promise: m.promise, hour: m.hour });
    for (const [x, y] of [[m.to, m.from], [m.from, m.to]]) {
      const conv = (state.agents[x].conversations[y] ??= []);
      conv.push({ hour: m.hour, from: m.from, text: m.text });
      if (conv.length > cfg.memory.perCounterpart) conv.shift();
    }
  }
  state.outbox = [];
  // Headlines for next hour.
  // Ducked call-outs always make the headlines (round 2: ducking is public); then the biggest moments.
  const heads = ctx.moments.slice().sort((x, y) => (y.type === 'callout_ducked') - (x.type === 'callout_ducked') || y.size - x.size).map(m => m.line);
  if (state.king) heads.push(`${state.agents[state.king].name} is the king`);
  state.headlines = heads.slice(0, cfg.view.headlines);
  const line = {
    seed: state.seed, day: clock.day, hour: clock.hour, t,
    agents,
    events: ctx.events,
    moments: ctx.moments,
    audience: { pools: roundGroups(state.pools), unassigned: roundGroups(state.unassigned), served: roundGroups(state.servedLastHour) },
    cops: state.cops.map(c => ({ id: c.id, block: c.block })),
    crate: state.crate ? { block: state.crate.block, until: state.crate.until } : null,
    king: state.king,
  };
  return line;
}

const roundGroups = g => Object.fromEntries(GROUPS.map(k => [k, round2(g[k])]));

// ---------- round 3 (R3.2): alerts ----------

// How serious each kind of alert is: the view lists the most serious first.
const ALERT_RANK = { killed: 100, shot: 90, kill_attempt: 85, shot_at: 80, mugged: 70, car_stolen: 65, beaten: 60, promise_broken: 55, bounty: 50, ducked: 45, fought_off: 40, mug_failed: 35, car_failed: 30, called_out: 25, bounty_revealed: 20 };

// Last hour's acts against each agent as plain past-tense lines (name and id, outcome, cost), most serious first, kept
// on the agent for the next view (which is built from the start-of-hour state). Built from typed facts only: the
// actors' results and this hour's events. A failed attempt reads as one ("tried to mug you and failed").
function buildAlerts(state, ctx) {
  const cfg = state.cfg;
  const out = Object.fromEntries(state.ids.map(id => [id, []]));
  const add = (id, kind, text) => out[id]?.push({ rank: ALERT_RANK[kind], text });
  const who = id => `${name(state, id)} (${id})`;
  const viewers = v => (Math.round(v) > 0 ? `${Math.round(v)} viewers` : null);
  const lost = (...bits) => { const b = bits.filter(Boolean); return b.length ? `you lost ${b.join(' and ')}` : null; };
  const tail = (...bits) => { const b = bits.filter(Boolean); return b.length ? `: ${b.join(', ')}` : ''; };
  const bounty = b => (b > 0 ? `they collected the $${b} bounty on you` : null);
  const F = cfg.actions.fistfight;
  const fightEnergy = mode => `${F.loseEnergy + (mode === 'action' ? 0 : F.energy)} energy`;
  const moved = (type, from, cause) => ctx.events.filter(e => e.type === type && e.from === from && e.cause === cause).reduce((s, e) => s + e.viewers, 0);
  // Hostile acts that reached their target (a target that had left, was in hospital or jail never saw them).
  for (const id of state.ids) {
    const act = ctx.acts[id];
    const r = act?.result;
    if (!act || act.failed || !act.target || !HOSTILE.has(act.move) || !r || act.status !== 'done') continue;
    const by = who(id), tg = act.target, o = r.outcome;
    switch (act.move) {
      case 'mug':
        if (o === 'win') add(tg, 'mugged', `${by} ${r.item ? `mugged you and took your ${r.item}` : `mugged you for $${r.cash}`}${tail(lost(viewers(r.viewers)), bounty(r.bounty))}.`);
        else if (o === 'lose') add(tg, 'mug_failed', `${by} tried to mug you and failed.`);
        break;
      case 'steal_car':
        if (o === 'win') add(tg, 'car_stolen', `${by} stole your car.`);
        else if (o === 'fail') add(tg, 'car_failed', `${by} tried to steal your car and failed.`);
        break;
      case 'fistfight': {
        const mode = r.mutual ? 'mutual' : 'action';
        if (o === 'win') add(tg, 'beaten', `${by} ${r.mutual ? 'beat you in a fight you both picked' : 'jumped you and won the fight'}${tail(lost(fightEnergy(mode), viewers(r.viewers)), bounty(r.bounty))}.`);
        else if (o === 'lose') add(tg, 'fought_off', r.mutual ? `You beat ${by} in a fight you both picked.` : `${by} jumped you and lost the fight.`);
        break;
      }
      case 'shoot':
        if (o === 'hit') add(tg, 'shot', `${by} shot you${tail(`${cfg.hospital.hours} hours in hospital`, lost(viewers(r.viewers)), bounty(r.bounty))}.`);
        else if (o === 'miss') add(tg, 'shot_at', `${by} shot at you and missed.`);
        break;
      case 'drive_by':
        if (o === 'hit') add(tg, 'shot', `${by} hit you in a drive-by${tail(`${cfg.hospital.hours} hours in hospital`, lost(viewers(r.viewers)), bounty(r.bounty))}.`);
        else if (o === 'miss') add(tg, 'shot_at', `${by} drove by shooting at you and missed.`);
        break;
      case 'kill_king':
        if (o === 'win') add(tg, 'killed', `${by} killed you${tail(lost(viewers(r.viewers)), r.item ? `they took your ${r.item}` : null, bounty(r.bounty))}.`);
        else if (o === 'fail') add(tg, 'kill_attempt', `${by} tried to kill you and missed.`);
        break;
      case 'call_out':
        if (act.ok) add(tg, 'called_out', `${by} called you out to a fight ${at(r.block)}, any hour ${untilText(state, r.until)}; if you never show, ${Math.round(cfg.actions.call_out.duckSteal * 100)}% of your viewers ${cfg.systems.duckWalkAway ? 'walk away' : 'go to them'}.`);
        break;
      case 'bounty':
        // The poster stays secret until the town learns it (bounty_revealed below).
        if (act.ok) add(tg, 'bounty', `Someone put a $${r.amount} bounty on you.`);
        break;
      default: break;
    }
  }
  for (const ev of ctx.events) {
    if (ev.type === 'callout_met') {
      const loser = ev.winner === ev.caller ? ev.target : ev.caller;
      const cost = lost(fightEnergy('callout'), viewers(moved('steal', loser, 'call_out')));
      if (ev.winner === ev.caller) {
        add(ev.target, 'beaten', `${who(ev.caller)} beat you in the call-out fight ${at(ev.block)}${tail(cost)}.`);
        add(ev.caller, 'fought_off', `${who(ev.target)} answered your call-out ${at(ev.block)} and lost the fight.`);
      } else {
        add(ev.target, 'fought_off', `You beat ${who(ev.caller)} in the call-out fight ${at(ev.block)}.`);
        add(ev.caller, 'beaten', `${who(ev.target)} answered your call-out ${at(ev.block)} and beat you${tail(cost)}.`);
      }
    } else if (ev.type === 'callout_ducked') {
      const n = viewers(ev.walkAway ? moved('walk_away', ev.target, 'ducked') : moved('steal', ev.target, 'ducked'));
      add(ev.target, 'ducked', `You ducked ${who(ev.caller)}'s call-out ${at(ev.block)}${n ? `: ${n} ${ev.walkAway ? 'walked away' : `went to ${name(state, ev.caller)}`}` : ''}.`);
    } else if (ev.type === 'promise_broken') {
      const p = state.promises.find(x => x.id === ev.id);
      const what = ev.give.cash ? `$${ev.give.cash}` : `the ${ev.give.item}`;
      add(ev.to, 'promise_broken', `${who(ev.from)} broke a promise to give you ${what}${p ? ` by ${clockText(cfg, p.by)}` : ''}${ev.paid > 0 && ev.give.cash ? ` (paid $${ev.paid} of it)` : ''}.`);
    } else if (ev.type === 'bounty_revealed') {
      add(ev.target, 'bounty_revealed', `${who(ev.poster)} turned out to be who put the $${ev.amount} bounty on you.`);
    }
  }
  for (const id of state.ids) {
    out[id].sort((x, y) => y.rank - x.rank); // stable: same rank keeps resolution order
    state.agents[id].alerts = out[id].slice(0, cfg.view.alerts).map(x => x.text);
  }
}

// ---------- step 11: day end ----------

export function dayEnd(state, line) {
  const cfg = state.cfg;
  const ctx = { state, t: state.t, events: line.events, moments: line.moments, points: {}, stolen: {}, kingAtStart: state.king, involved: new Set() };
  const day = clockOf(cfg, state.t).day;
  for (const id of state.ids) {
    const a = state.agents[id];
    if (cfg.systems.rent && a.state !== 'dead') {
      if (!a.evicted) {
        if (a.cash >= cfg.rent.amount) {
          a.cash -= cfg.rent.amount;
          ctx.events.push({ type: 'rent_paid', agent: id, amount: cfg.rent.amount });
        } else {
          a.evicted = true;
          a.backRent = cfg.rent.amount;
          ctx.events.push({ type: 'eviction', agent: id, cash: Math.round(a.cash), day });
          moment(state, ctx, 'eviction', [id], 2, `${a.name} couldn't make rent and got evicted`);
        }
      } else if (a.cash >= a.backRent + cfg.rent.amount + cfg.rent.rehouseFee) {
        // Coming home tonight: the back rent, tonight's rent and the fee.
        const paid = a.backRent + cfg.rent.amount + cfg.rent.rehouseFee;
        a.cash -= paid;
        a.evicted = false;
        a.backRent = 0;
        ctx.events.push({ type: 'rehoused', agent: id, paid });
      } else {
        // Back rent accrues every night an agent stays evicted (round 1).
        a.backRent += cfg.rent.amount;
        ctx.events.push({ type: 'rent_owed', agent: id, backRent: a.backRent });
      }
    }
    if (cfg.systems.heatDecay && !a.crimeToday && a.stars > 0) {
      a.stars = Math.max(0, a.stars - cfg.heat.dailyDecay);
      ctx.events.push({ type: 'heat', agent: id, stars: -cfg.heat.dailyDecay, total: a.stars, cause: 'day_decay' });
    }
    a.crimeToday = false;
    if (a.state === 'partying') { endHosting(state, ctx, id); }
    if (a.state === 'free') a.block = a.evicted ? 'park' : 'home';
    if (a.state !== 'dead') a.energy = Math.min(cfg.energy.max, a.energy + (a.evicted && a.state === 'free' ? cfg.energy.sleepEvicted : cfg.energy.sleep));
    if (cfg.systems.nightThieves && a.evicted && a.state === 'free' && rng(state.seed, 'night', day, id)() < cfg.rent.nightTheftChance) {
      const took = Math.floor(a.cash * cfg.rent.nightTheftPct);
      if (took > 0) {
        a.cash -= took;
        ctx.events.push({ type: 'night_theft', agent: id, cash: took });
      }
    }
  }
  for (const p of state.parties) p.active = false;
  for (const g of GOODS) state.wholesaleSold[g] = 0;
  state.dealtLastHour = {};
  // Agents' meters in the line reflect the night.
  for (const e of line.agents) {
    const a = state.agents[e.id];
    e.meters.cash = Math.round(a.cash);
    e.meters.energy = Math.round(a.energy);
    e.meters.stars = a.stars;
    e.state = a.state;
    e.block = a.block;
  }
  line.dayEnd = true;
}

// Season end: uncollected bounties are refunded to their posters.
export function seasonEnd(state, line) {
  for (const b of state.bounties) {
    if (b.status === 'open') {
      b.status = 'refunded';
      state.agents[b.poster].cash += b.amount;
      line.events.push({ type: 'bounty_refunded', id: b.id, poster: b.poster, target: b.target, amount: b.amount });
    }
  }
}

export { actingHoursPerDay, crowdOf, JOB_ACTION, dist };
