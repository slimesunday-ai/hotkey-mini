# hotkey mini report: sweep-jobHeatOnly

40 seasons · lineup `default` · seeds 1–40 · systems off: none · config daa55d3e · sets: heat.crimes=["pickpocket","mug","steal_car","bank_job","push_npc","fistfight","crate","shoot","drive_by","kill_king","run_cops"]

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 38% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 68% of seasons (mean fewest partners 4) | **no** |
| 1 | At least 2 rivalries per season | mean 12.15; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 100% of seasons (broken 11.05/season, lead changes 29.98/season) | yes |
| 2 | At least 1 king attempt in most seasons | 10% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 38% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 100% (mean place 10) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 33%, chemist 25%, dealer 20%, gunrunner 23% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 29%; overall top action move 20% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 0.79x; 0% of seasons | **no** |
| 3 | Longest dull stretch is 3 acting hours or less | mean 1.3, worst 3; 100% of seasons | yes |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 12.79 |
| Share of acting hours that involve another agent | 38% |
| Unique pairs that interacted | 34.98 of 45 |
| Fewest partners any agent had | 4 |
| Rivalries (pairs with 3+ hostile interactions) | 12.15 |
| Alliances (pairs with 2+ friendly interactions) | 5.83 |
| Interactions by kind | friendly 25.55, hostile 92.95, rival 32.5, talk 31.8, trade 8.98 |
| Messages sent / answered | 49.68 / 19.27 |
| Promises made / kept / broken | 13.83 / 2.78 / 11.05 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 22.68 / 25.95 / 8.28 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 147.13 |
| Lead changes per season | 29.98 |
| Seasons with a king attempt | 10% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 38% |
| Turtle | mean place 10 of 10; bottom third 100% |
| Copycat: mean share of the most common action per hour | 29% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.71 |

**Moments by type (per season):** lead_change 29.98, callout_ducked 20.68, comeback 18.75, arrest 18.2, revenge 16.1, callout_answered 14.05, promise_broken 11.05, eviction 5.2, escape 3.2, promise_kept 2.78, bounty_posted 1.7, bounty_revealed 1.63, bounty_collected 1.45, party 0.65, shooting 0.65, bank_job_fail 0.45, crate_brawl 0.2, king_attempt 0.13, drive_by 0.1, king_killed 0.1, bank_job_win 0.05, revive 0.05

**Wins by job:** smuggler 33%, chemist 25%, dealer 20%, gunrunner 23%

**Wins by character type:** greedy 70%, hothead 5%, hustler 5%, saint 5%, showboat 10%, snake 5%, turtle 0%

**Action mix:** move 20%, rest 9%, battle 9%, call_out 8%, shift 7%, crip_walk 7%, drip_check 6%, buy 5%, run 4%, mug 4%, fistfight 4%, pickpocket 3%, cook 2%, lay_low 2%, deal 2%, crate 1%, push_npc 1%, steal_car 1%, run_cops 1%, party 1%, scout 1%, build 1%, bounty 0%, shoot 0%, bank_job 0%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 2,658,243 |
| Audience pool: start → end | 1000 → 788.27 (0.79x; growing in 0% of seasons) |
| Longest dull stretch (acting hours with no moment) | mean 1.3, worst 3 |

**Audience curve** (whole pool, every 6 acting hours): 1002 → 995 → 959 → 924 → 898 → 870 → 841 → 824 → 804 → 788

**Watching curve** (viewers assigned to agents, every 6 acting hours): 465 → 957 → 850 → 853 → 843 → 806 → 780 → 797 → 752 → 743

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 4262 |
| a02 | Kim | hustler | 4032 |
| a03 | Penny | showboat | 4779 |
| a04 | Dutch | snake | 5203 |
| a05 | Moss | saint | 3895 |
| a06 | Juno | turtle | 1134 |
| a07 | Rook | greedy | 5297 |
| a08 | Tally | greedy | 5254 |
| a09 | Sable | greedy | 5430 |
| a10 | Wren | greedy | 5017 |

By brain: greedy 5250, hothead 4262, hustler 4032, saint 3895, showboat 4779, snake 5203, turtle 1134. By job: chemist 4320, dealer 4314, gunrunner 4338, smuggler 4861.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 25, parts smuggled 23.9, product cooked 23.63, product dealt 23.05 ($566.9), guns built 2.23, guns sold to agents 0.05 / to NPC 0.43 |
| Mean cash at the end of each day | day 1: $55, day 2: $58, day 3: $82 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 12.13 / 5.2 (2.65) / 0.5 / 2.48 |
| Gear bought or taken | car 2.78, gun 0.1 |
| Seasons where a gun entered play | 93% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.2 / 20% / 0% / 0.1 |
| Board prices (agent-to-agent mean) | chems $9.35, parts $20.06, product $15.1, guns $113 |

