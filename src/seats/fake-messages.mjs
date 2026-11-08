// A fake of the Claude Messages API (POST /v1/messages), in-process and $0: the endpoint the copied Claude client
// (./anthropic.mjs) talks to when a --fake run or a test has Claude seats. Builder B owns this file. Nothing here
// touches the network.
//
// fakeMessages({ script, bot, clock }) -> { fetch, close, calls, failures }
// - fetch(url, init) has fetch's shape. It takes the request the Claude client sends: POST /v1/messages, the x-api-key
//   and anthropic-version headers, the seat's x-seat and x-call headers, and a Messages body. It checks the body is
//   one: model, max_tokens, messages, an optional `system` array of text blocks, and none of the chat API's fields
//   (reasoning, response_format, usage). A request that isn't one gets the API's 400 `invalid_request_error`.
// - The answer is keyed by seat and that seat's request count n (1, 2, ...), never by arrival across seats. A seat's
//   requests are one at a time, and the client's 429/529 retries resend the same x-call, so n (not x-call) is what
//   tells a retry from the first try. The answer is the first of:
//   1. script[seat][n - 1] (an array) or script(seat, n): { text }, { json }, { bot: true }, { fault: 'hang' }
//      (no answer until the caller gives up), { fault: 'cutoff' } (the bot's text cut in half, stop_reason
//      max_tokens), or { status, error, headers } (an error reply, for 429/529/400/401 paths); each may add delayMs
//      (on the clock) and thinkingTokens;
//   2. bot(request): the text of a reply object, built by the caller (ai.mjs plays legalReply on the seat's view).
// - Usage is counted the way the API counts it: the cache-marked system blocks are a cache write the first time a
//   model sees them and a cache read after; the rest is input_tokens; thinking tokens (by the request's effort, when
//   thinking is adaptive) plus the text are output_tokens, with output_tokens_details.thinking_tokens beside them.
//   Token counts are characters / 3 and the thinking counts are made up: the fake prices a call's shape, not its cost.
// - The reply has a `thinking` block before the text, so the client's stripping of it is exercised.
import { MESSAGES_PATH, CLAUDE_VERSION } from './anthropic.mjs';
import { SEAT_HEADER, CALL_HEADER } from './fake-model.mjs';

const REAL_CLOCK = { now: () => Date.now(), setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: id => clearTimeout(id) };
const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
const tokens = s => Math.ceil(String(s).length / 3);
// Made-up thinking tokens per effort, for a fake reply's usage.
export const FAKE_THINKING = { low: 60, medium: 180, high: 500, xhigh: 1200, max: 2500 };
const CHAT_ONLY = ['reasoning', 'response_format', 'usage', 'temperature', 'top_p'];
const textOf = content => (typeof content === 'string' ? content : Array.isArray(content) ? content.map(b => (isObject(b) && typeof b.text === 'string' ? b.text : '')).join('') : '');

export function fakeMessages({ script = {}, bot = null, clock = REAL_CLOCK } = {}) {
  const calls = [], failures = [], cached = new Set(), seq = new Map();
  const closing = new AbortController();

  const error = (status, type, message, more = {}) => ({ status, body: { type: 'error', error: { type, message, ...more } } });
  const fail = (status, why, more = {}) => {
    failures.push({ why, ...more });
    return error(status, 'invalid_request_error', `fake messages: ${why}`);
  };

  // What's wrong with a request as a Messages call, or null.
  function invalid(body) {
    if (!isObject(body)) return 'the body is not one JSON object';
    if (typeof body.model !== 'string' || !body.model) return 'model is missing';
    if (!Number.isInteger(body.max_tokens) || body.max_tokens < 1) return 'max_tokens is missing';
    if (!Array.isArray(body.messages) || body.messages.length === 0) return 'messages is missing';
    if (body.messages.some(m => !isObject(m) || (m.role !== 'user' && m.role !== 'assistant'))) return 'a message has a role other than user or assistant';
    if (body.system !== undefined && (!Array.isArray(body.system) || body.system.some(b => !isObject(b) || b.type !== 'text'))) return 'system is not an array of text blocks';
    const chat = CHAT_ONLY.filter(k => k in body);
    if (chat.length) return `fields the Messages API doesn't take: ${chat.join(', ')}`;
    return null;
  }

  // The usage of one answer, counted as the API counts it.
  function usageOf(body, text, thinking) {
    const marked = (body.system || []).filter(b => b.cache_control);
    const plain = (body.system || []).filter(b => !b.cache_control);
    const markedText = marked.map(b => b.text).join('');
    const key = `${body.model}\n${markedText}`;
    let write = 0, read = 0;
    if (markedText) {
      if (cached.has(key)) read = tokens(markedText);
      else {
        write = tokens(markedText);
        cached.add(key);
      }
    }
    const input = tokens(plain.map(b => b.text).join('') + body.messages.map(m => textOf(m.content)).join(''));
    return {
      input_tokens: input, cache_creation_input_tokens: write, cache_read_input_tokens: read,
      output_tokens: thinking + tokens(text), output_tokens_details: { thinking_tokens: thinking },
    };
  }

  // Waits delay ms on the clock (or forever when delay is null), until the caller or close() gives up.
  function after(delay, signal) {
    return new Promise((resolve, reject) => {
      let timer = null;
      const stop = () => {
        if (timer !== null) clock.clearTimeout(timer);
        reject(signal.reason);
      };
      if (signal.aborted) return stop();
      signal.addEventListener('abort', stop, { once: true });
      if (delay === null) return;
      const done = () => {
        signal.removeEventListener('abort', stop);
        resolve();
      };
      if (delay > 0) timer = clock.setTimeout(done, delay);
      else done();
    });
  }

  async function answer(url, init) {
    if (closing.signal.aborted) throw new Error('the fake Messages API is closed');
    const headers = new Headers(init.headers);
    const path = new URL(String(url), 'http://fake.invalid').pathname;
    const seat = headers.get(SEAT_HEADER), call = Number(headers.get(CALL_HEADER));
    if (String(init.method ?? 'GET').toUpperCase() !== 'POST' || path !== MESSAGES_PATH) return fail(404, 'not POST /v1/messages');
    if (!headers.get('x-api-key')) return error(401, 'authentication_error', 'x-api-key header is required');
    if (headers.get('anthropic-version') !== CLAUDE_VERSION) return fail(400, 'anthropic-version header is missing or wrong');
    if (!seat || !Number.isInteger(call) || call < 1) return fail(400, 'no x-seat / x-call');
    let body;
    try {
      body = JSON.parse(typeof init.body === 'string' ? init.body : '');
    } catch {
      body = null;
    }
    const bad = invalid(body);
    if (bad) return fail(400, bad, { seat, call });
    const n = (seq.get(seat) ?? 0) + 1;
    seq.set(seat, n);
    const entry = typeof script === 'function' ? script(seat, n) : Array.isArray(script[seat]) ? script[seat][n - 1] : script[seat]?.[n];
    const request = { seat, call, n, body };
    const rec = { seat, call, n, request: body, version: headers.get('anthropic-version'), keyed: !!headers.get('x-api-key'), reply: null, status: null, start: clock.now(), ms: null, outcome: 'pending' };
    calls.push(rec);
    const signal = AbortSignal.any(init.signal ? [init.signal, closing.signal] : [closing.signal]);
    const e = entry ?? { bot: true };
    try {
      await after(e.fault === 'hang' ? null : e.delayMs ?? 0, signal);
    } catch (err) {
      rec.outcome = 'none';
      rec.ms = clock.now() - rec.start;
      throw err;
    }
    let out;
    if (Number.isInteger(e.status) && e.status !== 200) {
      out = { status: e.status, body: { type: 'error', error: e.error ?? { type: 'api_error', message: 'fake error' } }, headers: e.headers ?? {} };
    } else {
      let text;
      if (typeof e.text === 'string') text = e.text;
      else if (e.json !== undefined) text = JSON.stringify(e.json);
      else {
        if (typeof bot !== 'function') return fail(409, 'nothing scripted', { seat, call });
        const v = await bot(request);
        text = typeof v === 'string' ? v : JSON.stringify(v);
      }
      const cut = e.fault === 'cutoff';
      if (cut) text = text.slice(0, Math.floor(text.length / 2));
      const adaptive = isObject(body.thinking) && body.thinking.type === 'adaptive';
      const effort = isObject(body.output_config) ? body.output_config.effort : null;
      const thinking = Number.isInteger(e.thinkingTokens) ? e.thinkingTokens : adaptive ? FAKE_THINKING[effort] ?? FAKE_THINKING.high : 0;
      out = {
        status: 200,
        body: {
          id: `msg_fake_${seat}_${call}`, type: 'message', role: 'assistant', model: body.model,
          content: [...(thinking > 0 ? [{ type: 'thinking', thinking: 'fake reasoning', signature: 'fake' }] : []), { type: 'text', text }],
          stop_reason: cut ? 'max_tokens' : 'end_turn', stop_sequence: null,
          usage: e.usage ?? usageOf(body, text, thinking),
        },
        headers: {},
      };
    }
    rec.reply = out.body;
    rec.status = out.status;
    rec.outcome = 'reply';
    rec.ms = clock.now() - rec.start;
    return out;
  }

  async function fetchFake(url, init = {}) {
    const out = await answer(url, init);
    return new Response(JSON.stringify(out.body), { status: out.status, headers: { 'content-type': 'application/json', ...(out.headers || {}) } });
  }

  async function close() {
    closing.abort(new Error('the fake Messages API closed'));
  }

  return { fetch: fetchFake, close, calls, failures };
}
