# hotkey mini report: sweep-cook02

40 seasons · lineup `default` · seeds 1–40 · systems off: none · config 133e907c · sets: points.cook={"weird":0.2}

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 36% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 68% of seasons (mean fewest partners 4.05) | **no** |
| 1 | At least 2 rivalries per season | mean 9.53; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 83% of seasons (broken 6.75/season, lead changes 3.78/season) | **no** |
| 2 | At least 1 king attempt in most seasons | 33% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 43% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 98% (mean place 9.85) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 13%, chemist 35%, dealer 35%, gunrunner 18% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 22% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.14x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3.58, worst 6, 50% of seasons; any moment: mean 3.08, worst 6 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 10.98 |
| Share of acting hours that involve another agent | 36% |
| Unique pairs that interacted | 34.35 of 45 |
| Fewest partners any agent had | 4.05 |
| Rivalries (pairs with 3+ hostile interactions) | 9.53 |
| Alliances (pairs with 2+ friendly interactions) | 5.83 |
| Interactions by kind | friendly 26.18, hostile 71.97, rival 24.95, talk 31.8, trade 9.82 |
| Messages sent / answered | 48.78 / 19.15 |
| Promises made / kept / broken | 10.6 / 3.85 / 6.75 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 24.7 / 34.95 / 5.5 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 90.05 |
| Lead changes per season | 3.78 |
| Seasons with a king attempt | 33% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 43% |
| Turtle | mean place 9.85 of 10; bottom third 98% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.72 |

**Moments by type (per season):** revenge 19.77, arrest 18.25, callout_answered 8.38, promise_broken 6.75, callout_ducked 4.15, promise_kept 3.85, lead_change 3.78, eviction 3.7, escape 3.25, comeback 2.88, shooting 2.83, bounty_posted 2.75, bank_job_fail 2.48, bounty_revealed 2.48, bounty_collected 2.2, bank_job_win 0.83, party 0.68, king_attempt 0.35, drive_by 0.28, crate_brawl 0.23, king_killed 0.13, revive 0.1

**Wins by job:** smuggler 13%, chemist 35%, dealer 35%, gunrunner 18%

**Wins by character type:** greedy 45%, hothead 23%, hustler 0%, saint 0%, showboat 5%, snake 28%, turtle 0%

**Action mix:** move 22%, rest 10%, battle 8%, call_out 7%, buy 7%, shift 7%, crip_walk 6%, drip_check 5%, mug 3%, run 3%, fistfight 3%, pickpocket 2%, deal 2%, cook 2%, push_npc 2%, steal_car 2%, lay_low 1%, crate 1%, scout 1%, run_cops 1%, build 1%, shoot 1%, party 1%, bank_job 1%, bounty 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,731,392 |
| Audience pool: start → end | 1000 → 1139.2 (1.14x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 3.58, worst 6 |
| Longest dull stretch (no moment of any kind) | mean 3.08, worst 6 |

**Audience curve** (whole pool, every 6 acting hours): 995 → 1028 → 1032 → 1044 → 1063 → 1075 → 1090 → 1106 → 1123 → 1139

**Watching curve** (viewers assigned to agents, every 6 acting hours): 63 → 585 → 482 → 548 → 540 → 553 → 577 → 560 → 599 → 612

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 3616 |
| a02 | Kim | hustler | 2492 |
| a03 | Penny | showboat | 3118 |
| a04 | Dutch | snake | 3502 |
| a05 | Moss | saint | 1935 |
| a06 | Juno | turtle | 791 |
| a07 | Rook | greedy | 3307 |
| a08 | Tally | greedy | 3357 |
| a09 | Sable | greedy | 3359 |
| a10 | Wren | greedy | 3380 |

By brain: greedy 3350, hothead 3616, hustler 2492, saint 1935, showboat 3118, snake 3502, turtle 791. By job: chemist 2980, dealer 3052, gunrunner 2660, smuggler 2721.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 14.5, parts smuggled 20.85, product cooked 24.15, product dealt 28.33 ($700.43), guns built 4.28, guns sold to agents 0.3 / to NPC 1.27 |
| Mean cash at the end of each day | day 1: $101, day 2: $98, day 3: $131 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 14.65 / 3.7 (1.6) / 0.2 / 1.45 |
| Gear bought or taken | car 3.33, gun 4.78 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.25 / 20% / 2% / 0.13 |
| Board prices (agent-to-agent mean) | chems $9.33, parts $20.95, product $15.35, guns $108.95 |

