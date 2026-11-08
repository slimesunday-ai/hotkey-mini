# Codex round 2

Completed in Node v22.22.2. All four required verification commands exited 0.

## Diff summary

- `src/config.mjs`: changed `points.run.action` from 1 to 1.5 and added the requested round 2 comment.
- `src/report.mjs`: replaced only the two requested marks. Broken promises must occur in at least 80% of seasons, and a lead change in more than 50%; the value shows both shares. Each configured job must win between 0.5x and 1.5x its seat share, with values shown as `job win% (seat%)`. Pass/fail uses unrounded shares.
- `src/stats.mjs`: carries a copy of `cfg.agents.jobs` into the season stats so the job mark uses the configured distribution.
- `tools/compare.mjs`: compares all three optional strong dull fields; `seasonsStrongDullAtMost3` uses percentages and percentage-point deltas.
- `test/round1.test.mjs`: added coverage for separate season shares, inclusive/exclusive thresholds, rounding boundaries, configured seat distributions, both job-ratio bounds, and zero wins.
- `test/compare.test.mjs`: added JSON/text coverage for the three fields and their absence from either or both reports.
- `TUNING.md`: changed only the two requested mark lines.

The existing `SPEC.md` modification was present before this task and was left untouched. Generated verification artifacts are in `out/r2-codex-check`. No network access, npm installs, staging, or commits were performed.

## Verification output

### `node --test "test/**/*.test.mjs"`

TAP summary (182 passed; no failures, cancellations, skips, or TODOs):

```text
1..182
# tests 182
# suites 0
# pass 182
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 6761.788375
```

### `node run.mjs --bots --seeds 20 --out out/r2-codex-check`

```text
20 seasons (bots, lineup default) in 2089 ms -> out/r2-codex-check
  [FAIL] At least 40% of acting hours involve another agent: 37%
  [FAIL] Every agent interacts with at least 4 others per season: 70% of seasons (mean fewest partners 4.1)
  [pass] At least 2 rivalries per season: mean 10.05; 100% of seasons
  [pass] At least 1 broken promise per season, and a lead change in most seasons: broken promise in 100% of seasons; lead change in 100% of seasons
  [FAIL] At least 1 king attempt in most seasons: 40% of seasons
  [FAIL] Top agent finishes top third again in 50-70% of seeds: 40%
  [pass] Turtle finishes in the bottom third in at least 80% of seeds: 100% (mean place 9.95)
  [pass] Each job wins between 0.5x and 1.5x its share of seats: smuggler 15% (20%), chemist 30% (30%), dealer 35% (30%), gunrunner 20% (20%)
  [n/a] Copycat: most common action takes 40% or less of acting hours (all-greedy lineup): top share per hour 30%; overall top action move 21%
  [pass] The audience ends the season at least as big as it started: end/start 1.14x; 100% of seasons
  [FAIL] Longest dull stretch is 3 acting hours or less: strong moments only: mean 3.7, worst 7, 45% of seasons; any moment: mean 3.15, worst 7
```

Both new marks pass. Other simulation tuning marks still fail as shown above; these are report findings, not test or command failures.

### `out/r2-codex-check/report.md` marks table

```text
## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 37% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 70% of seasons (mean fewest partners 4.1) | **no** |
| 1 | At least 2 rivalries per season | mean 10.05; 100% of seasons | yes |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 100% of seasons; lead change in 100% of seasons | yes |
| 2 | At least 1 king attempt in most seasons | 40% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 40% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 100% (mean place 9.95) | yes |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 15% (20%), chemist 30% (30%), dealer 35% (30%), gunrunner 20% (20%) | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 21% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.14x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3.7, worst 7, 45% of seasons; any moment: mean 3.15, worst 7 | **no** |
```

### `node tools/compare.mjs out/r1-default out/r2-codex-check`

The existing round 1 run contains 50 seasons; the requested check contains 20. The renamed marks appear as removed/added because comparison matches marks by text.

```text
A: out/r1-default | run=r1-default | lineup=default | off=[] | sets=[] | configHash=d78dccee | seasons=50
B: out/r2-codex-check | run=r2-codex-check | lineup=default | off=[] | sets=[] | configHash=3185a4c3 | seasons=20

Shares use %; share deltas use pp (percentage points). Change % = (B-A)/A; zero base = n/a.
metric                                            A        B  delta (B-A)  change %
------------------------------------------  -------  -------  -----------  --------
interacting.involvedShare                       36%      37%        +1 pp    +2.78%
interacting.interactionsPerAgentPerDay         10.9    10.89        -0.01    -0.09%
interacting.everyoneMet4                        68%      70%        +2 pp    +2.94%
interacting.minPartners                        3.94      4.1        +0.16    +4.06%
interacting.rivalries                          9.54    10.05        +0.51    +5.35%
interacting.alliances                           5.8     6.25        +0.45    +7.76%
interacting.messagesSent                      48.26     48.7        +0.44    +0.91%
interacting.promisesMade                      10.86     11.3        +0.44    +4.05%
interacting.promisesKept                       3.96     4.25        +0.29    +7.32%
interacting.promisesBroken                      6.9     7.05        +0.15    +2.17%
interacting.tradesAgentAgent                  24.02    25.55        +1.53    +6.37%
interesting.momentsPerSeason                  91.22     90.9        -0.32    -0.35%
interesting.leadChanges                        3.68     3.95        +0.27    +7.34%
interesting.seasonsWithKingAttempt              44%      40%        -4 pp    -9.09%
interesting.topThirdRepeat                      40%      40%         0 pp        0%
interesting.copycatTopShare                     30%      30%         0 pp        0%
interesting.greedySimilarity                   0.74     0.71        -0.03    -4.05%
interesting.momentsByType.arrest              18.48     18.9        +0.42    +2.27%
interesting.momentsByType.bank_job_fail         2.8     2.35        -0.45   -16.07%
interesting.momentsByType.bank_job_win         0.96     0.85        -0.11   -11.46%
interesting.momentsByType.bounty_collected      2.2     2.15        -0.05    -2.27%
interesting.momentsByType.bounty_posted        2.82      2.6        -0.22     -7.8%
interesting.momentsByType.bounty_revealed       2.6     2.35        -0.25    -9.62%
interesting.momentsByType.callout_answered     7.96        7        -0.96   -12.06%
interesting.momentsByType.callout_ducked        4.8     5.05        +0.25    +5.21%
interesting.momentsByType.comeback             2.74        3        +0.26    +9.49%
interesting.momentsByType.crate_brawl          0.28      0.4        +0.12   +42.86%
interesting.momentsByType.drive_by             0.28     0.25        -0.03   -10.71%
interesting.momentsByType.escape               3.24     2.75        -0.49   -15.12%
interesting.momentsByType.eviction             3.66      3.9        +0.24    +6.56%
interesting.momentsByType.king_attempt          0.3     0.35        +0.05   +16.67%
interesting.momentsByType.king_killed          0.18     0.25        +0.07   +38.89%
interesting.momentsByType.lead_change          3.68     3.95        +0.27    +7.34%
interesting.momentsByType.party                0.54     0.65        +0.11   +20.37%
interesting.momentsByType.promise_broken        6.9     7.05        +0.15    +2.17%
interesting.momentsByType.promise_kept         3.96     4.25        +0.29    +7.32%
interesting.momentsByType.revenge             19.86    18.95        -0.91    -4.58%
interesting.momentsByType.revive                0.1     0.25        +0.15     +150%
interesting.momentsByType.shooting             2.88     3.65        +0.77   +26.74%
interesting.winsByJob.chemist                   46%      30%       -16 pp   -34.78%
interesting.winsByJob.dealer                    26%      35%        +9 pp   +34.62%
interesting.winsByJob.gunrunner                 20%      20%         0 pp        0%
interesting.winsByJob.smuggler                   8%      15%        +7 pp    +87.5%
interesting.winsByBrain.greedy                  62%      50%       -12 pp   -19.35%
interesting.winsByBrain.hothead                 14%      20%        +6 pp   +42.86%
interesting.winsByBrain.hustler                  2%       5%        +3 pp     +150%
interesting.winsByBrain.saint                    0%       0%         0 pp       n/a
interesting.winsByBrain.showboat                 8%      10%        +2 pp      +25%
interesting.winsByBrain.snake                   12%      15%        +3 pp      +25%
interesting.winsByBrain.turtle                   2%       0%        -2 pp     -100%
watch.minutesWatched                        1745584  1738200        -7384    -0.42%
watch.audienceEndRatio                         1.15     1.14        -0.01    -0.87%
watch.seasonsGrowing                           100%     100%         0 pp        0%
watch.longestDull                              2.86     3.15        +0.29   +10.14%
watch.longestDullMax                              5        7           +2      +40%
watch.longestStrongDull                        3.32      3.7        +0.38   +11.45%
watch.longestStrongDullMax                        5        7           +2      +40%
watch.seasonsStrongDullAtMost3                  56%      45%       -11 pp   -19.64%
economy.dealCash                             635.52   643.25        +7.73    +1.22%
economy.gunsBuilt                               4.7      4.4         -0.3    -6.38%
economy.evictions                              3.66      3.9        +0.24    +6.56%
economy.arrests                               18.48     18.9        +0.42    +2.27%
economy.jailShare                               20%      21%        +1 pp       +5%
economy.hospitalShare                            2%       2%         0 pp        0%
economy.deaths                                 0.18     0.25        +0.07   +38.89%
economy.seasonsWithAGun                        100%     100%         0 pp        0%
economy.cashByDay.day1                       104.76    98.28        -6.48    -6.19%
economy.cashByDay.day2                       102.95    92.37       -10.58   -10.28%
economy.cashByDay.day3                       130.56   129.19        -1.37    -1.05%

marks
mark                                                                                     A        B           change
---------------------------------------------------------------------------------  -------  -------  ---------------
At least 40% of acting hours involve another agent                                    fail     fail        unchanged
Every agent interacts with at least 4 others per season                               fail     fail        unchanged
At least 2 rivalries per season                                                       pass     pass        unchanged
At least 1 broken promise and 2 lead changes per season                               fail  missing  fail -> missing
At least 1 king attempt in most seasons                                               fail     fail        unchanged
Top agent finishes top third again in 50-70% of seeds                                 fail     fail        unchanged
Turtle finishes in the bottom third in at least 80% of seeds                          pass     pass        unchanged
No job wins more than 40% of seasons; every job wins at least 10%                     fail  missing  fail -> missing
Copycat: most common action takes 40% or less of acting hours (all-greedy lineup)      n/a      n/a        unchanged
The audience ends the season at least as big as it started                            pass     pass        unchanged
Longest dull stretch is 3 acting hours or less                                        fail     fail        unchanged
At least 1 broken promise per season, and a lead change in most seasons            missing     pass  missing -> pass
Each job wins between 0.5x and 1.5x its share of seats                             missing     pass  missing -> pass
```

### `node scripts/check-keys.mjs`

```text
check-keys: clean
```

