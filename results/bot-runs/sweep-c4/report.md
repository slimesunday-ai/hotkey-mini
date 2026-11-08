# hotkey mini report: sweep-c4

40 seasons · lineup `default` · seeds 1–40 · systems off: none · config 0a33d1f0 · sets: shop.gun=90, agents.startCash=150, audience.decayRate=0.015, audience.churn=0.15, heat.crimes=["pickpocket","mug","steal_car","bank_job","push_npc","fistfight","crate","shoot","drive_by","kill_king","run_cops"]

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 36% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 75% of seasons (mean fewest partners 4.22) | **no** |
| 1 | At least 2 rivalries per season | mean 11.2; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 100% of seasons (broken 10.53/season, lead changes 23.3/season) | yes |
| 2 | At least 1 king attempt in most seasons | 25% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 38% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 90% (mean place 9.43) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 28%, chemist 30%, dealer 30%, gunrunner 13% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 22% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1x; 48% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | mean 1.58, worst 3; 100% of seasons | yes |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.86 |
| Share of acting hours that involve another agent | 36% |
| Unique pairs that interacted | 34.3 of 45 |
| Fewest partners any agent had | 4.22 |
| Rivalries (pairs with 3+ hostile interactions) | 11.2 |
| Alliances (pairs with 2+ friendly interactions) | 5.85 |
| Interactions by kind | friendly 25.75, hostile 84.05, rival 29.73, talk 31.83, trade 6.58 |
| Messages sent / answered | 50.23 / 19.38 |
| Promises made / kept / broken | 13.63 / 3.1 / 10.53 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 16.43 / 26.28 / 8.2 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 134.9 |
| Lead changes per season | 23.3 |
| Seasons with a king attempt | 25% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 38% |
| Turtle | mean place 9.43 of 10; bottom third 90% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.74 |

**Moments by type (per season):** lead_change 23.3, callout_ducked 18.95, arrest 18.75, comeback 16.35, revenge 12.73, callout_answered 11.4, promise_broken 10.53, eviction 5.05, escape 3.63, promise_kept 3.1, bounty_posted 2.28, bounty_revealed 2.1, bounty_collected 1.93, shooting 1.53, bank_job_fail 1.27, bank_job_win 0.63, drive_by 0.45, party 0.38, crate_brawl 0.23, king_attempt 0.2, king_killed 0.13, revive 0.03

**Wins by job:** smuggler 28%, chemist 30%, dealer 30%, gunrunner 13%

**Wins by character type:** greedy 60%, hothead 5%, hustler 3%, saint 3%, showboat 13%, snake 18%, turtle 0%

**Action mix:** move 22%, battle 9%, rest 9%, call_out 8%, shift 7%, crip_walk 7%, drip_check 6%, buy 5%, mug 4%, fistfight 3%, run 3%, pickpocket 3%, lay_low 2%, push_npc 2%, steal_car 2%, crate 2%, scout 1%, deal 1%, cook 1%, run_cops 1%, build 1%, party 1%, bounty 1%, shoot 0%, bank_job 0%, drive_by 0%, kill_king 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 3,010,176 |
| Audience pool: start → end | 1000 → 999.54 (1x; growing in 48% of seasons) |
| Longest dull stretch (acting hours with no moment) | mean 1.58, worst 3 |

**Audience curve** (whole pool, every 6 acting hours): 990 → 1010 → 997 → 995 → 995 → 990 → 988 → 995 → 995 → 1000

**Watching curve** (viewers assigned to agents, every 6 acting hours): 323 → 970 → 940 → 949 → 952 → 956 → 935 → 964 → 940 → 936

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 4956 |
| a02 | Kim | hustler | 4568 |
| a03 | Penny | showboat | 6119 |
| a04 | Dutch | snake | 5958 |
| a05 | Moss | saint | 4577 |
| a06 | Juno | turtle | 1859 |
| a07 | Rook | greedy | 5798 |
| a08 | Tally | greedy | 5534 |
| a09 | Sable | greedy | 5559 |
| a10 | Wren | greedy | 5242 |

By brain: greedy 5533, hothead 4956, hustler 4568, saint 4577, showboat 6119, snake 5958, turtle 1859. By job: chemist 4978, dealer 4902, gunrunner 5036, smuggler 5230.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 14.5, parts smuggled 18.75, product cooked 17.93, product dealt 18.13 ($448.18), guns built 3.35, guns sold to agents 0.13 / to NPC 0.93 |
| Mean cash at the end of each day | day 1: $76, day 2: $76, day 3: $106 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 12.45 / 5.05 (2.5) / 0.8 / 2.33 |
| Gear bought or taken | car 3.55, gun 2.88 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.75 / 21% / 1% / 0.13 |
| Board prices (agent-to-agent mean) | chems $9.41, parts $20.44, product $15.35, guns $107.8 |

