# hotkey mini report: r2-all-greedy

50 seasons · lineup `all-greedy` · seeds 1–50 · systems off: none · config bf6545d6

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 31% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 66% of seasons (mean fewest partners 4.12) | **no** |
| 1 | At least 2 rivalries per season | mean 6.06; 98% of seasons | **no** |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 0% of seasons; lead change in 100% of seasons | **no** |
| 2 | At least 1 king attempt in most seasons | 0% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 30% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | no turtle in this lineup | n/a |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 20% (20%), chemist 32% (30%), dealer 36% (30%), gunrunner 12% (20%) | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 36%; overall top action move 26% | yes |
| 3 | The audience ends the season at least as big as it started | end/start 1.24x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 4.74, worst 8, 2% of seasons; any moment: mean 3.02, worst 6 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 7.79 |
| Share of acting hours that involve another agent | 31% |
| Unique pairs that interacted | 32.98 of 45 |
| Fewest partners any agent had | 4.12 |
| Rivalries (pairs with 3+ hostile interactions) | 6.06 |
| Alliances (pairs with 2+ friendly interactions) | 3.02 |
| Interactions by kind | friendly 16.54, hostile 57.94, rival 26.42, trade 15.88 |
| Messages sent / answered | 0 / 0 |
| Promises made / kept / broken | 0 / 0 / 0 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 40.32 / 53.42 / 9.4 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 86.42 |
| Lead changes per season | 5.54 |
| Seasons with a king attempt | 0% |
| Seasons with a betrayal (broken promise) | 0% |
| Top-third repeat rate (target 50-70%) | 30% |
| Turtle | not in lineup |
| Copycat: mean share of the most common action per hour | 36% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.71 |

**Moments by type (per season):** arrest 21.6, callout_answered 13.78, revenge 10.96, bank_job_fail 9.94, lead_change 5.54, eviction 4.74, escape 4.1, comeback 4.08, callout_ducked 3.68, bank_job_win 3.36, party 2.72, crate_brawl 1.86, shooting 0.06

**Wins by job:** smuggler 20%, chemist 32%, dealer 36%, gunrunner 12%

**Wins by character type:** greedy 100%

**Action mix:** move 26%, buy 11%, crip_walk 8%, call_out 8%, battle 8%, rest 5%, run 4%, scout 4%, deal 3%, bank_job 3%, pickpocket 3%, crate 3%, cook 2%, build 2%, party 2%, lay_low 2%, steal_car 2%, run_cops 1%, drip_check 1%, push_npc 1%, fistfight 0%, mug 0%, shift 0%, shoot 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,926,100 |
| Audience pool: start → end | 1000 → 1240.28 (1.24x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 4.74, worst 8 |
| Longest dull stretch (no moment of any kind) | mean 3.02, worst 6 |

**Audience curve** (whole pool, every 6 acting hours): 990 → 990 → 1010 → 1030 → 1061 → 1094 → 1119 → 1163 → 1205 → 1240

**Watching curve** (viewers assigned to agents, every 6 acting hours): 0 → 425 → 568 → 554 → 595 → 658 → 617 → 683 → 748 → 770

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | greedy | 3262 |
| a02 | Kim | greedy | 3137 |
| a03 | Penny | greedy | 3119 |
| a04 | Dutch | greedy | 3374 |
| a05 | Moss | greedy | 3018 |
| a06 | Juno | greedy | 3313 |
| a07 | Rook | greedy | 3233 |
| a08 | Tally | greedy | 3352 |
| a09 | Sable | greedy | 3162 |
| a10 | Wren | greedy | 3132 |

By brain: greedy 3210. By job: chemist 3318, dealer 3308, gunrunner 2870, smuggler 3242.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md) · [seed 41](41/play-by-play.md) · [seed 42](42/play-by-play.md) · [seed 43](43/play-by-play.md) · [seed 44](44/play-by-play.md) · [seed 45](45/play-by-play.md) · [seed 46](46/play-by-play.md) · [seed 47](47/play-by-play.md) · [seed 48](48/play-by-play.md) · [seed 49](49/play-by-play.md) · [seed 50](50/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 25.92, parts smuggled 25.12, product cooked 31.86, product dealt 43.9 ($1067.14), guns built 9.26, guns sold to agents 0.12 / to NPC 3.84 |
| Mean cash at the end of each day | day 1: $95, day 2: $108, day 3: $154 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 12.84 / 4.74 (2.42) / 0.48 / 2.36 |
| Gear bought or taken | car 3.94, gun 7.18 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 21.6 / 16% / 0% / 0 |
| Board prices (agent-to-agent mean) | chems $9.16, parts $20.17, product $15.59, guns $97.83 |

