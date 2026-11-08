# hotkey mini report: r3-abl-jitter

30 seasons · lineup `default` · seeds 1–30 · systems off: none · config 7d40a5ce · sets: agents.sliderJitterGreedy=0.1

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 38% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 73% of seasons (mean fewest partners 3.97) | **no** |
| 1 | At least 2 rivalries per season | mean 10.47; 100% of seasons | yes |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 100% of seasons; lead change in 97% of seasons | yes |
| 2 | At least 1 king attempt in most seasons | 37% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 42% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 100% (mean place 9.93) | yes |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 23% (20%), chemist 37% (30%), dealer 20% (30%), gunrunner 20% (20%) | yes |
| 2 | Each style wins between 0.5x and 1.5x its share of seats | reckless 20% (15%), safe 0% (20%), show-off 3% (10%), lowkey 3% (15%), ride-or-die 0% (20%), snake 13% (10%), mid 63% (42%) | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 22% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.2x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3.37, worst 6, 60% of seasons; any moment: mean 2.9, worst 6 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.25 |
| Share of acting hours that involve another agent | 38% |
| Unique pairs that interacted | 34.7 of 45 |
| Fewest partners any agent had | 3.97 |
| Rivalries (pairs with 3+ hostile interactions) | 10.47 |
| Alliances (pairs with 2+ friendly interactions) | 5.43 |
| Interactions by kind | friendly 25.2, hostile 72.5, rival 31.73, talk 28.6, trade 10.63 |
| Messages sent / answered | 43.9 / 16 |
| Promises made / kept / broken | 9.67 / 3.57 / 6.1 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 26.33 / 32.97 / 7.87 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 92.33 |
| Lead changes per season | 3.7 |
| Seasons with a king attempt | 37% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 42% |
| Turtle | mean place 9.93 of 10; bottom third 100% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.69 |

**Moments by type (per season):** arrest 21, revenge 20.83, callout_answered 7.17, promise_broken 6.1, callout_ducked 4.03, lead_change 3.7, shooting 3.63, promise_kept 3.57, eviction 3.43, bounty_posted 2.97, bounty_revealed 2.7, comeback 2.63, escape 2.63, bank_job_fail 2.47, bounty_collected 2.17, bank_job_win 1.13, party 0.87, drive_by 0.4, king_attempt 0.33, crate_brawl 0.27, king_killed 0.2, revive 0.1

**Wins by job:** smuggler 23%, chemist 37%, dealer 20%, gunrunner 20%

**Wins by character type:** greedy 63%, hothead 17%, hustler 3%, saint 0%, showboat 3%, snake 13%, turtle 0%

**Wins by style** (share of seats in brackets; an agent can wear two labels, mid = none): reckless 20% (15%), safe 0% (20%), show-off 3% (10%), lowkey 3% (15%), ride-or-die 0% (20%), snake 13% (10%), mid 63% (42%)

**Action mix:** move 22%, rest 10%, battle 9%, shift 7%, buy 7%, call_out 6%, crip_walk 6%, mug 4%, run 4%, fistfight 3%, pickpocket 2%, cook 2%, steal_car 2%, push_npc 2%, deal 2%, lay_low 2%, crate 2%, shoot 1%, scout 1%, build 1%, run_cops 1%, party 1%, bank_job 1%, drip_check 1%, bounty 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,886,492 |
| Audience pool: start → end | 1000 → 1199.89 (1.2x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 3.37, worst 6 |
| Longest dull stretch (no moment of any kind) | mean 2.9, worst 6 |

**Audience curve** (whole pool, every 6 acting hours): 995 → 1023 → 1033 → 1058 → 1081 → 1104 → 1122 → 1159 → 1183 → 1200

**Watching curve** (viewers assigned to agents, every 6 acting hours): 69 → 555 → 533 → 600 → 571 → 625 → 625 → 665 → 661 → 650

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 3835 |
| a02 | Kim | hustler | 2934 |
| a03 | Penny | showboat | 3313 |
| a04 | Dutch | snake | 3601 |
| a05 | Moss | saint | 1959 |
| a06 | Juno | turtle | 784 |
| a07 | Rook | greedy | 3668 |
| a08 | Tally | greedy | 3633 |
| a09 | Sable | greedy | 3756 |
| a10 | Wren | greedy | 3960 |

By brain: greedy 3754, hothead 3835, hustler 2934, saint 1959, showboat 3313, snake 3601, turtle 784. By job: chemist 3056, dealer 3309, gunrunner 3031, smuggler 3142.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 18.27, parts smuggled 21.6, product cooked 29.4, product dealt 23.3 ($578.1), guns built 4.87, guns sold to agents 0.23 / to NPC 1.3 |
| Mean cash at the end of each day | day 1: $100, day 2: $99, day 3: $127 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 14.87 / 3.43 (1.67) / 0.33 / 1.43 |
| Gear bought or taken | car 3.9, gun 4.07 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 21 / 16% / 3% / 0.2 |
| Board prices (agent-to-agent mean) | chems $9.44, parts $20.87, product $14.76, guns $106.71 |

