# Builder B (AI seats): notes

## Status (2026-11-07): v1 seats built, tests green, checked against A's in-progress engine

Files (all under `src/seats/` and `test/seats/`):
- `openrouter.mjs`, `fake-model.mjs`: trunk's `core/agents/` files copied byte for byte below a one-line header naming
  the source and its sha256 prefix. Import paths needed no change (`./fake-model.mjs` resolves to the copy beside it).
- `defaults.mjs`: models, max_tokens 400, timeout 60 s, 1 retry, concurrency 4, reasoning, JSON mode, URL, key file
  path, word limits (`LIMITS`), board goods (`GOODS`), §4 action ids (`ACTION_IDS`).
- `prompt.mjs`: `render(view) -> { system, user }`, plus `MENU_FORMAT` (the menu's layout, stated once in the system part).
- `reply.mjs`: `parseReply(text, menu, ctx?)`, plus `REPLY_FORMAT` (the reply section the prompt prints).
- `ai.mjs`: `createAiSeats({...})` as pinned in §9.1, plus `legalReply(view)` (the fake's legal player).
- Tests: `test/seats/{prompt,reply,ai}.test.mjs`, helpers in `test/seats/helpers.mjs`, four §7 view fixtures in
  `test/seats/fixtures/` shaped like A's `buildView` output (free dealer, armed gunrunner, jail talk-only, zero energy).

Test command (from the repo root): `node --test "test/seats/**/*.test.mjs"` -> 36 tests, 36 pass, 0 fail.
No network, no key file, no git. A scan of `src/seats` and `test/seats` with the regex from `scripts/check-keys.mjs`
found 0 key-shaped strings (I didn't run the script itself, because it shells out to git).

**Integration check (scratch script, nothing written to the repo).** I ran A's current `createSeason` / `buildViews` /
`runHour` / `dayEnd` with all 10 seats played by `createAiSeats({ transport: 'fake' })`, seeds 1–3:
- each seed: 54 hours, 540 turns, 0 failed seat turns, 0 rejections by A's `validateReply`, $0;
- one system text across every seat and hour;
- largest user prompt 8.7–9.0K characters;
- seed 4 run twice gave identical output, and seed 5 differed.

## How the engine calls it

```js
import { createAiSeats } from './src/seats/ai.mjs';
const ai = createAiSeats({ seats: aiIds.map(id => ({ agentId: id, model: state.agents[id].model })), transport: 'fake' });
// paid: createAiSeats({ seats, transport: 'openrouter', maxCost: 3, go: "<slime's words>" }); then await ai.preflight()
const out = await ai.decide(aiIds.filter(id => views[id]).map(id => ({ agentId: id, view: views[id] })));
runHour(state, { ...botReplies, ...Object.fromEntries(out) }, views, hashes);   // { reply, ok, why } is what runHour reads
```

- Each result is `{ reply, ok, why, usage: { in, out, cost }, ms, raw, model, tries, finish, trimmed, dropped }`.
  `reply` is the §9.3 shape, normalized: `{ move, target, args, thought, say, message, sell, callShot }`. `args` is
  `null` when the line has no spec. `message` is `{ to, text, cash, item, promise }` or null.
- For `run.json` and the report:
  - `ai.spend`: `{ cost, calls }`;
  - `ai.perModel`: `{ [model]: { calls, in, out, cost, failed, skipped } }`;
  - `ai.capped`;
  - `ai.halted`: `null`, or `{ kind: 'cap'|'credit'|'key', why }`;
  - `ai.log`: one record per request (seat, call, try, status, finish, cost, tokens, ms, model, served);
  - `ai.go`.
- Dry run: after the one acting hour, `ai.estimate({ callsPerSeat: 54 })` gives dollars for a season at the per-call
  cost seen so far. It returns `null` before any costed call.
- `--ai --fake`: `createAiSeats({ seats, transport: 'fake' })` needs nothing else. `legalReply(view)` answers every call:
  - the move is a menu line picked by a stable hash of `view.you.id`, `clock.day` and `clock.hour`;
  - the target is one the line lists, and the args are inside its spec;
  - some hours it adds a `say`, and some hours a text-only `message` to a roster agent.
  It costs $0 and is deterministic. The picks are uniform over the menu, so job actions are rare: the fake season
  tests the plumbing, not the economy.
- `ai.close()` ends the fake model it made (harmless for openrouter).

## Decisions (mine, inside the SPEC)

1. **Thinking.** `reasoning: { effort: 'minimal' }` for every model, except Anthropic models, which get the copied
   client's own "plain" setting, `{ enabled: false }` (SPEC §9.2 allows off). Reason: as I recall OpenRouter's docs,
   it turns an effort into a thinking budget of at least 1024 tokens for Anthropic models, which can't fit under
   max_tokens 400. **Unverified.** The dry run should check each model's `finish` and reasoning tokens in `ai.log`.
2. **JSON mode** (`response_format: { type: 'json_object' }`) is sent to all four models. As far as I know, OpenRouter
   drops it for providers that don't support it. Also unverified until the dry run. Per-model overrides go in
   `defaults.mjs` (`jsonModeByModel`, `reasoningByModel`).
3. **Retries.** One retry for a timeout, a network error, or an HTTP 408, 429 (after the client's own 6/12/18 s waits)
   or 5xx. No retry when the model replied but the reply fails to parse, for any other 4xx, or after a halt. Every
   request counts as a call, retries included, keyed by seat and call number (trunk's Q1).
4. **Only move, target and args decide `ok`.** A bad `message`, `sell` or `callShot` is dropped and named in `dropped`;
   an over-long thought, say or message text is cut and named in `trimmed`.
5. **Talk-only views** (menu `[]`): the reply's move must be null. A move given anyway is ignored (listed in
   `dropped`), and the talk is kept.
6. **Leniency the parser allows:** code fences and text around the object, one trailing comma, a move id in any case,
   a target or `to` given by name (when it's unique in the roster or the target list), and numeric strings for
   numbers ("3", "$50").
7. **Reply format, single owner.** The prompt prints `REPLY_FORMAT` from `reply.mjs` (the parser's own statement of
   what it accepts) and doesn't print `brief.reply`. A's `REPLY_TEXT` in `view.mjs` is therefore unused by AI seats;
   set `brief.reply = REPLY_FORMAT` if you want one copy.
8. **The menu's per-choice `options`** are printed as indented lines under their menu line. Each shows only the numbers
   that differ from the line, and `MENU_FORMAT` in the system part says so. That cut the average user prompt from 6.9K
   to 6.3K characters over a fake season.
   Left out on purpose:
   - `next.value`: the engine's own score of a line, which is a ranking, not a fact. Showing it would teach models the
     greedy bots' metric.
   - `audience[].likes`: it repeats the brief.
9. **Word limits** (15/15/30) live in `defaults.mjs` `LIMITS`, since `src/config.mjs` is yours.
10. **`capped` vs `halted`.** `capped` is true only for the spend cap. `halted` is set for any stop: the cap, a 402 or
    out of credits (`credit`), or a 401 or 403 (`key`). Turn reasons are `'capped'`, `'halted: credit'` and
    `'halted: key'`. **Switch AI seats to greedy once `ai.halted` is non-null**, not just when `capped` is true.
11. **Spend-cap overshoot.** The cap is checked before each request, but calls already in flight still land. That's
    at most `concurrency` calls, each about half a cent.
12. **Test guard.** Under `node --test` (`NODE_TEST_CONTEXT` set), the openrouter transport refuses the default key
    file and the real fetch.

## For Builder A

Things the seats rely on. A's current code already does all of them.
- **Args specs.** Arrays (with `null` for optional), or `"int A-B"`. The parser also reads `"int A+"`, `"int >=A"` and
  a trailing `?`. Any other spec fails the reply with `args spec for "x" not understood`.
- **`targets`.** Id strings, or `{ id, name }` objects.
- **The hour count.** `clock.t` is the count for memory, deadlines and a promise's `by`. The NOW line prints it, and the
  reply format says `"by":<hour t>`.
- **Your added fields.** `cops`, `parties` and `callShots` get their own sections, and `talkOnly` drives the MENU line.
  Any other new field still reaches the model, printed generically.

Small things I noticed in your output (yours to judge):
- `bounty` lines have args `"int 50-<cash>"`. When cash < 50 the range is empty, so I assume the line is dropped then.
- A `call_out` option for an agent in jail suggests `block precinct`, with the note "Penny is at the jail".
- Notes read "Kim is at the home" (wording only).
- `runHour` doesn't advance `state.t`; my scratch driver set `state.t = t` each hour and called `dayEnd` after every
  18th hour. I assume `run.mjs` will do the same.

## Open questions (for the orchestrator)

- **Thinking and JSON-mode settings per model** (decisions 1 and 2) are my best reading. The 4-call dry run is the
  check: look at `finish`, the reasoning tokens and any 400s per model in `ai.log`.
- **Prompt size.** Measured over a 10-seat fake season on A's engine: about 6.3K characters of system text plus 6.3K of
  user text per call on average (user maximum 9.0K). At roughly 3–4 characters a token, that's about 3.5K input tokens a
  call, or about 0.75M per 216-call AI season.
  - TUNING.md's "about $1 a season" should be checked against `ai.estimate()` after the dry run.
  - The system part is identical across seats and hours, so prompt caching applies on providers that cache. Anthropic
    has a minimum cacheable length (1024–2048 tokens, as I recall), which a ~1.7K-token system part may or may not
    clear on Haiku.

## Job 2 (2026-11-07): direct Claude API seats and per-seat models, for the first real AI season

slime's words (the `--go` text): "Go ai season use my API credits for Anthropic with 2 sonnet at high thinking , haiku
ar extra thinking, then a couple open router models that don't fail calls".

**Built**
- `src/seats/anthropic.mjs`: trunk's `core/agents/anthropic.mjs`, byte for byte below a one-line header naming its
  source and sha256 prefix.
- `src/seats/fake-messages.mjs`: a Messages-format fake (POST /v1/messages).
  - It checks the request is a real Messages body: no chat-only fields, a `system` array, and the version and key
    headers.
  - Its replies carry a `thinking` block and usage counted as the API counts it: cache write, then cache reads,
    with thinking tokens by effort.
  - Scripted answers are keyed by each seat's request count, because the client's 429/529 retries resend the same
    `x-call`.
- **Per-seat settings in `ai.mjs`.** Each seat is `{ agentId, model, api: 'openrouter'|'claude', effort?, maxTokens?,
  timeoutMs? }`.
  - Claude seats: `claudeFields({ thinking: true, model, effort })` (adaptive thinking; effort defaults to high),
    `max_tokens` 16000, a 180 s window, and the system text cache-marked.
  - OpenRouter seats: unchanged (minimal reasoning, 400 tokens, 60 s, JSON mode).
  - Effort is refused on OpenRouter seats, and a Claude model with no entry in `PRICES` is refused.
- **Transports.**
  - `'live'` (old name `'openrouter'`): one OpenRouter client and one Claude client, sharing one `spend` tally, so a
    single `maxCost` caps both. Each key file is read only if a seat uses that API. Under `node --test`, both default
    key files and the real fetch are refused.
  - `'fake'`: OpenRouter seats go to the chat fake. Claude seats go through the real Claude client over the Messages
    fake, so the Messages round trip, pricing, waits and halts all run. Those calls are priced from the fake's made-up
    token counts.
- **`perModel[model]`**: `{ api, efforts, seats, calls, in, out, reasoning (null until reported), cost, failed,
  skipped, cutoffs, finishes, medianMs, p90Ms }`.
  - Latency counts requests that got an answer.
  - Cut-offs count a finish of `length` or `max_tokens`.
  - `ai.turns` logs every turn, and `estimateDetail()` gives per-model season estimates.
- **CLI.**
  - `--seat-models '<json>'` replaces `--models`, with strict checks (unknown keys, api, effort, Claude price).
  - Lineup `ai5` (five characters plus 5 greedy). `withAiSeats` takes seat-model objects and errors when there are
    more models than greedy seats.
  - The preflight now **stops a live run it refuses**; it used to only record the refusal.
  - The dry run prints per-turn and per-model lines and records `runJson.dryRun`.
  - `--max-cost` also works with `--fake`: it caps the fake-priced spend, so a cap can be rehearsed for $0.
  - `run.json` records `seatModels`, `aiSeats`, `go`, `maxCost`, `ai.perModel`, `ai.capped`, `ai.halted`, and
    `ai.stops`: one entry per seed, with the halt reason and the first t played by greedy.
- **Tests**: `test/seats/claude.test.mjs` (10) and `test/seats/cli.test.mjs` (6).

**Checked against the bundled claude-api reference (cached 2026-10-06), not against a call:**
- Haiku 5.5 and Sonnet 5.5 both take effort low–max (Haiku's default is medium, Sonnet's high).
- Both allow up to 128K output.
- The reference advises keeping non-streaming calls at about 16K output or less. The copied client doesn't stream,
  so 16000 is at the ceiling.
- The minimum cacheable prefix is 512 tokens on both, so the system part (about 1.7K tokens) caches.
- `usage.output_tokens_details.thinking_tokens` is reported "where the response carries it".

**Open points for the dry run**
- **Sonnet cache-read price.** Trunk's `PRICES` has $0.10/M for Sonnet 5.5 cache reads; the reference says $0.20/M.
  Small effect: the tally undercounts about $0.0002 a call. I did not edit the copied file.
- **Sonnet at 180 s.** A Sonnet call that spends most of its 16000 tokens could outlast the 180 s window and be retried
  (and billed twice). Watch `p90Ms` and `cutoffs`.
- **Refusals.** A refusal shows as `finishes.refusal` (a failed turn). The game's violent move names could in principle
  meet Sonnet 5.5's classifiers.
- **Preflight compares against the whole cap.** It checks OpenRouter's balance against the whole `--max-cost`, Claude
  share included, so it can refuse when the OpenRouter account holds less than the cap.

## Round 3 (2026-11-08) supersedes the limits above

See SPEC §0.1, R3.4–R3.6.

**Limits**
- OpenRouter `max_tokens` is now 2000, up from 400. Kimi's reasoning overran 400 on 11 of 54 turns in `ai-s1`.
- Claude seats' `max_tokens` and window go by effort:
  - high and below: 16000, 180 s;
  - xhigh: 32000, 360 s;
  - max: 64000, 600 s.
- A Claude reply cut off with no valid move is asked once more at the next lower effort. It is logged as `fallback`.
  Haiku at xhigh hit 16000 on 5 of 54 turns in `ai-s1`.
- Word limits: thought 30, say 20. A cut lands on the last sentence end inside the limit.

**What the prompt shows**
- No hour counter `t`: every hour is a clock time.
- A promise's `by` is a clock time.
- ALERTS come first.
- The style line replaces the bare slider numbers.

**New seat keys:** `--seat-models` entries take `sliders` and `persona`. The bot twin keeps them, via `twinOf`.
