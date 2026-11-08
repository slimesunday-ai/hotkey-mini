# hotkey mini report: sweep-cash200

30 seasons · lineup `default` · seeds 1–30 · systems off: none · config 5db8e020 · sets: agents.startCash=200

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 38% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 70% of seasons (mean fewest partners 4.13) | **no** |
| 1 | At least 2 rivalries per season | mean 11.87; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 100% of seasons (broken 9.7/season, lead changes 30.83/season) | yes |
| 2 | At least 1 king attempt in most seasons | 37% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 39% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 100% (mean place 9.9) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 23%, chemist 27%, dealer 27%, gunrunner 23% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 21% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 0.76x; 0% of seasons | **no** |
| 3 | Longest dull stretch is 3 acting hours or less | mean 1.17, worst 3; 100% of seasons | yes |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 12.48 |
| Share of acting hours that involve another agent | 38% |
| Unique pairs that interacted | 35.73 of 45 |
| Fewest partners any agent had | 4.13 |
| Rivalries (pairs with 3+ hostile interactions) | 11.87 |
| Alliances (pairs with 2+ friendly interactions) | 6.53 |
| Interactions by kind | friendly 29.03, hostile 88.23, rival 28.73, talk 31.1, trade 10.1 |
| Messages sent / answered | 51.13 / 19.87 |
| Promises made / kept / broken | 13.57 / 3.87 / 9.7 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 25.47 / 33.33 / 7.4 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 145.27 |
| Lead changes per season | 30.83 |
| Seasons with a king attempt | 37% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 39% |
| Turtle | mean place 9.9 of 10; bottom third 100% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.7 |

**Moments by type (per season):** lead_change 30.83, comeback 19.5, callout_ducked 19.2, arrest 18.87, revenge 13.37, callout_answered 13.2, promise_broken 9.7, promise_kept 3.87, eviction 3.13, bounty_posted 2.5, escape 2.47, bounty_revealed 2.43, bounty_collected 1.9, shooting 1.7, bank_job_fail 0.6, party 0.6, crate_brawl 0.33, drive_by 0.27, king_attempt 0.23, bank_job_win 0.2, king_killed 0.2, revive 0.17

**Wins by job:** smuggler 23%, chemist 27%, dealer 27%, gunrunner 23%

**Wins by character type:** greedy 70%, hothead 3%, hustler 0%, saint 7%, showboat 20%, snake 0%, turtle 0%

**Action mix:** move 21%, rest 9%, battle 9%, call_out 8%, shift 7%, buy 6%, crip_walk 6%, drip_check 5%, mug 4%, run 4%, fistfight 3%, deal 2%, cook 2%, pickpocket 2%, push_npc 2%, crate 2%, lay_low 2%, steal_car 1%, run_cops 1%, build 1%, party 1%, bounty 1%, shoot 1%, scout 0%, bank_job 0%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 2,603,918 |
| Audience pool: start → end | 1000 → 761.09 (0.76x; growing in 0% of seasons) |
| Longest dull stretch (acting hours with no moment) | mean 1.17, worst 3 |

**Audience curve** (whole pool, every 6 acting hours): 999 → 989 → 952 → 922 → 896 → 870 → 835 → 808 → 781 → 761

**Watching curve** (viewers assigned to agents, every 6 acting hours): 445 → 935 → 865 → 859 → 811 → 801 → 760 → 760 → 723 → 711

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 4515 |
| a02 | Kim | hustler | 3929 |
| a03 | Penny | showboat | 5384 |
| a04 | Dutch | snake | 4850 |
| a05 | Moss | saint | 3774 |
| a06 | Juno | turtle | 1211 |
| a07 | Rook | greedy | 4995 |
| a08 | Tally | greedy | 5038 |
| a09 | Sable | greedy | 4994 |
| a10 | Wren | greedy | 4709 |

By brain: greedy 4934, hothead 4515, hustler 3929, saint 3774, showboat 5384, snake 4850, turtle 1211. By job: chemist 4215, dealer 4388, gunrunner 4225, smuggler 4568.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 22.8, parts smuggled 20.93, product cooked 25.9, product dealt 27.33 ($673.07), guns built 4.13, guns sold to agents 0.27 / to NPC 1 |
| Mean cash at the end of each day | day 1: $102, day 2: $84, day 3: $106 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 15.93 / 3.13 (0.87) / 0.23 / 0.93 |
| Gear bought or taken | car 2.87, gun 1.07 |
| Seasons where a gun entered play | 97% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.87 / 21% / 1% / 0.2 |
| Board prices (agent-to-agent mean) | chems $9.4, parts $20.89, product $14.87, guns $109.71 |

