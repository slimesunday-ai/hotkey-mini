# hotkey mini report: sweep-lessJail

30 seasons · lineup `default` · seeds 1–30 · systems off: none · config ebc31a98 · sets: cops.arrest={"3":0.25,"4":0.5,"5":1}

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 38% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 67% of seasons (mean fewest partners 3.93) | **no** |
| 1 | At least 2 rivalries per season | mean 12.6; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 100% of seasons (broken 10.47/season, lead changes 29.9/season) | yes |
| 2 | At least 1 king attempt in most seasons | 17% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 42% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 100% (mean place 9.97) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 30%, chemist 27%, dealer 20%, gunrunner 23% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 29%; overall top action move 20% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 0.79x; 0% of seasons | **no** |
| 3 | Longest dull stretch is 3 acting hours or less | mean 1.27, worst 3; 100% of seasons | yes |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 12.98 |
| Share of acting hours that involve another agent | 38% |
| Unique pairs that interacted | 35.17 of 45 |
| Fewest partners any agent had | 3.93 |
| Rivalries (pairs with 3+ hostile interactions) | 12.6 |
| Alliances (pairs with 2+ friendly interactions) | 6.03 |
| Interactions by kind | friendly 26.17, hostile 94.57, rival 34.8, talk 30.63, trade 8.5 |
| Messages sent / answered | 49.03 / 19.13 |
| Promises made / kept / broken | 13.7 / 3.23 / 10.47 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 21.53 / 28.3 / 8.47 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 146.53 |
| Lead changes per season | 29.9 |
| Seasons with a king attempt | 17% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 42% |
| Turtle | mean place 9.97 of 10; bottom third 100% |
| Copycat: mean share of the most common action per hour | 29% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.69 |

**Moments by type (per season):** lead_change 29.9, callout_ducked 20.3, comeback 18.23, arrest 16.63, revenge 16.63, callout_answered 14.17, promise_broken 10.47, eviction 5.07, escape 3.77, promise_kept 3.23, bounty_posted 2.1, bounty_revealed 1.93, bounty_collected 1.73, shooting 0.9, party 0.57, crate_brawl 0.27, bank_job_fail 0.2, bank_job_win 0.13, drive_by 0.1, king_attempt 0.1, king_killed 0.07, revive 0.03

**Wins by job:** smuggler 30%, chemist 27%, dealer 20%, gunrunner 23%

**Wins by character type:** greedy 77%, hothead 0%, hustler 3%, saint 3%, showboat 10%, snake 7%, turtle 0%

**Action mix:** move 20%, battle 10%, rest 9%, call_out 8%, shift 7%, crip_walk 7%, drip_check 6%, buy 5%, mug 4%, fistfight 4%, run 4%, pickpocket 3%, lay_low 2%, deal 2%, cook 2%, crate 2%, run_cops 1%, push_npc 1%, steal_car 1%, scout 1%, party 1%, build 1%, bounty 0%, shoot 0%, bank_job 0%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 2,683,694 |
| Audience pool: start → end | 1000 → 794.17 (0.79x; growing in 0% of seasons) |
| Longest dull stretch (acting hours with no moment) | mean 1.27, worst 3 |

**Audience curve** (whole pool, every 6 acting hours): 1003 → 996 → 961 → 922 → 905 → 877 → 853 → 836 → 811 → 794

**Watching curve** (viewers assigned to agents, every 6 acting hours): 472 → 947 → 895 → 853 → 862 → 818 → 781 → 769 → 769 → 761

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 4365 |
| a02 | Kim | hustler | 3868 |
| a03 | Penny | showboat | 4942 |
| a04 | Dutch | snake | 4977 |
| a05 | Moss | saint | 3636 |
| a06 | Juno | turtle | 1087 |
| a07 | Rook | greedy | 5568 |
| a08 | Tally | greedy | 5550 |
| a09 | Sable | greedy | 5261 |
| a10 | Wren | greedy | 5475 |

By brain: greedy 5463, hothead 4365, hustler 3868, saint 3636, showboat 4942, snake 4977, turtle 1087. By job: chemist 4243, dealer 4313, gunrunner 4399, smuggler 5130.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 22.13, parts smuggled 22.47, product cooked 21.6, product dealt 24.97 ($614.63), guns built 2.47, guns sold to agents 0.17 / to NPC 0.5 |
| Mean cash at the end of each day | day 1: $60, day 2: $62, day 3: $91 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 12.33 / 5.07 (2.6) / 0.53 / 2.3 |
| Gear bought or taken | car 2.13, gun 0.2 |
| Seasons where a gun entered play | 93% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 16.63 / 19% / 1% / 0.07 |
| Board prices (agent-to-agent mean) | chems $9.26, parts $20.17, product $15.44, guns $109.13 |

