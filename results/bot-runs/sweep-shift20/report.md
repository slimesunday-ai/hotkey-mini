# hotkey mini report: sweep-shift20

30 seasons · lineup `default` · seeds 1–30 · systems off: none · config 0b76dce0 · sets: actions.shift.pays=20

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 38% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 80% of seasons (mean fewest partners 4.1) | **no** |
| 1 | At least 2 rivalries per season | mean 12.53; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 100% of seasons (broken 10.77/season, lead changes 30.37/season) | yes |
| 2 | At least 1 king attempt in most seasons | 20% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 43% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 100% (mean place 9.97) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 33%, chemist 27%, dealer 23%, gunrunner 17% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 29%; overall top action move 20% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 0.79x; 0% of seasons | **no** |
| 3 | Longest dull stretch is 3 acting hours or less | mean 1.2, worst 3; 100% of seasons | yes |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 12.69 |
| Share of acting hours that involve another agent | 38% |
| Unique pairs that interacted | 35.37 of 45 |
| Fewest partners any agent had | 4.1 |
| Rivalries (pairs with 3+ hostile interactions) | 12.53 |
| Alliances (pairs with 2+ friendly interactions) | 6.1 |
| Interactions by kind | friendly 25.77, hostile 92.13, rival 32.7, talk 30.07, trade 9.73 |
| Messages sent / answered | 48.3 / 18.3 |
| Promises made / kept / broken | 13.83 / 3.07 / 10.77 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 24.5 / 27.67 / 8.4 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 146.53 |
| Lead changes per season | 30.37 |
| Seasons with a king attempt | 20% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 43% |
| Turtle | mean place 9.97 of 10; bottom third 100% |
| Copycat: mean share of the most common action per hour | 29% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.7 |

**Moments by type (per season):** lead_change 30.37, callout_ducked 20.07, comeback 18.7, arrest 18.3, revenge 16.17, callout_answered 13.53, promise_broken 10.77, eviction 5.13, escape 3.1, promise_kept 3.07, bounty_posted 1.73, bounty_revealed 1.63, bounty_collected 1.5, party 0.7, shooting 0.53, bank_job_fail 0.33, crate_brawl 0.27, king_attempt 0.2, king_killed 0.2, revive 0.17, bank_job_win 0.03, drive_by 0.03

**Wins by job:** smuggler 33%, chemist 27%, dealer 23%, gunrunner 17%

**Wins by character type:** greedy 73%, hothead 0%, hustler 3%, saint 0%, showboat 13%, snake 10%, turtle 0%

**Action mix:** move 20%, battle 9%, rest 9%, call_out 8%, shift 7%, crip_walk 6%, drip_check 6%, buy 5%, mug 4%, run 4%, fistfight 4%, pickpocket 3%, cook 2%, deal 2%, lay_low 2%, crate 1%, push_npc 1%, steal_car 1%, run_cops 1%, scout 1%, party 1%, build 1%, bounty 0%, shoot 0%, kill_king 0%, bank_job 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 2,680,116 |
| Audience pool: start → end | 1000 → 787.42 (0.79x; growing in 0% of seasons) |
| Longest dull stretch (acting hours with no moment) | mean 1.2, worst 3 |

**Audience curve** (whole pool, every 6 acting hours): 1003 → 997 → 958 → 926 → 899 → 874 → 846 → 829 → 805 → 787

**Watching curve** (viewers assigned to agents, every 6 acting hours): 472 → 950 → 844 → 876 → 857 → 834 → 801 → 788 → 751 → 748

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 4328 |
| a02 | Kim | hustler | 3952 |
| a03 | Penny | showboat | 5145 |
| a04 | Dutch | snake | 5027 |
| a05 | Moss | saint | 3660 |
| a06 | Juno | turtle | 1212 |
| a07 | Rook | greedy | 5598 |
| a08 | Tally | greedy | 5247 |
| a09 | Sable | greedy | 5482 |
| a10 | Wren | greedy | 5018 |

By brain: greedy 5336, hothead 4328, hustler 3952, saint 3660, showboat 5145, snake 5027, turtle 1212. By job: chemist 4275, dealer 4373, gunrunner 4298, smuggler 5064.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 26.4, parts smuggled 20.07, product cooked 25.7, product dealt 24.37 ($598.9), guns built 2.47, guns sold to agents 0.03 / to NPC 0.43 |
| Mean cash at the end of each day | day 1: $62, day 2: $69, day 3: $100 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 12.03 / 5.13 (2.77) / 0.5 / 2.47 |
| Gear bought or taken | car 2.87, gun 0.13 |
| Seasons where a gun entered play | 93% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.3 / 20% / 0% / 0.2 |
| Board prices (agent-to-agent mean) | chems $9.14, parts $20.54, product $15.17, guns $105 |

