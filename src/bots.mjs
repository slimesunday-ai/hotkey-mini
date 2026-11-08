// Bots (SPEC §8): free, instant, deterministic. A bot sees only its view (exactly what an AI seat sees) plus the
// static config and its own seeded stream; it never reads hidden state.
// - characters (hothead, hustler, showboat, snake, saint): preset action weights plus canned thought/say/message lines;
// - turtle: always the safest legal action (shift, job, rest, lay low) — the control;
// - greedy: scores every menu line/option with odds × (pays + k·Σfans + v·steals) − e·energy − h·heat and takes the best.
import { rng, shuffle, hash32 } from './rng.mjs';
import { GROUPS, JOB_ACTION } from './config.mjs';
import { dist } from './world.mjs';
import { lineValue, HOSTILE } from './menu.mjs';
import { clockLabel } from './state.mjs';

const VIOLENT = new Set([...HOSTILE, 'pickpocket', 'push_npc', 'crate', 'bank_job', 'steal_car']);

// Preset action weights per character (unlisted legal lines get `other`).
const PRESETS = {
  hothead: { brave: 12, w: { kill_king: 40, shoot: 9, drive_by: 7, fistfight: 7, mug: 4, call_out: 3, crate: 5, push_npc: 2, battle: 1, bounty: 1, run_cops: 6 }, job: 3, other: 0.3, gear: ['gun', 'car', 'armor'], seek: 'people', reply: 0.3, callShot: 0.25 },
  hustler: { brave: 5, w: { bank_job: 60, scout: 4, pickpocket: 4, mug: 3, steal_car: 4, crate: 3, shift: 1, run_cops: 6 }, job: 6, other: 0.3, gear: ['gun', 'car'], seek: 'bank', reply: 0.4, callShot: 0.05 },
  showboat: { brave: 10, w: { party: 7, drip_check: 5, crip_walk: 5, battle: 5, call_out: 3, push_npc: 1 }, job: 3, other: 0.3, gear: ['chain', 'fit', 'grill'], seek: 'crowd', reply: 0.5, callShot: 0 },
  snake: { brave: 1.5, w: { mug: 4, bounty: 3, pickpocket: 2, fistfight: 1, call_out: 1, steal_car: 1, run_cops: 4 }, job: 5, other: 0.3, gear: ['gun'], seek: 'marks', reply: 0.7, callShot: 0.05 },
  saint: { brave: 2, w: { party: 3, battle: 3, crip_walk: 2, shift: 2, drip_check: 1 }, job: 7, other: 0.2, gear: ['chain'], seek: 'crowd', reply: 0.8, callShot: 0, peaceful: true },
};

const LINES = {
  hothead: {
    say: ['Say it to my face.', 'This block is mine.', "Who's next?", 'Keep walking.', 'You looking at me?'],
    think: ['Somebody has to pay.', "Hit first, don't ask.", 'They think I forgot.', 'The crown should be mine.'],
    msg: ['You and me. Soon.', 'I remember what you did.', 'Watch your back tonight.'],
  },
  hustler: {
    say: ['Business is business.', 'Time is money.', 'Nothing personal.', 'Got a deal for you.'],
    think: ['Every hour is a payday.', 'The bank is the big one.', 'Stack it, then flex it.'],
    msg: ['Got product if you need it.', 'Work with me, we both eat.', 'I can move that for you.'],
  },
  showboat: {
    say: ['Cameras on me!', 'Watch this!', 'Too clean.', "Who's dancing?", 'Party tonight, everyone come.'],
    think: ['They love me.', 'Bigger. Louder.', 'Need more drip.'],
    msg: ['Come to my party.', 'Battle me if you dare.', 'You can be in my next clip.'],
  },
  snake: {
    say: ["We're friends, right?", 'Trust me.', 'I got you.', 'Relax, it is all good.'],
    think: ["They'll never see that money.", 'Smile, then strike.', 'Promises are cheap.', 'Keep them close.'],
    msg: ["I'll pay you back, swear.", 'Partners? I got your back.', 'Just between us.'],
  },
  saint: {
    say: ['Peace, everybody.', 'Need a hand?', 'Stay safe out there.', 'Good vibes only.'],
    think: ['Keep the peace.', 'Help where I can.', 'Kindness pays too.'],
    msg: ['Here, take this. No strings.', 'Rough day? This helps.', 'I keep my word.'],
  },
  turtle: { say: ['', '', 'Just working.'], think: ['Head down.', 'Rent first.', 'Not my business.'], msg: ['Leave me out of it.'] },
  greedy: { say: [''], think: ['Best line wins.', 'Numbers say so.'], msg: ['Deal?'] },
};

const pick = (r, list) => list[Math.floor(r() * list.length)];

// Greedy's thoughts: a short human line about the move it chose (no numbers, no ids). Picked by a hash of the agent
// and the hour, not from the bot's stream, so the choice of words never changes what the bot does.
const GREEDY_THOUGHTS = {
  shift: ['Honest money is still money.', 'Clock in, get paid.'],
  run: ['The docks are calling.', 'One more run before dark.'],
  cook: ['Time to cook.', 'Product does not make itself.'],
  deal: ['Move the product.', 'The corner is open for business.'],
  build: ['Another piece for the shelf.', 'Parts in, gun out.'],
  pickpocket: ['Light fingers, full pockets.', 'Nobody watches their wallet here.'],
  mug: ['They look like an easy mark.', 'Their pockets, my rent.'],
  steal_car: ['I need wheels.', 'That ride is mine now.'],
  scout: ['Learn the bank before you hit it.', 'Count the guards.'],
  bank_job: ['This is the big score.', 'In and out, with the bag.'],
  buy: ['Gear up.', 'Spend money to make money.'],
  push_npc: ['Make some noise.', 'Get their attention.'],
  crip_walk: ['Give them a show.', 'Feet do the talking.'],
  drip_check: ['Let them see the shine.', 'Dressed to be watched.'],
  party: ['Everybody to my place.', 'Throw it and they will come.'],
  battle: ['Time to prove who is better.', 'Let the crowd decide.'],
  call_out: ['Settle this in public.', 'Say it where everyone can hear.'],
  bounty: ['Let someone else do it.', 'Money talks.'],
  fistfight: ['Hands up.', 'This ends now.'],
  crate: ['That crate is mine.', 'Grab it before anyone else.'],
  shoot: ['No more talking.', 'They had this coming.'],
  drive_by: ['Roll past and let it rip.', 'Window down.'],
  kill_king: ['The crown is up for grabs.', 'Long live the new king.'],
  run_cops: ['Not going back inside.', 'Run now, explain later.'],
  move: ['Better plays elsewhere.', 'On the move.'],
  rest: ['Need to catch my breath.', 'Recharge first.'],
  lay_low: ['Keep my head down for a bit.', 'Let the heat cool off.'],
};
function greedyThought(view, move) {
  const list = GREEDY_THOUGHTS[move] ?? ['Best play right now.'];
  return list[hash32(`${view.you.id}|${view.clock.day}|${view.clock.hour}`) % list.length];
}

// The candidates a line offers: one per option (target/args/destination), or the line itself.
function candidates(line) {
  if (line.options?.length) return line.options.map(o => ({ line, opt: o, target: o.target ?? null, args: o.args ?? {} }));
  return [{ line, opt: line, target: null, args: defaultArgs(line) }];
}
function defaultArgs(line) {
  if (!line.args) return {};
  const out = {};
  for (const [k, spec] of Object.entries(line.args)) {
    if (Array.isArray(spec)) { const v = spec.find(x => x !== null); if (!spec.includes(null) && v !== undefined) out[k] = v; }
    else { const m = /^int (\d+)/.exec(String(spec)); if (m) out[k] = Number(m[1]); }
  }
  return out;
}

const reply = (move, target, args, extra = {}) => ({ move, target: target ?? null, args: args ?? {}, thought: '', say: '', message: null, sell: null, callShot: null, ...extra });

// ---------- shared economy (selling what you make) ----------

const OWN_INPUT = { chemist: 'chems', gunrunner: 'parts', dealer: 'product' };

function economyExtras(view, cfg, r) {
  const you = view.you;
  // List goods you don't use at the typical price; keep one gun.
  for (const good of ['chems', 'parts', 'product', 'guns']) {
    let have = you.stock[good] ?? 0;
    if (good === OWN_INPUT[you.job]) continue;
    if (good === 'guns') have -= 1;
    if (have <= 0) continue;
    const row = view.board.find(b => b.good === good);
    const bid = row?.bestBid ?? 0;
    if (you.cash < cfg.rent.amount && view.clock.hour >= 20) return { good, qty: have, to: 'npc' };
    // Undercut the cheapest ask (another agent's or the supplier's), never below the wholesaler's bid.
    const price = Math.min(Math.round(cfg.board.typical[good] * (1 + r() * 0.15)), (row?.bestAsk ?? cfg.board.supplier[good]) - 1);
    return { good, qty: have, price: Math.max(price, Math.ceil(bid) + 1) };
  }
  return null;
}

// ---------- job pipeline ----------

function moveToward(view, block) {
  const line = view.menu.find(l => l.id === 'move');
  if (!line || view.you.block === block) return null;
  let best = null;
  for (const o of line.options ?? []) if (!best || dist(o.args.to, block) < dist(best.args.to, block)) best = o;
  return best ? { line, target: null, args: { to: best.args.to } } : null;
}

const menuHas = (view, id) => view.menu.find(l => l.id === id);

function buyOption(view, item, from) {
  const line = menuHas(view, 'buy');
  if (!line) return null;
  const o = (line.options ?? []).find(x => x.args.item === item && (!from || x.args.from === from));
  return o ? { line, target: null, args: { ...o.args }, opt: o } : null;
}

function jobStep(view, cfg) {
  const you = view.you;
  const reserve = cfg.bots.reserve;
  const jobLine = menuHas(view, JOB_ACTION[you.job]);
  switch (you.job) {
    case 'smuggler': {
      if (jobLine) {
        const best = (jobLine.options ?? []).slice().sort((a, b) => b.pays - a.pays)[0];
        return { line: jobLine, target: null, args: best ? best.args : { good: 'chems' } };
      }
      return moveToward(view, 'docks');
    }
    case 'chemist': {
      if (you.stock.chems >= cfg.actions.cook.input.chems) return jobLine ? { line: jobLine, target: null, args: {} } : you.home === 'ok' ? moveToward(view, 'home') : null;
      const b = buyOption(view, 'chems', 'board');
      return b && you.cash - b.opt.cash >= reserve / 2 ? b : null;
    }
    case 'gunrunner': {
      if (you.stock.parts >= cfg.actions.build.input.parts) return jobLine ? { line: jobLine, target: null, args: {} } : you.home === 'ok' ? moveToward(view, 'home') : null;
      const b = buyOption(view, 'parts', 'board');
      return b && you.cash - b.opt.cash >= reserve / 2 ? b : null;
    }
    case 'dealer': {
      if (you.stock.product >= 1) {
        if (jobLine) return { line: jobLine, target: null, args: {} };
        const spots = cfg.actions.deal.where;
        const crowd = s => view.roster.filter(x => x.block === s && x.job === 'dealer').length * 3 + dist(you.block, s);
        const best = spots.slice().sort((a, b) => crowd(a) - crowd(b) || (a < b ? -1 : 1))[0];
        return moveToward(view, best);
      }
      const b = buyOption(view, 'product', 'board');
      return b && you.cash - b.opt.cash >= reserve / 2 ? b : null;
    }
    default:
      return null;
  }
}

// ---------- greedy ----------

export function greedyDecide(view, cfg, r) {
  const w = cfg.bots.greedy;
  if (view.talkOnly) return reply(null, null, null, { thought: 'Waiting it out.' });
  const all = shuffle(r, view.menu.flatMap(candidates));
  let best = null, bestV = -Infinity;
  for (const c of all) {
    let v;
    if (c.line.id === 'move') v = c.opt.next ? w.moveDiscount * Math.max(0, c.opt.next.value) - w.e * c.opt.energy : -w.e * c.opt.energy;
    else if (c.line.id === 'rest') v = view.you.energy < w.restBelow ? 1e6 : 0;
    else v = lineValue(cfg, c.opt, view.you.stars);
    if (v > bestV) { best = c; bestV = v; }
  }
  const out = reply(best.line.id, best.target, best.args, { thought: greedyThought(view, best.line.id) });
  out.sell = economyExtras(view, cfg, r);
  return out;
}

// ---------- turtle ----------

export function turtleDecide(view, cfg, r) {
  if (view.talkOnly) return reply(null, null, null, { thought: 'Wait it out.' });
  const you = view.you;
  const has = id => menuHas(view, id);
  const job = JOB_ACTION[you.job];
  let out;
  if (you.energy < 25 && has('rest')) out = reply('rest');
  else if (you.stars > 0 && has('lay_low') && has('lay_low').heatRisk < 0) out = reply('lay_low');
  else if (has('shift')) out = reply('shift');
  else if (has(job) && has(job).heatRisk <= 0.15) out = reply(job, null, candidates(has(job))[0].args);
  else {
    const m = moveToward(view, 'market');
    out = m ? reply('move', null, m.args) : reply('rest');
  }
  out.thought = pick(r, LINES.turtle.think);
  out.say = pick(r, LINES.turtle.say);
  return out;
}

// ---------- characters ----------

function prefTarget(view, kind, cands, r) {
  const roster = Object.fromEntries(view.roster.map(x => [x.id, x]));
  const grudges = new Set(view.memory.filter(m => m.kind === 'grudge').map(m => m.who));
  const crowdRank = { none: 0, some: 1, big: 2, city: 3 };
  const friends = new Set(view.conversations.map(c => c.with));
  const score = c => {
    const t = roster[c.target];
    if (!t) return 0;
    let s = 1 + (c.opt.odds ?? 0.5);
    if (t.king) s += kind === 'hothead' ? 4 : 1;
    if (grudges.has(c.target)) s += kind === 'saint' ? 0 : 3;
    s += crowdRank[t.crowd] * 0.5;
    if (t.bounty > 0) s += 2;
    if (kind === 'snake' && friends.has(c.target)) s += 3;
    return s + r() * 0.5;
  };
  return cands.slice().sort((a, b) => score(b) - score(a))[0];
}

function weightedPick(r, items) {
  const total = items.reduce((s, x) => s + x.w, 0);
  if (total <= 0) return null;
  let x = r() * total;
  for (const it of items) { if (x < it.w) return it; x -= it.w; }
  return items[items.length - 1];
}

function seekBlock(view, kind) {
  const you = view.you;
  const count = b => view.roster.filter(x => x.block === b && x.state === 'free').length;
  const blocks = ['market', 'bank', 'corner', 'bar', 'park', 'docks'];
  if (kind === 'bank') return you.items.includes('gun') && you.car ? 'bank' : 'market';
  if (kind === 'people') {
    const king = view.roster.find(x => x.king);
    if (king && you.items.includes('gun') && king.state === 'free' && king.block !== 'jail') return king.block;
    const grudge = view.memory.find(m => m.kind === 'grudge');
    const g = grudge && view.roster.find(x => x.id === grudge.who && x.state === 'free');
    if (g && g.block !== 'jail') return g.block;
  }
  if (kind === 'marks') {
    const friends = new Set(view.conversations.map(c => c.with));
    const f = view.roster.find(x => friends.has(x.id) && x.state === 'free' && x.block !== 'jail');
    if (f) return f.block;
  }
  return blocks.slice().sort((a, b) => count(b) - count(a) || (a < b ? -1 : 1))[0];
}

export function characterDecide(view, cfg, r, kind, seed = 0) {
  const P = PRESETS[kind];
  const L = LINES[kind];
  const you = view.you;
  const extras = { thought: pick(r, L.think), say: r() < 0.5 ? pick(r, L.say) : '' };
  const msg = characterMessage(view, cfg, r, kind, seed);
  if (view.talkOnly) return reply(null, null, null, { ...extras, message: msg });
  const items = [];
  const add = (c, w) => { if (c && w > 0) items.push({ c, w }); };
  // Survival first.
  if (you.energy < 15) add({ line: menuHas(view, 'rest'), target: null, args: {} }, 20);
  if (you.stars >= 3 && menuHas(view, 'lay_low')?.heatRisk < 0) add({ line: menuHas(view, 'lay_low'), target: null, args: {} }, kind === 'hothead' ? 2 : 6);
  // The job pipeline; rent pressure late in the day makes money matter.
  const broke = view.clock.hour >= 16 && you.cash < cfg.rent.amount + 10 && you.home === 'ok';
  const step = jobStep(view, cfg);
  if (step) add(step, P.job * (broke ? 4 : 1));
  if (broke) {
    if (menuHas(view, 'shift')) add({ line: menuHas(view, 'shift'), target: null, args: {} }, 12);
    else if (!P.peaceful && menuHas(view, 'pickpocket')) add({ line: menuHas(view, 'pickpocket'), target: null, args: {} }, 6);
    else add(moveToward(view, 'market'), 6);
  }
  // Gear wishes.
  for (const g of P.gear) {
    const have = g === 'gun' ? you.items.includes('gun') : g === 'car' ? you.car : you.items.includes(g);
    if (have) continue;
    // The cheapest way to the item: the shop, or (for a gun) another agent's or the supplier's board listing.
    const b = [buyOption(view, g, 'shop'), g === 'gun' ? buyOption(view, 'guns', 'board') : null].filter(Boolean).sort((x, y) => x.opt.cash - y.opt.cash)[0] ?? null;
    if (b && you.cash - b.opt.cash >= cfg.bots.reserve) add(b, 8);
    else if (!b && g !== 'gun' && you.cash - cfg.shop[g] >= cfg.bots.reserve) add(moveToward(view, 'market'), 3);
    else if (!b && g === 'gun' && you.cash - Math.min(cfg.shop.gun, view.board.find(x => x.good === 'guns')?.bestAsk ?? Infinity) >= cfg.bots.reserve) add(moveToward(view, 'market'), 3);
    break;
  }
  // Preferred actions.
  for (const line of view.menu) {
    if (line.id === 'move' || line.id === 'buy' || line.id === JOB_ACTION[you.job]) continue;
    if (P.peaceful && VIOLENT.has(line.id)) continue;
    const w = P.w[line.id] ?? (line.id === 'rest' || line.id === 'lay_low' ? 0.2 : P.other);
    const cands = candidates(line);
    const c0 = cands[0].target ? prefTarget(view, kind, cands, r) : cands.slice().sort((a, b) => lineValue(cfg, b.opt, you.stars) - lineValue(cfg, a.opt, you.stars))[0];
    const c = { ...c0, args: { ...c0.args } };
    if (line.id === 'bounty') c.args = { amount: Math.max(cfg.actions.bounty.min, Math.min(Math.floor(you.cash - cfg.bots.reserve), 50 + Math.floor(r() * 60))) };
    if (line.id === 'bounty' && you.cash - c.args.amount < cfg.bots.reserve) continue;
    if (line.id === 'party' && you.cash - cfg.actions.party.cost < cfg.bots.reserve) continue;
    add(c, w);
  }
  // Seek a block.
  const goal = seekBlock(view, P.seek);
  if (goal && goal !== you.block) add(moveToward(view, goal), 1.5);
  // Open call-outs: the brave show up at the block and stay there.
  const mine = view.callOuts.filter(c => c.caller === you.id || c.target === you.id);
  const holding = mine.some(c => c.block === you.block);
  if (holding) for (const it of items) if (it.c.line?.id === 'move') it.w *= 0.1;
  else if (mine.length) add(moveToward(view, mine[0].block), P.brave);
  const chosen = weightedPick(r, items.filter(x => x.c.line)) ?? { c: { line: menuHas(view, 'rest'), target: null, args: {} } };
  const c = chosen.c;
  const out = reply(c.line.id, c.target, c.args, { ...extras, message: msg });
  if (c.target && P.callShot && HOSTILE.has(c.line.id) && r() < P.callShot) out.callShot = { move: c.line.id, target: c.target };
  out.sell = economyExtras(view, cfg, r);
  return out;
}

// Messages: replies to the inbox, promises (kept with probability = loyalty), gifts, threats.
function characterMessage(view, cfg, r, kind, seed) {
  const P = PRESETS[kind];
  const L = LINES[kind];
  const you = view.you;
  const t = view.clock.t;
  // Promises I made that fall due this hour or next: keep them (pay) with probability = loyalty, decided once per promise.
  for (const m of view.memory) {
    if (m.kind !== 'promise' || m.from !== you.id || m.status !== 'open') continue;
    if (m.by - t > 1) continue;
    const keep = rng(seed, 'promise-keep', you.id, m.to, m.by, m.made)() < you.sliders.loyalty;
    if (!keep) continue;
    if (m.give.cash) {
      const owe = m.give.cash - (m.paid ?? 0);
      if (owe > 0 && you.cash >= owe) return { to: m.to, text: 'As promised.', cash: owe, item: null, promise: null };
    } else if (m.give.item && you.items.includes(m.give.item)) return { to: m.to, text: 'As promised.', cash: 0, item: m.give.item, promise: null };
  }
  const others = view.roster.filter(x => x.state !== 'dead').map(x => x.id);
  if (!others.length) return null;
  // Answer the inbox.
  const inbox = view.inbox.filter(m => m.from !== you.id);
  if (inbox.length && r() < P.reply) {
    const m = inbox[inbox.length - 1];
    return { to: m.from, text: pick(r, L.msg), cash: 0, item: null, promise: null };
  }
  // Snakes (and sometimes hustlers and saints) make promises.
  const promiseRate = kind === 'snake' ? 0.18 : kind === 'hustler' ? 0.05 : kind === 'saint' ? 0.06 : 0;
  // Within the promise rules: one open promise per person, two in all, never more cash than you hold.
  const myOpen = view.memory.filter(m => m.kind === 'promise' && m.from === you.id && m.status === 'open');
  const free = others.filter(id => !myOpen.some(m => m.to === id));
  if (r() < promiseRate && view.clock.actingHoursLeft > 4 && myOpen.length < cfg.promises.maxOpenPerSender && free.length && you.cash >= 20) {
    const to = pick(r, free);
    const amount = Math.min(Math.floor(you.cash), 20 + Math.floor(r() * 4) * 10);
    const when = clockLabel(cfg, t + 4);
    return { to, text: kind === 'snake' ? `I'll send you $${amount} by ${when}. Trust me.` : `I'll have $${amount} for you by ${when}.`, cash: 0, item: null, promise: { give: { cash: amount }, by: t + 4 } };
  }
  // Saints give small gifts.
  if (kind === 'saint' && r() < 0.12 && you.cash > cfg.bots.reserve + 40) {
    const low = view.roster.filter(x => x.state === 'free' && (x.crowd === 'none' || x.block === 'park'));
    const to = (low.length ? pick(r, low) : pick(r, view.roster)).id;
    return { to, text: pick(r, L.msg), cash: 15, item: null, promise: null };
  }
  // Threats and pitches.
  if (r() < 0.06) return { to: pick(r, others), text: pick(r, L.msg), cash: 0, item: null, promise: null };
  return null;
}

// One bot reply. `brain` is the seat's brain; `seed` keys the bot's own stream.
export function decideBot(view, { brain, cfg, seed }) {
  const r = rng(seed, 'bot', view.you.id, view.clock.t);
  if (brain === 'greedy') return greedyDecide(view, cfg, r);
  if (brain === 'turtle') return turtleDecide(view, cfg, r);
  if (PRESETS[brain]) return characterDecide(view, cfg, r, brain, seed);
  return greedyDecide(view, cfg, r);
}

export const CHARACTER_BRAINS = Object.keys(PRESETS);
export { GROUPS };
