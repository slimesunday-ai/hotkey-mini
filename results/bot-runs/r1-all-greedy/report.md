# hotkey mini report: r1-all-greedy

50 seasons · lineup `all-greedy` · seeds 1–50 · systems off: none · config d78dccee

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 30% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 56% of seasons (mean fewest partners 3.5) | **no** |
| 1 | At least 2 rivalries per season | mean 6.26; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 0% of seasons (broken 0/season, lead changes 4.74/season) | **no** |
| 2 | At least 1 king attempt in most seasons | 0% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 29% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | no turtle in this lineup | n/a |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 20%, chemist 40%, dealer 34%, gunrunner 6% | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 38%; overall top action move 27% | yes |
| 3 | The audience ends the season at least as big as it started | end/start 1.2x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 4.64, worst 8, 2% of seasons; any moment: mean 3.04, worst 5 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 6.96 |
| Share of acting hours that involve another agent | 30% |
| Unique pairs that interacted | 31.08 of 45 |
| Fewest partners any agent had | 3.5 |
| Rivalries (pairs with 3+ hostile interactions) | 6.26 |
| Alliances (pairs with 2+ friendly interactions) | 2.94 |
| Interactions by kind | friendly 14.92, hostile 54.96, rival 24.48, trade 10.08 |
| Messages sent / answered | 0 / 0 |
| Promises made / kept / broken | 0 / 0 / 0 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 25.28 / 50.3 / 9.2 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 85.22 |
| Lead changes per season | 4.74 |
| Seasons with a king attempt | 0% |
| Seasons with a betrayal (broken promise) | 0% |
| Top-third repeat rate (target 50-70%) | 29% |
| Turtle | not in lineup |
| Copycat: mean share of the most common action per hour | 38% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.73 |

**Moments by type (per season):** arrest 21.16, callout_answered 13.68, revenge 11.5, bank_job_fail 9.34, eviction 5.22, escape 4.74, lead_change 4.74, comeback 4.24, callout_ducked 3.4, bank_job_win 3.34, party 2.44, crate_brawl 1.32, shooting 0.06, drive_by 0.04

**Wins by job:** smuggler 20%, chemist 40%, dealer 34%, gunrunner 6%

**Wins by character type:** greedy 100%

**Action mix:** move 27%, buy 10%, crip_walk 9%, call_out 9%, battle 8%, rest 4%, scout 4%, run 4%, pickpocket 3%, bank_job 3%, deal 3%, crate 3%, build 2%, party 2%, steal_car 2%, run_cops 2%, lay_low 2%, cook 2%, drip_check 1%, push_npc 1%, fistfight 0%, mug 0%, shift 0%, shoot 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,828,349 |
| Audience pool: start → end | 1000 → 1204.28 (1.2x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 4.64, worst 8 |
| Longest dull stretch (no moment of any kind) | mean 3.04, worst 5 |

**Audience curve** (whole pool, every 6 acting hours): 990 → 994 → 1009 → 1033 → 1053 → 1087 → 1107 → 1143 → 1175 → 1204

**Watching curve** (viewers assigned to agents, every 6 acting hours): 0 → 457 → 526 → 565 → 538 → 669 → 593 → 636 → 680 → 693

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | greedy | 3113 |
| a02 | Kim | greedy | 3157 |
| a03 | Penny | greedy | 3207 |
| a04 | Dutch | greedy | 3072 |
| a05 | Moss | greedy | 2940 |
| a06 | Juno | greedy | 2969 |
| a07 | Rook | greedy | 2906 |
| a08 | Tally | greedy | 2939 |
| a09 | Sable | greedy | 3123 |
| a10 | Wren | greedy | 3046 |

By brain: greedy 3047. By job: chemist 3234, dealer 3120, gunrunner 2675, smuggler 3030.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md) · [seed 41](41/play-by-play.md) · [seed 42](42/play-by-play.md) · [seed 43](43/play-by-play.md) · [seed 44](44/play-by-play.md) · [seed 45](45/play-by-play.md) · [seed 46](46/play-by-play.md) · [seed 47](47/play-by-play.md) · [seed 48](48/play-by-play.md) · [seed 49](49/play-by-play.md) · [seed 50](50/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 21.52, parts smuggled 20.32, product cooked 19.38, product dealt 34.54 ($838.86), guns built 9.08, guns sold to agents 0.08 / to NPC 3.92 |
| Mean cash at the end of each day | day 1: $88, day 2: $110, day 3: $164 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 11.82 / 5.22 (2.96) / 0.58 / 2.32 |
| Gear bought or taken | car 3.98, gun 7.52 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 21.16 / 23% / 0% / 0 |
| Board prices (agent-to-agent mean) | chems $9.2, parts $20.3, product $15.75, guns $97.83 |

