# hotkey mini report: r3-default-r3c0

30 seasons · lineup `default` · seeds 1–30 · systems off: none · config 07141339 · sets: style.brandClout=0, style.brandRisk=0.3

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 38% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 73% of seasons (mean fewest partners 3.9) | **no** |
| 1 | At least 2 rivalries per season | mean 10.4; 100% of seasons | yes |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 100% of seasons; lead change in 90% of seasons | yes |
| 2 | At least 1 king attempt in most seasons | 37% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 47% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 100% (mean place 9.93) | yes |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 13% (20%), chemist 37% (30%), dealer 30% (30%), gunrunner 20% (20%) | yes |
| 2 | Each style wins between 0.5x and 1.5x its share of seats | reckless 40% (15%), safe 0% (20%), show-off 0% (10%), lowkey 3% (15%), ride-or-die 0% (20%), snake 10% (10%), mid 50% (42%) | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 21% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.24x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3.3, worst 5, 57% of seasons; any moment: mean 2.9, worst 5 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.54 |
| Share of acting hours that involve another agent | 38% |
| Unique pairs that interacted | 34.53 of 45 |
| Fewest partners any agent had | 3.9 |
| Rivalries (pairs with 3+ hostile interactions) | 10.4 |
| Alliances (pairs with 2+ friendly interactions) | 5.73 |
| Interactions by kind | friendly 25.13, hostile 75.53, rival 30.8, talk 29.87, trade 11.73 |
| Messages sent / answered | 45.1 / 17.23 |
| Promises made / kept / broken | 9.73 / 3.37 / 6.37 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 29.3 / 33.7 / 7.8 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 94.93 |
| Lead changes per season | 3.43 |
| Seasons with a king attempt | 37% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 47% |
| Turtle | mean place 9.93 of 10; bottom third 100% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.69 |

**Moments by type (per season):** revenge 22.3, arrest 20.83, callout_answered 8.03, promise_broken 6.37, eviction 3.87, callout_ducked 3.67, shooting 3.47, lead_change 3.43, promise_kept 3.37, bounty_posted 3.13, bounty_revealed 2.97, comeback 2.87, escape 2.7, bounty_collected 2.53, bank_job_fail 2.13, party 1.1, bank_job_win 0.87, drive_by 0.4, crate_brawl 0.3, king_killed 0.3, revive 0.17, king_attempt 0.13

**Wins by job:** smuggler 13%, chemist 37%, dealer 30%, gunrunner 20%

**Wins by character type:** greedy 50%, hothead 33%, hustler 7%, saint 0%, showboat 0%, snake 10%, turtle 0%

**Wins by style** (share of seats in brackets; an agent can wear two labels, mid = none): reckless 40% (15%), safe 0% (20%), show-off 0% (10%), lowkey 3% (15%), ride-or-die 0% (20%), snake 10% (10%), mid 50% (42%)

**Action mix:** move 21%, rest 10%, battle 9%, buy 7%, shift 7%, crip_walk 6%, call_out 6%, mug 4%, run 3%, fistfight 3%, cook 2%, pickpocket 2%, deal 2%, push_npc 2%, steal_car 2%, lay_low 2%, crate 2%, scout 1%, run_cops 1%, build 1%, shoot 1%, party 1%, drip_check 1%, bounty 1%, bank_job 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,957,852 |
| Audience pool: start → end | 1000 → 1239.99 (1.24x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 3.3, worst 5 |
| Longest dull stretch (no moment of any kind) | mean 2.9, worst 5 |

**Audience curve** (whole pool, every 6 acting hours): 996 → 1026 → 1039 → 1066 → 1093 → 1117 → 1139 → 1180 → 1212 → 1240

**Watching curve** (viewers assigned to agents, every 6 acting hours): 72 → 564 → 525 → 608 → 603 → 623 → 629 → 709 → 689 → 735

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 4444 |
| a02 | Kim | hustler | 3183 |
| a03 | Penny | showboat | 3175 |
| a04 | Dutch | snake | 3873 |
| a05 | Moss | saint | 2049 |
| a06 | Juno | turtle | 674 |
| a07 | Rook | greedy | 3982 |
| a08 | Tally | greedy | 3667 |
| a09 | Sable | greedy | 3828 |
| a10 | Wren | greedy | 3757 |

By brain: greedy 3808, hothead 4444, hustler 3183, saint 2049, showboat 3175, snake 3873, turtle 674. By job: chemist 3157, dealer 3394, gunrunner 3346, smuggler 3142.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 21.07, parts smuggled 19.2, product cooked 30.1, product dealt 26.9 ($664.43), guns built 4.67, guns sold to agents 0.3 / to NPC 1.77 |
| Mean cash at the end of each day | day 1: $101, day 2: $99, day 3: $129 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 14.4 / 3.87 (1.63) / 0.23 / 1.7 |
| Gear bought or taken | car 3.67, chain 0.07, gun 4.27 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 20.83 / 16% / 3% / 0.3 |
| Board prices (agent-to-agent mean) | chems $9.47, parts $21, product $15.17, guns $108.56 |

