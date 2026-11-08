# hotkey mini report: ai-s1

1 season · lineup `ai5` · seeds 1–1 · systems off: none · config bf6545d6 · AI: live (claude-sonnet-5-5 (claude, high), claude-sonnet-5-5 (claude, high), claude-haiku-5-5 (claude, xhigh), openai/gpt-6.1-sol (openrouter), moonshotai/kimi-k3.1-pro (openrouter))

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 50% | yes |
| 1 | Every agent interacts with at least 4 others per season | 100% of seasons (mean fewest partners 7) | yes |
| 1 | At least 2 rivalries per season | mean 16; 100% of seasons | yes |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 100% of seasons; lead change in 100% of seasons | yes |
| 2 | At least 1 king attempt in most seasons | 100% of seasons | yes |
| 2 | Top agent finishes top third again in 50-70% of seeds | 0% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | no turtle in this lineup | n/a |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 0% (20%), chemist 0% (30%), dealer 100% (30%), gunrunner 0% (20%) | **no** |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 29%; overall top action move 19% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.22x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 2, worst 2, 100% of seasons; any moment: mean 2, worst 2 | yes |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 16.27 |
| Share of acting hours that involve another agent | 50% |
| Unique pairs that interacted | 43 of 45 |
| Fewest partners any agent had | 7 |
| Rivalries (pairs with 3+ hostile interactions) | 16 |
| Alliances (pairs with 2+ friendly interactions) | 3 |
| Interactions by kind | friendly 23, hostile 108, rival 49, talk 53, trade 11 |
| Messages sent / answered | 71 / 25 |
| Promises made / kept / broken | 12 / 4 / 8 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 28 / 52 / 23 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 106 |
| Lead changes per season | 2 |
| Seasons with a king attempt | 100% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 0% |
| Turtle | not in lineup |
| Copycat: mean share of the most common action per hour | 29% |
| Copycat: mean pairwise similarity of greedy action mixes | n/a (under 2 greedy seats) |

**Moments by type (per season):** revenge 28, callout_ducked 22, arrest 21, promise_broken 8, callout_answered 6, promise_kept 4, comeback 3, eviction 3, shooting 3, bounty_posted 2, escape 2, lead_change 2, bounty_revealed 1, king_attempt 1

**Wins by job:** smuggler 0%, chemist 0%, dealer 100%, gunrunner 0%

**Wins by character type:** ai:claude-haiku-5-5 0%, ai:claude-sonnet-5-5 0%, ai:moonshotai/kimi-k3.1-pro 0%, ai:openai/gpt-6.1-sol 100%, hothead 0%, hustler 0%, saint 0%, showboat 0%, snake 0%

**Action mix:** move 19%, battle 14%, call_out 11%, crip_walk 9%, buy 8%, rest 8%, mug 6%, fistfight 5%, cook 5%, pickpocket 2%, deal 2%, push_npc 2%, drip_check 2%, run_cops 1%, shift 1%, run 1%, lay_low 1%, build 1%, kill_king 1%, shoot 1%, scout 1%, party 0%, bounty 0%, steal_car 0%, crate 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,880,700 |
| Audience pool: start → end | 1000 → 1217.49 (1.22x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 2, worst 2 |
| Longest dull stretch (no moment of any kind) | mean 2, worst 2 |

**Audience curve** (whole pool, every 6 acting hours): 994 → 1001 → 1049 → 1060 → 1103 → 1090 → 1095 → 1128 → 1169 → 1217

**Watching curve** (viewers assigned to agents, every 6 acting hours): 45 → 429 → 704 → 600 → 584 → 426 → 536 → 630 → 657 → 864

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 3151 |
| a02 | Kim | hustler | 2720 |
| a03 | Penny | showboat | 2493 |
| a04 | Dutch | snake | 3687 |
| a05 | Moss | saint | 1561 |
| a06 | Juno | ai:claude-sonnet-5-5 | 1922 |
| a07 | Rook | ai:claude-sonnet-5-5 | 3273 |
| a08 | Tally | ai:claude-haiku-5-5 | 2875 |
| a09 | Sable | ai:openai/gpt-6.1-sol | 4866 |
| a10 | Wren | ai:moonshotai/kimi-k3.1-pro | 4797 |

By brain: ai:claude-haiku-5-5 2875, ai:claude-sonnet-5-5 2598, ai:moonshotai/kimi-k3.1-pro 4797, ai:openai/gpt-6.1-sol 4866, hothead 3151, hustler 2720, saint 1561, showboat 2493, snake 3687. By job: chemist 2961, dealer 4179, gunrunner 2027, smuggler 2936.

**Play-by-plays:** [seed 1](1/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 0, parts smuggled 8, product cooked 63, product dealt 29 ($725), guns built 3, guns sold to agents 0 / to NPC 1 |
| Mean cash at the end of each day | day 1: $47, day 2: $34, day 3: $32 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 15 / 3 (2) / 0 / 3 |
| Gear bought or taken | grill 2, gun 3 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 21 / 16% / 1% / 0 |
| Board prices (agent-to-agent mean) | chems no trades, parts $20, product $13.42, guns no trades |

## AI runs

| Model | Calls | Failed | Tokens in | Tokens out | Cost | Capped turns |
|---|---|---|---|---|---|---|
| claude-sonnet-5-5 | 108 | 0 | 611304 | 41083 | $1.0956 | 0 |
| claude-haiku-5-5 | 54 | 5 | 294643 | 350114 | $0.1918 | 0 |
| openai/gpt-6.1-sol | 54 | 0 | 218903 | 5551 | $0.3559 | 0 |
| moonshotai/kimi-k3.1-pro | 54 | 12 | 227391 | 15265 | $0.3992 | 0 |

Run not capped. Spend: $2.0424 over 270 calls.

**Each AI seat vs its bot-twin seat (same seed):**

| Seed | Seat | Model | Job | AI viewer-h | Twin viewer-h | AI interactions | Twin interactions | AI moments | Twin moments | AI place | Twin place | AI failed turns |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | a06 | claude-sonnet-5-5 | chemist | 1922 | 2757 | 42 | 19 | 12 | 6 | 9 | 8 | 0 |
| 1 | a07 | claude-sonnet-5-5 | chemist | 3273 | 5432 | 36 | 49 | 6 | 32 | 4 | 2 | 0 |
| 1 | a08 | claude-haiku-5-5 | dealer | 2875 | 3482 | 45 | 27 | 15 | 16 | 6 | 6 | 5 |
| 1 | a09 | openai/gpt-6.1-sol | dealer | 4866 | 2759 | 59 | 28 | 34 | 16 | 1 | 7 | 0 |
| 1 | a10 | moonshotai/kimi-k3.1-pro | dealer | 4797 | 3986 | 72 | 14 | 34 | 23 | 2 | 4 | 12 |

