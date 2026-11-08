# hotkey mini report: r1-abl-nosmooth

50 seasons · lineup `default` · seeds 1–50 · systems off: smoothAudience · config fe9bd520

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 37% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 72% of seasons (mean fewest partners 3.96) | **no** |
| 1 | At least 2 rivalries per season | mean 10.14; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 88% of seasons (broken 6.24/season, lead changes 3.34/season) | **no** |
| 2 | At least 1 king attempt in most seasons | 42% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 43% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 98% (mean place 9.82) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 30%, chemist 30%, dealer 26%, gunrunner 14% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 21% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.16x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3.4, worst 6, 52% of seasons; any moment: mean 3, worst 6 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.12 |
| Share of acting hours that involve another agent | 37% |
| Unique pairs that interacted | 34.26 of 45 |
| Fewest partners any agent had | 3.96 |
| Rivalries (pairs with 3+ hostile interactions) | 10.14 |
| Alliances (pairs with 2+ friendly interactions) | 5.64 |
| Interactions by kind | friendly 26.24, hostile 73.48, rival 26.34, talk 30.68, trade 10.04 |
| Messages sent / answered | 47.3 / 18.1 |
| Promises made / kept / broken | 10.16 / 3.92 / 6.24 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 25.08 / 32.86 / 5.8 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 89.8 |
| Lead changes per season | 3.34 |
| Seasons with a king attempt | 42% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 43% |
| Turtle | mean place 9.82 of 10; bottom third 98% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.72 |

**Moments by type (per season):** revenge 22.42, arrest 18.48, callout_answered 8.3, promise_broken 6.24, promise_kept 3.92, callout_ducked 3.9, eviction 3.68, lead_change 3.34, bank_job_fail 2.62, escape 2.58, shooting 2.54, bounty_posted 2.48, bounty_revealed 2.28, bounty_collected 1.96, comeback 1.92, party 0.84, bank_job_win 0.8, king_attempt 0.44, crate_brawl 0.34, king_killed 0.3, drive_by 0.22, revive 0.2

**Wins by job:** smuggler 30%, chemist 30%, dealer 26%, gunrunner 14%

**Wins by character type:** greedy 48%, hothead 4%, hustler 6%, saint 4%, showboat 32%, snake 6%, turtle 0%

**Action mix:** move 21%, rest 9%, battle 8%, call_out 7%, buy 7%, shift 7%, crip_walk 6%, drip_check 5%, mug 3%, run 3%, fistfight 3%, pickpocket 3%, deal 2%, cook 2%, push_npc 2%, lay_low 2%, crate 2%, steal_car 1%, scout 1%, build 1%, run_cops 1%, party 1%, bank_job 1%, shoot 1%, bounty 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 3,221,287 |
| Audience pool: start → end | 1000 → 1163.42 (1.16x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 3.4, worst 6 |
| Longest dull stretch (no moment of any kind) | mean 3, worst 6 |

**Audience curve** (whole pool, every 6 acting hours): 995 → 1031 → 1032 → 1048 → 1069 → 1079 → 1099 → 1121 → 1145 → 1163

**Watching curve** (viewers assigned to agents, every 6 acting hours): 314 → 978 → 962 → 986 → 1007 → 1028 → 1042 → 1055 → 1087 → 1103

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 5767 |
| a02 | Kim | hustler | 5069 |
| a03 | Penny | showboat | 7288 |
| a04 | Dutch | snake | 5559 |
| a05 | Moss | saint | 4710 |
| a06 | Juno | turtle | 1709 |
| a07 | Rook | greedy | 5750 |
| a08 | Tally | greedy | 6157 |
| a09 | Sable | greedy | 5630 |
| a10 | Wren | greedy | 6049 |

By brain: greedy 5896, hothead 5767, hustler 5069, saint 4710, showboat 7288, snake 5559, turtle 1709. By job: chemist 5320, dealer 5235, gunrunner 5167, smuggler 5844.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md) · [seed 41](41/play-by-play.md) · [seed 42](42/play-by-play.md) · [seed 43](43/play-by-play.md) · [seed 44](44/play-by-play.md) · [seed 45](45/play-by-play.md) · [seed 46](46/play-by-play.md) · [seed 47](47/play-by-play.md) · [seed 48](48/play-by-play.md) · [seed 49](49/play-by-play.md) · [seed 50](50/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 14.88, parts smuggled 18, product cooked 22.74, product dealt 26.74 ($662.34), guns built 4.78, guns sold to agents 0.14 / to NPC 1.7 |
| Mean cash at the end of each day | day 1: $98, day 2: $98, day 3: $130 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 14.72 / 3.68 (1.56) / 0.22 / 1.42 |
| Gear bought or taken | car 2.96, chain 0.04, gun 4.4 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.48 / 20% / 2% / 0.3 |
| Board prices (agent-to-agent mean) | chems $9.23, parts $20.58, product $15.32, guns $108.75 |

