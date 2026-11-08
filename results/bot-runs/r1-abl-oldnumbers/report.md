# hotkey mini report: r1-abl-oldnumbers

50 seasons · lineup `default` · seeds 1–50 · systems off: none · config 2e67e179 · sets: shop.gun=150, agents.startCash=100, audience.decayRate=0.02, audience.churn=0.3

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 39% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 62% of seasons (mean fewest partners 3.72) | **no** |
| 1 | At least 2 rivalries per season | mean 11.1; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 74% of seasons (broken 5.68/season, lead changes 3.14/season) | **no** |
| 2 | At least 1 king attempt in most seasons | 12% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 42% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 100% (mean place 9.94) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 14%, chemist 38%, dealer 38%, gunrunner 10% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 29%; overall top action move 18% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 0.7x; 0% of seasons | **no** |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3.08, worst 6, 70% of seasons; any moment: mean 2.58, worst 5 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.99 |
| Share of acting hours that involve another agent | 39% |
| Unique pairs that interacted | 34.2 of 45 |
| Fewest partners any agent had | 3.72 |
| Rivalries (pairs with 3+ hostile interactions) | 11.1 |
| Alliances (pairs with 2+ friendly interactions) | 4.58 |
| Interactions by kind | friendly 22.3, hostile 86.58, rival 31.78, talk 30.76, trade 8.42 |
| Messages sent / answered | 43.76 / 17.4 |
| Promises made / kept / broken | 8.8 / 3.12 / 5.68 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 21.28 / 26.84 / 7.94 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 93.38 |
| Lead changes per season | 3.14 |
| Seasons with a king attempt | 12% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 42% |
| Turtle | mean place 9.94 of 10; bottom third 100% |
| Copycat: mean share of the most common action per hour | 29% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.67 |

**Moments by type (per season):** revenge 29.54, arrest 18.54, callout_answered 12.66, promise_broken 5.68, eviction 5.3, callout_ducked 4.2, lead_change 3.14, promise_kept 3.12, escape 1.96, bounty_posted 1.72, comeback 1.7, bounty_revealed 1.66, bounty_collected 1.42, party 0.88, bank_job_fail 0.52, shooting 0.44, crate_brawl 0.38, bank_job_win 0.22, drive_by 0.1, king_killed 0.08, king_attempt 0.06, revive 0.06

**Wins by job:** smuggler 14%, chemist 38%, dealer 38%, gunrunner 10%

**Wins by character type:** greedy 80%, hothead 4%, hustler 4%, saint 2%, showboat 8%, snake 2%, turtle 0%

**Action mix:** move 18%, rest 11%, battle 9%, call_out 9%, crip_walk 7%, shift 7%, drip_check 6%, buy 5%, mug 4%, run 4%, fistfight 3%, pickpocket 3%, deal 2%, push_npc 2%, lay_low 2%, steal_car 2%, cook 2%, crate 1%, party 1%, run_cops 1%, build 1%, scout 1%, bounty 0%, bank_job 0%, shoot 0%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,104,284 |
| Audience pool: start → end | 1000 → 702.65 (0.7x; growing in 0% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 3.08, worst 6 |
| Longest dull stretch (no moment of any kind) | mean 2.58, worst 5 |

**Audience curve** (whole pool, every 6 acting hours): 997 → 984 → 936 → 891 → 851 → 815 → 780 → 757 → 725 → 703

**Watching curve** (viewers assigned to agents, every 6 acting hours): 211 → 467 → 324 → 343 → 311 → 320 → 320 → 337 → 276 → 281

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 2080 |
| a02 | Kim | hustler | 1628 |
| a03 | Penny | showboat | 1981 |
| a04 | Dutch | snake | 2111 |
| a05 | Moss | saint | 1301 |
| a06 | Juno | turtle | 399 |
| a07 | Rook | greedy | 2369 |
| a08 | Tally | greedy | 2063 |
| a09 | Sable | greedy | 2349 |
| a10 | Wren | greedy | 2125 |

By brain: greedy 2226, hothead 2080, hustler 1628, saint 1301, showboat 1981, snake 2111, turtle 399. By job: chemist 1957, dealer 1897, gunrunner 1725, smuggler 1696.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md) · [seed 41](41/play-by-play.md) · [seed 42](42/play-by-play.md) · [seed 43](43/play-by-play.md) · [seed 44](44/play-by-play.md) · [seed 45](45/play-by-play.md) · [seed 46](46/play-by-play.md) · [seed 47](47/play-by-play.md) · [seed 48](48/play-by-play.md) · [seed 49](49/play-by-play.md) · [seed 50](50/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 20.56, parts smuggled 22.24, product cooked 19.62, product dealt 23.72 ($584.2), guns built 2.82, guns sold to agents 0.16 / to NPC 0.48 |
| Mean cash at the end of each day | day 1: $56, day 2: $59, day 3: $88 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 11.88 / 5.3 (2.8) / 0.32 / 2.28 |
| Gear bought or taken | car 3.38, gun 0.26 |
| Seasons where a gun entered play | 92% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.54 / 20% / 0% / 0.08 |
| Board prices (agent-to-agent mean) | chems $9.24, parts $20.55, product $15.04, guns $108 |

