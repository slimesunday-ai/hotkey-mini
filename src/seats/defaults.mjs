// AI-seat defaults (SPEC §9.2). Builder B owns this file; the engine's tunables live in src/config.mjs.
// Every number here is a starting guess with a reason beside it.
import os from 'node:os';
import path from 'node:path';

export const SEAT_DEFAULTS = {
  // The four AI seats of an AI season, in seat order (SPEC §9.2: all listed on OpenRouter on 2026-11-07).
  models: ['google/gemini-3.8-flash', 'openai/gpt-6.1-sol', 'moonshotai/kimi-k3.1-pro', 'anthropic/claude-haiku-5.5'],
  // Reply cap in tokens, reasoning and reply together (round 3: 400 -> 2000). A full §9.3 reply is about 120-200
  // tokens, but a reasoning model thinks inside the same cap even at minimal: in the first AI season Kimi's reasoning
  // overran 400 on 11 of 54 turns.
  maxTokens: 2000,
  // One attempt's window in ms (SPEC §9.2: 60 s), then one retry on a transport error.
  timeoutMs: 60000,
  // Transport errors get this many retries (SPEC §9.2: one).
  retries: 1,
  // AI seats called at once (SPEC §9.1 default 4: one hour of a 4-seat AI season in one wave).
  concurrency: 4,
  // Thinking minimal (SPEC §9.2). OpenRouter's `reasoning` field, sent as is.
  reasoning: { effort: 'minimal' },
  // Per-model overrides of `reasoning`, by OpenRouter id prefix. Anthropic: thinking off, the copied client's own
  // "plain" setting (allowed by SPEC §9.2). It was set when the cap was 400, which a thinking budget of at least 1024
  // tokens (OpenRouter's floor for Anthropic models, as recalled, unverified) can't fit under; at 2000 one would fit,
  // but a Claude seat that should think goes direct (api 'claude') at its own effort, so this route stays plain.
  reasoningByModel: { 'anthropic/': { enabled: false } },
  // JSON mode (`response_format: { type: 'json_object' }`), where the model supports it. OpenRouter drops the field for
  // providers that don't support it (unless a request sets provider.require_parameters, which seats never do).
  jsonMode: true,
  // Per-model JSON-mode overrides, by OpenRouter id prefix (none known yet).
  jsonModeByModel: {},
  // The endpoint and the key file. The key file is read only for transport 'openrouter', after maxCost and go are given.
  url: 'https://openrouter.ai/api/v1/chat/completions',
  keyFile: path.join(os.homedir(), '.config', 'openrouter', 'key'),
  // The fake transport's endpoint: never resolved, the fake answers in-process.
  fakeUrl: 'http://fake.invalid/v1/chat/completions',
  // Claude seats (api 'claude', the Messages API through ./anthropic.mjs): always thinking, adaptive, at the seat's
  // effort (the client's default is high).
  claude: {
    // max_tokens by effort (SPEC §0.1 R3.5); it caps thinking and the reply together. Trunk's 6000 cut Haiku off on 28
    // of 66 calls at high effort, and 16000 cut Haiku at xhigh off on 5 of 54 turns in the first AI season. Every
    // Claude 5.5 model takes up to 128K.
    maxTokensByEffort: { low: 16000, medium: 16000, high: 16000, xhigh: 32000, max: 64000 },
    // A thinking call's window by effort (R3.5), then the same one retry as every seat.
    timeoutMsByEffort: { low: 180000, medium: 180000, high: 180000, xhigh: 360000, max: 600000 },
    // The Claude seats' fake endpoint in a --fake run (never resolved: ./fake-messages.mjs answers in-process).
    fakeUrl: 'http://fake.invalid/v1/messages',
  },
};

// The APIs a seat can name: OpenRouter's chat completions, or the Claude Messages API direct.
export const APIS = ['openrouter', 'claude'];

// The free extras' limits (SPEC §4.6; thought and say from SPEC §0.1 R3.4), in words. The prompt states them and
// parseReply trims to them, at the last sentence end inside the limit.
export const LIMITS = {
  thought: 30,
  say: 20,
  message: 30,
};

// Board goods (SPEC §4.2), for `sell`. Singular spellings are accepted and mapped to these.
export const GOODS = ['chems', 'parts', 'product', 'guns'];

// Every action id in SPEC §4, for `callShot.move` (a called shot may name a move that isn't on this hour's menu).
export const ACTION_IDS = [
  'shift', 'run', 'cook', 'deal', 'build', 'pickpocket', 'mug', 'steal_car', 'scout', 'bank_job',
  'buy',
  'push_npc', 'crip_walk', 'drip_check', 'party', 'battle', 'call_out', 'bounty',
  'fistfight', 'crate', 'shoot', 'drive_by', 'kill_king', 'run_cops',
  'move', 'rest', 'lay_low',
];

// The value for a model from a { prefix: value } table, or the fallback.
export function byPrefix(table, model, fallback) {
  const hit = Object.keys(table || {}).sort().find(p => typeof model === 'string' && model.startsWith(p));
  return hit === undefined ? fallback : table[hit];
}
