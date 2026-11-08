# hotkey mini report: r3-default-b0.2

30 seasons · lineup `default` · seeds 1–30 · systems off: none · config bd6dc846 · sets: style.brand=0.2

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 38% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 70% of seasons (mean fewest partners 3.83) | **no** |
| 1 | At least 2 rivalries per season | mean 10.13; 100% of seasons | yes |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 100% of seasons; lead change in 97% of seasons | yes |
| 2 | At least 1 king attempt in most seasons | 33% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 43% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 100% (mean place 9.87) | yes |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 23% (20%), chemist 27% (30%), dealer 40% (30%), gunrunner 10% (20%) | yes |
| 2 | Each style wins between 0.5x and 1.5x its share of seats | reckless 20% (15%), safe 0% (20%), show-off 7% (10%), lowkey 0% (15%), ride-or-die 0% (20%), snake 3% (10%), mid 70% (42%) | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 21% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.24x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3.03, worst 5, 70% of seasons; any moment: mean 2.67, worst 5 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.58 |
| Share of acting hours that involve another agent | 38% |
| Unique pairs that interacted | 34.7 of 45 |
| Fewest partners any agent had | 3.83 |
| Rivalries (pairs with 3+ hostile interactions) | 10.13 |
| Alliances (pairs with 2+ friendly interactions) | 6.2 |
| Interactions by kind | friendly 26.9, hostile 73.7, rival 31.9, talk 29.57, trade 11.6 |
| Messages sent / answered | 45.67 / 17.5 |
| Promises made / kept / broken | 10.13 / 3.57 / 6.57 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 29.37 / 33.13 / 6.13 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 95.23 |
| Lead changes per season | 3.57 |
| Seasons with a king attempt | 33% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 43% |
| Turtle | mean place 9.87 of 10; bottom third 100% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.68 |

**Moments by type (per season):** revenge 23.23, arrest 20.87, callout_answered 8.17, promise_broken 6.57, eviction 3.8, callout_ducked 3.7, lead_change 3.57, promise_kept 3.57, escape 2.9, bounty_posted 2.87, shooting 2.8, bank_job_fail 2.67, bounty_revealed 2.67, comeback 2.43, bounty_collected 2.27, party 0.97, bank_job_win 0.87, drive_by 0.67, king_attempt 0.27, king_killed 0.17, revive 0.13, crate_brawl 0.1

**Wins by job:** smuggler 23%, chemist 27%, dealer 40%, gunrunner 10%

**Wins by character type:** greedy 70%, hothead 20%, hustler 0%, saint 0%, showboat 7%, snake 3%, turtle 0%

**Wins by style** (share of seats in brackets; an agent can wear two labels, mid = none): reckless 20% (15%), safe 0% (20%), show-off 7% (10%), lowkey 0% (15%), ride-or-die 0% (20%), snake 3% (10%), mid 70% (42%)

**Action mix:** move 21%, rest 10%, battle 10%, buy 7%, shift 7%, call_out 6%, crip_walk 6%, mug 4%, run 4%, fistfight 3%, pickpocket 3%, cook 2%, deal 2%, steal_car 2%, push_npc 2%, lay_low 2%, crate 1%, scout 1%, run_cops 1%, build 1%, party 1%, shoot 1%, drip_check 1%, bank_job 1%, bounty 1%, drive_by 0%, kill_king 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,955,888 |
| Audience pool: start → end | 1000 → 1236.81 (1.24x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 3.03, worst 5 |
| Longest dull stretch (no moment of any kind) | mean 2.67, worst 5 |

**Audience curve** (whole pool, every 6 acting hours): 996 → 1025 → 1039 → 1066 → 1093 → 1119 → 1144 → 1176 → 1212 → 1237

**Watching curve** (viewers assigned to agents, every 6 acting hours): 73 → 559 → 541 → 617 → 604 → 654 → 658 → 690 → 722 → 707

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 4360 |
| a02 | Kim | hustler | 3263 |
| a03 | Penny | showboat | 3593 |
| a04 | Dutch | snake | 3576 |
| a05 | Moss | saint | 1950 |
| a06 | Juno | turtle | 647 |
| a07 | Rook | greedy | 3846 |
| a08 | Tally | greedy | 3717 |
| a09 | Sable | greedy | 3953 |
| a10 | Wren | greedy | 3694 |

By brain: greedy 3802, hothead 4360, hustler 3263, saint 1950, showboat 3593, snake 3576, turtle 647. By job: chemist 3245, dealer 3370, gunrunner 3193, smuggler 3183.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 19.07, parts smuggled 21.93, product cooked 29.2, product dealt 27.7 ($686.63), guns built 4.4, guns sold to agents 0.17 / to NPC 1.43 |
| Mean cash at the end of each day | day 1: $105, day 2: $107, day 3: $120 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 14.37 / 3.8 (1.77) / 0.27 / 1.83 |
| Gear bought or taken | car 4.27, chain 0.07, gun 4.27 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 20.87 / 16% / 3% / 0.17 |
| Board prices (agent-to-agent mean) | chems $9.46, parts $20.99, product $15.15, guns $109 |

