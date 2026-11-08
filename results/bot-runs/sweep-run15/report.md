# hotkey mini report: sweep-run15

40 seasons · lineup `default` · seeds 1–40 · systems off: none · config 3185a4c3 · sets: points.run={"action":1.5}

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 37% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 68% of seasons (mean fewest partners 4.1) | **no** |
| 1 | At least 2 rivalries per season | mean 9.95; 100% of seasons | yes |
| 2 | At least 1 broken promise and 2 lead changes per season | 88% of seasons (broken 6.78/season, lead changes 4.2/season) | **no** |
| 2 | At least 1 king attempt in most seasons | 43% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 40% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | 95% (mean place 9.73) | yes |
| 2 | No job wins more than 40% of seasons; every job wins at least 10% | smuggler 18%, chemist 30%, dealer 33%, gunrunner 20% | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 30%; overall top action move 21% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.16x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3.45, worst 7, 57% of seasons; any moment: mean 2.9, worst 7 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 11.03 |
| Share of acting hours that involve another agent | 37% |
| Unique pairs that interacted | 34.38 of 45 |
| Fewest partners any agent had | 4.1 |
| Rivalries (pairs with 3+ hostile interactions) | 9.95 |
| Alliances (pairs with 2+ friendly interactions) | 5.63 |
| Interactions by kind | friendly 25.83, hostile 73.28, rival 25.03, talk 32, trade 9.32 |
| Messages sent / answered | 49.05 / 19.4 |
| Promises made / kept / broken | 10.65 / 3.88 / 6.78 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 23.13 / 32.98 / 5.15 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 93.3 |
| Lead changes per season | 4.2 |
| Seasons with a king attempt | 43% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 40% |
| Turtle | mean place 9.73 of 10; bottom third 95% |
| Copycat: mean share of the most common action per hour | 30% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.73 |

**Moments by type (per season):** revenge 20.6, arrest 18.35, callout_answered 8.9, promise_broken 6.78, callout_ducked 4.93, lead_change 4.2, promise_kept 3.88, eviction 3.73, shooting 3.05, bounty_posted 2.95, escape 2.95, comeback 2.9, bounty_revealed 2.73, bank_job_fail 2.35, bounty_collected 2.33, bank_job_win 0.73, party 0.63, drive_by 0.33, king_attempt 0.33, crate_brawl 0.28, king_killed 0.25, revive 0.18

**Wins by job:** smuggler 18%, chemist 30%, dealer 33%, gunrunner 20%

**Wins by character type:** greedy 63%, hothead 13%, hustler 3%, saint 0%, showboat 8%, snake 15%, turtle 0%

**Action mix:** move 21%, rest 10%, battle 8%, call_out 7%, buy 7%, shift 7%, crip_walk 6%, drip_check 5%, run 3%, mug 3%, fistfight 3%, pickpocket 3%, deal 2%, cook 2%, push_npc 2%, steal_car 1%, lay_low 1%, crate 1%, scout 1%, run_cops 1%, build 1%, shoot 1%, party 1%, bank_job 1%, bounty 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,781,186 |
| Audience pool: start → end | 1000 → 1157.46 (1.16x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 3.45, worst 7 |
| Longest dull stretch (no moment of any kind) | mean 2.9, worst 7 |

**Audience curve** (whole pool, every 6 acting hours): 995 → 1029 → 1035 → 1051 → 1075 → 1083 → 1104 → 1122 → 1146 → 1157

**Watching curve** (viewers assigned to agents, every 6 acting hours): 63 → 590 → 505 → 574 → 568 → 543 → 621 → 584 → 628 → 593

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 3567 |
| a02 | Kim | hustler | 2781 |
| a03 | Penny | showboat | 3232 |
| a04 | Dutch | snake | 3369 |
| a05 | Moss | saint | 1987 |
| a06 | Juno | turtle | 743 |
| a07 | Rook | greedy | 3453 |
| a08 | Tally | greedy | 3475 |
| a09 | Sable | greedy | 3421 |
| a10 | Wren | greedy | 3659 |

By brain: greedy 3502, hothead 3567, hustler 2781, saint 1987, showboat 3232, snake 3369, turtle 743. By job: chemist 3004, dealer 2977, gunrunner 2817, smuggler 3055.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md) · [seed 31](31/play-by-play.md) · [seed 32](32/play-by-play.md) · [seed 33](33/play-by-play.md) · [seed 34](34/play-by-play.md) · [seed 35](35/play-by-play.md) · [seed 36](36/play-by-play.md) · [seed 37](37/play-by-play.md) · [seed 38](38/play-by-play.md) · [seed 39](39/play-by-play.md) · [seed 40](40/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 15.8, parts smuggled 18.5, product cooked 21.45, product dealt 25.18 ($623.88), guns built 4.65, guns sold to agents 0.3 / to NPC 1.33 |
| Mean cash at the end of each day | day 1: $99, day 2: $91, day 3: $121 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 14.73 / 3.73 (1.5) / 0.18 / 1.6 |
| Gear bought or taken | car 2.93, chain 0.03, gun 4.7 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 18.35 / 20% / 2% / 0.25 |
| Board prices (agent-to-agent mean) | chems $9.34, parts $20.79, product $15.45, guns $107.9 |

