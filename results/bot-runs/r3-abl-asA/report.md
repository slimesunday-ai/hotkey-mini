# hotkey mini report: r3-abl-asA

30 seasons · lineup `default` · seeds 1–30 · systems off: none · config 5a8b50d2 · sets: agents.sliderJitterGreedy=0.1, style.brandRisk=0.5, style.brandClout=0.5, promises.breakerMaxScale=999

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 38% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 60% of seasons (mean fewest partners 3.7) | **no** |
| 1 | At least 2 rivalries per season | mean 9.5; 100% of seasons | yes |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 100% of seasons; lead change in 90% of seasons | yes |
| 2 | At least 1 king attempt in most seasons | 37% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 46% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 100% (mean place 9.97) | yes |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 20% (20%), chemist 33% (30%), dealer 33% (30%), gunrunner 13% (20%) | yes |
| 2 | Each style wins between 0.5x and 1.5x its share of seats | reckless 43% (15%), safe 0% (20%), show-off 7% (10%), lowkey 7% (15%), ride-or-die 0% (20%), snake 7% (10%), mid 40% (42%) | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 21% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.27x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 2.93, worst 4, 67% of seasons; any moment: mean 2.6, worst 4 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.63 |
| Share of acting hours that involve another agent | 38% |
| Unique pairs that interacted | 34.43 of 45 |
| Fewest partners any agent had | 3.7 |
| Rivalries (pairs with 3+ hostile interactions) | 9.5 |
| Alliances (pairs with 2+ friendly interactions) | 6.07 |
| Interactions by kind | friendly 27.03, hostile 72.87, rival 33.23, talk 29.47, trade 11.8 |
| Messages sent / answered | 45.73 / 17.03 |
| Promises made / kept / broken | 10.47 / 3.73 / 6.73 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 29.8 / 34.2 / 7.9 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 91.9 |
| Lead changes per season | 2.77 |
| Seasons with a king attempt | 37% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 46% |
| Turtle | mean place 9.97 of 10; bottom third 100% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.68 |

**Moments by type (per season):** revenge 21.6, arrest 21.07, callout_answered 7.4, promise_broken 6.73, eviction 3.8, callout_ducked 3.77, promise_kept 3.73, shooting 3.23, escape 3.13, lead_change 2.77, bank_job_fail 2.67, bounty_posted 2.43, bounty_revealed 2.23, bounty_collected 1.97, comeback 1.57, bank_job_win 1.27, party 1.03, drive_by 0.5, crate_brawl 0.33, king_killed 0.27, revive 0.23, king_attempt 0.17

**Wins by job:** smuggler 20%, chemist 33%, dealer 33%, gunrunner 13%

**Wins by character type:** greedy 37%, hothead 40%, hustler 10%, saint 0%, showboat 7%, snake 7%, turtle 0%

**Wins by style** (share of seats in brackets; an agent can wear two labels, mid = none): reckless 43% (15%), safe 0% (20%), show-off 7% (10%), lowkey 7% (15%), ride-or-die 0% (20%), snake 7% (10%), mid 40% (42%)

**Action mix:** move 21%, battle 10%, rest 10%, buy 7%, shift 7%, crip_walk 6%, call_out 6%, mug 4%, run 3%, fistfight 3%, pickpocket 2%, cook 2%, deal 2%, push_npc 2%, steal_car 2%, lay_low 2%, crate 1%, scout 1%, build 1%, run_cops 1%, party 1%, shoot 1%, bank_job 1%, drip_check 1%, bounty 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 2,053,180 |
| Audience pool: start → end | 1000 → 1274.07 (1.27x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 2.93, worst 4 |
| Longest dull stretch (no moment of any kind) | mean 2.6, worst 4 |

**Audience curve** (whole pool, every 6 acting hours): 1001 → 1034 → 1055 → 1080 → 1109 → 1139 → 1177 → 1211 → 1245 → 1274

**Watching curve** (viewers assigned to agents, every 6 acting hours): 139 → 563 → 597 → 629 → 629 → 648 → 699 → 705 → 728 → 723

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 4944 |
| a02 | Kim | hustler | 3674 |
| a03 | Penny | showboat | 3649 |
| a04 | Dutch | snake | 4210 |
| a05 | Moss | saint | 1843 |
| a06 | Juno | turtle | 535 |
| a07 | Rook | greedy | 3483 |
| a08 | Tally | greedy | 3657 |
| a09 | Sable | greedy | 4105 |
| a10 | Wren | greedy | 4120 |

By brain: greedy 3841, hothead 4944, hustler 3674, saint 1843, showboat 3649, snake 4210, turtle 535. By job: chemist 3361, dealer 3624, gunrunner 3265, smuggler 3367.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 19.73, parts smuggled 19.8, product cooked 29.1, product dealt 27.27 ($675.07), guns built 5.37, guns sold to agents 0.27 / to NPC 1.93 |
| Mean cash at the end of each day | day 1: $102, day 2: $108, day 3: $139 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 14.3 / 3.8 (1.77) / 0.4 / 1.57 |
| Gear bought or taken | car 4.33, gun 4.47 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 21.07 / 16% / 2% / 0.27 |
| Board prices (agent-to-agent mean) | chems $9.41, parts $20.61, product $14.94, guns $108.14 |

