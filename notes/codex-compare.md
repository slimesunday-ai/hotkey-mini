# Report comparison

Implemented only `tools/compare.mjs`, `test/compare.test.mjs`, and this note. Uses Node built-ins only; no network, package installs, or Git mutations.

## Usage and output

```sh
node tools/compare.mjs <runA> <runB> [--json]
```

Inspected `out/verify-a/report.json` and `out/final-all-greedy/report.json` before implementation. Their season counts are top-level, daily cash is an array, and marks use `mark` for their text with boolean or null `pass` values.

- Scalar metrics appear when present in either report. Missing or null scalar values display as `n/a`.
- Moments, job wins, brain wins, and cash days include entries from both runs, with missing entries treated as zero. Cash days are numbered from 1.
- Shares display as percentages, with share deltas in percentage points (`pp`). Audience ratios and similarity scores stay numeric. Text numbers use up to two decimals.
- Percent change is `(B - A) / A * 100`. A zero base, including zero to zero, displays as `n/a`.
- Marks match by exact text, falling back to index when text is unavailable. Added or removed marks show `missing`; null pass results show `n/a`. Changes show the A-to-B status transition.
- Missing run folders or `report.json` files exit 2 and identify the missing path on stderr. Invalid usage also exits 2; malformed reports exit 1.
- JSON shape: `{ runs: { a: { folder, meta }, b: { folder, meta } }, metrics, marks }`. Metadata includes `run`, `lineup`, `off`, `sets`, `configHash`, and `seasons`. Metric rows contain `metric`, `a`, `b`, `delta`, `percentChange`, and `unit` (`number` or `share`). Numeric values retain their input precision; shares and their deltas remain fractions. Undefined values or changes are JSON `null`, never Infinity or NaN. Mark rows contain `text`, A/B status strings in `a` and `b`, and a `changed` boolean.
- Tests create two fake reports per fixture in `fs.mkdtempSync(path.join(os.tmpdir(), 'hkmini-'))` and clean up afterward.

## Verification

Environment: Node v22.22.2. Both required commands exited successfully.

### `node --test test/compare.test.mjs`

Exit code: 0

```text
TAP version 13
# Subtest: --json includes run metadata, numeric metric rows and mark differences
ok 1 - --json includes run metadata, numeric metric rows and mark differences
  ---
  duration_ms: 56.2705
  type: 'test'
  ...
# Subtest: plain text includes metadata and formats shares, deltas and numbers
ok 2 - plain text includes metadata and formats shares, deltas and numbers
  ---
  duration_ms: 53.404917
  type: 'test'
  ...
# Subtest: zero bases yield n/a in text and null in JSON, including zero to zero
ok 3 - zero bases yield n/a in text and null in JSON, including zero to zero
  ---
  duration_ms: 102.1025
  type: 'test'
  ...
# Subtest: union sections include either run's keys and days, using zero for missing entries
ok 4 - union sections include either run's keys and days, using zero for missing entries
  ---
  duration_ms: 52.554542
  type: 'test'
  ...
# Subtest: absent sections are allowed; unavailable scalar values remain n/a
ok 5 - absent sections are allowed; unavailable scalar values remain n/a
  ---
  duration_ms: 103.864667
  type: 'test'
  ...
# Subtest: marks match by text despite reordering, fall back to index, and show changes
ok 6 - marks match by text despite reordering, fall back to index, and show changes
  ---
  duration_ms: 107.121542
  type: 'test'
  ...
# Subtest: missing run folders exit 2 with a clear path on stderr
ok 7 - missing run folders exit 2 with a clear path on stderr
  ---
  duration_ms: 102.615708
  type: 'test'
  ...
# Subtest: missing report.json exits 2 and identifies the missing file
ok 8 - missing report.json exits 2 and identifies the missing file
  ---
  duration_ms: 53.957791
  type: 'test'
  ...
# Subtest: invalid arguments print usage and malformed JSON reports its file
ok 9 - invalid arguments print usage and malformed JSON reports its file
  ---
  duration_ms: 253.706208
  type: 'test'
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 957.069334
```

### `node tools/compare.mjs out/verify-a out/final-all-greedy`

Exit code: 0

```text
A: out/verify-a | run=verify-a | lineup=default | off=[] | sets=[] | configHash=609319a4 | seasons=50
B: out/final-all-greedy | run=final-all-greedy | lineup=all-greedy | off=[] | sets=[] | configHash=609319a4 | seasons=50

Shares use %; share deltas use pp (percentage points). Change % = (B-A)/A; zero base = n/a.
metric                                            A        B  delta (B-A)  change %
------------------------------------------  -------  -------  -----------  --------
interacting.involvedShare                       38%      39%        +1 pp    +2.63%
interacting.interactionsPerAgentPerDay        12.82    11.09        -1.73   -13.49%
interacting.everyoneMet4                        70%      94%       +24 pp   +34.29%
interacting.minPartners                        3.96     4.98        +1.02   +25.76%
interacting.rivalries                          12.1      9.5         -2.6   -21.49%
interacting.alliances                          6.04     3.22        -2.82   -46.69%
interacting.messagesSent                      49.22        0       -49.22     -100%
interacting.promisesMade                      13.94        0       -13.94     -100%
interacting.promisesKept                       2.92        0        -2.92     -100%
interacting.promisesBroken                    11.02        0       -11.02     -100%
interacting.tradesAgentAgent                  21.82     42.1       +20.28   +92.94%
interesting.momentsPerSeason                  148.1    149.6         +1.5    +1.01%
interesting.leadChanges                       29.56    31.48        +1.92     +6.5%
interesting.seasonsWithKingAttempt              14%       0%       -14 pp     -100%
interesting.topThirdRepeat                      38%      29%        -9 pp   -23.68%
interesting.copycatTopShare                     29%      36%        +7 pp   +24.14%
interesting.greedySimilarity                   0.72     0.72            0        0%
interesting.momentsByType.arrest              18.52    16.98        -1.54    -8.32%
interesting.momentsByType.bank_job_fail        0.42     1.28        +0.86  +204.76%
interesting.momentsByType.bank_job_win         0.12     0.74        +0.62  +516.67%
interesting.momentsByType.bounty_collected      1.5        0         -1.5     -100%
interesting.momentsByType.bounty_posted         1.8        0         -1.8     -100%
interesting.momentsByType.bounty_revealed      1.66        0        -1.66     -100%
interesting.momentsByType.callout_answered    14.08    26.66       +12.58   +89.35%
interesting.momentsByType.callout_ducked      21.36     24.7        +3.34   +15.64%
interesting.momentsByType.comeback             19.2     20.7         +1.5    +7.81%
interesting.momentsByType.crate_brawl           0.3     1.44        +1.14     +380%
interesting.momentsByType.drive_by             0.08        0        -0.08     -100%
interesting.momentsByType.escape                3.1     3.46        +0.36   +11.61%
interesting.momentsByType.eviction             5.28     5.94        +0.66    +12.5%
interesting.momentsByType.king_attempt         0.16        0        -0.16     -100%
interesting.momentsByType.king_killed          0.08        0        -0.08     -100%
interesting.momentsByType.lead_change         29.56    31.48        +1.92     +6.5%
interesting.momentsByType.party                 0.6      2.9         +2.3  +383.33%
interesting.momentsByType.promise_broken      11.02        0       -11.02     -100%
interesting.momentsByType.promise_kept         2.92        0        -2.92     -100%
interesting.momentsByType.revenge             15.64     12.8        -2.84   -18.16%
interesting.momentsByType.revive               0.06        0        -0.06     -100%
interesting.momentsByType.shooting             0.64     0.52        -0.12   -18.75%
interesting.winsByJob.chemist                   26%      32%        +6 pp   +23.08%
interesting.winsByJob.dealer                    20%      24%        +4 pp      +20%
interesting.winsByJob.gunrunner                 28%      12%       -16 pp   -57.14%
interesting.winsByJob.smuggler                  26%      32%        +6 pp   +23.08%
interesting.winsByBrain.greedy                  68%     100%       +32 pp   +47.06%
interesting.winsByBrain.hothead                  4%       0%        -4 pp     -100%
interesting.winsByBrain.hustler                  4%       0%        -4 pp     -100%
interesting.winsByBrain.saint                    4%       0%        -4 pp     -100%
interesting.winsByBrain.showboat                12%       0%       -12 pp     -100%
interesting.winsByBrain.snake                    8%       0%        -8 pp     -100%
interesting.winsByBrain.turtle                   0%       0%         0 pp       n/a
watch.minutesWatched                        2654870  2674543       +19673    +0.74%
watch.audienceEndRatio                         0.79     0.83        +0.04    +5.06%
watch.seasonsGrowing                             0%       0%         0 pp       n/a
watch.longestDull                              1.32      1.2        -0.12    -9.09%
watch.longestDullMax                              3        3            0        0%
economy.dealCash                             548.64   901.52      +352.88   +64.32%
economy.gunsBuilt                              2.44     4.58        +2.14    +87.7%
economy.evictions                              5.28     5.94        +0.66    +12.5%
economy.arrests                               18.52    16.98        -1.54    -8.32%
economy.jailShare                               21%      19%        -2 pp    -9.52%
economy.hospitalShare                            0%       0%         0 pp       n/a
economy.deaths                                 0.08        0        -0.08     -100%
economy.seasonsWithAGun                         94%      98%        +4 pp    +4.26%
economy.cashByDay.day1                        55.05    55.28        +0.23    +0.42%
economy.cashByDay.day2                        58.22    55.93        -2.29    -3.93%
economy.cashByDay.day3                        85.49    81.44        -4.05    -4.74%

marks
mark                                                                                  A     B        change
---------------------------------------------------------------------------------  ----  ----  ------------
At least 40% of acting hours involve another agent                                 fail  fail     unchanged
Every agent interacts with at least 4 others per season                            fail  fail     unchanged
At least 2 rivalries per season                                                    pass  pass     unchanged
At least 1 broken promise and 2 lead changes per season                            pass  fail  pass -> fail
At least 1 king attempt in most seasons                                            fail  fail     unchanged
Top agent finishes top third again in 50-70% of seeds                              fail  fail     unchanged
Turtle finishes in the bottom third in at least 80% of seeds                       pass   n/a   pass -> n/a
No job wins more than 40% of seasons; every job wins at least 10%                  pass  pass     unchanged
Copycat: most common action takes 40% or less of acting hours (all-greedy lineup)   n/a  pass   n/a -> pass
The audience ends the season at least as big as it started                         fail  fail     unchanged
Longest dull stretch is 3 acting hours or less                                     pass  pass     unchanged
```

