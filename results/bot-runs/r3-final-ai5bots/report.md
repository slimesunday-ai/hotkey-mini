# hotkey mini report: r3-final-ai5bots

30 seasons · lineup `ai5` · seeds 1–30 · systems off: none · config 48e5c80a

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 43% | yes |
| 1 | Every agent interacts with at least 4 others per season | 93% of seasons (mean fewest partners 5.5) | **no** |
| 1 | At least 2 rivalries per season | mean 10.93; 100% of seasons | yes |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 100% of seasons; lead change in 100% of seasons | yes |
| 2 | At least 1 king attempt in most seasons | 40% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 34% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | no turtle in this lineup | n/a |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 17% (20%), chemist 43% (30%), dealer 30% (30%), gunrunner 10% (20%) | yes |
| 2 | Each style wins between 0.5x and 1.5x its share of seats | reckless 23% (15%), safe 0% (10%), show-off 3% (10%), lowkey 0% (5%), ride-or-die 0% (10%), snake 10% (10%), mid 63% (52%) | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 32%; overall top action move 24% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.31x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 2.8, worst 4, 77% of seasons; any moment: mean 2.47, worst 4 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 12.47 |
| Share of acting hours that involve another agent | 43% |
| Unique pairs that interacted | 37.07 of 45 |
| Fewest partners any agent had | 5.5 |
| Rivalries (pairs with 3+ hostile interactions) | 10.93 |
| Alliances (pairs with 2+ friendly interactions) | 6.2 |
| Interactions by kind | friendly 28.8, hostile 81.2, rival 34.43, talk 28.73, trade 13.87 |
| Messages sent / answered | 44.53 / 16.3 |
| Promises made / kept / broken | 10.03 / 3.37 / 6.67 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 34.9 / 39.03 / 8.27 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 104.4 |
| Lead changes per season | 3.7 |
| Seasons with a king attempt | 40% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 34% |
| Turtle | not in lineup |
| Copycat: mean share of the most common action per hour | 32% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.71 |

**Moments by type (per season):** revenge 25.37, arrest 22.43, callout_answered 9.1, promise_broken 6.67, callout_ducked 4.57, eviction 4.3, bank_job_fail 4, lead_change 3.7, shooting 3.4, promise_kept 3.37, escape 3.23, bounty_posted 2.77, comeback 2.77, bounty_revealed 2.4, bounty_collected 2.2, party 1.3, bank_job_win 1.23, drive_by 0.43, king_attempt 0.4, crate_brawl 0.3, king_killed 0.23, revive 0.23

**Wins by job:** smuggler 17%, chemist 43%, dealer 30%, gunrunner 10%

**Wins by character type:** greedy 63%, hothead 20%, hustler 3%, saint 0%, showboat 3%, snake 10%

**Wins by style** (share of seats in brackets; an agent can wear two labels, mid = none): reckless 23% (15%), safe 0% (10%), show-off 3% (10%), lowkey 0% (5%), ride-or-die 0% (10%), snake 10% (10%), mid 63% (52%)

**Action mix:** move 24%, battle 11%, buy 8%, call_out 7%, crip_walk 7%, rest 5%, mug 4%, run 4%, fistfight 3%, pickpocket 3%, cook 3%, deal 3%, lay_low 2%, steal_car 2%, push_npc 2%, scout 2%, crate 2%, build 1%, party 1%, bank_job 1%, run_cops 1%, shift 1%, shoot 1%, drip_check 1%, bounty 1%, kill_king 0%, drive_by 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 2,108,296 |
| Audience pool: start → end | 1000 → 1305.15 (1.31x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 2.8, worst 4 |
| Longest dull stretch (no moment of any kind) | mean 2.47, worst 4 |

**Audience curve** (whole pool, every 6 acting hours): 996 → 1035 → 1055 → 1083 → 1123 → 1159 → 1193 → 1232 → 1270 → 1305

**Watching curve** (viewers assigned to agents, every 6 acting hours): 81 → 596 → 597 → 650 → 638 → 668 → 728 → 715 → 762 → 801

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 4208 |
| a02 | Kim | hustler | 3090 |
| a03 | Penny | showboat | 3475 |
| a04 | Dutch | snake | 3753 |
| a05 | Moss | saint | 1875 |
| a06 | Juno | greedy | 3580 |
| a07 | Rook | greedy | 3805 |
| a08 | Tally | greedy | 3745 |
| a09 | Sable | greedy | 3924 |
| a10 | Wren | greedy | 3684 |

By brain: greedy 3748, hothead 4208, hustler 3090, saint 1875, showboat 3475, snake 3753. By job: chemist 3570, dealer 3581, gunrunner 3255, smuggler 3588.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 18.67, parts smuggled 21.53, product cooked 33.6, product dealt 32.53 ($803.93), guns built 5.6, guns sold to agents 0.3 / to NPC 1.7 |
| Mean cash at the end of each day | day 1: $96, day 2: $73, day 3: $95 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 13.8 / 4.3 (1.9) / 0.2 / 1.97 |
| Gear bought or taken | car 3.83, chain 0.03, gun 4.7 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 22.43 / 17% / 2% / 0.23 |
| Board prices (agent-to-agent mean) | chems $9.17, parts $20.8, product $14.93, guns $109.29 |

