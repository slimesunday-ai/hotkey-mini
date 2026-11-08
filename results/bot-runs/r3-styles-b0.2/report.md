# hotkey mini report: r3-styles-b0.2

30 seasons · lineup `styles` · seeds 1–30 · systems off: none · config bd6dc846 · sets: style.brand=0.2

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 31% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 50% of seasons (mean fewest partners 3.8) | **no** |
| 1 | At least 2 rivalries per season | mean 5.77; 100% of seasons | yes |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 0% of seasons; lead change in 97% of seasons | **no** |
| 2 | At least 1 king attempt in most seasons | 0% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 50% | yes |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | no turtle in this lineup | n/a |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 17% (20%), chemist 37% (30%), dealer 43% (30%), gunrunner 3% (20%) | **no** |
| 2 | Each style wins between 0.5x and 1.5x its share of seats | reckless 10% (20%), safe 7% (20%), show-off 63% (20%), lowkey 3% (20%), mid 17% (20%) | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 35%; overall top action move 26% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.26x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 4.4, worst 9, 13% of seasons; any moment: mean 3.43, worst 6 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 7.65 |
| Share of acting hours that involve another agent | 31% |
| Unique pairs that interacted | 32.2 of 45 |
| Fewest partners any agent had | 3.8 |
| Rivalries (pairs with 3+ hostile interactions) | 5.77 |
| Alliances (pairs with 2+ friendly interactions) | 3.27 |
| Interactions by kind | friendly 15.97, hostile 55.07, rival 28.23, trade 15.5 |
| Messages sent / answered | 0 / 0 |
| Promises made / kept / broken | 0 / 0 / 0 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 38.87 / 54.17 / 9.37 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 84.83 |
| Lead changes per season | 4.57 |
| Seasons with a king attempt | 0% |
| Seasons with a betrayal (broken promise) | 0% |
| Top-third repeat rate (target 50-70%) | 50% |
| Turtle | not in lineup |
| Copycat: mean share of the most common action per hour | 35% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.68 |

**Moments by type (per season):** arrest 20.97, callout_answered 13.73, revenge 12.8, bank_job_fail 9.2, escape 4.73, lead_change 4.57, eviction 4.43, bank_job_win 3.73, callout_ducked 3.2, comeback 3.17, party 2.6, crate_brawl 1.53, shooting 0.13, drive_by 0.03

**Wins by job:** smuggler 17%, chemist 37%, dealer 43%, gunrunner 3%

**Wins by character type:** greedy 100%

**Wins by style** (share of seats in brackets; an agent can wear two labels, mid = none): reckless 10% (20%), safe 7% (20%), show-off 63% (20%), lowkey 3% (20%), mid 17% (20%)

**Action mix:** move 26%, buy 10%, battle 9%, crip_walk 8%, call_out 8%, rest 6%, run 5%, scout 4%, deal 3%, bank_job 3%, pickpocket 3%, crate 3%, cook 2%, build 2%, lay_low 2%, party 2%, steal_car 2%, run_cops 1%, push_npc 1%, drip_check 1%, fistfight 0%, mug 0%, shift 0%, shoot 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,988,508 |
| Audience pool: start → end | 1000 → 1262.1 (1.26x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 4.4, worst 9 |
| Longest dull stretch (no moment of any kind) | mean 3.43, worst 6 |

**Audience curve** (whole pool, every 6 acting hours): 991 → 997 → 1019 → 1042 → 1081 → 1117 → 1141 → 1191 → 1229 → 1262

**Watching curve** (viewers assigned to agents, every 6 acting hours): 16 → 456 → 593 → 580 → 632 → 676 → 657 → 703 → 727 → 770

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | greedy | 3442 |
| a02 | Kim | greedy | 3269 |
| a03 | Penny | greedy | 3410 |
| a04 | Dutch | greedy | 3143 |
| a05 | Moss | greedy | 4131 |
| a06 | Juno | greedy | 3812 |
| a07 | Rook | greedy | 2638 |
| a08 | Tally | greedy | 2906 |
| a09 | Sable | greedy | 3285 |
| a10 | Wren | greedy | 3106 |

By brain: greedy 3314. By job: chemist 3468, dealer 3365, gunrunner 2998, smuggler 3323.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 27.6, parts smuggled 27.2, product cooked 30.6, product dealt 43.7 ($1056.57), guns built 9.27, guns sold to agents 0.13 / to NPC 4.2 |
| Mean cash at the end of each day | day 1: $87, day 2: $113, day 3: $169 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 13.13 / 4.43 (2.43) / 0.5 / 2.33 |
| Gear bought or taken | car 3.83, gun 6.73 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 20.97 / 16% / 0% / 0 |
| Board prices (agent-to-agent mean) | chems $9.1, parts $20.04, product $15.67, guns $98.5 |

