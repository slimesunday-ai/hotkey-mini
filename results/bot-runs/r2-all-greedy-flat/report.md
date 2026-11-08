# hotkey mini report: r2-all-greedy-flat

50 seasons · lineup `all-greedy` · seeds 1–50 · systems off: audienceTastes · config d5d68e3c

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 40% | yes |
| 1 | Every agent interacts with at least 4 others per season | 82% of seasons (mean fewest partners 4.96) | **no** |
| 1 | At least 2 rivalries per season | mean 9.08; 100% of seasons | yes |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 0% of seasons; lead change in 94% of seasons | **no** |
| 2 | At least 1 king attempt in most seasons | 0% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 31% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | no turtle in this lineup | n/a |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 16% (20%), chemist 40% (30%), dealer 40% (30%), gunrunner 4% (20%) | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 34%; overall top action move 23% | yes |
| 3 | The audience ends the season at least as big as it started | end/start 1.31x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3.6, worst 7, 66% of seasons; any moment: mean 3.02, worst 5 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 10.68 |
| Share of acting hours that involve another agent | 40% |
| Unique pairs that interacted | 34.86 of 45 |
| Fewest partners any agent had | 4.96 |
| Rivalries (pairs with 3+ hostile interactions) | 9.08 |
| Alliances (pairs with 2+ friendly interactions) | 4.04 |
| Interactions by kind | friendly 20.04, hostile 89.48, rival 33.18, trade 17.56 |
| Messages sent / answered | 0 / 0 |
| Promises made / kept / broken | 0 / 0 / 0 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 46.48 / 57.8 / 8.62 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 94.64 |
| Lead changes per season | 3.72 |
| Seasons with a king attempt | 0% |
| Seasons with a betrayal (broken promise) | 0% |
| Top-third repeat rate (target 50-70%) | 31% |
| Turtle | not in lineup |
| Copycat: mean share of the most common action per hour | 34% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.73 |

**Moments by type (per season):** revenge 25.26, callout_answered 24.54, arrest 17.32, eviction 4.46, callout_ducked 4.28, lead_change 3.72, party 3.68, escape 3.5, bank_job_fail 2.86, comeback 1.58, crate_brawl 1.52, bank_job_win 1.2, shooting 0.72

**Wins by job:** smuggler 16%, chemist 40%, dealer 40%, gunrunner 4%

**Wins by character type:** greedy 100%

**Action mix:** move 23%, call_out 12%, buy 11%, battle 9%, crip_walk 7%, rest 7%, deal 4%, scout 4%, run 3%, cook 3%, pickpocket 3%, crate 2%, party 2%, lay_low 2%, build 2%, run_cops 1%, steal_car 1%, bank_job 1%, drip_check 1%, push_npc 1%, fistfight 1%, mug 0%, shoot 0%, shift 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 2,166,498 |
| Audience pool: start → end | 1000 → 1312.52 (1.31x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 3.6, worst 7 |
| Longest dull stretch (no moment of any kind) | mean 3.02, worst 5 |

**Audience curve** (whole pool, every 6 acting hours): 998 → 1015 → 1030 → 1054 → 1087 → 1125 → 1166 → 1211 → 1269 → 1313

**Watching curve** (viewers assigned to agents, every 6 acting hours): 103 → 487 → 576 → 613 → 652 → 715 → 731 → 753 → 864 → 862

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | greedy | 3822 |
| a02 | Kim | greedy | 3592 |
| a03 | Penny | greedy | 3569 |
| a04 | Dutch | greedy | 3537 |
| a05 | Moss | greedy | 3600 |
| a06 | Juno | greedy | 3303 |
| a07 | Rook | greedy | 3534 |
| a08 | Tally | greedy | 3761 |
| a09 | Sable | greedy | 3721 |
| a10 | Wren | greedy | 3668 |

By brain: greedy 3611. By job: chemist 3846, dealer 3763, gunrunner 3010, smuggler 3630.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md) · [seed 41](41/play-by-play.md) · [seed 42](42/play-by-play.md) · [seed 43](43/play-by-play.md) · [seed 44](44/play-by-play.md) · [seed 45](45/play-by-play.md) · [seed 46](46/play-by-play.md) · [seed 47](47/play-by-play.md) · [seed 48](48/play-by-play.md) · [seed 49](49/play-by-play.md) · [seed 50](50/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 22.96, parts smuggled 19.96, product cooked 38.04, product dealt 51.3 ($1238.5), guns built 8.8, guns sold to agents 0.28 / to NPC 3.74 |
| Mean cash at the end of each day | day 1: $87, day 2: $76, day 3: $106 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 13.52 / 4.46 (2.02) / 0.28 / 2.16 |
| Gear bought or taken | car 2.12, gun 6.02 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 17.32 / 14% / 0% / 0 |
| Board prices (agent-to-agent mean) | chems $9.22, parts $20.71, product $15.47, guns $101.17 |

