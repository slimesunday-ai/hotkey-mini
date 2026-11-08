# hotkey mini report: sweep-c2

40 seasons · lineup `default` · seeds 1–40 · systems off: none · config 1c0f9f61 · sets: shop.gun=90, agents.startCash=200, audience.decayRate=0.01, audience.churn=0.15

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 36% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 65% of seasons (mean fewest partners 3.88) | **no** |
| 1 | At least 2 rivalries per season | mean 11.23; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 100% of seasons (broken 9.85/season, lead changes 22.3/season) | yes |
| 2 | At least 1 king attempt in most seasons | 33% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 40% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 100% (mean place 9.88) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 20%, chemist 23%, dealer 40%, gunrunner 18% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 23% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.27x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | mean 1.58, worst 4; 98% of seasons | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.63 |
| Share of acting hours that involve another agent | 36% |
| Unique pairs that interacted | 34.08 of 45 |
| Fewest partners any agent had | 3.88 |
| Rivalries (pairs with 3+ hostile interactions) | 11.23 |
| Alliances (pairs with 2+ friendly interactions) | 6.48 |
| Interactions by kind | friendly 28.35, hostile 78.22, rival 26.53, talk 32.38, trade 8.98 |
| Messages sent / answered | 52.2 / 20.23 |
| Promises made / kept / broken | 13.58 / 3.73 / 9.85 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 21.93 / 27.75 / 6.53 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 130.88 |
| Lead changes per season | 22.3 |
| Seasons with a king attempt | 33% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 40% |
| Turtle | mean place 9.88 of 10; bottom third 100% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.73 |

**Moments by type (per season):** lead_change 22.3, arrest 18.45, callout_ducked 18.08, comeback 16.25, revenge 11.33, promise_broken 9.85, callout_answered 9.75, eviction 3.88, promise_kept 3.73, escape 3.03, bounty_posted 2.88, bounty_revealed 2.63, bounty_collected 2.38, shooting 2.25, bank_job_fail 1.58, bank_job_win 0.78, party 0.6, king_attempt 0.48, crate_brawl 0.3, king_killed 0.15, drive_by 0.13, revive 0.13

**Wins by job:** smuggler 20%, chemist 23%, dealer 40%, gunrunner 18%

**Wins by character type:** greedy 60%, hothead 3%, hustler 3%, saint 0%, showboat 20%, snake 15%, turtle 0%

**Action mix:** move 23%, rest 9%, battle 8%, call_out 7%, shift 7%, crip_walk 6%, buy 6%, drip_check 5%, run 3%, mug 3%, fistfight 3%, pickpocket 2%, cook 2%, push_npc 2%, deal 2%, steal_car 2%, lay_low 2%, crate 1%, run_cops 1%, scout 1%, build 1%, party 1%, bounty 1%, shoot 1%, bank_job 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 3,393,900 |
| Audience pool: start → end | 1000 → 1268.84 (1.27x; growing in 100% of seasons) |
| Longest dull stretch (acting hours with no moment) | mean 1.58, worst 4 |

**Audience curve** (whole pool, every 6 acting hours): 996 → 1045 → 1063 → 1091 → 1115 → 1143 → 1168 → 1207 → 1242 → 1269

**Watching curve** (viewers assigned to agents, every 6 acting hours): 334 → 980 → 974 → 1018 → 1050 → 1081 → 1097 → 1156 → 1182 → 1187

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 5662 |
| a02 | Kim | hustler | 5285 |
| a03 | Penny | showboat | 7054 |
| a04 | Dutch | snake | 6762 |
| a05 | Moss | saint | 5073 |
| a06 | Juno | turtle | 1882 |
| a07 | Rook | greedy | 6442 |
| a08 | Tally | greedy | 5850 |
| a09 | Sable | greedy | 6739 |
| a10 | Wren | greedy | 5815 |

By brain: greedy 6211, hothead 5662, hustler 5285, saint 5073, showboat 7054, snake 6762, turtle 1882. By job: chemist 5482, dealer 5671, gunrunner 5787, smuggler 5766.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 18.4, parts smuggled 19.55, product cooked 21.15, product dealt 20.33 ($502.08), guns built 4.22, guns sold to agents 0.35 / to NPC 0.88 |
| Mean cash at the end of each day | day 1: $106, day 2: $91, day 3: $121 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 14.68 / 3.88 (1.4) / 0.43 / 1.58 |
| Gear bought or taken | car 3.3, chain 0.03, gun 3.58 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.45 / 21% / 2% / 0.15 |
| Board prices (agent-to-agent mean) | chems $9.37, parts $20.94, product $15.3, guns $109.54 |

