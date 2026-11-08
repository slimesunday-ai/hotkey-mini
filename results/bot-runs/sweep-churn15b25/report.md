# hotkey mini report: sweep-churn15b25

30 seasons · lineup `default` · seeds 1–30 · systems off: none · config 2ad84765 · sets: audience.churn=0.15, audience.browse=0.25

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 38% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 73% of seasons (mean fewest partners 4.03) | **no** |
| 1 | At least 2 rivalries per season | mean 12.53; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 100% of seasons (broken 10.57/season, lead changes 22.33/season) | yes |
| 2 | At least 1 king attempt in most seasons | 10% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 43% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 93% (mean place 9.6) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 23%, chemist 33%, dealer 27%, gunrunner 17% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 29%; overall top action move 21% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 0.77x; 0% of seasons | **no** |
| 3 | Longest dull stretch is 3 acting hours or less | mean 1.23, worst 2; 100% of seasons | yes |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 12.75 |
| Share of acting hours that involve another agent | 38% |
| Unique pairs that interacted | 34.67 of 45 |
| Fewest partners any agent had | 4.03 |
| Rivalries (pairs with 3+ hostile interactions) | 12.53 |
| Alliances (pairs with 2+ friendly interactions) | 6.03 |
| Interactions by kind | friendly 27.03, hostile 90.53, rival 33, talk 30.67, trade 10.07 |
| Messages sent / answered | 49.07 / 18.87 |
| Promises made / kept / broken | 13.6 / 3.03 / 10.57 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 25.4 / 25.3 / 8.43 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 132.23 |
| Lead changes per season | 22.33 |
| Seasons with a king attempt | 10% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 43% |
| Turtle | mean place 9.6 of 10; bottom third 93% |
| Copycat: mean share of the most common action per hour | 29% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.71 |

**Moments by type (per season):** lead_change 22.33, callout_ducked 20.33, arrest 17.37, comeback 15.1, revenge 14.87, callout_answered 13.63, promise_broken 10.57, eviction 4.57, promise_kept 3.03, escape 3, bounty_posted 1.87, bounty_revealed 1.67, bounty_collected 1.43, party 0.77, crate_brawl 0.43, shooting 0.33, bank_job_fail 0.27, bank_job_win 0.27, drive_by 0.17, king_killed 0.1, revive 0.1, king_attempt 0.03

**Wins by job:** smuggler 23%, chemist 33%, dealer 27%, gunrunner 17%

**Wins by character type:** greedy 73%, hothead 0%, hustler 3%, saint 3%, showboat 20%, snake 0%, turtle 0%

**Action mix:** move 21%, battle 9%, rest 9%, call_out 8%, shift 7%, crip_walk 7%, drip_check 5%, buy 5%, mug 4%, run 4%, fistfight 3%, pickpocket 3%, deal 2%, cook 2%, lay_low 2%, crate 2%, push_npc 2%, steal_car 1%, run_cops 1%, party 1%, scout 1%, build 1%, bounty 0%, bank_job 0%, shoot 0%, drive_by 0%, kill_king 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 2,538,844 |
| Audience pool: start → end | 1000 → 771.03 (0.77x; growing in 0% of seasons) |
| Longest dull stretch (acting hours with no moment) | mean 1.23, worst 2 |

**Audience curve** (whole pool, every 6 acting hours): 1003 → 997 → 956 → 918 → 893 → 861 → 837 → 812 → 788 → 771

**Watching curve** (viewers assigned to agents, every 6 acting hours): 236 → 816 → 874 → 846 → 834 → 813 → 792 → 770 → 758 → 724

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 3933 |
| a02 | Kim | hustler | 4117 |
| a03 | Penny | showboat | 5038 |
| a04 | Dutch | snake | 4669 |
| a05 | Moss | saint | 3909 |
| a06 | Juno | turtle | 1405 |
| a07 | Rook | greedy | 4829 |
| a08 | Tally | greedy | 5085 |
| a09 | Sable | greedy | 4736 |
| a10 | Wren | greedy | 4594 |

By brain: greedy 4811, hothead 3933, hustler 4117, saint 3909, showboat 5038, snake 4669, turtle 1405. By job: chemist 4206, dealer 3988, gunrunner 4214, smuggler 4652.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 19.33, parts smuggled 25.27, product cooked 23.9, product dealt 24.4 ($601.93), guns built 2.27, guns sold to agents 0.03 / to NPC 0.47 |
| Mean cash at the end of each day | day 1: $64, day 2: $65, day 3: $101 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 13.17 / 4.57 (2.23) / 0.77 / 1.9 |
| Gear bought or taken | car 2.77, gun 0.03 |
| Seasons where a gun entered play | 93% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 17.37 / 20% / 0% / 0.1 |
| Board prices (agent-to-agent mean) | chems $9.3, parts $20.51, product $15.23, guns $115 |

