# hotkey mini report: sweep-decay1

30 seasons · lineup `default` · seeds 1–30 · systems off: none · config 75b8e74c · sets: audience.decayRate=0.01

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 39% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 53% of seasons (mean fewest partners 3.8) | **no** |
| 1 | At least 2 rivalries per season | mean 13.53; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 100% of seasons (broken 10.5/season, lead changes 29.67/season) | yes |
| 2 | At least 1 king attempt in most seasons | 17% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 38% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 97% (mean place 9.8) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 30%, chemist 33%, dealer 17%, gunrunner 20% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 29%; overall top action move 20% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.35x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | mean 1.3, worst 3; 100% of seasons | yes |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 12.87 |
| Share of acting hours that involve another agent | 39% |
| Unique pairs that interacted | 34.7 of 45 |
| Fewest partners any agent had | 3.8 |
| Rivalries (pairs with 3+ hostile interactions) | 13.53 |
| Alliances (pairs with 2+ friendly interactions) | 5.43 |
| Interactions by kind | friendly 25.17, hostile 93.8, rival 34.57, talk 30.9, trade 8.63 |
| Messages sent / answered | 48.83 / 19.2 |
| Promises made / kept / broken | 13.5 / 3 / 10.5 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 21.57 / 27 / 8.33 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 148.8 |
| Lead changes per season | 29.67 |
| Seasons with a king attempt | 17% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 38% |
| Turtle | mean place 9.8 of 10; bottom third 97% |
| Copycat: mean share of the most common action per hour | 29% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.71 |

**Moments by type (per season):** lead_change 29.67, callout_ducked 21.5, comeback 19.5, arrest 18.57, revenge 16.7, callout_answered 13.43, promise_broken 10.5, eviction 5.13, promise_kept 3, escape 2.83, bounty_posted 1.73, bounty_revealed 1.67, bounty_collected 1.6, shooting 0.87, party 0.63, bank_job_fail 0.43, drive_by 0.23, crate_brawl 0.2, king_killed 0.17, revive 0.17, bank_job_win 0.13, king_attempt 0.13

**Wins by job:** smuggler 30%, chemist 33%, dealer 17%, gunrunner 20%

**Wins by character type:** greedy 77%, hothead 7%, hustler 0%, saint 0%, showboat 7%, snake 10%, turtle 0%

**Action mix:** move 20%, battle 10%, rest 9%, call_out 9%, shift 7%, crip_walk 6%, drip_check 5%, buy 5%, mug 5%, fistfight 4%, run 4%, pickpocket 3%, deal 2%, lay_low 2%, cook 2%, push_npc 2%, crate 1%, steal_car 1%, run_cops 1%, party 1%, build 1%, scout 1%, bounty 0%, shoot 0%, bank_job 0%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 3,450,680 |
| Audience pool: start → end | 1000 → 1346.8 (1.35x; growing in 100% of seasons) |
| Longest dull stretch (acting hours with no moment) | mean 1.3, worst 3 |

**Audience curve** (whole pool, every 6 acting hours): 1013 → 1070 → 1091 → 1119 → 1159 → 1183 → 1225 → 1259 → 1304 → 1347

**Watching curve** (viewers assigned to agents, every 6 acting hours): 472 → 991 → 969 → 1029 → 1084 → 1058 → 1155 → 1128 → 1224 → 1252

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 5563 |
| a02 | Kim | hustler | 5134 |
| a03 | Penny | showboat | 6427 |
| a04 | Dutch | snake | 6429 |
| a05 | Moss | saint | 5041 |
| a06 | Juno | turtle | 1691 |
| a07 | Rook | greedy | 7039 |
| a08 | Tally | greedy | 6252 |
| a09 | Sable | greedy | 7304 |
| a10 | Wren | greedy | 6631 |

By brain: greedy 6806, hothead 5563, hustler 5134, saint 5041, showboat 6427, snake 6429, turtle 1691. By job: chemist 5740, dealer 5684, gunrunner 5365, smuggler 6256.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 20, parts smuggled 22.67, product cooked 21.2, product dealt 24.9 ($615.17), guns built 2.33, guns sold to agents 0.13 / to NPC 0.43 |
| Mean cash at the end of each day | day 1: $53, day 2: $60, day 3: $84 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 12.23 / 5.13 (2.57) / 0.57 / 2.43 |
| Gear bought or taken | car 2.87, gun 0.13 |
| Seasons where a gun entered play | 93% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.57 / 20% / 1% / 0.17 |
| Board prices (agent-to-agent mean) | chems $9.03, parts $20.08, product $15.08, guns $108.83 |

