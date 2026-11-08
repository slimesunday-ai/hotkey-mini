# hotkey mini report: r3-abl-nocap

30 seasons · lineup `default` · seeds 1–30 · systems off: none · config 5936e74c · sets: promises.breakerMaxScale=999

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 38% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 67% of seasons (mean fewest partners 3.93) | **no** |
| 1 | At least 2 rivalries per season | mean 10.27; 100% of seasons | yes |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 100% of seasons; lead change in 93% of seasons | yes |
| 2 | At least 1 king attempt in most seasons | 27% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 44% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 97% (mean place 9.77) | yes |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 13% (20%), chemist 57% (30%), dealer 13% (30%), gunrunner 17% (20%) | **no** |
| 2 | Each style wins between 0.5x and 1.5x its share of seats | reckless 13% (15%), safe 0% (20%), show-off 10% (10%), lowkey 0% (15%), ride-or-die 0% (20%), snake 17% (10%), mid 60% (42%) | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 22% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.21x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 2.93, worst 5, 73% of seasons; any moment: mean 2.67, worst 5 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.4 |
| Share of acting hours that involve another agent | 38% |
| Unique pairs that interacted | 34.93 of 45 |
| Fewest partners any agent had | 3.93 |
| Rivalries (pairs with 3+ hostile interactions) | 10.27 |
| Alliances (pairs with 2+ friendly interactions) | 5.83 |
| Interactions by kind | friendly 26.27, hostile 73.27, rival 30.8, talk 28.8, trade 11.8 |
| Messages sent / answered | 44.73 / 16.27 |
| Promises made / kept / broken | 10.13 / 3.57 / 6.57 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 29.7 / 33.2 / 7.8 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 91.3 |
| Lead changes per season | 3.33 |
| Seasons with a king attempt | 27% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 44% |
| Turtle | mean place 9.77 of 10; bottom third 97% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.68 |

**Moments by type (per season):** arrest 20.87, revenge 19.83, callout_answered 6.57, promise_broken 6.57, eviction 3.93, callout_ducked 3.63, promise_kept 3.57, lead_change 3.33, bounty_posted 3.1, shooting 3.1, escape 2.9, bounty_revealed 2.83, bank_job_fail 2.7, comeback 2.6, bounty_collected 2.3, party 1.23, bank_job_win 1.03, drive_by 0.43, king_attempt 0.27, crate_brawl 0.2, king_killed 0.2, revive 0.1

**Wins by job:** smuggler 13%, chemist 57%, dealer 13%, gunrunner 17%

**Wins by character type:** greedy 60%, hothead 13%, hustler 0%, saint 0%, showboat 10%, snake 17%, turtle 0%

**Wins by style** (share of seats in brackets; an agent can wear two labels, mid = none): reckless 13% (15%), safe 0% (20%), show-off 10% (10%), lowkey 0% (15%), ride-or-die 0% (20%), snake 17% (10%), mid 60% (42%)

**Action mix:** move 22%, rest 10%, battle 9%, buy 7%, shift 7%, crip_walk 6%, call_out 6%, mug 4%, run 4%, fistfight 3%, pickpocket 2%, cook 2%, deal 2%, steal_car 2%, lay_low 2%, push_npc 2%, crate 2%, scout 1%, run_cops 1%, build 1%, shoot 1%, party 1%, bank_job 1%, drip_check 1%, bounty 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,904,686 |
| Audience pool: start → end | 1000 → 1206.05 (1.21x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 2.93, worst 5 |
| Longest dull stretch (no moment of any kind) | mean 2.67, worst 5 |

**Audience curve** (whole pool, every 6 acting hours): 995 → 1025 → 1036 → 1063 → 1085 → 1107 → 1131 → 1164 → 1188 → 1206

**Watching curve** (viewers assigned to agents, every 6 acting hours): 69 → 566 → 531 → 623 → 569 → 614 → 642 → 653 → 657 → 655

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 3795 |
| a02 | Kim | hustler | 3032 |
| a03 | Penny | showboat | 3234 |
| a04 | Dutch | snake | 3846 |
| a05 | Moss | saint | 2045 |
| a06 | Juno | turtle | 876 |
| a07 | Rook | greedy | 3824 |
| a08 | Tally | greedy | 3693 |
| a09 | Sable | greedy | 3903 |
| a10 | Wren | greedy | 3496 |

By brain: greedy 3729, hothead 3795, hustler 3032, saint 2045, showboat 3234, snake 3846, turtle 876. By job: chemist 3243, dealer 3276, gunrunner 2973, smuggler 3121.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 22, parts smuggled 20.27, product cooked 29.2, product dealt 27.1 ($673.1), guns built 4.7, guns sold to agents 0.23 / to NPC 1.43 |
| Mean cash at the end of each day | day 1: $100, day 2: $104, day 3: $124 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 14.27 / 3.93 (1.73) / 0.33 / 2 |
| Gear bought or taken | car 3.3, chain 0.07, gun 4.2 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 20.87 / 16% / 2% / 0.2 |
| Board prices (agent-to-agent mean) | chems $9.32, parts $20.52, product $14.92, guns $109 |

