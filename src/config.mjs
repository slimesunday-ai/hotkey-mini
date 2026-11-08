// Every tunable number in hotkey mini (SPEC §1: one place, each with a comment). The values are SPEC §2-§8's starting
// guesses; tuning changes them through `--set path=value` and `--off sys1,sys2`, never by editing the engine.
// defaultConfig() returns a fresh copy each call, so a run's overrides never leak into another run or test.
import { hash32 } from './rng.mjs';

const BASE = {
  // On/off switch for every system (SPEC §1), so tuning can test the core alone and add systems one at a time.
  systems: {
    audienceTastes: true, // taste groups differ; off = every group likes every outcome equally (one flat audience)
    audienceGrowth: true, // pools grow/shrink with points (SPEC §5 step 5); off = fixed pool sizes
    boredom: true, // ×0.5 per repeat of the same action within the window
    novelty: true, // weird ×1.5 when nobody else took the action this hour
    callShot: true, // announce a crime: ×2 fans on success, a cop is pulled, −0.15 odds
    revenge: true, // a win against someone you hold a grudge on scores ×1.5
    kingslayer: true, // wins against the king steal more (×1.5, ×2 for kill_king)
    steals: true, // viewer steals on wins (mug, fight, shoot, battle, ducks...)
    attentionEnergy: true, // +1/+2 energy regen for the top half / top 3 by viewers
    dealtHands: true, // each agent sees a dealt hand of 8 legal actions instead of the whole menu
    cops: true, // cops move and arrest; off = no arrests at all (heat still accrues)
    getaway: true, // car getaway rolls after 4-5 star crimes and drive-bys
    heatDecay: true, // −1 star at day end for anyone with no crime that day
    rent: true, // $40 rent at midnight, eviction, re-housing
    nightThieves: true, // park thieves may rob evicted sleepers
    crate: true, // the crate drops every 8±2 acting hours
    bounties: true, // the bounty action
    callOuts: true, // the call_out action, met fights and ducks
    promises: true, // message promises recorded, kept/broken detection
    messages: true, // private messages (and their cash/item attachments)
    board: true, // agent-to-agent board listings (the NPC supplier/wholesaler stay on regardless)
    parties: true, // the party action
    flash: true, // flash items: passive points, drip scaling, mug bonus against the flashing
    king: true, // the kill_king action (death and revive)
    style: true, // round 3: owner sliders bite: brand fan multiplier, style hands and shop order, the view's style (src/style.mjs)
    battles: true, // the battle action
    mugging: true, // the mug action
    carTheft: true, // the steal_car action
    bankJob: true, // scout and bank_job
    shooting: true, // shoot and drive_by
    fistfights: true, // the fistfight action
    leaderKing: true, // round 1: the king is the viewer-hours leader; off = #1 by current viewers (v1)
    smoothAudience: true, // round 1: hand out only min(1, points/growthFull) of the pot; off = all of it (v1)
    duckWalkAway: true, // round 3: a ducked call-out's viewers walk away to the unassigned pool; off = they go to the caller (round 2)
  },

  season: {
    days: 3, // SPEC §2: a season is 3 days
    firstHour: 6, // acting hours run 06:00..23:00; 00:00-06:00 is sleep (nobody acts)
    lastHour: 23,
  },

  agents: {
    count: 10, // SPEC §2 default seats
    startEnergy: 80, // SPEC §3
    startCash: 200, // SPEC §3 said 100; round 1 tuning: 200
    // SPEC §2: 2 smugglers, 3 chemists, 3 dealers, 2 gunrunners. Shuffled across seats per seed.
    jobs: ['smuggler', 'smuggler', 'chemist', 'chemist', 'chemist', 'dealer', 'dealer', 'dealer', 'gunrunner', 'gunrunner'],
    // Names by seat (a01..), fixed across seeds so play-by-plays are comparable.
    names: ['Vex', 'Kim', 'Penny', 'Dutch', 'Moss', 'Juno', 'Rook', 'Tally', 'Sable', 'Wren', 'Ash', 'Bly'],
    sliderJitter: 0.1, // ± seeded jitter on each character's preset sliders
  },

  energy: {
    max: 100, // SPEC §3: 0-100
    regen: 4, // +4 per awake hour
    bonusTopHalf: 1, // +1 regen for the top half by viewers
    bonusTop3: 2, // +2 regen for the top 3 (max +2 total)
    sleep: 40, // +40 for the night at home
    sleepEvicted: 20, // +20 sleeping rough in the park (round 1)
    rest: 15, // rest: +15 on top of regen
    partyGuest: 5, // each party attendee gets +5 per hour
  },

  rent: {
    amount: 40, // SPEC §3: $40 due at 24:00
    rehouseFee: 20, // an evicted agent is re-housed when it can pay back rent + $20
    nightTheftChance: 0.5, // chance park thieves hit an evicted sleeper (SPEC: "seeded roll")
    nightTheftPct: 0.2, // they take 20% of its cash
  },

  heat: {
    max: 5, // 0-5 stars
    wanted: 3, // 3+ stars is wanted and public
    layLowCooldown: 2, // lay_low removes a star at most once every 2 hours
    dailyDecay: 1, // −1 star at day end with no crime that day
    // Actions that count as "crime" for the day-end decay.
    crimes: ['run', 'cook', 'deal', 'build', 'pickpocket', 'mug', 'steal_car', 'bank_job', 'push_npc', 'fistfight', 'crate', 'shoot', 'drive_by', 'kill_king', 'run_cops'],
  },

  odds: {
    clamp: [0.05, 0.95], // every rolled chance is clamped here (tests widen it to [0,1] to force outcomes)
    callShotPenalty: 0.15, // a called shot is −0.15 odds (SPEC §4.6)
    flashingTarget: 0.1, // +0.1 on mugs against a flashing target (SPEC §4.2)
  },

  // SPEC §4: per-action numbers. energy = the action's cost, paid when it resolves.
  actions: {
    shift: { energy: 15, pays: 14, where: ['market', 'docks'] },
    run: { energy: 20, where: ['docks'], job: 'smuggler', yields: { chems: 4, parts: 2 }, heatChance: 0.25 },
    cook: { energy: 15, where: ['home'], job: 'chemist', input: { chems: 2 }, output: { product: 3 }, heatChance: 0.15 },
    deal: { energy: 10, where: ['corner', 'bar', 'park'], job: 'dealer', maxQty: 3, price: 25, crowdCut: 0.15, crowdFloor: 0.4, heatChance: 0.15, copStars: 1 },
    build: { energy: 20, where: ['home'], job: 'gunrunner', input: { parts: 2 }, output: { guns: 1 }, heatChance: 0.1 },
    pickpocket: { energy: 8, where: ['market', 'bar', 'park', 'corner'], odds: 0.7, cashMin: 10, cashMax: 40, winHeatChance: 0.3, failStars: 1 },
    mug: { energy: 15, odds: 0.5, gunBonus: 0.2, armedExtraStars: 1, loneWorker: 0.15, targetGun: -0.15, takePct: 0.4, takeMin: 10, steal: 0.1, loseEnergy: 10, loseSteal: 0.05, stars: 1 },
    steal_car: { energy: 12, streetWhere: ['market', 'bar', 'bank', 'corner'], streetOdds: 0.6, streetWinStars: 2, streetFailStars: 1, agentOdds: 0.4, loneWorker: 0.15, agentStars: 2 },
    scout: { energy: 8, where: ['bank'], bonus: 0.1, max: 0.3 },
    bank_job: { energy: 40, where: ['bank'], odds: 0.25, cashMin: 800, cashMax: 1500, stars: 4, failArrestChance: 0.5 },
    buy: { energy: 4, maxQty: 5 },
    push_npc: { energy: 5, heatChance: 0.3, notWhere: ['precinct'] },
    crip_walk: { energy: 6, where: ['market', 'bank', 'corner', 'bar', 'park', 'docks'] }, // public blocks
    drip_check: { energy: 4 }, // round 2: legal only while you wear flash (no more drip checks with no jewelry)
    party: { energy: 15, where: ['bar', 'park'], cost: 80, hours: 3, momentGuests: 3 },
    battle: { energy: 10, flashBonusPer100: 0.2, steal: 0.08 },
    call_out: { energy: 5, hours: 3, duckSteal: 0.15 }, // round 2: a duck costs 15% (was 10%) and is headline news
    bounty: { energy: 3, min: 50, revealHours: 12 },
    fistfight: { energy: 15, odds: 0.5, energyDiffDiv: 400, loneWorker: 0.1, steal: 0.15, loseEnergy: 15, stars: 1 },
    crate: { energy: 10, gunWeight: 0.5, energyDiv: 200, contestEnergy: 10, stars: 1 },
    shoot: { energy: 15, odds: 0.6, armor: -0.3, loneWorker: 0.1, hospitalHours: 6, steal: 0.25, hitStars: 3, missStars: 2 },
    drive_by: { energy: 15, odds: 0.45, armor: -0.3, hospitalHours: 6, steal: 0.2, stars: 2 },
    kill_king: { energy: 25, odds: 0.4, armor: -0.25, alone: 0.15, steal: 0.4, stars: 5, failStars: 4 },
    run_cops: { energy: 15, odds: 0.5, carBonus: 0.3, extraJail: 3 },
    move: { energy: 3, carSteps: 2 },
    rest: { energy: 0 },
    lay_low: { energy: 0, stars: 1 },
  },

  // SPEC §4.2 shop prices and what flash is worth.
  shop: { gun: 90, car: 500, armor: 200, chain: 250, grill: 150, fit: 300 }, // gun 150 -> 90 in round 1
  flashValue: { chain: 100, grill: 60, fit: 120 }, // drip_check points are per 100 flashValue
  gunVisibleHours: 6, // a gun is seen for 6 hours after use

  // SPEC §4.2 market board. Goods are chems, parts, product, guns.
  board: {
    typical: { chems: 9, parts: 20, product: 15, guns: 105 }, // typical agent price; also the menu's value of a unit
    supplier: { chems: 12, parts: 25, product: 18, guns: 180 }, // NPC supplier ask (always on the board, unlimited)
    wholesaler: { chems: 5, parts: 10, product: 10, guns: 60 }, // NPC wholesaler bid at the start of a day
    wholesaleDecay: 0.05, // bid drops 5% per unit sold to it that day
    wholesaleFloor: 0.5, // ...to at most 50% of its start
    listingHours: 12, // an unsold agent listing returns to the seller after this many acting hours
  },

  // SPEC §5 fake audience.
  audience: {
    pools: { action: 400, drama: 300, weird: 150, feelgood: 150 }, // starting pools; all start unassigned
    likes: {
      action: 'fights, shootings, chases, robberies',
      drama: 'betrayals, call-outs, bounties, revenge',
      weird: 'stunts, dances, whatever nobody else is doing',
      feelgood: 'parties, gifts, kept promises, battles',
    },
    churn: 0.15, // each agent releases 15% of its viewers per hour (0.3 -> 0.15 in round 1)...
    stateChurn: { jail: 2, hospital: 1.5, dead: 1.5 }, // ...times this in these states
    browse: 0.5, // 50% of unassigned viewers browse each hour
    growthRate: 0.04, // pool × (1 + 0.04 × clamp(points/10, 0, 1) − 0.02)
    growthFull: 10, // points per hour for full growth; also for full reallocation (round 1: below it, only min(1, points/10) of the released + browsing viewers are handed out, the rest stays unassigned)
    decayRate: 0.01, // 0.02 -> 0.01 in round 1
    poolMin: 0.3, // pool clamped to [0.3×, 3×] of its start
    poolMax: 3,
    passiveFlash: 0.3, // wearing flash: flashValue/100 × 0.3 weird and feelgood points per hour
    boredom: 0.5, // ×0.5 per repeat...
    boredomWindow: 6, // ...within 6 hours
    novelty: 1.5, // weird ×1.5 when nobody else took the action this hour
    callShotMult: 2, // a called shot that lands within its window scores ×2
    callShotHours: 3,
    revenge: 1.5, // a win against someone you hold a grudge on
    kingslayer: 1.5, // a non-lethal win against the king steals ×1.5 (round 1: was ×2)
    kingslayerKill: 2, // kill_king's steal is ×2 (0.4 × 2 = 0.8 of the king's viewers)
    crowd: { none: 25, some: 100, big: 250 }, // roster crowd sizes: none <25, some <100, big <250, city 250+
    crowdMid: { none: 10, some: 60, big: 175, city: 400 }, // the menu's estimate of a crowd for steal numbers
  },

  // SPEC §5 fan points per outcome. Missing groups are 0.
  points: {
    shift: { feelgood: 0.2 },
    run: { action: 1.5 }, // round 2: 1 -> 1.5 balanced job wins (chemists won 48%, smugglers 10% at 1)
    cook: { weird: 0.5 },
    deal: { drama: 1 },
    build: { action: 0.5 },
    pickpocket_win: { action: 0.5, weird: 0.5 },
    pickpocket_fail: { weird: 1 },
    mug_win: { action: 2, drama: 1 },
    mug_lose: { action: 1, drama: 1, weird: 1 },
    steal_car_win: { action: 2, weird: 0.5 },
    bank_job_win: { action: 6, drama: 2 },
    bank_job_fail: { action: 3, drama: 3, weird: 1 },
    push_npc: { action: 1, weird: 0.5 },
    crip_walk: { weird: 1.5, feelgood: 1 },
    drip_check: { drama: 1, weird: 1, feelgood: 1 }, // per 100 flashValue
    party_hour: { drama: 1, weird: 1, feelgood: 2 }, // host, per hour
    party_attendee: { feelgood: 0.5 }, // host, per attendee per hour
    battle_win: { drama: 1, weird: 2, feelgood: 1 },
    battle_lose: { weird: 1 },
    call_out: { drama: 2 },
    bounty_posted: { drama: 3 },
    bounty_collected: { action: 2, drama: 2 },
    fistfight_win: { action: 3, drama: 1 },
    fistfight_lose: { action: 1 },
    crate_win: { action: 2, drama: 1 },
    crate_contest: { action: 1 },
    shoot_hit: { action: 4, drama: 2 },
    shoot_miss: { action: 2, drama: 1 },
    drive_by_hit: { action: 4, drama: 1 },
    kill_king_win: { action: 6, drama: 4 },
    kill_king_fail: { action: 3, drama: 3 },
    arrested: { action: 1, drama: 2 },
    run_cops_win: { action: 3, drama: 1 },
    run_cops_fail: { action: 1, drama: 2 },
    promise_broken_breaker: { drama: 4 }, // per $100 at stake (round 1); boredom applies
    promise_broken_victim: { drama: 2, feelgood: 1 }, // × min(1, stake/$100)
    promise_kept: { drama: 1, feelgood: 1 }, // × min(1, stake/$100); boredom applies
  },

  scoring: { win: 'viewerHours' }, // 'viewerHours' | 'final' | 'peak'

  // SPEC §6.7 cops.
  cops: {
    count: 2,
    start: 'precinct',
    speed: 2, // blocks a cop moves per hour toward its target (the 3x3 town is at most 4 apart)
    lookback: 3, // cops chase the block with the most stars added in the last 3 hours
    arrest: { 3: 0.4, 4: 0.7, 5: 1 }, // arrest chance by stars on a cop's block; 5 stars is arrested anywhere
    jailHours: 4, // round 2: 6 -> 4 (+3 when caught running stays)
    fine: 0.5, // fine = 50% of cash
    getawayBase: 0.4, // getaway roll after a 4-5 star crime by a car owner
    getawayDriveBy: 0.5, // +0.5 for a drive-by
  },

  hospital: { hours: 6 },
  revive: { base: 12, perViewers: 100, min: 3 }, // dead for max(3, 12 − floor(viewers/100)) hours

  // SPEC §6.8 the crate.
  crate: {
    every: 8, // drops every 8 ± 2 acting hours
    jitter: 2,
    stays: 2, // stays 2 hours or until won
    weights: { home: 1, market: 1, bank: 1, corner: 1, bar: 1, park: 1, docks: 3, precinct: 1 }, // the docks are favoured
    contents: { cash: 0.5, gun: 0.25, flash: 0.25 }, // chance of each kind
    cashMin: 100,
    cashMax: 300,
  },

  // SPEC §7 the view.
  // Round 3 fix: the engine's own cap on a reply's thought and say. It must not be below the AI parser's limits
  // (src/seats/defaults.mjs LIMITS), which already cut at a sentence end. A leftover 15-word cap here cut 244 of 246
  // AI thoughts mid-sentence in the 11-08 AI season.
  talk: { thoughtWords: 30, sayWords: 20 },

  view: {
    handSize: 8, // dealt hands: 8 lines
    handMax: 11, // round 3: a reckless or show-off agent's always-dealt style lines may grow the hand past handSize, up to this
    handRiskWeight: 3, // risk slider weights crime/violence lines in the draw
    handCloutWeight: 3, // clout slider weights drip/party/battle/call-out lines
    headlines: 6, // max headline lines
    inboxMax: 8,
    alerts: 6, // round 3: at most 6 alert lines (last hour's acts against you), most serious first
  },

  // Round 3 (SPEC §0.1, R3.1): owner sliders as a play style (src/style.mjs).
  style: {
    high: 0.7, // a slider at 0.7+ is high: reckless, show-off, ride-or-die
    low: 0.3, // at 0.3 or less it's low: safe, lowkey, snake
    brand: 0.5, // fans for on-style moves: x(1 + 0.5 x (2s - 1)), so a slider at 1 pays x1.5, at 0.5 x1, at 0 x0.5
    // Per-slider strengths (each falls back to brand). Risk and clout ship at 0: in a 30-seed bot sweep of the `styles`
    // lineup (greedy seats that differ only in style) any real bonus made the high setting win almost every season
    // (clout 0.5: show-off 87%; risk 0.5 with clout 0: reckless 77%; at 0 all styles 13-27%), because the bonus has no
    // cost at the high end. Their surfacing (dealt hands, shop order) stays. Loyalty's bonus didn't dominate, so it stays.
    brandRisk: 0,
    brandClout: 0,
    brandLoyalty: 0.5,
    riskHand: ['shoot', 'drive_by', 'bank_job', 'steal_car', 'mug'], // always dealt to a reckless agent when legal
    cloutHand: ['party', 'drip_check', 'battle'], // always dealt to a show-off when legal
    riskShop: ['gun', 'car', 'armor'], // a reckless agent's buy line lists these first (a board gun right after the shop gun)
    cloutShop: ['chain', 'fit', 'grill'], // a show-off's buy line lists these first (after risk's when both are high)
    deals: 3, // at most 3 deal lines in you.style (snake and ride-or-die only)
    allies: 2, // a ride-or-die's deals name up to 2 allies (pairs with report.allianceFriendly+ friendly acts)
  },
  memory: {
    perCounterpart: 3, // last 3 messages with each counterpart...
    maxMessages: 8, // ...max 8 in total
    results: 3, // last 3 results
    grudges: 6, // most recent grudges kept in the view
  },
  messages: { answeredWithin: 3 }, // a reply within 3 hours counts as "answered"
  promises: {
    minLead: 2, // a promise's "by" must be at least t+2 (round 1: no instant break/keep)
    maxOpenPerSender: 2, // at most 2 open promises per sender...
    maxOpenPerPair: 1, // ...and one open promise per recipient
    stakeUnit: 100, // points scale with the stake: breaker drama 4 per $100; victim and kept × min(1, stake/100)
    breakerMaxScale: 2, // round 3: the breaker's scale stops at $200 (uncapped, a rich snake farmed broken promises)
  },

  // The menu's numbers (SPEC §7: live pays/fans per line). These only shape what the menu shows.
  menu: {
    fanValue: 15, // dollars per fan point, used only to pick each line's headline option
    gearHorizon: 3, // a gear purchase is shown as worth this many uses of what it unlocks
    moveStepsShown: 2,
    jobMargin: { chemist: 27, gunrunner: 65, dealer: 30 }, // one conversion's margin at typical prices (buying inputs)
    gearWorth: { gun: 120, car: 40, armor: 60 }, // what owning one is worth in the menu's pays (0 once you own one); car 150 -> 40 in the sanity pass
    wantedWeight: 3, // heatRisk counts each star that lands at 3+ (wanted) this many times
  },

  // SPEC §8 bots.
  bots: {
    greedy: {
      k: 8, // dollars per expected fan point (sanity pass: 15 made fans outbid every job; see notes/engine.md)
      e: 0.5, // cost per energy point
      h: 8, // cost per expected star
      v: 0.3, // dollars per viewer the line steals (menu's crowd estimate)
      moveDiscount: 0.6, // a move is worth this share of the best line at the destination
      restBelow: 20, // rest when energy is under this
    },
    reserve: 40, // character bots keep this much cash for rent before buying gear
  },

  // SPEC §11 report thresholds.
  report: {
    rivalryHostile: 3, // a pair with 3+ hostile interactions is a rivalry
    allianceFriendly: 2, // a pair with 2+ friendly interactions is an alliance
    comebackWindow: 18, // bottom 3 to top 3 (season standings) within a day (18 acting hours)
    weakMoments: ['lead_change', 'comeback', 'callout_ducked'], // left out of the strong dull-stretch measure
    raceEvery: 6, // round 3: the play-by-play's race line (top 3 by viewer-hours) every 6 acting hours (src/playbyplay.mjs)
  },
};

export function defaultConfig() {
  return structuredClone(BASE);
}

// Set a dotted path ("actions.shift.pays") to a value. Strings that parse as JSON (numbers, true, arrays) are parsed.
export function setPath(cfg, dotted, raw) {
  const value = typeof raw === 'string' ? parseValue(raw) : raw;
  const keys = dotted.split('.');
  let o = cfg;
  for (const k of keys.slice(0, -1)) {
    if (o[k] === undefined || typeof o[k] !== 'object') throw new Error(`--set: no config path ${dotted}`);
    o = o[k];
  }
  const last = keys[keys.length - 1];
  if (!(last in o)) throw new Error(`--set: no config path ${dotted}`);
  o[last] = value;
  return cfg;
}

function parseValue(s) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export function switchOff(cfg, names) {
  for (const n of names) {
    if (!(n in cfg.systems)) throw new Error(`--off: unknown system ${n} (known: ${Object.keys(cfg.systems).join(', ')})`);
    cfg.systems[n] = false;
  }
  return cfg;
}

export function configHash(cfg) {
  return hash32(JSON.stringify(cfg)).toString(16).padStart(8, '0');
}

export const GROUPS = ['action', 'drama', 'weird', 'feelgood'];
export const GOODS = ['chems', 'parts', 'product', 'guns'];
export const GEAR = ['gun', 'car', 'armor', 'chain', 'grill', 'fit'];
export const FLASH = ['chain', 'grill', 'fit'];
export const JOB_ACTION = { smuggler: 'run', chemist: 'cook', dealer: 'deal', gunrunner: 'build' };
