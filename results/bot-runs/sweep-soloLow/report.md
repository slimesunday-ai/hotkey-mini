# hotkey mini report: sweep-soloLow

40 seasons · lineup `default` · seeds 1–40 · systems off: none · config 903cb252 · sets: points.crip_walk={"weird":1,"feelgood":0.5}

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 38% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 68% of seasons (mean fewest partners 4.15) | **no** |
| 1 | At least 2 rivalries per season | mean 9.5; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 80% of seasons (broken 5.95/season, lead changes 3.58/season) | **no** |
| 2 | At least 1 king attempt in most seasons | 33% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 40% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 93% (mean place 9.5) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 20%, chemist 30%, dealer 35%, gunrunner 15% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 21% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.16x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3.55, worst 8, 60% of seasons; any moment: mean 3.13, worst 8 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.16 |
| Share of acting hours that involve another agent | 38% |
| Unique pairs that interacted | 34.28 of 45 |
| Fewest partners any agent had | 4.15 |
| Rivalries (pairs with 3+ hostile interactions) | 9.5 |
| Alliances (pairs with 2+ friendly interactions) | 5.35 |
| Interactions by kind | friendly 25.1, hostile 74.4, rival 26.58, talk 31.6, trade 9.68 |
| Messages sent / answered | 47.28 / 18.7 |
| Promises made / kept / broken | 9.65 / 3.7 / 5.95 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 23.8 / 31.73 / 6.93 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 92.75 |
| Lead changes per season | 3.58 |
| Seasons with a king attempt | 33% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 40% |
| Turtle | mean place 9.5 of 10; bottom third 93% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.71 |

**Moments by type (per season):** revenge 21.4, arrest 18.85, callout_answered 9.25, promise_broken 5.95, callout_ducked 3.93, eviction 3.78, promise_kept 3.7, lead_change 3.58, escape 3.25, bounty_posted 2.98, bank_job_fail 2.9, bounty_revealed 2.78, comeback 2.7, shooting 2.55, bounty_collected 2.45, bank_job_win 1, party 0.68, drive_by 0.33, king_attempt 0.3, crate_brawl 0.2, king_killed 0.13, revive 0.1

**Wins by job:** smuggler 20%, chemist 30%, dealer 35%, gunrunner 15%

**Wins by character type:** greedy 73%, hothead 10%, hustler 3%, saint 0%, showboat 8%, snake 8%, turtle 0%

**Action mix:** move 21%, rest 10%, battle 8%, call_out 8%, shift 7%, buy 7%, drip_check 5%, crip_walk 4%, mug 3%, run 3%, fistfight 3%, pickpocket 3%, deal 2%, cook 2%, push_npc 2%, lay_low 2%, steal_car 2%, scout 2%, crate 1%, run_cops 1%, build 1%, party 1%, bank_job 1%, shoot 1%, bounty 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,755,731 |
| Audience pool: start → end | 1000 → 1155.66 (1.16x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 3.55, worst 8 |
| Longest dull stretch (no moment of any kind) | mean 3.13, worst 8 |

**Audience curve** (whole pool, every 6 acting hours): 995 → 1027 → 1033 → 1046 → 1064 → 1072 → 1085 → 1119 → 1137 → 1156

**Watching curve** (viewers assigned to agents, every 6 acting hours): 63 → 570 → 492 → 561 → 523 → 536 → 562 → 629 → 605 → 613

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 3491 |
| a02 | Kim | hustler | 2541 |
| a03 | Penny | showboat | 3106 |
| a04 | Dutch | snake | 3237 |
| a05 | Moss | saint | 1901 |
| a06 | Juno | turtle | 977 |
| a07 | Rook | greedy | 3548 |
| a08 | Tally | greedy | 3552 |
| a09 | Sable | greedy | 3401 |
| a10 | Wren | greedy | 3507 |

By brain: greedy 3502, hothead 3491, hustler 2541, saint 1901, showboat 3106, snake 3237, turtle 977. By job: chemist 3045, dealer 3037, gunrunner 2682, smuggler 2826.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 15.3, parts smuggled 20.05, product cooked 22.95, product dealt 23.9 ($591.45), guns built 4.83, guns sold to agents 0.2 / to NPC 1.4 |
| Mean cash at the end of each day | day 1: $99, day 2: $97, day 3: $130 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 14.2 / 3.78 (1.95) / 0.35 / 1.75 |
| Gear bought or taken | car 3.15, chain 0.05, gun 4.58 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.85 / 21% / 2% / 0.13 |
| Board prices (agent-to-agent mean) | chems $9.17, parts $20.74, product $15.27, guns $110.33 |

