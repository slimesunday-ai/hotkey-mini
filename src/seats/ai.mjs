// The AI seats (SPEC §9): a view -> a model call -> a validated reply, for every AI seat of an hour, in parallel.
// Builder B owns this file. The interface is pinned in SPEC §9.1; the options after `fake` are additions.
//
// const seats = createAiSeats({ seats: [{ agentId, model, api?, effort? }], transport: 'fake' })
// const out = await seats.decide([{ agentId, view }])   // Map agentId -> { reply, ok, why, usage, ms, raw, ... }
//
// - Each seat names its API: 'openrouter' (the default: chat completions through ./openrouter.mjs, thinking minimal,
//   max_tokens 2000, 60 s) or 'claude' (the Messages API direct through ./anthropic.mjs: adaptive thinking at the seat's
//   effort, default high, with max_tokens and window by effort: 16000 and 180 s up to high, 32000 and 360 s at xhigh,
//   64000 and 600 s at max). Both clients share one spend tally, so one maxCost caps them both.
// - The cut-off fallback (SPEC §0.1 R3.5): a Claude reply cut off at max_tokens that gave no valid move is asked once
//   more at the next lower effort (max -> xhigh -> high -> medium -> low), with that effort's max_tokens and window. It
//   is one more call on the same tally and cap, logged with `fallback: { from, to }` and counted in perModel
//   (fallbacks, rescued); the turn says `fallback: { from, to, ok }`. Cut off again (or at low already), the turn fails.
// - Transport 'live' (or its old name 'openrouter') makes real calls. It refuses to start without maxCost and go, and
//   only then reads the key file of each API a seat uses (keyFile for OpenRouter, claudeKeyFile for Claude). Under
//   `node --test` it also refuses the default key files and the real fetch.
// - Transport 'fake' answers in-process for $0: OpenRouter seats through the copied chat fake (./fake-model.mjs),
//   Claude seats through the copied Claude client talking to a Messages-format fake (./fake-messages.mjs), so the
//   Messages round trip is the real one. Unscripted calls are played by legalReply(view): a legal move picked by a
//   stable hash of seat id, day and hour. The Claude fake's usage is priced from PRICES, so a fake run shows the shape
//   of a bill, not a real one.
// - Every request counts as a call (a retry too), keyed by seat and call number, never by arrival: the Map comes back
//   in sorted agent-id order whatever order the replies land in.
// - A failed turn is { ok: false, why }: 'timeout', 'transport: ...', 'http 4xx: ...', a parse reason ('move "x" is not
//   on the menu'), 'cut off: ...', 'capped' (the spend cap was reached: no call was made) or 'halted: credit' /
//   'halted: key' (the account or the key stopped the run). The engine plays `rest` for it.
import { openRouter, readKey, openRouterFields, needsCacheMark, cacheMarked } from './openrouter.mjs';
import { claudeApi, claudeFields, CLAUDE_URL, CLAUDE_KEY_FILE, CLAUDE_EFFORTS, CLAUDE_NOTE, CLAUDE_THINKING, PRICES } from './anthropic.mjs';
import { fakeModel, SEAT_HEADER, CALL_HEADER } from './fake-model.mjs';
import { fakeMessages } from './fake-messages.mjs';
import { render } from './prompt.mjs';
import { parseReply, extractJson, readSpec, targetIds } from './reply.mjs';
import { SEAT_DEFAULTS, LIMITS, APIS, byPrefix } from './defaults.mjs';
import { dayClock } from './clock.mjs';

const REAL_CLOCK = { now: () => Date.now(), setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: id => clearTimeout(id) };
const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
const parsed = text => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};
const short = s => String(s).replace(/\s+/g, ' ').slice(0, 200);
// The fake Claude endpoint's key: a plain word the fake checks is present. Not a credential.
const FAKE_CLAUDE_KEY = ['fake', 'messages', 'word'].join('-');
// A request's finish reasons that mean the reply was cut off at max_tokens (chat's and the Messages API's names).
const CUT_OFF = new Set(['length', 'max_tokens']);
// Nearest-rank percentile of a sorted list, or null when it's empty.
const percentile = (sorted, p) => (sorted.length ? sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)] : null);

// FNV-1a, 32 bits: a stable hash for the fake's picks.
export function stableHash(s) {
  let h = 0x811c9dc5;
  for (const ch of String(s)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// A legal §9.3 reply for a view, with no model: a menu line picked by a stable hash of seat id, day and hour, a valid
// target from that line, and args inside its spec. Some hours it also says a line and messages a roster agent, so the
// engine's talk paths run in a fake season. A view with an empty menu gets move null.
export function legalReply(view) {
  const v = isObject(view) ? view : {};
  const you = isObject(v.you) ? v.you : {};
  const c = isObject(v.clock) ? v.clock : {};
  const pick = (what, n) => stableHash(`${you.id}|${c.day}|${c.hour}|${what}`) % n;
  const menu = Array.isArray(v.menu) ? v.menu.filter(isObject) : [];
  const reply = { move: null, target: null, args: null, thought: 'nothing to do this hour', say: '', message: null, sell: null, callShot: null };
  if (menu.length > 0) {
    const line = menu[pick('move', menu.length)];
    const ids = targetIds(line.targets);
    reply.move = line.id;
    reply.target = ids.length ? ids[pick('target', ids.length)] : null;
    if (isObject(line.args)) {
      reply.args = {};
      for (const [name, spec] of Object.entries(line.args)) {
        const r = readSpec(spec);
        // A spec the parser can't read is left out, so parseReply names it.
        if (!r) continue;
        if (r.kind === 'enum') reply.args[name] = r.values[pick(`arg:${name}`, r.values.length)];
        else {
          const lo = Number.isFinite(r.min) ? Math.ceil(r.min) : 0;
          const hi = Number.isFinite(r.max) ? Math.floor(r.max) : lo;
          reply.args[name] = hi >= lo ? lo + pick(`arg:${name}`, hi - lo + 1) : lo;
        }
      }
    }
    reply.thought = `fake seat ${you.id ?? ''} picks ${line.id}`.trim();
  }
  if (pick('say', 3) === 0) reply.say = reply.move ? `${reply.move} hour for me` : 'still here';
  const others = (Array.isArray(v.roster) ? v.roster : []).filter(r => isObject(r) && typeof r.id === 'string' && r.id !== you.id);
  if (others.length && pick('message', 4) === 0) {
    const to = others[pick('to', others.length)].id;
    reply.message = { to, text: `${Number.isInteger(c.t) ? dayClock(c).label(c.t) : `Day ${c.day}`}: hello from ${you.id}`, cash: 0, item: null, promise: null };
    // Some messages promise $5 three hours on, by a clock time, so the "by" round trip runs in a fake season.
    if (Number.isInteger(c.t) && Number.isFinite(you.cash) && you.cash >= 5 && pick('promise', 3) === 0) {
      reply.message.promise = { give: { cash: 5 }, by: dayClock(c).label(c.t + 3) };
    }
  }
  return reply;
}

// The next effort down for the cut-off fallback, or null at the lowest.
export const effortBelow = effort => {
  const i = CLAUDE_EFFORTS.indexOf(effort);
  return i > 0 ? CLAUDE_EFFORTS[i - 1] : null;
};
// A Claude seat's max_tokens and window at an effort (SEAT_DEFAULTS.claude, R3.5).
export const claudeLimits = effort => ({ maxTokens: SEAT_DEFAULTS.claude.maxTokensByEffort[effort], timeoutMs: SEAT_DEFAULTS.claude.timeoutMsByEffort[effort] });

// One seat as given -> its settings: { agentId, model, api, effort, maxTokens, timeoutMs }. Throws on a bad seat. A
// Claude seat's max_tokens and window come from its effort unless the seat names its own.
export function seatSettings(s, { maxTokens = SEAT_DEFAULTS.maxTokens, timeoutMs = SEAT_DEFAULTS.timeoutMs } = {}) {
  if (!isObject(s) || typeof s.agentId !== 'string' || !s.agentId || typeof s.model !== 'string' || !s.model) throw new Error('each seat is { agentId, model, api?, effort? }, with agentId and model strings');
  const api = s.api ?? 'openrouter';
  if (!APIS.includes(api)) throw new Error(`seat ${s.agentId}: api is ${APIS.map(a => `'${a}'`).join(' or ')}, not ${JSON.stringify(s.api)}`);
  const effort = s.effort ?? null;
  if (effort !== null && api !== 'claude') throw new Error(`seat ${s.agentId}: effort is for claude seats (OpenRouter seats think at minimal)`);
  if (effort !== null && !CLAUDE_EFFORTS.includes(effort)) throw new Error(`seat ${s.agentId}: effort is one of ${CLAUDE_EFFORTS.join(', ')}, not ${JSON.stringify(effort)}`);
  if (api === 'claude' && !Object.hasOwn(PRICES, s.model)) throw new Error(`seat ${s.agentId}: ${s.model} has no price in anthropic.mjs PRICES (${Object.keys(PRICES).join(', ')}), so its spend can't be counted`);
  const own = (v, name) => {
    if (v === undefined || v === null) return null;
    if (!(Number.isInteger(v) && v > 0)) throw new Error(`seat ${s.agentId}: ${name} is a whole number above 0`);
    return v;
  };
  const claude = api === 'claude';
  const eff = claude ? effort ?? CLAUDE_THINKING.on.output_config.effort : null;
  return {
    agentId: s.agentId, model: s.model, api, effort: eff,
    maxTokens: own(s.maxTokens, 'maxTokens') ?? (claude ? claudeLimits(eff).maxTokens : maxTokens),
    timeoutMs: own(s.timeoutMs, 'timeoutMs') ?? (claude ? claudeLimits(eff).timeoutMs : timeoutMs),
  };
}

export function createAiSeats({
  seats,
  transport,
  keyFile = SEAT_DEFAULTS.keyFile,
  maxCost,
  go,
  concurrency = SEAT_DEFAULTS.concurrency,
  timeoutMs = SEAT_DEFAULTS.timeoutMs,
  fake,
  // Additions beyond SPEC §9.1, all optional:
  // claudeKeyFile: the Claude API's key file (default ~/.config/anthropic/key), read only for a live run with a
  //   claude seat; fakeClaude: the Messages fake (a fakeMessages() instance, or { script } options for one);
  // fetch: the fetch both live clients call (tests inject a fake's); url / claudeUrl: the endpoints;
  // clock: { now, setTimeout, clearTimeout } (manualClock() in tests); maxTokens, retries: OpenRouter request settings
  //   (timeoutMs above is OpenRouter's window; Claude seats default to SEAT_DEFAULTS.claude);
  // onCall(record): every request as it ends, with its seat model; onHalt(halt): the run stopped calling.
  claudeKeyFile = CLAUDE_KEY_FILE,
  fakeClaude,
  fetch: injectedFetch,
  url,
  claudeUrl,
  clock = REAL_CLOCK,
  maxTokens = SEAT_DEFAULTS.maxTokens,
  retries = SEAT_DEFAULTS.retries,
  onCall = null,
  onHalt = null,
} = {}) {
  if (!Array.isArray(seats) || seats.length === 0) throw new Error('createAiSeats needs seats: [{ agentId, model, api?, effort? }]');
  if (!(Number.isFinite(timeoutMs) && timeoutMs > 0)) throw new Error('timeoutMs is a number of ms above 0');
  const byAgent = new Map();
  for (const s of seats) {
    const seat = seatSettings(s, { maxTokens, timeoutMs });
    if (byAgent.has(seat.agentId)) throw new Error(`seat ${seat.agentId} is listed twice`);
    byAgent.set(seat.agentId, seat);
  }
  const live = transport === 'live' || transport === 'openrouter';
  if (!live && transport !== 'fake') throw new Error(`transport is 'live' (or 'openrouter') or 'fake', not ${JSON.stringify(transport)}`);
  if (!(Number.isInteger(concurrency) && concurrency >= 1)) throw new Error('concurrency is a whole number of at least 1');
  if (!(Number.isInteger(retries) && retries >= 0)) throw new Error('retries is a whole number of at least 0');
  const uses = api => [...byAgent.values()].some(s => s.api === api);

  const spend = { cost: 0, calls: 0 };
  const perModel = {};
  const costed = {};
  const latencies = {};
  const entryFor = model => {
    if (!perModel[model]) {
      const seatsOf = [...byAgent.values()].filter(s => s.model === model);
      perModel[model] = {
        api: seatsOf[0]?.api ?? null, efforts: [...new Set(seatsOf.map(s => s.effort).filter(Boolean))], seats: seatsOf.length,
        calls: 0, in: 0, out: 0, reasoning: null, cost: 0, failed: 0, skipped: 0, cutoffs: 0, fallbacks: 0, rescued: 0, finishes: {}, medianMs: null, p90Ms: null,
      };
      costed[model] = 0;
      latencies[model] = [];
    }
    return perModel[model];
  };
  for (const { model } of byAgent.values()) entryFor(model);
  const log = [];
  const turns = [];
  const callNo = new Map([...byAgent.keys()].map(id => [id, 0]));
  const turnUse = new Map();
  const pending = new Map();
  // seat#call -> { from, to } for the cut-off fallback's calls, so their records say so.
  const fallbackCalls = new Map();
  let halt = null;
  const setHalt = (kind, why) => {
    if (halt) return;
    halt = { kind, why: String(why) };
    if (onHalt) onHalt(halt);
  };

  // Every request as it ends, from either client's onCall or the fake chat path below: the spend by model, the turn's
  // usage, the log. Latency counts requests that got an answer (a timeout's wait is the window, not the model).
  function record(r) {
    const seat = byAgent.get(r.seat);
    const model = seat ? seat.model : 'unknown';
    const st = entryFor(model);
    const tin = r.tokens && Number.isFinite(r.tokens.in) ? r.tokens.in : 0;
    const tout = r.tokens && Number.isFinite(r.tokens.out) ? r.tokens.out : 0;
    const think = r.tokens && Number.isFinite(r.tokens.reasoning) ? r.tokens.reasoning : null;
    const cost = Number.isFinite(r.cost) ? r.cost : 0;
    st.calls += 1;
    st.in += tin;
    st.out += tout;
    if (think !== null) st.reasoning = (st.reasoning ?? 0) + think;
    st.cost += cost;
    if (Number.isFinite(r.cost)) costed[model] += 1;
    if (r.finish !== null && r.finish !== undefined) {
      st.finishes[r.finish] = (st.finishes[r.finish] ?? 0) + 1;
      if (CUT_OFF.has(r.finish)) st.cutoffs += 1;
    }
    if (r.status !== null && r.status !== undefined && Number.isFinite(r.ms)) {
      const list = latencies[model];
      list.push(r.ms);
      list.sort((a, b) => a - b);
      st.medianMs = percentile(list, 0.5);
      st.p90Ms = percentile(list, 0.9);
    }
    const u = turnUse.get(`${r.seat}#${r.call}`);
    if (u) {
      u.in += tin;
      u.out += tout;
      if (think !== null) u.reasoning = (u.reasoning ?? 0) + think;
      u.cost += cost;
    }
    const fb = fallbackCalls.get(`${r.seat}#${r.call}`);
    const line = { ...r, served: r.model ?? null, model, api: seat ? seat.api : null, ...(fb ? { fallback: { ...fb } } : {}) };
    log.push(line);
    if (onCall) onCall(line);
  }
  const clientHalt = h => setHalt(h.halt || 'cap', h.message);
  const capOn = Number.isFinite(maxCost) && maxCost > 0;

  // The route for each API: { send, endpoint }. Live clients share `spend` as their tally, so one cap counts both.
  const routes = {};
  const clients = [];
  let chatFake = null, messagesFake = null;
  if (live) {
    if (!capOn) throw new Error('a live run refuses to start without maxCost (dollars, above 0)');
    if (typeof go !== 'string' || !go.trim()) throw new Error("a live run refuses to start without go (slime's go words)");
    // Tests never reach a real key or the network.
    if (process.env.NODE_TEST_CONTEXT) {
      const realFetch = typeof injectedFetch !== 'function' || injectedFetch === globalThis.fetch;
      if (realFetch || (uses('openrouter') && keyFile === SEAT_DEFAULTS.keyFile) || (uses('claude') && claudeKeyFile === CLAUDE_KEY_FILE)) {
        throw new Error('under node --test a live run needs an injected fetch and temp key files');
      }
    }
    const send = injectedFetch ?? globalThis.fetch;
    if (uses('openrouter')) {
      const c = openRouter({ fetch: send, key: readKey(keyFile), maxCost, clock, tally: spend, onCall: record, onHalt: clientHalt });
      clients.push(c);
      routes.openrouter = { send: c.fetch, endpoint: url ?? SEAT_DEFAULTS.url, preflight: () => c.preflight(url ?? SEAT_DEFAULTS.url), keyUsage: () => c.keyUsage(url ?? SEAT_DEFAULTS.url) };
    }
    if (uses('claude')) {
      const c = claudeApi({ fetch: send, key: readKey(claudeKeyFile), maxCost, clock, tally: spend, onCall: record, onHalt: clientHalt });
      clients.push(c);
      routes.claude = { send: c.fetch, endpoint: claudeUrl ?? CLAUDE_URL };
    }
  } else {
    const botFor = request => {
      const p = pending.get(`${request.seat}#${request.call}`);
      if (!p) throw new Error(`no view for ${request.seat} call ${request.call}`);
      return legalReply(p.view);
    };
    if (uses('openrouter')) {
      // A chat fake given whole is used as it is; otherwise one is made here, its unscripted calls played by legalReply.
      const own = !(fake && typeof fake.fetch === 'function');
      chatFake = own ? fakeModel({ script: fake?.script ?? {}, tape: fake?.tape ?? null, hooks: { bot: botFor, ...(fake?.hooks || {}) }, clock }) : fake;
      // The fake chat path's own accounting, in the client's record shape; a maxCost, when given, caps it like the client.
      const send = async (u, init) => {
        const headers = new Headers(init.headers);
        const seat = headers.get(SEAT_HEADER), call = Number(headers.get(CALL_HEADER)) || null;
        if (capOn && spend.cost >= maxCost) setHalt('cap', `the spend reached the cap: $${spend.cost.toFixed(4)} of $${maxCost} after ${spend.calls} calls`);
        if (halt) throw new Error(`no call once the run has stopped: ${halt.why}`);
        const start = clock.now();
        let res, text;
        try {
          res = await chatFake.fetch(u, init);
          text = await res.text();
        } catch (e) {
          spend.calls += 1;
          record({ seat, call, try: 1, status: null, finish: null, cost: null, provider: null, model: null, tokens: null, ms: clock.now() - start, why: init.signal && init.signal.aborted ? 'aborted' : 'failed' });
          throw e;
        }
        const body = parsed(text);
        const usage = isObject(body) && isObject(body.usage) ? body.usage : null;
        const cost = usage && Number.isFinite(usage.cost) ? usage.cost : null;
        const choice = isObject(body) && Array.isArray(body.choices) ? body.choices[0] : null;
        spend.calls += 1;
        if (cost !== null) spend.cost += cost;
        record({
          seat, call, try: 1, status: res.status, finish: (choice && choice.finish_reason) ?? null, cost, provider: null,
          model: (isObject(body) && body.model) ?? null,
          tokens: usage ? { in: usage.prompt_tokens ?? null, out: usage.completion_tokens ?? null, reasoning: usage.completion_tokens_details?.reasoning_tokens ?? null } : null,
          ms: clock.now() - start,
        });
        if (capOn && spend.cost >= maxCost) setHalt('cap', `the spend reached the cap: $${spend.cost.toFixed(4)} of $${maxCost} after ${spend.calls} calls`);
        return new Response(text, { status: res.status });
      };
      routes.openrouter = { send, endpoint: url ?? SEAT_DEFAULTS.fakeUrl };
    }
    if (uses('claude')) {
      // The real Claude client over a Messages-format fake: the body conversion, pricing, waits and halts all run.
      const own = !(fakeClaude && typeof fakeClaude.fetch === 'function');
      messagesFake = own ? fakeMessages({ script: fakeClaude?.script ?? {}, bot: botFor, clock }) : fakeClaude;
      const c = claudeApi({
        fetch: messagesFake.fetch, key: FAKE_CLAUDE_KEY, maxCost: capOn ? maxCost : Number.MAX_SAFE_INTEGER,
        clock, tally: spend, onCall: record, onHalt: clientHalt,
      });
      clients.push(c);
      routes.claude = { send: c.fetch, endpoint: claudeUrl ?? SEAT_DEFAULTS.claude.fakeUrl };
    }
  }

  // Any client's halt, mirrored here once it is set (a call that crossed the cap still returns its reply).
  const syncHalt = () => {
    for (const c of clients) if (c.halted && !halt) setHalt(c.halted.halt || 'cap', c.halted.message);
    return halt;
  };
  const haltWhy = () => (halt.kind === 'cap' ? 'capped' : `halted: ${halt.kind}`);

  // The request body for one seat's prompt, in the chat shape both clients take. OpenRouter: the client's fields,
  // thinking minimal (or off), max_tokens, JSON mode, the cache mark where the model needs one. Claude: adaptive
  // thinking at the seat's effort, the seat's max_tokens, the system text cache-marked (the Messages client keeps the
  // mark; it drops chat-only fields and has no JSON mode).
  function bodyFor(seat, prompt) {
    const messages = [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }];
    if (seat.api === 'claude') {
      return cacheMarked({ model: seat.model, messages, ...claudeFields({ thinking: true, model: seat.model, effort: seat.effort }), max_tokens: seat.maxTokens }, prompt.system);
    }
    const body = {
      model: seat.model,
      messages,
      ...openRouterFields(),
      reasoning: { ...byPrefix(SEAT_DEFAULTS.reasoningByModel, seat.model, SEAT_DEFAULTS.reasoning) },
      max_tokens: seat.maxTokens,
      ...(byPrefix(SEAT_DEFAULTS.jsonModeByModel, seat.model, SEAT_DEFAULTS.jsonMode) ? { response_format: { type: 'json_object' } } : {}),
    };
    return needsCacheMark(seat.model) ? cacheMarked(body, prompt.system) : body;
  }

  // One request inside the window of `seat` (its settings, or the fallback's): { kind: 'reply', status, text } |
  // { kind: 'timeout' | 'halted' | 'error' }.
  async function once(seat, call, bodyText) {
    const { send, endpoint } = routes[seat.api];
    const stop = new AbortController();
    let late = false;
    const timer = clock.setTimeout(() => {
      late = true;
      stop.abort(new Error(`no reply inside ${seat.timeoutMs} ms`));
    }, seat.timeoutMs);
    try {
      const res = await send(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [SEAT_HEADER]: seat.agentId, [CALL_HEADER]: String(call) },
        body: bodyText,
        signal: stop.signal,
      });
      return { kind: 'reply', status: res.status, text: await res.text() };
    } catch (e) {
      if (late) return { kind: 'timeout', message: `no reply inside ${seat.timeoutMs} ms` };
      if (syncHalt()) return { kind: 'halted', message: halt.why };
      return { kind: 'error', message: short(e && e.message !== undefined ? e.message : e) };
    } finally {
      clock.clearTimeout(timer);
    }
  }

  // One seat's turn: never throws. Its attempts at the seat's settings, then, for a Claude reply cut off with no valid
  // move, the same at the next lower effort once (R3.5).
  async function turn({ agentId, view }) {
    const start = clock.now();
    const seat = byAgent.get(agentId);
    const usage = { in: 0, out: 0, reasoning: null, cost: 0 };
    const out = {
      reply: null, ok: false, why: null, usage, ms: 0, raw: null, model: seat ? seat.model : null, api: seat ? seat.api : null,
      effort: seat ? seat.effort : null, tries: 0, finish: null, parsed: false, trimmed: [], dropped: [], fallback: null,
    };
    const done = () => {
      out.ms = clock.now() - start;
      if (seat && !out.ok) {
        if (out.tries > 0) perModel[seat.model].failed += 1;
        else if (out.why === 'capped' || String(out.why).startsWith('halted')) perModel[seat.model].skipped += 1;
      }
      turns.push({
        t: Number.isInteger(view?.clock?.t) ? view.clock.t : null, agentId, model: out.model, api: out.api, effort: out.effort,
        ok: out.ok, parsed: out.parsed, why: out.why, finish: out.finish, usage: { ...usage }, ms: out.ms, tries: out.tries,
        fallback: out.fallback ? { ...out.fallback } : null,
      });
      return out;
    };
    if (!seat) return Object.assign(out, { why: `${agentId} is not an AI seat` }) && done();
    if (syncHalt()) return Object.assign(out, { why: haltWhy() }) && done();
    let prompt, bodyText;
    try {
      prompt = render(view);
      bodyText = JSON.stringify(bodyFor(seat, prompt));
    } catch (e) {
      return Object.assign(out, { why: `render failed: ${short(e.message)}` }) && done();
    }
    const ctx = {
      self: isObject(view?.you) ? view.you.id : null, roster: Array.isArray(view?.roster) ? view.roster : [],
      t: Number.isInteger(view?.clock?.t) ? view.clock.t : undefined, clock: isObject(view?.clock) ? view.clock : null,
    };
    await attempts(seat, bodyText, view, ctx, out, usage, null);
    const lower = seat.api === 'claude' && !out.ok && CUT_OFF.has(out.finish) && !syncHalt() ? effortBelow(seat.effort) : null;
    if (lower) {
      const fb = { ...seat, effort: lower, ...claudeLimits(lower) };
      out.fallback = { from: seat.effort, to: lower, ok: false };
      perModel[seat.model].fallbacks += 1;
      Object.assign(out, { reply: null, why: null, raw: null, finish: null, parsed: false, trimmed: [], dropped: [] });
      await attempts(fb, JSON.stringify(bodyFor(fb, prompt)), view, ctx, out, usage, { from: seat.effort, to: lower });
      out.fallback.ok = out.ok;
      if (out.ok) perModel[seat.model].rescued += 1;
    }
    return done();
  }

  // A seat's requests at one setting (`cur`: the seat's, or the fallback's), with the transport retries: the model's
  // answer, parsed into `out`, or the failure. `mark` ({ from, to }) marks the fallback's calls in the log.
  async function attempts(cur, bodyText, view, ctx, out, usage, mark) {
    const { agentId } = cur;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (syncHalt()) {
        out.why = haltWhy();
        break;
      }
      const call = callNo.get(agentId) + 1;
      callNo.set(agentId, call);
      const key = `${agentId}#${call}`;
      turnUse.set(key, usage);
      pending.set(key, { view });
      if (mark) fallbackCalls.set(key, mark);
      out.tries += 1;
      const res = await once(cur, call, bodyText);
      pending.delete(key);
      turnUse.delete(key);
      fallbackCalls.delete(key);
      syncHalt();
      if (res.kind === 'timeout') {
        out.why = 'timeout';
        continue;
      }
      if (res.kind === 'halted') {
        out.why = haltWhy();
        break;
      }
      if (res.kind === 'error') {
        out.why = `transport: ${res.message}`;
        continue;
      }
      const body = parsed(res.text);
      const error = isObject(body) && isObject(body.error) ? body.error : null;
      const choice = isObject(body) && Array.isArray(body.choices) ? body.choices[0] : null;
      const content = choice && isObject(choice.message) ? choice.message.content : undefined;
      out.finish = (choice && choice.finish_reason) ?? null;
      if (res.status === 200 && !error && typeof content === 'string') {
        out.raw = content;
        out.parsed = extractJson(content) !== undefined;
        const p = parseReply(content, Array.isArray(view?.menu) ? view.menu : [], ctx);
        if (p.ok) Object.assign(out, { ok: true, why: null, reply: p.reply, trimmed: p.trimmed, dropped: p.dropped });
        else {
          out.why = CUT_OFF.has(out.finish) ? `cut off: ${p.why}` : p.why;
          // A failed move keeps its talk (thought, say, message) when the reply had any (round 1).
          if (p.reply) Object.assign(out, { reply: p.reply, trimmed: p.trimmed ?? [], dropped: p.dropped ?? [] });
        }
        // A model's answer, good or bad, is final: no transport retry (a Claude cut-off gets the fallback above).
        break;
      }
      out.raw = typeof res.text === 'string' ? res.text.slice(0, 500) : null;
      const code = res.status !== 200 ? res.status : error ? Number(error.code) || null : null;
      const said = error && typeof error.message === 'string' ? `: ${short(error.message)}` : '';
      if (halt) {
        out.why = haltWhy();
        break;
      }
      if (res.status === 200 && !error) {
        out.why = 'empty reply';
        break;
      }
      out.why = `http ${code ?? res.status}${said}`;
      // Server-side, overload and rate errors are transport errors and get the retry; other 4xx answers are final.
      if (code === null || code === 408 || code === 429 || code >= 500) continue;
      break;
    }
  }

  // One hour's AI turns, in parallel up to the cap: Map agentId -> result, in sorted agent-id order.
  async function decide(batch) {
    if (!Array.isArray(batch)) throw new Error('decide takes [{ agentId, view }]');
    const items = [...batch].sort((a, b) => (a.agentId < b.agentId ? -1 : a.agentId > b.agentId ? 1 : 0));
    for (let i = 1; i < items.length; i++) if (items[i].agentId === items[i - 1].agentId) throw new Error(`${items[i].agentId} is in the batch twice`);
    const results = new Map();
    let next = 0;
    const worker = async () => {
      while (next < items.length) {
        const item = items[next++];
        results.set(item.agentId, await turn(item));
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
    return new Map(items.map(it => [it.agentId, results.get(it.agentId)]));
  }

  // Dollars for callsPerSeat more calls by every seat, at the mean cost per call each model has shown so far (a model
  // with no costed call yet uses the mean of all models): { total, perModel: { [model]: { seats, perCall, season } } },
  // total null before any call has a cost.
  function estimateDetail({ callsPerSeat } = {}) {
    if (!(Number.isFinite(callsPerSeat) && callsPerSeat >= 0)) throw new Error('estimate needs callsPerSeat, a number of at least 0');
    const models = Object.keys(perModel);
    const n = models.reduce((a, m) => a + costed[m], 0);
    const all = n > 0 ? models.reduce((a, m) => a + (costed[m] > 0 ? perModel[m].cost : 0), 0) / n : null;
    const detail = {};
    let total = 0;
    for (const { model } of byAgent.values()) {
      const each = costed[model] > 0 ? perModel[model].cost / costed[model] : all;
      // measured: false when this model has no costed call yet and borrows the other models' mean.
      const d = (detail[model] ??= { seats: 0, perCall: each, measured: costed[model] > 0, season: each === null ? null : 0 });
      d.seats += 1;
      if (each === null) total = null;
      else {
        d.season += each * callsPerSeat;
        if (total !== null) total += each * callsPerSeat;
      }
    }
    return { callsPerSeat, total, perModel: detail };
  }
  const estimate = opts => estimateDetail(opts).total;

  // Before a live run: OpenRouter's balance and key limit against maxCost (refused below it), and the Claude API's note
  // (it has no balance to read; the Console's spend limit is the hard stop). The fake has none to check.
  async function preflight() {
    if (!live) return { balance: null, left: null, usage: null, refused: null, transport: 'fake' };
    const or = routes.openrouter?.preflight ? await routes.openrouter.preflight() : { balance: null, left: null, usage: null, refused: null };
    return { ...or, ...(routes.claude ? { claude: CLAUDE_NOTE } : {}) };
  }

  // OpenRouter's key usage in dollars, read again at the end for what the run was billed (null without OpenRouter seats).
  async function keyUsage() {
    return routes.openrouter?.keyUsage ? routes.openrouter.keyUsage() : null;
  }

  // Ends the fakes this made (open calls dropped, timers cleared). A fake given whole is the caller's to close.
  async function close() {
    if (chatFake && chatFake !== fake) await chatFake.close();
    if (messagesFake && messagesFake !== fakeClaude) await messagesFake.close();
  }

  return {
    decide, estimate, estimateDetail, preflight, keyUsage, close,
    spend, perModel, log, turns, transport: live ? 'live' : 'fake',
    seats: [...byAgent.values()].map(s => ({ ...s })),
    go: live ? go : (go ?? null),
    maxCost: capOn ? maxCost : null,
    limits: { ...LIMITS },
    get capped() {
      return !!syncHalt() && halt.kind === 'cap';
    },
    get halted() {
      return syncHalt() ? { ...halt } : null;
    },
    get fake() {
      return chatFake;
    },
    get fakeClaude() {
      return messagesFake;
    },
  };
}
