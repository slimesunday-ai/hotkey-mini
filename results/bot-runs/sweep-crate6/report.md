# hotkey mini report: sweep-crate6

40 seasons · lineup `default` · seeds 1–40 · systems off: none · config 1ead7a32 · sets: crate.every=6

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 36% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 65% of seasons (mean fewest partners 4.25) | **no** |
| 1 | At least 2 rivalries per season | mean 9.4; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 83% of seasons (broken 6.43/season, lead changes 3.55/season) | **no** |
| 2 | At least 1 king attempt in most seasons | 43% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 39% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 98% (mean place 9.78) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 13%, chemist 48%, dealer 25%, gunrunner 15% | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 22% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.14x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3.63, worst 6, 48% of seasons; any moment: mean 3.28, worst 6 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 10.8 |
| Share of acting hours that involve another agent | 36% |
| Unique pairs that interacted | 33.98 of 45 |
| Fewest partners any agent had | 4.25 |
| Rivalries (pairs with 3+ hostile interactions) | 9.4 |
| Alliances (pairs with 2+ friendly interactions) | 5.73 |
| Interactions by kind | friendly 25.78, hostile 70.95, rival 23.05, talk 31.6, trade 10.68 |
| Messages sent / answered | 48.45 / 18.95 |
| Promises made / kept / broken | 10.33 / 3.9 / 6.43 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 26.15 / 30.9 / 6.4 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 89.23 |
| Lead changes per season | 3.55 |
| Seasons with a king attempt | 43% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 39% |
| Turtle | mean place 9.78 of 10; bottom third 98% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.72 |

**Moments by type (per season):** arrest 19.05, revenge 18.9, callout_answered 7.75, promise_broken 6.43, callout_ducked 3.95, promise_kept 3.9, eviction 3.65, lead_change 3.55, bounty_posted 2.93, escape 2.88, comeback 2.78, shooting 2.75, bank_job_fail 2.68, bounty_revealed 2.55, bounty_collected 2.23, bank_job_win 0.93, party 0.6, crate_brawl 0.45, king_killed 0.38, drive_by 0.33, king_attempt 0.33, revive 0.28

**Wins by job:** smuggler 13%, chemist 48%, dealer 25%, gunrunner 15%

**Wins by character type:** greedy 73%, hothead 15%, hustler 0%, saint 5%, showboat 3%, snake 5%, turtle 0%

**Action mix:** move 22%, rest 10%, battle 8%, call_out 7%, buy 7%, shift 7%, crip_walk 6%, drip_check 5%, run 3%, mug 3%, fistfight 3%, pickpocket 3%, deal 2%, cook 2%, crate 2%, push_npc 2%, steal_car 1%, lay_low 1%, run_cops 1%, scout 1%, build 1%, party 1%, shoot 1%, bank_job 1%, bounty 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,728,594 |
| Audience pool: start → end | 1000 → 1138.79 (1.14x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 3.63, worst 6 |
| Longest dull stretch (no moment of any kind) | mean 3.28, worst 6 |

**Audience curve** (whole pool, every 6 acting hours): 995 → 1029 → 1033 → 1047 → 1066 → 1077 → 1081 → 1105 → 1124 → 1139

**Watching curve** (viewers assigned to agents, every 6 acting hours): 63 → 588 → 495 → 545 → 566 → 561 → 513 → 574 → 593 → 594

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 3582 |
| a02 | Kim | hustler | 2542 |
| a03 | Penny | showboat | 3269 |
| a04 | Dutch | snake | 3168 |
| a05 | Moss | saint | 2096 |
| a06 | Juno | turtle | 725 |
| a07 | Rook | greedy | 3505 |
| a08 | Tally | greedy | 3312 |
| a09 | Sable | greedy | 3237 |
| a10 | Wren | greedy | 3376 |

By brain: greedy 3357, hothead 3582, hustler 2542, saint 2096, showboat 3269, snake 3168, turtle 725. By job: chemist 2946, dealer 2995, gunrunner 2710, smuggler 2785.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 20, parts smuggled 17.45, product cooked 23.18, product dealt 25.88 ($638.08), guns built 4.58, guns sold to agents 0.25 / to NPC 1.3 |
| Mean cash at the end of each day | day 1: $108, day 2: $108, day 3: $131 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 14.5 / 3.65 (1.7) / 0.38 / 1.18 |
| Gear bought or taken | car 2.95, chain 0.03, gun 4.55 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 19.05 / 21% / 2% / 0.38 |
| Board prices (agent-to-agent mean) | chems $9.18, parts $20.72, product $15.19, guns $107.89 |

