# hotkey mini report: r3-a-greedy-no-duckWalkAway

30 seasons · lineup `all-greedy` · seeds 1–30 · systems off: duckWalkAway · config 0df511de

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 31% | **no** |
| 1 | Every agent interacts with at least 4 others per season | 90% of seasons (mean fewest partners 4.43) | **no** |
| 1 | At least 2 rivalries per season | mean 5.27; 93% of seasons | **no** |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 0% of seasons; lead change in 93% of seasons | **no** |
| 2 | At least 1 king attempt in most seasons | 0% of seasons | **no** |
| 2 | Top agent finishes top third again in 50-70% of seeds | 29% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | no turtle in this lineup | n/a |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 30% (20%), chemist 23% (30%), dealer 43% (30%), gunrunner 3% (20%) | **no** |
| 2 | Each style wins between 0.5x and 1.5x its share of seats | mid 100% (100%) | yes |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 35%; overall top action move 25% | yes |
| 3 | The audience ends the season at least as big as it started | end/start 1.22x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 4.97, worst 7, 0% of seasons; any moment: mean 3.5, worst 6 | **no** |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 7.54 |
| Share of acting hours that involve another agent | 31% |
| Unique pairs that interacted | 33.37 of 45 |
| Fewest partners any agent had | 4.43 |
| Rivalries (pairs with 3+ hostile interactions) | 5.27 |
| Alliances (pairs with 2+ friendly interactions) | 3.5 |
| Interactions by kind | friendly 17.3, hostile 50.3, rival 27.6, trade 17.97 |
| Messages sent / answered | 0 / 0 |
| Promises made / kept / broken | 0 / 0 / 0 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 45.8 / 53.33 / 10.13 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 76.17 |
| Lead changes per season | 4.8 |
| Seasons with a king attempt | 0% |
| Seasons with a betrayal (broken promise) | 0% |
| Top-third repeat rate (target 50-70%) | 29% |
| Turtle | not in lineup |
| Copycat: mean share of the most common action per hour | 35% |
| Copycat: mean pairwise similarity of greedy action mixes | 0.7 |

**Moments by type (per season):** arrest 19.63, callout_answered 11.47, revenge 10.1, bank_job_fail 8.27, lead_change 4.8, eviction 4.27, escape 4.03, bank_job_win 3.17, callout_ducked 3.1, comeback 2.8, party 2.77, crate_brawl 1.6, shooting 0.17

**Wins by job:** smuggler 30%, chemist 23%, dealer 43%, gunrunner 3%

**Wins by character type:** greedy 100%

**Wins by style** (share of seats in brackets; an agent can wear two labels, mid = none): mid 100% (100%)

**Action mix:** move 25%, buy 11%, battle 9%, crip_walk 8%, call_out 7%, rest 5%, run 5%, scout 4%, deal 3%, pickpocket 3%, cook 3%, crate 3%, bank_job 3%, party 2%, build 2%, lay_low 2%, steal_car 2%, run_cops 1%, drip_check 1%, push_npc 1%, fistfight 0%, mug 0%, shift 0%, shoot 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,902,496 |
| Audience pool: start → end | 1000 → 1223.28 (1.22x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 4.97, worst 7 |
| Longest dull stretch (no moment of any kind) | mean 3.5, worst 6 |

**Audience curve** (whole pool, every 6 acting hours): 995 → 987 → 1007 → 1023 → 1053 → 1088 → 1110 → 1154 → 1196 → 1223

**Watching curve** (viewers assigned to agents, every 6 acting hours): 68 → 403 → 564 → 543 → 582 → 669 → 619 → 680 → 748 → 735

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | greedy | 3429 |
| a02 | Kim | greedy | 3332 |
| a03 | Penny | greedy | 3200 |
| a04 | Dutch | greedy | 3180 |
| a05 | Moss | greedy | 2996 |
| a06 | Juno | greedy | 3314 |
| a07 | Rook | greedy | 2991 |
| a08 | Tally | greedy | 3041 |
| a09 | Sable | greedy | 3133 |
| a10 | Wren | greedy | 3093 |

By brain: greedy 3171. By job: chemist 3253, dealer 3287, gunrunner 2775, smuggler 3269.

**Play-by-plays:** [seed 1](1/play-by-play.md) · [seed 2](2/play-by-play.md) · [seed 3](3/play-by-play.md) · [seed 4](4/play-by-play.md) · [seed 5](5/play-by-play.md) · [seed 6](6/play-by-play.md) · [seed 7](7/play-by-play.md) · [seed 8](8/play-by-play.md) · [seed 9](9/play-by-play.md) · [seed 10](10/play-by-play.md) · [seed 11](11/play-by-play.md) · [seed 12](12/play-by-play.md) · [seed 13](13/play-by-play.md) · [seed 14](14/play-by-play.md) · [seed 15](15/play-by-play.md) · [seed 16](16/play-by-play.md) · [seed 17](17/play-by-play.md) · [seed 18](18/play-by-play.md) · [seed 19](19/play-by-play.md) · [seed 20](20/play-by-play.md) · [seed 21](21/play-by-play.md) · [seed 22](22/play-by-play.md) · [seed 23](23/play-by-play.md) · [seed 24](24/play-by-play.md) · [seed 25](25/play-by-play.md) · [seed 26](26/play-by-play.md) · [seed 27](27/play-by-play.md) · [seed 28](28/play-by-play.md) · [seed 29](29/play-by-play.md) · [seed 30](30/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 33.73, parts smuggled 23.8, product cooked 35.4, product dealt 45.7 ($1107.3), guns built 9.7, guns sold to agents 0.1 / to NPC 4.1 |
| Mean cash at the end of each day | day 1: $102, day 2: $108, day 3: $145 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 13.37 / 4.27 (2.37) / 0.53 / 2.33 |
| Gear bought or taken | car 4, gun 6.97 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 19.63 / 15% / 0% / 0 |
| Board prices (agent-to-agent mean) | chems $9.11, parts $20.08, product $15.67, guns $96.33 |

