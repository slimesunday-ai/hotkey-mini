// The model's reply -> a validated move (SPEC §9.1, §9.3, §4.6). Builder B owns this file.
// parseReply(text, menu, ctx?) -> { ok: true, reply, trimmed, dropped } | { ok: false, why }
// - The move, its target and its args decide `ok`: a move that isn't on the menu, a target that isn't on that line, or
//   args outside the line's spec fail the reply (the engine plays `rest` and flags the turn).
// - The free extras never fail a reply. An over-long thought, say or message text is cut at the last sentence end inside
//   its word limit (a word cut when there is none) and named in `trimmed`; a malformed message, sell or callShot is
//   dropped (set to null) and named in `dropped` with its reason.
// - ctx is optional: { self: '<own agent id>', roster: [{ id, name }], t, clock, minLead }. With a roster, `to` and
//   targets may be given by name, and `to` must be a roster id; without it, any id shaped like "a07" passes. clock (the
//   view's) reads a promise's "by" clock time ("Day 2 14:00") into t; t and minLead drop a promise due too soon.
//
// The args spec grammar (SPEC §7 shows { "item": ["gun", "car"], "qty": "int 1-5", "from": ["shop", "board"] }):
// - an array: one of those values (strings match ignoring case); `null` in the array makes the key optional;
// - "int A-B": a whole number from A to B; "int A+" or "int >=A": at least A; "int": any whole number;
// - "num ..." / "number ...": the same with decimals allowed;
// - a trailing "?" on a string spec makes the key optional.
// Every other key in the spec is required. A key the spec doesn't name is dropped. A spec this grammar can't read fails
// the reply with a reason that names it, so a mismatch with the engine shows up at once in the fake season.
import { LIMITS, GOODS, ACTION_IDS } from './defaults.mjs';
import { dayClock } from './clock.mjs';

// The reply format as the model reads it (SPEC §9.3, §4.6, §0.1 R3.4). The prompt renders this; the parser below
// accepts it. Hours are clock times here as everywhere in the prompt: no hour counter.
export const REPLY_FORMAT = [
  'Answer with one JSON object and nothing else:',
  `{"move":"<menu id>","target":"<agent id or null>","args":{},"thought":"<up to ${LIMITS.thought} words>","say":"<up to ${LIMITS.say} words or empty>","message":null,"sell":null,"callShot":null}`,
  '- move: one id from the MENU. null when the MENU is empty (no action this hour; you can still think, say and message if your state allows talk).',
  '- target: an agent id from that menu line\'s targets; null when the line has no targets.',
  '- args: an object with every key in that line\'s args spec; {} when the line has none. In a spec, a list means one of those values (null in the list means the key may be left out), "int A-B" means a whole number from A to B, and "int A+" means a whole number of at least A.',
  `- thought: up to ${LIMITS.thought} words. Private: other agents never see it; viewers can.`,
  `- say: up to ${LIMITS.say} words, or "". Spoken out loud to everyone on your block, in your own voice, the way a person in this town talks. It never quotes menu numbers, odds, percentages or agent ids.`,
  `- message: null, or {"to":"<agent id>","text":"<up to ${LIMITS.message} words>","cash":0,"item":null,"promise":null}. Private to one agent anywhere, delivered next hour. cash (dollars) and item (one item you hold) transfer at the start of this hour's resolution if you still hold them. promise: null, or {"give":{"cash":<dollars>},"by":"<Day N HH:00>"} or {"give":{"item":"<item>"},"by":"<Day N HH:00>"}; "by" is a clock time written as in NOW, e.g. "Day 3 09:00". The game records a promise in both memories and never enforces it.`,
  `- sell: null, or {"good":"<${GOODS.join('|')}>","qty":<whole number>,"price":<dollars>} to list on the board, or {"good":"<good>","qty":<whole number>,"to":"npc"} to sell now at the wholesaler's bid.`,
  '- callShot: null, or {"move":"<action id>","target":"<agent id>"} to announce a crime publicly.',
  'Words past a limit are cut at the last sentence end inside it. A reply that is not one JSON object, or names a move, target or args value that is not on the MENU, counts as rest.',
].join('\n');

const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
const tryParse = s => {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
};
const lower = s => String(s).trim().toLowerCase();
const AGENT_ID = /^a\d+$/;

// The first JSON object in the text: the whole text, or the first balanced {...} that parses, so code fences and words
// around the object don't matter. A trailing comma before } or ] is forgiven. undefined when there is none.
export function extractJson(text) {
  if (typeof text !== 'string') return undefined;
  const t = text.replace(/^﻿/, '').trim();
  const whole = tryParse(t);
  if (isObject(whole)) return whole;
  for (let i = t.indexOf('{'); i !== -1; i = t.indexOf('{', i + 1)) {
    const end = closing(t, i);
    if (end === -1) continue;
    const slice = t.slice(i, end + 1);
    const obj = tryParse(slice) ?? tryParse(slice.replace(/,\s*([}\]])/g, '$1'));
    if (isObject(obj)) return obj;
  }
  return undefined;
}

// The index of the } that closes the { at `start`, skipping strings; -1 when it never closes (a cut-off reply).
function closing(t, start) {
  let depth = 0, inString = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  return -1;
}

// Free text cut to `limit` words, whitespace collapsed: { text, cut }.
export function clipWords(value, limit) {
  const s = value === null || value === undefined ? '' : String(value);
  const words = s.trim().split(/\s+/).filter(Boolean);
  return { text: words.slice(0, limit).join(' '), cut: words.length > limit };
}

// A word that ends a sentence: . ! or ? at its end, maybe inside closing quotes or brackets.
const SENTENCE_END = /[.!?]["'\u2019\u201d)\]]*$/;
// Free text cut to `limit` words at the last sentence end inside the limit (SPEC §0.1 R3.4), or at the word limit when
// no sentence ends inside it: { text, cut }. Text inside the limit is only whitespace-collapsed.
export function clipText(value, limit) {
  const words = clipWords(value, Infinity).text.split(' ').filter(Boolean);
  if (words.length <= limit) return { text: words.join(' '), cut: false };
  let end = -1;
  for (let i = limit - 1; i >= 0 && end === -1; i--) if (SENTENCE_END.test(words[i])) end = i;
  return { text: words.slice(0, end === -1 ? limit : end + 1).join(' '), cut: true };
}

// One args spec value, read: { kind: 'enum', values, optional } | { kind: 'int'|'num', min, max, optional } | null.
export function readSpec(spec) {
  if (Array.isArray(spec)) {
    const values = spec.filter(v => v !== null);
    return values.length === 0 ? null : { kind: 'enum', values, optional: values.length < spec.length };
  }
  if (typeof spec !== 'string') return null;
  let s = spec.trim();
  const optional = s.endsWith('?');
  if (optional) s = s.slice(0, -1).trim();
  const m = /^(int|integer|num|number)(?:\s+(.*))?$/i.exec(s);
  if (!m) return null;
  const kind = /^int/i.test(m[1]) ? 'int' : 'num';
  const rest = (m[2] || '').replace(/\$/g, '').trim();
  const N = '(-?\\d+(?:\\.\\d+)?)';
  let r;
  if (!rest) return { kind, min: -Infinity, max: Infinity, optional };
  if ((r = new RegExp(`^${N}\\s*(?:-|–|\\.\\.|to)\\s*${N}$`).exec(rest))) return { kind, min: Number(r[1]), max: Number(r[2]), optional };
  if ((r = new RegExp(`^(?:>=\\s*${N}|${N}\\s*\\+)$`).exec(rest))) return { kind, min: Number(r[1] ?? r[2]), max: Infinity, optional };
  if ((r = new RegExp(`^<=\\s*${N}$`).exec(rest))) return { kind, min: -Infinity, max: Number(r[1]), optional };
  return null;
}

// A number from a number or a numeric string ("3", "$50"); NaN otherwise.
const asNumber = v => (typeof v === 'number' ? v : typeof v === 'string' && /^\s*\$?\s*-?\d+(\.\d+)?\s*$/.test(v) ? Number(v.replace(/[$\s]/g, '')) : NaN);
const describe = r => (r.kind === 'enum' ? `one of ${r.values.map(v => JSON.stringify(v)).join(', ')}`
  : `${r.kind === 'int' ? 'a whole number' : 'a number'}${Number.isFinite(r.min) && Number.isFinite(r.max) ? ` from ${r.min} to ${r.max}` : Number.isFinite(r.min) ? ` of at least ${r.min}` : Number.isFinite(r.max) ? ` of at most ${r.max}` : ''}`);

// One arg against its spec: { ok: true, value, omit } | { ok: false, why }. A missing required arg takes `fallback`
// (the line's first option's value, as the engine does) when there is one (round 1).
function checkArg(name, spec, given, present, fallback) {
  const r = readSpec(spec);
  if (!r) return { ok: false, why: `args spec for "${name}" not understood: ${JSON.stringify(spec)}` };
  if (!present || given === null || given === undefined || given === '') {
    if (r.optional) return { ok: true, omit: true };
    if (r.kind === 'enum' && r.values.length === 1) return { ok: true, value: r.values[0] };
    if (fallback !== undefined && fallback !== null) return checkArg(name, spec, fallback, true);
    return { ok: false, why: `args.${name} is missing: needs ${describe(r)}` };
  }
  if (r.kind === 'enum') {
    const hit = r.values.find(v => v === given || (typeof v === 'string' && typeof given === 'string' && lower(v) === lower(given))
      || (typeof v === 'number' && asNumber(given) === v));
    return hit === undefined ? { ok: false, why: `args.${name} ${JSON.stringify(given)} is not ${describe(r)}` } : { ok: true, value: hit };
  }
  const n = asNumber(given);
  if (!Number.isFinite(n) || (r.kind === 'int' && !Number.isInteger(n)) || n < r.min || n > r.max) {
    return { ok: false, why: `args.${name} ${JSON.stringify(given)} is not ${describe(r)}` };
  }
  return { ok: true, value: n };
}

// A menu line's args checked against its spec: { ok: true, args, extra } | { ok: false, why }. `extra` names the keys
// the spec doesn't have, which are dropped.
export function checkArgs(spec, given, defaults = null) {
  const input = isObject(given) ? given : {};
  const out = {};
  for (const name of Object.keys(spec)) {
    const res = checkArg(name, spec[name], input[name], Object.hasOwn(input, name), isObject(defaults) ? defaults[name] : undefined);
    if (!res.ok) return res;
    if (!res.omit) out[name] = res.value;
  }
  return { ok: true, args: out, extra: Object.keys(input).filter(k => !Object.hasOwn(spec, k)).sort() };
}

// The ids a menu line's targets allow: strings, or objects with an id.
export const targetIds = targets => (Array.isArray(targets) ? targets.map(t => (isObject(t) ? t.id : t)).filter(t => typeof t === 'string') : []);

// An agent named by id (any case) or by name, among `candidates` ([{ id, name }]): its id, or null.
function resolveAgent(given, candidates) {
  if (typeof given !== 'string' || !given.trim()) return null;
  const g = lower(given);
  const byId = candidates.find(c => lower(c.id) === g);
  if (byId) return byId.id;
  const byName = candidates.filter(c => typeof c.name === 'string' && lower(c.name) === g);
  return byName.length === 1 ? byName[0].id : null;
}

export function parseReply(text, menu, ctx = {}) {
  const obj = extractJson(text);
  if (!obj) return { ok: false, why: typeof text === 'string' && text.trim() ? 'no JSON object in the reply' : 'empty reply' };
  const lines = Array.isArray(menu) ? menu.filter(isObject) : [];
  const self = typeof ctx.self === 'string' ? ctx.self : null;
  const roster = (Array.isArray(ctx.roster) ? ctx.roster : []).filter(r => isObject(r) && typeof r.id === 'string');
  const trimmed = [], dropped = [];
  const drop = (field, why) => dropped.push({ field, why });
  const clock = dayClock(ctx.clock);

  // The free extras first: cut or dropped, never fatal. A move that fails still keeps the thought, say and message
  // (round 1: talk isn't lost to a move typo).
  const thought = clipText(obj.thought, LIMITS.thought);
  if (thought.cut) trimmed.push('thought');
  const say = clipText(obj.say, LIMITS.say);
  if (say.cut) trimmed.push('say');

  const agents = roster.length > 0 ? roster : null;
  const agentId = given => {
    const id = agents ? resolveAgent(given, agents) : typeof given === 'string' && AGENT_ID.test(given.trim()) ? given.trim() : null;
    return id && id !== self ? id : null;
  };

  let message = null;
  if (obj.message !== null && obj.message !== undefined && obj.message !== false && obj.message !== '') {
    const m = obj.message;
    if (!isObject(m)) drop('message', 'not an object');
    else {
      const to = agentId(m.to);
      if (!to) drop('message', `"to" ${JSON.stringify(m.to ?? null)} is not another agent's id`);
      else {
        const body = clipText(m.text, LIMITS.message);
        if (body.cut) trimmed.push('message.text');
        let cash = 0;
        if (m.cash !== null && m.cash !== undefined && m.cash !== 0) {
          const n = asNumber(m.cash);
          if (Number.isFinite(n) && n >= 0) cash = Math.floor(n);
          else drop('message.cash', `${JSON.stringify(m.cash)} is not a dollar amount`);
        }
        let item = null;
        if (m.item !== null && m.item !== undefined && m.item !== '') {
          if (typeof m.item === 'string' && m.item.trim()) item = m.item.trim();
          else drop('message.item', 'not an item name');
        }
        let promise = null;
        if (m.promise !== null && m.promise !== undefined && m.promise !== false) {
          const read = readPromise(m.promise, clock);
          const lead = Number.isInteger(ctx.minLead) ? ctx.minLead : 2;
          if (read.why) drop('message.promise', read.why);
          else if (Number.isInteger(ctx.t) && read.promise.by < ctx.t + lead) {
            drop('message.promise', `"by" ${clock.label(read.promise.by)} is too soon: at least ${clock.label(ctx.t + lead)}`);
          } else promise = read.promise;
        }
        if (!body.text && !cash && !item && !promise) drop('message', 'empty: no text, cash, item or promise');
        else message = { to, text: body.text, cash, item, promise };
      }
    }
  }
  const talkOnly = why => ({
    ok: false,
    why,
    reply: { move: null, target: null, args: null, thought: thought.text, say: say.text, message, sell: null, callShot: null },
    trimmed,
    dropped,
  });

  // The move.
  let move = null, line = null;
  const givenMove = typeof obj.move === 'string' ? obj.move.trim() : obj.move;
  if (lines.length === 0) {
    if (givenMove !== null && givenMove !== undefined && givenMove !== '') drop('move', 'no menu this hour: the move is ignored');
  } else {
    if (givenMove === null || givenMove === undefined || givenMove === '') return talkOnly('no move in the reply');
    line = typeof givenMove === 'string' ? lines.find(l => l.id === givenMove) ?? lines.find(l => lower(l.id) === lower(givenMove)) : undefined;
    if (!line) return talkOnly(`move ${JSON.stringify(givenMove)} is not on the menu`);
    move = line.id;
  }

  // Its target.
  let target = null;
  const allowed = line ? targetIds(line.targets) : [];
  const givenTarget = obj.target;
  const hasTarget = givenTarget !== null && givenTarget !== undefined && givenTarget !== '';
  if (allowed.length > 0) {
    if (!hasTarget) return talkOnly(`${move} needs a target: one of ${allowed.join(', ')}`);
    const named = (line.targets || []).map(t => (isObject(t) ? { id: t.id, name: t.name } : { id: t, name: roster.find(r => r.id === t)?.name }));
    target = resolveAgent(givenTarget, named);
    if (!target) return talkOnly(`target ${JSON.stringify(givenTarget)} is not a valid target for ${move}`);
  } else if (hasTarget) drop('target', move ? `${move} takes no target` : 'no menu this hour');

  // Its args. A missing required arg is filled from the line's first option, as the engine does.
  let args = null;
  const spec = line && isObject(line.args) ? line.args : null;
  const givenArgs = isObject(obj.args) ? obj.args : null;
  if (spec) {
    const first = Array.isArray(line.options) && isObject(line.options[0]) ? line.options[0].args : null;
    const res = checkArgs(spec, givenArgs, first);
    if (!res.ok) return talkOnly(res.why);
    args = res.args;
    for (const k of res.extra) drop(`args.${k}`, `${move} has no arg "${k}"`);
    // A line that lists its valid item + source pairs (buy) takes only one of those (round 1).
    if (Array.isArray(line.combos)) {
      const c = line.combos.find(x => isObject(x) && x.item === args.item && (args.from === undefined || x.from === args.from));
      if (!c) return talkOnly(`${args.item}${args.from ? ` from the ${args.from}` : ''} is not on sale: one of ${line.combos.map(x => `${x.item} (${x.from})`).join(', ')}`);
      args.from = c.from;
    }
  } else if (givenArgs && Object.keys(givenArgs).length > 0) drop('args', move ? `${move} takes no args` : 'no menu this hour');

  let sell = null;
  if (obj.sell !== null && obj.sell !== undefined && obj.sell !== false) {
    sell = readSell(obj.sell, Array.isArray(ctx.goods) && ctx.goods.length ? ctx.goods : GOODS);
    if (!sell) drop('sell', 'needs {"good","qty","price"} or {"good","qty","to":"npc"}');
  }

  let callShot = null;
  if (obj.callShot !== null && obj.callShot !== undefined && obj.callShot !== false) {
    const c = obj.callShot;
    const shot = isObject(c) && typeof c.move === 'string' ? ACTION_IDS.find(a => a === lower(c.move)) : undefined;
    const at = isObject(c) ? agentId(c.target) : null;
    if (shot && at) callShot = { move: shot, target: at };
    else drop('callShot', 'needs {"move":"<action id>","target":"<another agent id>"}');
  }

  return {
    ok: true,
    reply: { move, target, args, thought: thought.text, say: say.text, message, sell, callShot },
    trimmed,
    dropped,
  };
}

// A promise: { promise: { give: { cash } | { item }, by } } with whole numbers and `by` as t, or { why }. `by` is a
// clock time ("Day 2 14:00") read by `clock` (dayClock), or a bare whole number t.
const GIVE = 'needs {"give":{"cash":<dollars>}} or {"give":{"item":"<item>"}}';
function readPromise(p, clock) {
  if (!isObject(p) || !isObject(p.give)) return { why: GIVE };
  const keys = Object.keys(p.give).filter(k => p.give[k] !== null && p.give[k] !== undefined);
  let give = null;
  if (keys.length === 1 && keys[0] === 'cash') {
    const n = asNumber(p.give.cash);
    if (Number.isFinite(n) && n > 0) give = { cash: Math.floor(n) };
  } else if (keys.length === 1 && keys[0] === 'item' && typeof p.give.item === 'string' && p.give.item.trim()) give = { item: p.give.item.trim() };
  if (!give) return { why: GIVE };
  const by = clock.parse(p.by);
  return by.why ? { why: by.why } : { promise: { give, by: by.t } };
}

// A sell: { good, qty, price } or { good, qty, to: 'npc' }, or null.
function readSell(s, goods) {
  if (!isObject(s) || typeof s.good !== 'string') return null;
  const g = lower(s.good);
  const good = goods.find(x => x === g) ?? goods.find(x => x === `${g}s`);
  const qty = asNumber(s.qty);
  if (!good || !Number.isInteger(qty) || qty < 1) return null;
  const npc = typeof s.to === 'string' && lower(s.to) === 'npc';
  const hasPrice = s.price !== null && s.price !== undefined;
  if (npc && !hasPrice) return { good, qty, to: 'npc' };
  const price = asNumber(s.price);
  if (!npc && Number.isFinite(price) && price > 0) return { good, qty, price };
  return null;
}
