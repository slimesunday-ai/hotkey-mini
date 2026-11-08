# Builder A (engine): notes

Running log: progress, decisions, deviations from SPEC (with the reason), and open questions.

## Status (2026-11-07)

v1 engine built: world, state, menu and view (§7), the hour resolver (§6), cops/jail/hospital/death, crate, bounties,
call-outs, promises, messages, board, parties, the audience (§5), bots (§8), the season loop and `feed.jsonl`, moments,
`report.md`/`report.json`, per-seed play-by-play, `run.mjs` (§12), and `--ai` wired to Builder B's `createAiSeats`.

| File | What |
|---|---|
| `src/rng.mjs` | trunk's `core/rng.mjs`, copied unchanged under a source header |
| `src/config.mjs` | every number, with a comment; `config.systems` switches; `--set` / `--off` helpers |
| `src/world.mjs` | the 3x3 grid, adjacency, distances, `stepToward` |
| `src/state.mjs` | `createSeason`, the agent record, clock helpers |
| `src/lineups.mjs` | brains, `default` / `all-greedy`, lineup files, `withAiSeats` |
| `src/menu.mjs` | legality, live numbers, per-choice `options`, dealt hands |
| `src/view.mjs` | the pinned §7 view and brief |
| `src/audience.mjs` | points + multipliers, steals, the hourly update, the king |
| `src/resolve.mjs` | `runHour` (§6 steps 2-10, 12), `dayEnd` (§6.11), `seasonEnd` |
| `src/bots.mjs` | five characters, turtle, greedy |
| `src/season.mjs` | the season loop (the single owner of `state.t`), `finishHour` |
| `src/stats.mjs`, `src/report.mjs` | per-season numbers, aggregation, `report.md` with the TUNING marks |
| `src/playbyplay.mjs` | the per-seed play-by-play |
| `src/cli.mjs`, `run.mjs` | the command line |
| `test/*.test.mjs`, `test/helpers.mjs` | §14 tests |

Commands: `node run.mjs --bots --seeds 50` (about 4-5 s here), `node run.mjs --ai --fake --seeds 1`,
`node --test "test/**/*.test.mjs"`.

## Decisions (inside the SPEC, where it left a choice)

1. **Time.** `t` counts acting hours from 0 (day 1 06:00) to 53 (day 3 23:00). Every duration (jail, hospital,
   call-outs, promises' `by`, crates, boredom window, bounty reveal) counts acting hours, so nothing expires during
   sleep. Views carry `clock.t`; the brief says so. A state `until` releases at the end of that hour (6 jail hours =
   6 missed acting hours).
2. **Menu `options`.** Lines with choices (targets, items, destinations, goods) carry `options`, one per concrete choice
   with its own `odds/pays/fans/heatRisk/steals`; the line's top-level numbers are its best option's (by the greedy
   value). `targets` are id strings (B's parser accepts strings or `{id}`).
3. **`pays`** is what the line is worth in dollars: cash, plus goods at their live sale value and gear at
   `config.menu.gearWorth` (0 once owned). Cook/build show the value added; deal shows cash in; a job input on `buy`
   shows its margin (`config.menu.jobMargin`) only while you lack the input.
4. **`heatRisk`** (added numeric field) is expected stars added, each counted `menu.wantedWeight` (3) times when it lands
   at 3+ stars. `lay_low` shows a negative risk. `heat` stays the human text.
5. **`steals`** (added): the menu's estimate of viewers a win takes, from the target's public crowd size (mid-points in
   `audience.crowdMid`), so the steal isn't hidden behind the private viewer count.
6. **Move options** carry `next` (the best line at that block right now, with its value), `available` (legal ids there)
   and call-out stakes (showing up at your open call-out's block avoids the duck; leaving it risks it).
7. **Greedy** scores `odds × (pays + k·Σfans + v·steals) − e·energy − h·heatRisk` (SPEC formula plus the `v·steals`
   term, so a menu-visible payoff isn't ignored); a move is worth `moveDiscount × next.value`; it rests below
   `restBelow` energy. Weights in `config.bots.greedy`.
8. **Deal crowding** resolves on this hour's dealers on the block (§6.5); the menu forecasts it from last hour's (§4.1).
9. **Crate.** The action costs 10 and every contestant also takes the brawl's −10 (read literally: total 20).
10. **Call-outs.** A meeting can happen in the hour it's made (both already on the block). At the deadline, a target
    that never showed ducks (loses 10% to the caller); a target that showed while the caller didn't makes the caller
    the ducker (loses 10% to the target). Call-out targets exclude agents in jail, hospital or dead.
11. **steal_car** with a car owner on the block targets them; street theft is offered only when nobody here owns a car
    (B's parser requires a target whenever a line lists targets, so one line can't offer both).
12. **Partying hosts** are in state `partying`: a talk-only view for the 3 hours, still on the block and attackable.
13. **Releases.** Jail releases to the precinct, hospital to home, revive at home (§4.7).
14. **Rent.** Charged at midnight after days 1 and 2 (not after the last day, which ends the season). Re-housing costs
    the missed $40 + $20.
15. **Grudges** are written for every hostile act against you (mugs, fights, shots, car theft, kill attempts, broken
    promises, revealed bounty posters). Revenge = a win against someone you hold a grudge on.
16. **Getaways.** 4-5 star crimes by a car owner (bank job, kill_king) and drive-bys roll; success means no arrest this
    hour. Bank job win / kill_king win: a failed (or no) getaway is an arrest; bank job fail: a failed getaway then
    rolls the 50% arrest.
17. **Talk-only views** (jail, hospital, partying) have `menu: []` and `talkOnly: true`; dead agents get no view.
18. **audienceTastes off** = every group likes every outcome equally (each outcome's points spread evenly over the four
    groups), so the view shape stays the same.
19. **Feed extras** (added fields): `t`, `dayEnd`, and per agent `fans`, `delta`, `acting`, `involved`, `sell`,
    `callShot`, `by` (bot / ai / bot-halted).
20. **Interactions** are typed events `{ a, b, kind, cause }`, kind `hostile | friendly | rival (battles) | talk
    (plain messages) | trade (board)`. "Involves another agent" counts the initiator of an action or message and both
    sides of a board trade.
21. **Seats.** Jobs are a seeded shuffle of the job deck per seed (characters × jobs vary across seeds); names are fixed
    per seat. Sliders = the brain's preset ± seeded 0.1.
22. **Bots** use only their view, the static config and their own seeded stream. Characters keep promises with
    probability = loyalty (decided once per promise). The shared seller lists surplus goods just under the best ask.

## Orchestrator's changes, applied (2026-11-07)

- `ai.halted` (cap, credit or key) hands AI seats to their bot twins for the rest of the run.
- `brief.reply = REPLY_FORMAT` from `src/seats/reply.mjs`.
- bounty line only when floor(cash) ≥ $50; call-out targets exclude jail/hospital/dead; "at home" wording.
- The season loop is the only owner of `state.t` (`finishHour`); bots and `--ai` share it.
- Dealt hands always include `kill_king`, `run_cops` and `crate` when legal (SPEC §7 update).

## Sanity pass (config changes, each with the reason)

Run: `node run.mjs --bots --seeds 50` (default lineup) plus `all-greedy`.

1. `bots.greedy.k` 15 → 8. At 15, a fan point outbid every job (a crip walk beat cooking or dealing), so greedy dealers
   never dealt, chemists rarely cooked and greedy seats were broke.
2. `menu.gearWorth.car` 150 → 40 (new number). At 150, street car theft was the greedy bots' best line: about 7 cars
   stolen per season, +2 stars each, and greedy seats spent about a third of the season in jail.
3. New `menu.wantedWeight` 3 (heatRisk weighting above). Without it greedy walked into 3-5 stars at $8 a star.

Engine/menu fixes found in the same pass (bugs, not tuning): smuggling runs priced at the live board (chems were never
run because parts always looked worth more); the buy line's job margin only while you lack the input (chemists were
buying chems every hour); scouting is worth nothing without a gun or car; bots list goods under the best ask; brave
characters show up at their call-outs; characters feel rent pressure after 16:00; the hothead buys the cheapest gun.

After the pass (50 seeds, default): evictions 2.7 of 10 on day 1, a gun in play in 94% of seasons, top action `move`
~20%, ~11 interactions per agent per day. Not tuned further (the orchestrator's loop).

## Open questions / things the orchestrator should know

- **Volatile king.** ~30 lead changes and ~20 comeback moments per season: churn 0.3 plus all-points-share
  reallocation reshuffles viewers every hour. These inflate moments and make the dull-stretch mark easy.
- **Jail is heavy.** ~20% of agent-hours in jail in the default lineup (mostly the violent characters and greedy).
- **The audience shrinks** (~0.8x by season end): total points per group per hour rarely reach `growthFull`.
- **King attempts are rare** (well under half of seasons): guns are scarce in the hands of whoever wants to kill.
- **Greedy is myopic**: it values a job input only through `jobMargin`; chains of 3+ steps aren't seen.
- B's prompt leaves `next.value` out on purpose (so models don't learn the greedy metric).

## Final v1 numbers (50 seeds each, from `out/final-*`, not committed)

| | default | all-greedy | all-greedy, `--off audienceTastes` |
|---|---|---|---|
| run time | 3.7 s | 4.2 s | 4.4 s |
| interactions per agent per day | 12.82 | 11.09 | 11.97 |
| acting hours involving another agent | 38% | 39% | 43% |
| rivalries / alliances per season | 12.1 / 6.04 | 9.5 / 3.22 | 11.72 / 2 |
| moments per season / lead changes | 148.1 / 29.56 | 149.6 / 31.48 | 160.04 / 28.02 |
| seasons with a king attempt | 14% | 0% | 0% |
| top-third repeat | 38% | 29% | 30% |
| copycat: top action share per hour / greedy mix similarity | 29% / 0.72 | 36% / 0.72 | 36% / 0.73 |
| audience end/start | 0.79x | 0.83x | 0.84x |
| longest dull stretch (mean / worst) | 1.32 / 3 | 1.2 / 3 | 1.2 / 3 |
| evictions per season (day 1) | 5.28 (2.62) | 5.94 (3.38) | 6.28 (2.94) |
| agent-hours in jail | 21% | 19% | 22% |

Turtle (default): last place in every seed (mean place 10). Greedy seats win 68% of default seasons.
`--ai --fake --seeds 1`: 216 AI calls, 0 failed, $0, plus its bot twin.

## Round 1 (2026-11-07): exploits, the crown, first tuning numbers

Applied the orchestrator's round 1 job. Every item has a regression test in `test/round1.test.mjs`, apart from the
rent changes (`test/rent.test.mjs`) and the parser changes (`test/seats/reply.test.mjs`).

**A. Exploits**
1. Promise farm. A promise's `by` must be at least t+2 (engine and `parseReply`, which now gets `ctx.t`). The limits are
   one open promise per recipient and 2 open per sender. A cash promise can't exceed the sender's cash and an item
   promise needs the item, both judged on holdings before the message's own attachments move. The breaker scores drama
   4 per $100 unpaid, through `outcomePoints` (boredom counts earlier breaks). A promise is kept only by a payment in a
   later hour. My additions: kept points and the victim's points scale by min(1, stake/$100), so $1 promises are worth
   about nothing either way. Rejected promises are typed `promise_rejected` events, and the message is still delivered.
   Regression: the turtle with 5 spam patterns (the reviewer's 3 plus 2 legal ones) stays in the bottom half on average.
2. Call-outs. There's no meeting in the hour of the call-out. A met fight is `fight(..., 'callout')`: both pay 15
   energy, both score through `outcomePoints` as a fistfight, and both get a history entry so boredom counts it. Only
   the target ducks. A caller who never shows lets it lapse (`callout_lapsed`). My addition: a target in jail, in
   hospital or dead at the deadline doesn't duck. The menu line states the real outcomes.
3. Dealt hands always include the line the agent moved for last hour (`agent.movedFor`, from the move option's
   `next.id`).
4. Rent. Back rent grows $40 every night evicted, and coming home costs back rent + tonight's $40 + $20. Evicted sleep
   gives +20 energy.
5. Kingslayer is ×1.5 for non-lethal wins and ×2 for kill_king (0.4 × 2 = 0.8). Ducks and mug defences never get it.
6. `heatRisk` shows raw expected stars, and the wanted weighting lives only in `lineValue(cfg, o, stars)`. Battle and
   fistfight roll on the start-of-hour energies before anyone pays; the probe-style test lands within 0.06 of the menu
   odds. Your own bounty is never in your pays, and you can't collect it.
7. Arrest lines carry no fine. The fine is a typed field on the moment, shown only in the play-by-play.
8. A called shot is still recorded (×2 and −0.15) but pulls a cop only when that move against that target is on the
   caller's menu (`call_shot.pull`).
9. LLM hazards:
   - (a) A line's headline numbers are its first option's, in neutral order (targets by id, items in list order,
     destinations in grid order). `next` stays in the view for bots, and the prompt no longer prints "best there".
   - (b) The buy line lists `combos` (item + source); `from` is optional and filled from the combo. Both the engine and
     `parseReply` reject a bad pair. A buy that can't resolve costs no energy.
   - (c) `parseReply` fills missing args from the line's first option.
   - (d) A failed move keeps its thought, say and message (`{ ok: false, why, reply }`), and `ai.mjs` passes that
     reply on.

**B. Crown and audience** (with new switches, so they can be ablated)
1. `systems.leaderKing` (on): the king is the viewer-hours leader (ties: current viewers, then id). Season standings,
   the view's coarse rank and comebacks use viewer-hours; the attention energy bonus still uses current viewers.
2. `systems.smoothAudience` (on): only min(1, points/growthFull) of a group's pot is handed out; the rest stays
   unassigned.
3. Mutual fights. A fistfight or battle picked by both sides against each other is one fight: both pay, one winner,
   and both results are marked `mutual`.

**C. Numbers:** `shop.gun` 150 → 90, `agents.startCash` 100 → 200, `audience.decayRate` 0.02 → 0.01,
`audience.churn` 0.3 → 0.15.

**D. Wording.**
- "smuggled", "ran a drip check ... with no jewelry", "called their shot: will kill X".
- Arrests read "(fined $X)" or "(broke, no fine)".
- Hour states read "in jail", "in hospital" or "hosting a party".
- Revenge says what it's for ("for the Day 1 09:00 mugging": grudges now carry a typed `kind`).
- "The town learns X posted the $N bounty on Y".
- Feed entries get a typed `incoming` list, so targets see what was done to them ("was challenged to a battle by Moss
  and won").

**E. Report.** Strong dull stretch (no `lead_change`, `comeback` or `callout_ducked`). The mark keeps its v1 title, so
`tools/compare.mjs` lines it up, but it now uses the strong measure; both values are reported.

**Ablations** (50 seeds, default lineup, from `out/r1-abl-*`, gitignored):
- `--off leaderKing`: 20.68 lead changes vs 3.68 on. The leader-king rule is what stabilised the crown.
- Old C numbers: audience end/start 0.7x vs 1.15x, and a king attempt in 12% vs 44% of seasons. The numbers drive
  audience growth and the king hunts.
- `--off smoothAudience`: 3,221,287 minutes watched vs 1,745,584 on. Smoothing roughly halves minutes watched, and
  chemists win 30% of seasons without it vs 46% with it.

I left SPEC.md alone. These rule changes came from the orchestrator, who owns SPEC.

## Round 2 (2026-11-07): small rules and play-by-play clarity

**Rules** (tests in `test/round2.test.mjs`)
1. `cops.jailHours` 6 → 4 (+3 for a failed run stays). The brief's jail rule is built from config.
2. `drip_check` is on the menu only while you wear flash; `baseFlash` is gone. With `systems.flash` off nobody wears
   flash, so nobody can drip check. If one is attempted anyway, it fails and costs no energy.
3. Revenge (the ×1.5 and the moment) counts only grudges from earlier hours.
4. `call_out.duckSteal` 0.10 → 0.15. Ducks are always the first headline in everyone's view, and the call-out line
   says "the whole town hears they ducked".

**Play-by-play**
5. Promises show as they're made: "✎ Kim promised Vex $30 by Day 1 12:00".
6. Payments and reveals are tied to their cause:
   - a payment reads "(+$30, paying the $30 promised Day 1 10:00)", from a typed `keeps` on the message;
   - kept promises read "X kept a promise: paid Y $30, promised Day 1 10:00";
   - reveals read "..., the one Vex collected Day 1 10:00" or "..., still uncollected".
7. The header states the win rule.
8. Crown changes carry context:
   - the public line says where each king is ("while sitting in jail", "who is in hospital");
   - the play-by-play adds both totals from the moment's typed `leader` / `previous` fields;
   - the first king gets a ♛ note.
9. No `t` numbers for viewers. Hour headers, call-out windows ("from Day 1 10:00 until Day 1 12:00"), promise due
   times and the bots' canned promise lines all use `clockLabel` / `dayLabel`. The AI prompt keeps `t`.
10. Battles read "dance/rap battle (no violence)".
11. Glitches fixed:
    - every hour now prints its header and king (a quiet hour says so); the old renderer skipped hours with no moment
      and nobody shown, which is why seed 3 lost Day 3 06:00;
    - an agent revived or released in an hour shows that ("came back from the dead, at home"), not "dead".

Round 2's compare deltas (`out/r1-*` → `out/r2-*`) also include Codex's `points.run` 1 → 1.5 (commit `61899c9`),
since `out/r1-*` was run before it.
