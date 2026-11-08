// What an agent sees (SPEC §7, pinned schema). Fields may be added, never renamed or removed. The stable `brief` comes
// first so AI prompts cache. Never in a view: other agents' cash, exact viewers or thoughts; messages not addressed to
// the viewer; the full ranking (only the king marker and the viewer's own coarse rank).
import { hash32 } from './rng.mjs';
import { GROUPS, GOODS, GEAR } from './config.mjs';
import { TOWN_TEXT } from './world.mjs';
import { clockOf, clockLabel, totalViewers, presentOn, hasGun, hasCar, hasArmor, round1, round2 } from './state.mjs';
import { buildMenu, crowdOf, visibleItems, isFlashing, bestAsk, wholesaleBid } from './menu.mjs';
import { rankAgents } from './audience.mjs';
import { REPLY_FORMAT } from './seats/reply.mjs';
import { SLIDERS, RISK_MOVES, CLOUT_MOVES, levelOf, styleLabels, brandMult } from './style.mjs';

export function buildBrief(cfg) {
  const A = cfg.audience;
  const jobs = [
    { job: 'smuggler', does: 'runs 4 chems or 2 parts in at the docks', buys: 'nothing', sells: 'chems to chemists, parts to gunrunners' },
    { job: 'chemist', does: 'cooks 2 chems into 3 product at home', buys: 'chems from smugglers', sells: 'product to dealers' },
    { job: 'dealer', does: 'deals up to 3 product at $25 on the corner, bar or park (crowded blocks pay less)', buys: 'product from chemists', sells: 'to NPC customers' },
    { job: 'gunrunner', does: 'builds 2 parts into 1 gun at home', buys: 'parts from smugglers', sells: 'guns to anyone' },
  ];
  const does = {
    gun: 'unlocks shoot, drive-by, kill the king, bank job; +0.2 on mugs; seen for 6 hours after use',
    car: 'move up to 2 blocks; unlocks drive-by; needed for the bank job; gives a getaway roll',
    armor: 'shots and kill attempts against you get -0.3 odds',
    chain: `flash ${cfg.flashValue.chain}: passive weird and feel-good points every hour, better drip checks`,
    grill: `flash ${cfg.flashValue.grill}: passive weird and feel-good points every hour, better drip checks`,
    fit: `flash ${cfg.flashValue.fit}: passive weird and feel-good points every hour, better drip checks`,
  };
  const per = cfg.season.lastHour - cfg.season.firstHour + 1;
  return {
    town: TOWN_TEXT,
    goal: 'Humans are watching this town live. The citizen with the most viewers over the season wins. Money buys gear that unlocks bigger plays. Heat leads to jail. Only the king (#1) can be killed.',
    fans: GROUPS.map(g => ({ group: g, likes: A.likes[g] })),
    jobs,
    gear: GEAR.map(item => ({ item, price: cfg.shop[item], does: does[item] })),
    rules: [
      `The season is ${cfg.season.days} days of ${per} acting hours (${String(cfg.season.firstHour).padStart(2, '0')}:00-${cfg.season.lastHour}:00); everyone sleeps 00:00-${String(cfg.season.firstHour).padStart(2, '0')}:00. Every duration (jail, hospital, call-outs, promises, the crate) counts acting hours only.`,
      'Everyone acts at once each hour: one action from your menu, plus free extras (thought, say, message, sell, callShot).',
      `Rent is $${cfg.rent.amount} at midnight. Can't pay: evicted, you sleep in the park (only +${cfg.energy.sleepEvicted} energy; thieves may take ${Math.round(cfg.rent.nightTheftPct * 100)}% of your cash), can't cook or build at home, and back rent grows $${cfg.rent.amount} every night until you pay it all, tonight's rent and $${cfg.rent.rehouseFee} at a midnight.`,
      `Heat is 0-${cfg.heat.max} stars. ${cfg.heat.wanted}+ stars is wanted and public. A cop on your block arrests at 3 stars 40%, 4 stars 70%; at 5 stars you are arrested at the end of the hour wherever you are unless you run or get away by car.`,
      `Jail: ${cfg.cops.jailHours} hours (+${cfg.actions.run_cops.extraJail} if caught running), a fine of half your cash, stars reset; you can still talk.`,
      `Hospital: ${cfg.hospital.hours} hours after being shot; no actions, you can talk.`,
      `The king is the season leader: the most viewer-hours so far (the score). Only the king can be killed; any win against the king steals ${cfg.audience.kingslayer}x the usual viewers, and killing the king takes ${Math.round(cfg.actions.kill_king.steal * cfg.audience.kingslayerKill * 100)}% of them. A dead king is revived at home after max(${cfg.revive.min}, ${cfg.revive.base} - viewers/${cfg.revive.perViewers}) hours; no actions or talk while dead.`,
      `Promises in messages are recorded in both memories and never enforced. A promise's "by" must be at least ${cfg.promises.minLead} hours ahead; you can have one open promise per person and ${cfg.promises.maxOpenPerSender} in all, and can't promise more cash than you hold or an item you don't have. Paying in a later hour keeps it; breaking it is drama in proportion to what was at stake. Board trades are guaranteed: money and goods swap at once.`,
      `Call your shot (callShot): announce a crime; if it lands within ${cfg.audience.callShotHours} hours its fan points double, but a cop moves toward the target and the attempt gets -${cfg.odds.callShotPenalty} odds.`,
      `Bounties: the game holds the cash; whoever next beats the target in a fight, mugs, shoots or kills them collects (never the poster); the poster is revealed ${cfg.actions.bounty.revealHours} hours later. Uncollected bounties are refunded at the season's end.`,
      `Call-outs: name a target and a block; for the next ${cfg.actions.call_out.hours} hours, any hour you are both there you fight. If the target never shows while free, ${cfg.systems.duckWalkAway ? `${Math.round(cfg.actions.call_out.duckSteal * 100)}% of its viewers walk away (nobody gets them)` : `it loses ${Math.round(cfg.actions.call_out.duckSteal * 100)}% of its viewers to you`}. You can have one open call-out at a time.`,
      'Viewers: each hour some of your viewers drift away and every taste group hands its viewers to whoever earned its points that hour. Repeating the same action within 6 hours earns half each time; a weird act nobody else did that hour earns 1.5x.',
      'Lone-worker rule: when nobody else is on the block but you and your target (and no party), attacks get a bonus.',
      'Menu lines show odds, pays (dollars, goods and gear at typical value) and fans if it works, heat (heatRisk = expected stars added), and options with per-choice numbers. A line\'s top numbers are its first option\'s.',
      ...(cfg.systems.style ? ['Style: your owner set your style. Moves on your style earn more fans and moves against it fewer (the menu\'s fans already count it). A reckless agent is always dealt its big risk plays and sees gun, car and armor first when buying; a show-off is always dealt party, drip check and battle and sees its jewelry first.'] : []),
    ],
    reply: REPLY_FORMAT, // one source for the reply format: the AI seats' parser (src/seats/reply.mjs)
  };
}

function rankLabel(state, id) {
  if (state.king === id) return 'king';
  const order = rankAgents(state);
  const i = order.indexOf(id);
  if (i < 3) return 'top 3';
  return i < order.length / 2 ? 'top half' : 'bottom half';
}

export function itemsOf(a) {
  const out = [];
  if (hasGun(a)) out.push('gun');
  for (const g of GEAR) if (g !== 'gun' && a.gear[g] > 0) out.push(g);
  return out;
}

export function buildView(state, id, brief) {
  const cfg = state.cfg;
  const a = state.agents[id];
  if (a.state === 'dead') return null;
  const t = state.t;
  const clock = clockOf(cfg, t);
  const talkOnly = a.state !== 'free';
  const menu = talkOnly ? [] : buildMenu(state, a);
  const view = {
    brief,
    you: {
      id: a.id, name: a.name, job: a.job, persona: a.persona,
      sliders: { ...a.sliders }, // bots read these; the AI prompt shows style instead (round 3)
      style: styleOf(state, a),
      block: a.block, energy: Math.round(a.energy), cash: Math.round(a.cash), stars: a.stars,
      viewers: { total: Math.round(totalViewers(a)), byGroup: Object.fromEntries(GROUPS.map(g => [g, Math.round(a.viewers[g])])) },
      rank: rankLabel(state, id),
      items: itemsOf(a),
      stock: { ...a.stock },
      car: hasCar(a), armor: hasArmor(a),
      home: a.evicted ? 'evicted' : 'ok',
      state: a.state,
      rentDue: a.evicted ? a.backRent + cfg.rent.amount + cfg.rent.rehouseFee : cfg.rent.amount,
      scouting: Math.round(a.scouting * 100) / 100,
      ...(a.until !== null && a.state !== 'free' ? { until: a.until } : {}),
    },
    clock: { day: clock.day, hour: clock.hour, t, actingHoursLeft: state.seasonLength - t },
    alerts: a.alerts.slice(), // round 3 (R3.2): last hour's acts against you, most serious first
    last: a.last,
    memory: memoryOf(state, a),
    conversations: conversationsOf(state, a),
    roster: state.ids.filter(o => o !== id).map(o => rosterLine(state, state.agents[o])),
    here: presentOn(state, a.block).filter(o => o !== id).map(o => {
      const b = state.agents[o];
      return { who: o, did: b.lastMove, said: b.lastSayBlock === a.block ? b.lastSay : '' };
    }),
    audience: GROUPS.map(g => {
      const s = state.servedLastHour[g];
      return { group: g, likes: cfg.audience.likes[g], servedLastHour: round1(s), note: s <= 0 ? 'nobody is serving them' : s < 2 ? 'barely served' : s < 6 ? 'some action' : 'well served' };
    }),
    board: GOODS.map(good => {
      const listings = cfg.systems.board ? state.board.listings.filter(l => l.good === good && l.qty > 0) : [];
      const ask = bestAsk(state, good, id);
      return { good, bestAsk: ask.price, bestBid: wholesaleBid(state, good), listings: listings.length, askBy: ask.seller, npcAsk: cfg.board.supplier[good] };
    }),
    bounties: state.bounties.filter(b => b.status === 'open').map(b => ({ target: b.target, amount: b.amount, poster: b.revealed ? b.poster : null })),
    callOuts: state.callOuts.filter(c => c.status === 'open').map(c => ({ caller: c.caller, target: c.target, block: c.block, untilHour: c.until })),
    crate: state.crate ? { block: state.crate.block, untilHour: state.crate.until } : null,
    headlines: state.headlines.slice(0, cfg.view.headlines),
    inbox: a.inbox.slice(-cfg.view.inboxMax),
    menu,
    // Added fields (allowed by §7).
    cops: state.cops.map(c => c.block),
    parties: state.parties.filter(p => p.active).map(p => ({ host: p.host, block: p.block, untilHour: p.until })),
    callShots: state.callShots.filter(c => c.until >= t && !c.used).map(c => ({ by: c.agent, move: c.move, target: c.target, untilHour: c.until })),
    talkOnly,
  };
  return view;
}

// Round 3 (R3.1, pinned): the owner's style as the agent sees it. levels and labels; pays lists each brand multiplier
// that isn't 1 (2 decimals); deals (snake and ride-or-die only) are up to style.deals plain lines. Empty pays and deals
// with systems.style off.
function styleOf(state, a) {
  const cfg = state.cfg;
  const s = a.sliders ?? {};
  const levels = Object.fromEntries(SLIDERS.map(k => [k, levelOf(s[k], cfg)]));
  const pays = [];
  const add = (what, mult, moves = null) => { const m = round2(mult); if (m !== 1) pays.push({ what, ...(moves ? { moves } : {}), mult: m }); };
  add('risk moves', brandMult(cfg, s, RISK_MOVES[0]), RISK_MOVES.slice());
  add('clout moves', brandMult(cfg, s, CLOUT_MOVES[0]), CLOUT_MOVES.slice());
  add('breaking a promise', brandMult(cfg, s, 'promise_broken'));
  add('keeping a promise', brandMult(cfg, s, 'promise_kept'));
  return { levels, labels: styleLabels(s, cfg), pays, deals: cfg.systems.style ? dealsOf(state, a, levels.loyalty) : [] };
}

const who = (state, id) => `${state.agents[id]?.name ?? id} (${id})`;
const itemText = it => (it === 'gun' || it === 'guns' ? 'a gun' : GOODS.includes(it) ? `some ${it}` : `a ${it}`);
const giveText = g => (g.cash ? `$${g.cash}` : itemText(g.item));

// What a friendly act toward you was, for a deal line: "sent you $20 at Day 1 09:00".
function actText(cfg, rec) {
  const when = clockLabel(cfg, rec.hour);
  if (rec.kind === 'gift') return `sent you ${rec.cash > 0 ? `$${rec.cash}` : itemText(rec.item)} at ${when}`;
  if (rec.kind === 'promise') return `promised you ${giveText(rec.give)} at ${when}`;
  if (rec.kind === 'kept') return `kept a promise of ${giveText(rec.give)} to you at ${when}`;
  return `came to your party at ${when}`;
}

// A snake sees who trusts it most (gifts, kept promises, friendly acts; anyone it has wronged since drops off). A
// ride-or-die sees its open promises soonest first, what others owe it, and up to style.allies allies.
function dealsOf(state, a, loyalty) {
  const cfg = state.cfg;
  const max = cfg.style.deals;
  if (loyalty === 'low') {
    const trusting = Object.entries(a.trustedBy)
      .filter(([id, t]) => !state.agents[id].grudges.some(g => g.who === a.id && g.hour >= t.last.hour))
      .sort(([x, p], [y, q]) => q.n - p.n || q.cash - p.cash || q.last.hour - p.last.hour || (x < y ? -1 : 1));
    if (!trusting.length) return ['Nobody trusts you yet.'];
    return trusting.slice(0, max).map(([id, t]) => `${who(state, id)} trusts you: ${actText(cfg, t.last)}${t.n > 1 ? ` (${t.n} friendly acts in all)` : ''}.`);
  }
  if (loyalty !== 'high') return [];
  const open = state.promises.filter(p => p.status === 'open');
  const soonest = (x, y) => x.by - y.by || (x.id < y.id ? -1 : 1);
  const owe = p => (p.give.cash ? `$${p.give.cash - p.paid}` : giveText(p.give));
  // A deadline past the last acting hour reads as the season's end.
  const by = t => (t > state.seasonLength - 1 ? "the season's end" : clockLabel(cfg, t));
  const out = [
    ...open.filter(p => p.from === a.id).sort(soonest).map(p => `You owe ${who(state, p.to)} ${owe(p)} by ${by(p.by)}.`),
    ...open.filter(p => p.to === a.id).sort(soonest).map(p => `${who(state, p.from)} owes you ${owe(p)} by ${by(p.by)}.`),
  ];
  // Allies: the most friendly acts between you, both ways (an alliance in the report's sense).
  const allies = state.ids.filter(id => id !== a.id)
    .map(id => ({ id, n: (a.trustedBy[id]?.n ?? 0) + (state.agents[id].trustedBy[a.id]?.n ?? 0) }))
    .filter(x => x.n >= cfg.report.allianceFriendly)
    .sort((x, y) => y.n - x.n || (x.id < y.id ? -1 : 1))
    .slice(0, cfg.style.allies);
  for (const x of allies) out.push(`${who(state, x.id)} is your ally: ${x.n} friendly acts between you.`);
  return out.slice(0, max);
}

function rosterLine(state, b) {
  const cfg = state.cfg;
  const wanted = b.stars >= cfg.heat.wanted;
  return {
    id: b.id, name: b.name, job: b.job, block: b.block,
    stars: wanted ? b.stars : 0, wanted,
    crowd: crowdOf(cfg, totalViewers(b)),
    visible: b.state === 'dead' ? [] : visibleItems(state, b),
    state: b.state,
    king: state.king === b.id,
    bounty: state.bounties.filter(x => x.target === b.id && x.status === 'open').reduce((s, x) => s + x.amount, 0),
    flashing: isFlashing(state, b),
  };
}

function memoryOf(state, a) {
  const cfg = state.cfg;
  const out = [];
  for (const g of a.grudges.slice(-cfg.memory.grudges)) out.push({ kind: 'grudge', who: g.who, what: g.what, hour: g.hour });
  for (const p of state.promises) {
    if (p.from === a.id || p.to === a.id) out.push({ kind: 'promise', from: p.from, to: p.to, give: p.give, by: p.by, status: p.status, made: p.made, paid: p.paid });
  }
  for (const b of state.bounties) {
    if (b.target === a.id && b.status === 'open') out.push({ kind: 'bounty', on: 'you', amount: b.amount, poster: b.revealed ? b.poster : null, hour: b.posted });
    if (b.poster === a.id) out.push({ kind: 'bounty', on: b.target, amount: b.amount, status: b.status, hour: b.posted });
  }
  for (const c of state.callOuts) {
    if ((c.caller === a.id || c.target === a.id) && (c.status === 'open' || c.until >= state.t - 3)) out.push({ kind: 'callout', caller: c.caller, target: c.target, block: c.block, untilHour: c.until, status: c.status });
  }
  for (const r of a.results.slice(-cfg.memory.results)) out.push({ kind: 'result', hour: r.hour, move: r.move, ok: r.ok, what: r.text });
  return out;
}

function conversationsOf(state, a) {
  const cfg = state.cfg;
  const all = [];
  for (const [other, lines] of Object.entries(a.conversations)) for (const l of lines.slice(-cfg.memory.perCounterpart)) all.push({ with: other, ...l });
  all.sort((x, y) => x.hour - y.hour || (x.with < y.with ? -1 : x.with > y.with ? 1 : 0));
  const kept = all.slice(-cfg.memory.maxMessages);
  const by = {};
  for (const l of kept) (by[l.with] ??= []).push({ hour: l.hour, from: l.from, text: l.text });
  return Object.keys(by).sort().map(w => ({ with: w, lines: by[w] }));
}

// Every living agent's view this hour, plus a hash of each (without the brief) for the feed.
export function buildViews(state, brief) {
  const views = {};
  const hashes = {};
  for (const id of state.ids) {
    const v = buildView(state, id, brief);
    views[id] = v;
    if (v) {
      const { brief: _b, ...rest } = v;
      hashes[id] = hash32(JSON.stringify(rest)).toString(16).padStart(8, '0');
    } else hashes[id] = null;
  }
  return { views, hashes };
}
