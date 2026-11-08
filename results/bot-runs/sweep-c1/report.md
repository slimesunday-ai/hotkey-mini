# hotkey mini report: sweep-c1

40 seasons · lineup `default` · seeds 1–40 · systems off: none · config 58a8696f · sets: shop.gun=90, agents.startCash=200, audience.decayRate=0.01

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 35% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 75% of seasons (mean fewest partners 4.08) | **no** |
| 1 | At least 2 rivalries per season | mean 10.75; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 100% of seasons (broken 10.25/season, lead changes 31.18/season) | yes |
| 2 | At least 1 king attempt in most seasons | 35% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 42% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 98% (mean place 9.68) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 20%, chemist 25%, dealer 40%, gunrunner 15% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 23% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.27x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | mean 1.35, worst 3; 100% of seasons | yes |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.43 |
| Share of acting hours that involve another agent | 35% |
| Unique pairs that interacted | 34.45 of 45 |
| Fewest partners any agent had | 4.08 |
| Rivalries (pairs with 3+ hostile interactions) | 10.75 |
| Alliances (pairs with 2+ friendly interactions) | 6.38 |
| Interactions by kind | friendly 27.45, hostile 78.63, rival 25.43, talk 31.95, trade 8 |
| Messages sent / answered | 51.15 / 19.7 |
| Promises made / kept / broken | 13.6 / 3.35 / 10.25 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 20.27 / 29.13 / 6.48 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 143.9 |
| Lead changes per season | 31.18 |
| Seasons with a king attempt | 35% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 42% |
| Turtle | mean place 9.68 of 10; bottom third 98% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.75 |

**Moments by type (per season):** lead_change 31.18, comeback 19.6, arrest 18.5, callout_ducked 18.1, revenge 10.65, promise_broken 10.25, callout_answered 9.57, escape 3.53, eviction 3.45, promise_kept 3.35, bounty_posted 3.15, bounty_revealed 2.9, shooting 2.85, bounty_collected 2.35, bank_job_fail 1.93, bank_job_win 0.83, party 0.5, drive_by 0.28, king_attempt 0.28, king_killed 0.25, crate_brawl 0.23, revive 0.2

**Wins by job:** smuggler 20%, chemist 25%, dealer 40%, gunrunner 15%

**Wins by character type:** greedy 68%, hothead 3%, hustler 0%, saint 5%, showboat 10%, snake 15%, turtle 0%

**Action mix:** move 23%, rest 9%, battle 8%, call_out 7%, shift 7%, crip_walk 6%, buy 6%, drip_check 5%, run 4%, mug 4%, fistfight 3%, pickpocket 3%, deal 2%, steal_car 2%, cook 2%, push_npc 2%, lay_low 1%, run_cops 1%, scout 1%, crate 1%, build 1%, shoot 1%, bounty 1%, party 1%, bank_job 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 3,276,494 |
| Audience pool: start → end | 1000 → 1267.91 (1.27x; growing in 100% of seasons) |
| Longest dull stretch (acting hours with no moment) | mean 1.35, worst 3 |

**Audience curve** (whole pool, every 6 acting hours): 996 → 1045 → 1062 → 1083 → 1111 → 1141 → 1166 → 1205 → 1239 → 1268

**Watching curve** (viewers assigned to agents, every 6 acting hours): 334 → 961 → 928 → 928 → 993 → 1053 → 1051 → 1120 → 1143 → 1178

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 5319 |
| a02 | Kim | hustler | 4883 |
| a03 | Penny | showboat | 6500 |
| a04 | Dutch | snake | 6593 |
| a05 | Moss | saint | 4911 |
| a06 | Juno | turtle | 2043 |
| a07 | Rook | greedy | 6282 |
| a08 | Tally | greedy | 6173 |
| a09 | Sable | greedy | 6416 |
| a10 | Wren | greedy | 5489 |

By brain: greedy 6090, hothead 5319, hustler 4883, saint 4911, showboat 6500, snake 6593, turtle 2043. By job: chemist 5327, dealer 5499, gunrunner 5367, smuggler 5698.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 17, parts smuggled 21.25, product cooked 19.5, product dealt 22.78 ($563.88), guns built 3.9, guns sold to agents 0.18 / to NPC 0.93 |
| Mean cash at the end of each day | day 1: $104, day 2: $89, day 3: $129 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 15.23 / 3.45 (1.27) / 0.33 / 1.3 |
| Gear bought or taken | car 3.25, gun 3.33 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.5 / 21% / 2% / 0.25 |
| Board prices (agent-to-agent mean) | chems $9.29, parts $20.76, product $15.46, guns $107.83 |

