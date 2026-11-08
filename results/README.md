# Results

The playtest record so far: the AI seasons, the free bot test runs behind each tuning round, and the reviews that judged
them. How each round is run and judged is in [`../TUNING.md`](../TUNING.md). What changed in each round is in
[`../SPEC.md`](../SPEC.md) §0.1.

Removed from everything here: account numbers (API balance and spend), local paths. Not included: fake-transport runs
and debugging probes.

## AI seasons

Five seats are played by models, and five by scripted character bots: hothead, hustler, showboat, snake and saint.

Every AI season also runs a **bot twin**: the same seed, with simple bots in the AI seats.

| Season | Rules | Models and settings | Cost | Winner | Blind viewer, AI vs bot twin |
|---|---|---|---|---|---|
| [`ai-s1`](ai-seasons/ai-s1) (2026-11-07) | round 2 | 2× claude-sonnet-5-5 (high), claude-haiku-5-5 (xhigh), openai/gpt-6.1-sol, moonshotai/kimi-k3.1-pro. All sliders mid | $2.04, 270 calls | Sable (gpt-6.1-sol), 4,866 viewer-hours, 69 ahead of Wren (kimi) | 6/10 vs 4/10 |
| [`ai-s2`](ai-seasons/ai-s2) (2026-11-08) | round 3 (sliders) | Same models. Juno reckless + snake, Rook safe + ride-or-die (both Sonnet), Tally show-off (Haiku), Sable reckless + ride-or-die (Sol), Wren mid (Kimi) | $2.11, 247 calls | Sable (gpt-6.1-sol), 4,956 viewer-hours, 223 ahead of Vex (hothead bot) | 6/10 vs 3/10; it guessed 10 of 15 hidden settings |

**`ai-s1`: AIs bring character, bots bring stakes.**
- 50% of acting hours involved another agent. The best bot run reached 39%.
- The season had rivalries, debt collectors, and hypocrisy between what an AI thought and what it said.
- No AI shot anyone, robbed the bank, went for the king, or made a promise. Their thoughts were about rent and avoiding
  arrest.

**`ai-s2`: the first AI to buy a gun, and the first AI king kill.**
- Sable, set reckless, bought a gun on Day 2 at 11:00 and killed King Tally an hour later.
- The settings showed for Sol and Haiku. Sonnet mostly ignored "reckless" ("Cooking is safe and steady").
- "Snake" never showed, because no AI made a promise.
- Sable was killed on Day 3 at 12:00 and still won on banked watch time.
- AI turn failures: Haiku 0 and Kimi 0, down from 5 and 12 in `ai-s1`.

**What each season folder holds:**
- `report.md` / `report.json`: the marks, calls and costs per model, and, for `ai-s2`, each agent's style in play.
- `run.json`: the exact command and settings.
- `1/`: the AI season itself: `play-by-play.md` (what viewers read), `feed.jsonl` (every hour, every agent: move,
  result, speech, private thought, message) and `season.json`.
- `1-twin/`: the bot twin.
- `ai-s1/1/play-by-play-rerendered-round3.md`: the same `ai-s1` season in the round-3 play-by-play format.
- `dry-runs/`: each season's one-hour paid check.

**A known flaw in `ai-s2`'s text:** AI thoughts and speech were cut at 15 words by an old engine cap. That's fixed since,
so new seasons keep 30 words of thought and 20 of speech.

## Bot test runs

[`bot-runs/`](bot-runs) has 64 runs. Each has `report.md`, `report.json` and `run.json` (the exact command). Seeds are
deterministic, so a run's command reproduces it exactly, including the play-by-plays not stored here, on the code of its
day. Seed 1's play-by-play is included for `verify-a`, `r1-default`, `r2-default`, `r3-final-default` and
`r3-final-styles`.

The anchor run for each round (default lineup):

| Round | Anchor run | Seeds | Agent-to-agent hours | Lead changes a season | Seasons with a king attempt | Audience end/start | Shootings a season | Jail share |
|---|---|---|---|---|---|---|---|---|
| v1 | `verify-a` | 50 | 38% | 29.6 | 14% | 0.79x | 0.7 | 21% |
| 1 | `r1-default` | 50 | 36% | 3.7 | 44% | 1.15x | 3.2 | 20% |
| 2 | `r2-default` | 50 | 39% | 3.6 | 38% | 1.23x | 2.8 | 16% |
| 3 | `r3-final-default` | 30 | 38% | 3.7 | 37% | 1.20x | 4.0 | 16% |

**What each round changed:**
- **v1:** the first build.
- **Round 1:**
  - closed the exploits;
  - the king became the season leader by viewer-hours;
  - smoother audience swings;
  - cheaper guns ($90) and more starting cash ($200).
- **Round 2:**
  - smuggling pays more;
  - 4-hour jail;
  - drip checks need jewelry;
  - public ducks.
- **Round 3:**
  - owner sliders put matching moves in front of agents;
  - alerts;
  - call-out fixes;
  - clock-time prompts;
  - a play-by-play with a cast and a race.

**The round-3 slider sweep** (`r3-styles-*`, `r3-default-*`, `r3-abl-*`, `r3-a-*`). The `styles` lineup has ten
menu-following bots that differ only in sliders. It shows that any real fan bonus for on-style moves makes the high
setting win almost every season:
- show-off won 87% of seeds at bonus 0.5 (`r3-styles-b50`);
- reckless won 77% with only a risk bonus (`r3-styles-rc0`);
- with no bonus, every style won 13–27% (`r3-final-styles`).

So round 3 ships without the risk and clout bonus (SPEC §0.1).

Other folders:
- `final-*`: v1's last checks.
- `r1-abl-*`: round-1 ablations.
- `sweep-*`: single-setting sweeps behind rounds 1–2.
- `r3-final-greedy` and `r3-final-ai5bots`: the shipped rules on the other lineups.

## Reviews

[`reviews/`](reviews):
- `2026-11-07-exploit-review-v1.md`: the read-only mechanics review of v1. It found the promise farm, the call-out
  loopholes, kill-the-king paying less than shooting, and LLM parsing traps.
- `2026-11-07-viewer-round2-bots.md`: a blind viewer on three bot seasons after round 2. 5/10, with real plots and no
  ending.
- `2026-11-07-viewer-ai-s1.md`: a blind viewer on `ai-s1` (season A) and its bot twin (season B).
- `2026-11-08-viewer-ai-s2.md`: a blind viewer on `ai-s2` and its twin. It first guessed every AI's hidden settings from
  behavior alone, then scored the season.

The v1 and round-1 viewers' scores (5/10 each) are recorded in the tuning notes, but their full reports weren't kept.

## Unit tests

`node --test` at the commit that added this folder: 251 tests, 251 pass, 0 fail. The suite runs in about 8 s.
