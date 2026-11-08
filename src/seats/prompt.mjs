// A view (SPEC §7) -> the model's prompt (SPEC §9.1). Builder B owns this file.
// render(view) -> { system, user }
// - system: the brief and the reply format, nothing that changes by hour or by seat, so it is byte-identical across a
//   season and prompt caching can reuse it.
// - user: everything else in the view, in a fixed order, facts only, ALERTS first (SPEC §0.1 R3.2). Each section prints
//   its known fields in a fixed order, then any field it doesn't know (SPEC §7 lets fields be added) as "key: value" in
//   sorted key order, so a new engine field reaches the model without a change here.
// - No hour counter (R3.4): every hour in the view (memory, messages, deadlines, promises, jail) prints as a clock time,
//   "Day 2 14:00", through ./clock.mjs. The owner's sliders print as their style (R3.1), never as numbers.
// Deterministic: the same view gives the same strings.
import { REPLY_FORMAT, targetIds } from './reply.mjs';
import { dayClock } from './clock.mjs';
import { SLIDERS } from '../style.mjs';

const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
const has = v => v !== null && v !== undefined;
const num = n => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));
const money = n => (typeof n === 'number' ? `${n < 0 ? '-' : ''}$${num(Math.abs(n))}` : fmt(n));
const pct = n => (typeof n === 'number' ? `${Math.round(n * 100)}%` : fmt(n));
const yesNo = b => (b ? 'yes' : 'no');
const pad = n => String(n).padStart(2, '0');
const GROUPS = ['action', 'drama', 'weird', 'feelgood'];
// "1 star", "3 stars"; a value that isn't a number keeps the plural.
const count = (n, word) => `${fmt(n)} ${word}${n === 1 ? '' : 's'}`;

// Any value as short text: null -> "none", booleans -> yes/no, lists comma-joined, objects as "key value" pairs.
function fmt(v) {
  if (!has(v)) return 'none';
  if (typeof v === 'boolean') return yesNo(v);
  if (typeof v === 'number') return num(v);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.length ? v.map(x => (isObject(x) || Array.isArray(x) ? JSON.stringify(x) : fmt(x))).join(', ') : 'none';
  const keys = Object.keys(v).sort();
  return keys.length ? keys.map(k => `${k} ${isObject(v[k]) || Array.isArray(v[k]) ? JSON.stringify(v[k]) : fmt(v[k])}`).join(', ') : 'none';
}

// The keys of `obj` that `known` doesn't list, sorted, as "key: value" parts; `val(key, value)` writes each value.
const extras = (obj, known, val = (k, x) => fmt(x)) => Object.keys(obj).filter(k => !known.includes(k)).sort().map(k => `${k}: ${val(k, obj[k])}`);

// The view's fields that hold an acting hour t (SPEC §7 and the engine's additions): printed as clock times.
const HOUR_KEYS = ['hour', 'by', 'made', 'until', 'untilHour', 'posted', 'collectedAt'];
// Deadlines that hold through their hour: "through Day 2 14:00".
const THROUGH_KEYS = ['until', 'untilHour'];

// Viewer counts in group order, then any other group.
const byGroup = o => (isObject(o) ? [...GROUPS.filter(g => Object.hasOwn(o, g)), ...Object.keys(o).filter(g => !GROUPS.includes(g)).sort()].map(g => `${g} ${fmt(o[g])}`).join(', ') : fmt(o));

// A promise as text: "give $40 by Day 3 23:00", "give chain by Day 3 23:00". `clock` is the view's dayClock.
function promiseText(p, clock) {
  if (!isObject(p) || !isObject(p.give)) return fmt(p);
  const g = has(p.give.cash) ? money(p.give.cash) : has(p.give.item) ? fmt(p.give.item) : fmt(p.give);
  return [`give ${g}${has(p.by) ? ` by ${clock.label(p.by)}` : ''}`, ...extras(p, ['give', 'by'], (k, x) => (HOUR_KEYS.includes(k) ? clock.label(x) : fmt(x)))].join(', ');
}

// The owner's play style (SPEC §0.1 R3.1, you.style) as YOU lines: the labels and levels, what the crowd pays more or
// less for (the multipliers that aren't 1), and the deals. The one deliberate steer in the prompt, because it is the
// owner's own setting. A view without a style (an old one) says so.
function styleLines(st) {
  const head = "Style (your owner's setting)";
  if (!isObject(st)) return [`${head}: none given.`];
  const lv = isObject(st.levels) ? st.levels : {};
  const levels = [...SLIDERS.filter(k => has(lv[k])), ...Object.keys(lv).filter(k => !SLIDERS.includes(k)).sort()].map(k => `${k} ${fmt(lv[k])}`).join(', ');
  const labels = Array.isArray(st.labels) ? st.labels.filter(has).map(fmt) : [];
  const out = [`${head}: ${labels.length ? labels.join(', ') : 'no strong lean'}${levels ? ` (${levels})` : ''}.`];
  const pays = (Array.isArray(st.pays) ? st.pays : []).filter(p => isObject(p) && typeof p.mult === 'number' && p.mult !== 1);
  const item = p => `for ${fmt(p.what)}${Array.isArray(p.moves) && p.moves.length ? ` (${p.moves.map(fmt).join(', ')})` : ''} ×${num(p.mult)}`;
  const and = xs => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
  const more = pays.filter(p => p.mult > 1).map(item), less = pays.filter(p => p.mult < 1).map(item);
  if (more.length || less.length) {
    out.push(`Your crowd pays ${[...(more.length ? [`more ${and(more)}`] : []), ...(less.length ? [`less ${and(less)}`] : [])].join(', and ')}. The MENU's fans already include this.`);
  } else out.push('Your crowd pays the usual rate for every move.');
  const deals = (Array.isArray(st.deals) ? st.deals : []).filter(has).map(fmt);
  if (deals.length) out.push(`Deals: ${deals.join(' ')}`);
  out.push(...extras(st, ['levels', 'labels', 'pays', 'deals']));
  return out;
}

// How the user part's MENU reads: a layout fact, stated once here so the system part stays the same every hour.
export const MENU_FORMAT = [
  'Each MENU line: id: label | energy cost | cost in dollars | odds | pays (dollars if it works) | fans (viewer points by group if it works) | heat | then, when they apply: heat risk (expected stars), steals (expected viewers taken), why, targets, args (the spec for "args").',
  'Indented lines under a MENU line are its choices (a target, an item, a destination). Each shows only the numbers that differ from its MENU line; a choice with no numbers has the line\'s numbers.',
].join('\n');

const section = (title, lines) => `${title}\n${lines.length ? lines.join('\n') : 'none'}`;
const list = (items, line) => (Array.isArray(items) ? items.filter(has).map(x => `- ${line(x)}`) : has(items) ? [`- ${fmt(items)}`] : []);

export function renderBrief(brief) {
  const b = isObject(brief) ? brief : {};
  const known = ['town', 'goal', 'fans', 'jobs', 'gear', 'rules', 'reply'];
  const out = [
    section('TOWN', has(b.town) ? [fmt(b.town)] : []),
    section('GOAL', has(b.goal) ? [fmt(b.goal)] : []),
    section('VIEWER GROUPS', list(b.fans, f => (isObject(f) ? [`${fmt(f.group)}: likes ${fmt(f.likes)}`, ...extras(f, ['group', 'likes'])].join('; ') : fmt(f)))),
    section('JOBS', list(b.jobs, j => (isObject(j) ? [`${fmt(j.job)}: ${fmt(j.does)}`, ...(has(j.buys) ? [`buys ${fmt(j.buys)}`] : []), ...(has(j.sells) ? [`sells ${fmt(j.sells)}`] : []), ...extras(j, ['job', 'does', 'buys', 'sells'])].join('; ') : fmt(j)))),
    section('GEAR', list(b.gear, g => (isObject(g) ? [`${fmt(g.item)} (${money(g.price)}): ${fmt(g.does)}`, ...extras(g, ['item', 'price', 'does'])].join('; ') : fmt(g)))),
    section('RULES', list(b.rules, r => fmt(r))),
    ...Object.keys(b).filter(k => !known.includes(k)).sort().map(k => section(k.toUpperCase(), Array.isArray(b[k]) ? list(b[k], fmt) : [fmt(b[k])])),
    section('MENU FORMAT', [MENU_FORMAT]),
    // The reply format comes from reply.mjs, the parser's own statement of what it accepts; brief.reply is not
    // printed separately, so the prompt never carries two versions of it.
    section('REPLY', [REPLY_FORMAT]),
  ];
  return out.join('\n\n');
}

export function renderUser(view) {
  const v = isObject(view) ? view : {};
  const you = isObject(v.you) ? v.you : {};
  const clock = dayClock(v.clock);
  // A value by its key: an hour field as a clock time, anything else as fmt does. Unknown fields go through it too.
  const val = (k, x) => (HOUR_KEYS.includes(k) && Number.isInteger(x) ? clock.label(x) : fmt(x));
  const extra = (obj, known) => extras(obj, known, val);
  const names = new Map();
  for (const r of Array.isArray(v.roster) ? v.roster : []) if (isObject(r) && typeof r.id === 'string') names.set(r.id, r.name);
  // An agent id with its name: "a07 (Kim)", or "a03 (you)".
  const who = id => (typeof id !== 'string' ? fmt(id) : id === you.id ? `${id} (you)` : names.has(id) && has(names.get(id)) ? `${id} (${names.get(id)})` : id);
  const AGENT_KEYS = ['who', 'from', 'to', 'with', 'target', 'caller', 'poster', 'agent', 'on', 'host', 'askBy', 'seller'];
  // One "key value" part: agent ids get their names; an hour is "at Day 2 14:00", a deadline "through Day 2 14:00".
  const part = (k, x) => (AGENT_KEYS.includes(k) ? `${k} ${who(x)}`
    : k === 'give' && isObject(x) && (has(x.cash) || has(x.item)) ? `give ${has(x.cash) ? money(x.cash) : fmt(x.item)}`
    : THROUGH_KEYS.includes(k) && Number.isInteger(x) ? clock.through(x)
      : k === 'hour' && Number.isInteger(x) ? `at ${clock.label(x)}`
        : `${k} ${val(k, x)}`);
  // A generic entry: preferred keys first, the rest sorted.
  const entry = (o, order) => [...order.filter(k => Object.hasOwn(o, k)), ...Object.keys(o).filter(k => !order.includes(k)).sort()]
    .map(k => part(k, o[k])).join('; ');

  // Non-zero fan groups only: "action 2, drama 1", or "none".
  const fansShort = f => {
    if (!isObject(f)) return fmt(f);
    const keys = [...GROUPS.filter(g => Object.hasOwn(f, g)), ...Object.keys(f).filter(g => !GROUPS.includes(g)).sort()].filter(g => f[g] !== 0);
    return keys.length ? keys.map(g => `${g} ${fmt(f[g])}`).join(', ') : 'none';
  };
  // One concrete choice under a menu line (a target, an item, a destination) with its own numbers. A destination's
  // `next` (the greedy pick there) is left out: it's a ranking, not a fact of the world.
  const OPTION_KNOWN = ['target', 'args', 'odds', 'pays', 'cash', 'fans', 'heatRisk', 'steals', 'energy', 'next', 'available', 'note'];
  // Only the numbers that differ from its menu line are printed (MENU_FORMAT in the system part says so).
  const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const optionLine = (o, line) => {
    if (!isObject(o)) return `    · ${fmt(o)}`;
    const choice = [...(has(o.target) ? [who(o.target)] : []), ...(isObject(o.args) ? Object.keys(o.args).map(k => `${k} ${fmt(o.args[k])}`) : [])].join(', ') || 'as listed';
    const differs = k => has(o[k]) && !same(o[k], line[k]);
    const parts = [
      ...(differs('odds') ? [`odds ${pct(o.odds)}`] : []),
      ...(differs('pays') ? [`pays ${money(o.pays)}`] : []),
      ...(differs('cash') ? [`cost ${money(o.cash)}`] : []),
      ...(differs('fans') ? [`fans ${fansShort(o.fans)}`] : []),
      ...(differs('heatRisk') ? [`heat risk ${count(o.heatRisk, 'star')}`] : []),
      ...(differs('steals') ? [`steals ~${count(o.steals, 'viewer')}`] : []),
      ...(differs('energy') ? [`energy ${fmt(o.energy)}`] : []),
      // `next` (the greedy bots' pick at a destination) is never printed (round 1): it's a ranking, not a fact.
      ...(Array.isArray(o.available) && o.available.length ? [`can do there: ${o.available.map(fmt).join(', ')}`] : []),
      ...(has(o.note) && o.note !== '' ? [fmt(o.note)] : []),
      ...extra(o, OPTION_KNOWN),
    ];
    return parts.length ? `    · ${choice}: ${parts.join('; ')}` : `    · ${choice}`;
  };

  const out = [];

  // ALERTS: last hour's acts against you, most serious first (R3.2), before anything else.
  out.push(section('ALERTS (done to you last hour)', list(v.alerts, a => fmt(a))));

  // NOW: the clock as a clock; the hour counter t and the day's shape (for ./clock.mjs) are never printed.
  const c = isObject(v.clock) ? v.clock : {};
  out.push(section('NOW', [
    [
      `Day ${fmt(c.day)} ${typeof c.hour === 'number' ? `${pad(c.hour)}:00` : fmt(c.hour)}.`,
      `Acting hours left this season: ${fmt(c.actingHoursLeft)}.`,
      ...extra(c, ['day', 'hour', 't', 'actingHoursLeft', 'hoursPerDay', 'firstHour', 'lastHour']).map(s => `${s}.`),
    ].join(' '),
  ]));

  // YOU: the style replaces the slider numbers (R3.1); a timed state says when it ends.
  const vw = isObject(you.viewers) ? you.viewers : {};
  const state = `${fmt(you.state)}${Number.isInteger(you.until) ? ` ${clock.through(you.until)}` : ''}`;
  out.push(section('YOU', [
    `${fmt(you.name)} (${fmt(you.id)}), ${fmt(you.job)}. Persona: ${fmt(you.persona)}`,
    ...styleLines(you.style),
    `At ${fmt(you.block)}. State: ${state}. Energy ${fmt(you.energy)}/100. Cash ${money(you.cash)}. Heat ${count(you.stars, 'star')}.`,
    `Viewers ${fmt(vw.total)}: ${byGroup(vw.byGroup)}. Rank: ${fmt(you.rank)}.`,
    `Items: ${fmt(you.items)}. Stock: ${fmt(you.stock)}. Car: ${fmt(you.car)}. Armor: ${fmt(you.armor)}.`,
    `Home: ${fmt(you.home)}. Rent due: ${money(you.rentDue)}. Scouting: ${fmt(you.scouting)}.`,
    ...extra(you, ['id', 'name', 'job', 'persona', 'sliders', 'style', 'block', 'energy', 'cash', 'stars', 'viewers', 'rank', 'items', 'stock', 'car', 'armor', 'home', 'state', 'until', 'rentDue', 'scouting']),
  ]));

  // LAST HOUR
  const l = v.last;
  out.push(section('LAST HOUR', isObject(l) ? [
    [`${fmt(l.move)}: ${l.ok === true ? 'ok' : l.ok === false ? 'failed' : fmt(l.ok)}.`, ...(has(l.result) ? [`Result: ${fmt(l.result)}.`] : []), ...(has(l.why) ? [`Why: ${fmt(l.why)}.`] : []), ...extra(l, ['move', 'ok', 'result', 'why']).map(x => `${x}.`)].join(' '),
  ] : []));

  // MEMORY: each kind's fields in a reading order, the rest sorted.
  const MEMORY_ORDER = ['who', 'from', 'to', 'caller', 'target', 'on', 'what', 'move', 'ok', 'give', 'amount', 'block', 'by', 'untilHour', 'status', 'poster', 'made', 'paid', 'hour'];
  out.push(section('MEMORY', list(v.memory, m => (isObject(m) ? `${fmt(m.kind)}: ${entry(Object.fromEntries(Object.entries(m).filter(([k]) => k !== 'kind')), MEMORY_ORDER)}` : fmt(m)))));

  // CONVERSATIONS
  const convo = [];
  for (const t of Array.isArray(v.conversations) ? v.conversations : []) {
    if (!isObject(t)) continue;
    convo.push(`- with ${who(t.with)}:${extra(t, ['with', 'lines']).map(x => ` ${x};`).join('')}`);
    for (const ln of Array.isArray(t.lines) ? t.lines : []) {
      convo.push(isObject(ln) ? `  ${clock.label(ln.hour)}, ${who(ln.from)}: "${fmt(ln.text)}"${extra(ln, ['hour', 'from', 'text']).map(x => `; ${x}`).join('')}` : `  ${fmt(ln)}`);
    }
  }
  out.push(section('CONVERSATIONS', convo));

  // ROSTER
  out.push(section('ROSTER (every agent in town)', list(v.roster, r => (isObject(r) ? [
    `${fmt(r.id)} ${fmt(r.name)}`, `${fmt(r.job)} at ${fmt(r.block)}`, `${count(r.stars, 'star')}${r.wanted === true ? ' (wanted)' : ''}`, `crowd ${fmt(r.crowd)}`, `visible ${fmt(r.visible)}`,
    `state ${fmt(r.state)}`, `king ${fmt(r.king)}`, `bounty ${money(r.bounty)}`, `flashing ${fmt(r.flashing)}`,
    ...extra(r, ['id', 'name', 'job', 'block', 'stars', 'wanted', 'crowd', 'visible', 'state', 'king', 'bounty', 'flashing']),
  ].join('; ') : fmt(r)))));

  // HERE
  out.push(section('ON YOUR BLOCK LAST HOUR', list(v.here, h => (isObject(h) ? [`${who(h.who)}`, ...(has(h.did) ? [`did ${fmt(h.did)}`] : []), ...(has(h.said) && h.said !== '' ? [`said "${fmt(h.said)}"`] : []), ...extra(h, ['who', 'did', 'said'])].join('; ') : fmt(h)))));

  // AUDIENCE
  // `likes` is left out here: it repeats the brief's VIEWER GROUPS, which the system part already carries.
  out.push(section('AUDIENCE (viewer groups)', list(v.audience, a => (isObject(a) ? [`${fmt(a.group)}: served last hour ${fmt(a.servedLastHour)}`, ...(has(a.note) && a.note !== '' ? [fmt(a.note)] : []), ...extra(a, ['group', 'servedLastHour', 'note', 'likes'])].join('; ') : fmt(a)))));

  // BOARD
  out.push(section('MARKET BOARD', list(v.board, b => (isObject(b) ? [
    `${fmt(b.good)}: best ask ${money(b.bestAsk)}${has(b.askBy) ? ` from ${b.askBy === 'npc' ? 'the NPC supplier' : who(b.askBy)}` : ''}`,
    `best bid ${money(b.bestBid)}`, count(b.listings, 'listing'),
    ...(has(b.npcAsk) ? [`NPC supplier ask ${money(b.npcAsk)}`] : []),
    ...extra(b, ['good', 'bestAsk', 'bestBid', 'listings', 'askBy', 'npcAsk']),
  ].join('; ') : fmt(b)))));

  // BOUNTIES
  out.push(section('BOUNTIES', list(v.bounties, b => (isObject(b) ? [`on ${who(b.target)}: ${money(b.amount)}`, `poster ${has(b.poster) ? who(b.poster) : 'not revealed'}`, ...extra(b, ['target', 'amount', 'poster'])].join('; ') : fmt(b)))));

  // CALL-OUTS
  out.push(section('CALL-OUTS', list(v.callOuts, x => (isObject(x) ? [`${who(x.caller)} called out ${who(x.target)} at ${fmt(x.block)}`, clock.through(x.untilHour), ...extra(x, ['caller', 'target', 'block', 'untilHour'])].join('; ') : fmt(x)))));

  // CRATE
  const cr = v.crate;
  out.push(section('CRATE', isObject(cr) ? [[`At ${fmt(cr.block)} ${clock.through(cr.untilHour)}.`, ...extra(cr, ['block', 'untilHour']).map(x => `${x}.`)].join(' ')] : []));

  // COPS, PARTIES, CALLED SHOTS: fields the engine added to §7, printed when the view has them.
  if (Object.hasOwn(v, 'cops')) out.push(section('COPS', Array.isArray(v.cops) && v.cops.length ? [`At: ${v.cops.map(fmt).join(', ')}.`] : has(v.cops) && !Array.isArray(v.cops) ? [fmt(v.cops)] : []));
  if (Object.hasOwn(v, 'parties')) out.push(section('PARTIES', list(v.parties, p => (isObject(p) ? [`${who(p.host)} hosts at ${fmt(p.block)}`, clock.through(p.untilHour), ...extra(p, ['host', 'block', 'untilHour'])].join('; ') : fmt(p)))));
  if (Object.hasOwn(v, 'callShots')) out.push(section('CALLED SHOTS', list(v.callShots, x => (isObject(x) ? [`${who(x.by)} called ${fmt(x.move)} on ${who(x.target)}`, clock.through(x.untilHour), ...extra(x, ['by', 'move', 'target', 'untilHour'])].join('; ') : fmt(x)))));

  // HEADLINES
  out.push(section('HEADLINES', list(v.headlines, h => fmt(h))));

  // INBOX
  out.push(section('INBOX (private messages to you)', list(v.inbox, m => (isObject(m) ? [
    `from ${who(m.from)}, ${clock.label(m.hour)}: "${fmt(m.text)}"`,
    ...(typeof m.cash === 'number' && m.cash !== 0 ? [`cash ${money(m.cash)}`] : has(m.cash) && typeof m.cash !== 'number' ? [`cash ${fmt(m.cash)}`] : []),
    ...(has(m.item) ? [`item ${fmt(m.item)}`] : []),
    ...(has(m.promise) ? [`promise: ${promiseText(m.promise, clock)}`] : []),
    ...extra(m, ['from', 'hour', 'text', 'cash', 'item', 'promise']),
  ].join('; ') : fmt(m)))));

  // Fields this file doesn't know yet, so nothing in the view is lost.
  // `talkOnly` is shown by the MENU section (an empty menu).
  const KNOWN = ['brief', 'alerts', 'you', 'clock', 'last', 'memory', 'conversations', 'roster', 'here', 'audience', 'board', 'bounties', 'callOuts', 'crate', 'cops', 'parties', 'callShots', 'headlines', 'inbox', 'menu', 'talkOnly'];
  for (const k of Object.keys(v).filter(k => !KNOWN.includes(k)).sort()) {
    out.push(section(k.toUpperCase(), Array.isArray(v[k]) ? list(v[k], x => (isObject(x) ? JSON.stringify(x) : fmt(x))) : [isObject(v[k]) ? JSON.stringify(v[k]) : fmt(v[k])]));
  }

  // MENU
  const menu = Array.isArray(v.menu) ? v.menu.filter(isObject) : [];
  if (menu.length === 0) {
    out.push(section('MENU', [`No moves this hour (state: ${fmt(you.state)}). "move" must be null.`]));
  } else {
    out.push(section('MENU ("move" must be one of these ids)', menu.map(m => {
      const parts = [
        `${fmt(m.id)}: ${fmt(m.label)}`,
        `energy ${fmt(m.energy)}`,
        `cost ${money(m.cash)}`,
        `odds ${pct(m.odds)}`,
        `pays ${money(m.pays)}`,
        `fans ${fansShort(m.fans)}`,
        `heat ${fmt(m.heat)}`,
        ...(typeof m.heatRisk === 'number' && m.heatRisk !== 0 ? [`heat risk ${count(m.heatRisk, 'star')}`] : []),
        ...(typeof m.steals === 'number' && m.steals !== 0 ? [`steals ~${count(m.steals, 'viewer')}`] : []),
        ...(has(m.why) && m.why !== '' ? [`why: ${fmt(m.why)}`] : []),
        ...(targetIds(m.targets).length ? [`targets: ${(m.targets || []).map(t => (isObject(t) ? (has(t.name) ? `${t.id} (${t.name})` : who(t.id)) : who(t))).join(', ')}`] : []),
        ...(isObject(m.args) ? [`args: ${JSON.stringify(m.args)}`] : []),
        ...extra(m, ['id', 'label', 'energy', 'cash', 'odds', 'pays', 'fans', 'heat', 'heatRisk', 'steals', 'why', 'targets', 'args', 'options']),
      ];
      const options = Array.isArray(m.options) ? m.options.map(o => optionLine(o, m)) : [];
      return [`- ${parts.join(' | ')}`, ...options].join('\n');
    })));
  }

  out.push('Reply now with one JSON object in the REPLY format.');
  return out.join('\n\n');
}

export function render(view) {
  return { system: renderBrief(isObject(view) ? view.brief : null), user: renderUser(view) };
}
