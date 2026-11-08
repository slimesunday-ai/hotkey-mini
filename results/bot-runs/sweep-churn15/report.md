# hotkey mini report: sweep-churn15

30 seasons · lineup `default` · seeds 1–30 · systems off: none · config b8645d7b · sets: audience.churn=0.15

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 39% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 57% of seasons (mean fewest partners 3.9) | **no** |
| 1 | At least 2 rivalries per season | mean 12.63; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 100% of seasons (broken 10.83/season, lead changes 24.2/season) | yes |
| 2 | At least 1 king attempt in most seasons | 13% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 43% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 93% (mean place 9.77) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 37%, chemist 40%, dealer 17%, gunrunner 7% | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 28%; overall top action move 19% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 0.8x; 0% of seasons | **no** |
| 3 | Longest dull stretch is 3 acting hours or less | mean 1.27, worst 4; 97% of seasons | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 12.97 |
| Share of acting hours that involve another agent | 39% |
| Unique pairs that interacted | 35.27 of 45 |
| Fewest partners any agent had | 3.9 |
| Rivalries (pairs with 3+ hostile interactions) | 12.63 |
| Alliances (pairs with 2+ friendly interactions) | 5.6 |
| Interactions by kind | friendly 26, hostile 94.83, rival 34.8, talk 30.67, trade 8.23 |
| Messages sent / answered | 48.57 / 18.8 |
| Promises made / kept / broken | 13.73 / 2.9 / 10.83 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 21.03 / 27.2 / 7.87 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 139.77 |
| Lead changes per season | 24.2 |
| Seasons with a king attempt | 13% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 43% |
| Turtle | mean place 9.77 of 10; bottom third 93% |
| Copycat: mean share of the most common action per hour | 28% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.71 |

**Moments by type (per season):** lead_change 24.2, callout_ducked 22.67, arrest 18.1, revenge 16.43, comeback 15.37, callout_answered 12.93, promise_broken 10.83, eviction 4.97, escape 2.97, promise_kept 2.9, bounty_posted 1.9, bounty_collected 1.77, bounty_revealed 1.67, party 0.9, shooting 0.7, bank_job_fail 0.67, bank_job_win 0.23, drive_by 0.2, crate_brawl 0.13, king_attempt 0.13, king_killed 0.07, revive 0.03

**Wins by job:** smuggler 37%, chemist 40%, dealer 17%, gunrunner 7%

**Wins by character type:** greedy 73%, hothead 0%, hustler 3%, saint 7%, showboat 3%, snake 13%, turtle 0%

**Action mix:** move 19%, battle 10%, rest 9%, call_out 9%, shift 7%, crip_walk 7%, drip_check 6%, buy 5%, mug 4%, run 4%, fistfight 4%, pickpocket 3%, deal 2%, cook 2%, lay_low 2%, push_npc 2%, crate 1%, steal_car 1%, run_cops 1%, party 1%, build 1%, scout 1%, bounty 0%, bank_job 0%, shoot 0%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 2,768,784 |
| Audience pool: start → end | 1000 → 798.82 (0.8x; growing in 0% of seasons) |
| Longest dull stretch (acting hours with no moment) | mean 1.27, worst 4 |

**Audience curve** (whole pool, every 6 acting hours): 1003 → 1001 → 958 → 932 → 906 → 879 → 858 → 838 → 815 → 799

**Watching curve** (viewers assigned to agents, every 6 acting hours): 472 → 968 → 914 → 906 → 880 → 857 → 831 → 817 → 792 → 784

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 4306 |
| a02 | Kim | hustler | 4502 |
| a03 | Penny | showboat | 5094 |
| a04 | Dutch | snake | 5338 |
| a05 | Moss | saint | 3965 |
| a06 | Juno | turtle | 1267 |
| a07 | Rook | greedy | 5417 |
| a08 | Tally | greedy | 5172 |
| a09 | Sable | greedy | 5376 |
| a10 | Wren | greedy | 5708 |

By brain: greedy 5418, hothead 4306, hustler 4502, saint 3965, showboat 5094, snake 5338, turtle 1267. By job: chemist 4572, dealer 4574, gunrunner 4374, smuggler 4980.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 20.27, parts smuggled 25.27, product cooked 22.2, product dealt 23.07 ($567.13), guns built 2.57, guns sold to agents 0.07 / to NPC 0.27 |
| Mean cash at the end of each day | day 1: $58, day 2: $66, day 3: $87 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 12.63 / 4.97 (2.4) / 0.53 / 2.13 |
| Gear bought or taken | car 2.8, gun 0.13 |
| Seasons where a gun entered play | 90% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.1 / 20% / 1% / 0.07 |
| Board prices (agent-to-agent mean) | chems $9.37, parts $20.85, product $14.89, guns $115.5 |

