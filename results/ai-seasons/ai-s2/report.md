# hotkey mini report: ai-s2

1 season · lineup `ai5` · seeds 1–1 · systems off: none · config 48e5c80a · AI: live (claude-sonnet-5-5 (claude, high), claude-sonnet-5-5 (claude, high), claude-haiku-5-5 (claude, xhigh), openai/gpt-6.1-sol (openrouter), moonshotai/kimi-k3.1-pro (openrouter))

## Marks (TUNING.md)

| Q | Mark | Value | Pass |
|---|---|---|---|
| 1 | At least 40% of acting hours involve another agent | 51% | yes |
| 1 | Every agent interacts with at least 4 others per season | 100% of seasons (mean fewest partners 6) | yes |
| 1 | At least 2 rivalries per season | mean 14; 100% of seasons | yes |
| 2 | At least 1 broken promise per season, and a lead change in most seasons | broken promise in 100% of seasons; lead change in 100% of seasons | yes |
| 2 | At least 1 king attempt in most seasons | 100% of seasons | yes |
| 2 | Top agent finishes top third again in 50-70% of seeds | 0% | **no** |
| 2 | Turtle finishes in the bottom third in at least 80% of seeds | no turtle in this lineup | n/a |
| 2 | Each job wins between 0.5x and 1.5x its share of seats | smuggler 0% (20%), chemist 0% (30%), dealer 100% (30%), gunrunner 0% (20%) | **no** |
| 2 | Each style wins between 0.5x and 1.5x its share of seats | reckless 100% (40%), safe 0% (20%), show-off 0% (20%), lowkey 0% (10%), ride-or-die 100% (30%), snake 0% (20%), mid 0% (10%) | n/a |
| 2 | Copycat: most common action takes 40% or less of acting hours (all-greedy lineup) | top share per hour 31%; overall top action move 24% | n/a |
| 3 | The audience ends the season at least as big as it started | end/start 1.23x; 100% of seasons | yes |
| 3 | Longest dull stretch is 3 acting hours or less | strong moments only: mean 3, worst 3, 100% of seasons; any moment: mean 2, worst 2 | yes |

## 1. Are they interacting?

| Metric | Per season (mean) |
|---|---|
| Interactions per agent per day | 17.53 |
| Share of acting hours that involve another agent | 51% |
| Unique pairs that interacted | 40 of 45 |
| Fewest partners any agent had | 6 |
| Rivalries (pairs with 3+ hostile interactions) | 14 |
| Alliances (pairs with 2+ friendly interactions) | 5 |
| Interactions by kind | friendly 29, hostile 79, rival 37, talk 104, trade 14 |
| Messages sent / answered | 126 / 75 |
| Promises made / kept / broken | 15 / 3 / 12 |
| Board trades agent-to-agent / bought from NPC / sold to NPC | 34 / 52 / 30 |

## 2. Is anything interesting happening?

| Metric | Value |
|---|---|
| Moments per season | 91 |
| Lead changes per season | 2 |
| Seasons with a king attempt | 100% |
| Seasons with a betrayal (broken promise) | 100% |
| Top-third repeat rate (target 50-70%) | 0% |
| Turtle | not in lineup |
| Copycat: mean share of the most common action per hour | 31% |
| Copycat: mean pairwise similarity of greedy action mixes | n/a (under 2 greedy seats) |

**Moments by type (per season):** arrest 20, revenge 19, promise_broken 12, shooting 7, callout_answered 5, callout_ducked 5, bounty_posted 3, drive_by 3, promise_kept 3, bounty_collected 2, bounty_revealed 2, escape 2, eviction 2, king_killed 2, lead_change 2, comeback 1, revive 1

**Wins by job:** smuggler 0%, chemist 0%, dealer 100%, gunrunner 0%

**Wins by character type:** ai:claude-haiku-5-5 0%, ai:claude-sonnet-5-5 0%, ai:moonshotai/kimi-k3.1-pro 0%, ai:openai/gpt-6.1-sol 100%, hothead 0%, hustler 0%, saint 0%, showboat 0%, snake 0%

**Wins by style** (share of seats in brackets; an agent can wear two labels, mid = none): reckless 100% (40%), safe 0% (20%), show-off 0% (20%), lowkey 0% (10%), ride-or-die 100% (30%), snake 0% (20%), mid 0% (10%)

**Action mix:** move 24%, battle 13%, buy 8%, crip_walk 8%, rest 6%, cook 5%, call_out 5%, mug 5%, fistfight 4%, run 3%, lay_low 3%, pickpocket 2%, deal 2%, shoot 2%, steal_car 1%, shift 1%, build 1%, push_npc 1%, kill_king 1%, party 1%, bounty 1%, crate 1%, drive_by 1%, run_cops 0%, drip_check 0%

## 3. Would people watch?

| Metric | Value |
|---|---|
| Minutes watched per season (viewer-hours × 60) | 1,938,720 |
| Audience pool: start → end | 1000 → 1229.99 (1.23x; growing in 100% of seasons) |
| Longest dull stretch (no strong moment: lead changes, comebacks and ducked call-outs don't count) | mean 3, worst 3 |
| Longest dull stretch (no moment of any kind) | mean 2, worst 2 |

**Audience curve** (whole pool, every 6 acting hours): 1005 → 1017 → 1039 → 1049 → 1077 → 1105 → 1106 → 1163 → 1187 → 1230

**Watching curve** (viewers assigned to agents, every 6 acting hours): 185 → 509 → 473 → 503 → 647 → 746 → 511 → 804 → 812 → 834

**Viewer-hours per agent (mean per season):**

| Seat | Name | Brain | Viewer-hours |
|---|---|---|---|
| a01 | Vex | hothead | 4733 |
| a02 | Kim | hustler | 1660 |
| a03 | Penny | showboat | 2633 |
| a04 | Dutch | snake | 4419 |
| a05 | Moss | saint | 2007 |
| a06 | Juno | ai:claude-sonnet-5-5 | 2919 |
| a07 | Rook | ai:claude-sonnet-5-5 | 864 |
| a08 | Tally | ai:claude-haiku-5-5 | 4142 |
| a09 | Sable | ai:openai/gpt-6.1-sol | 4956 |
| a10 | Wren | ai:moonshotai/kimi-k3.1-pro | 3979 |

By brain: ai:claude-haiku-5-5 4142, ai:claude-sonnet-5-5 1892, ai:moonshotai/kimi-k3.1-pro 3979, ai:openai/gpt-6.1-sol 4956, hothead 4733, hustler 1660, saint 2007, showboat 2633, snake 4419. By job: chemist 2734, dealer 4359, gunrunner 2320, smuggler 3197.

**Play-by-plays:** [seed 1](1/play-by-play.md)

## Economy health

| Metric | Per season (mean) |
|---|---|
| Chain flow | chems smuggled 8, parts smuggled 18, product cooked 69, product dealt 26 ($650), guns built 5, guns sold to agents 1 / to NPC 3 |
| Mean cash at the end of each day | day 1: $84, day 2: $44, day 3: $54 |
| Rent paid / evictions (day 1) / re-housed / night thefts | 16 / 2 (1) / 0 / 3 |
| Gear bought or taken | car 4, grill 1, gun 4 |
| Seasons where a gun entered play | 100% |
| Arrests / share of agent-hours in jail / in hospital / deaths | 20 / 13% / 4% / 2 |
| Board prices (agent-to-agent mean) | chems $9, parts $21, product $14.29, guns $111 |

## AI runs

| Model | Calls | Failed | Tokens in | Tokens out | Cost | Capped turns |
|---|---|---|---|---|---|---|
| claude-sonnet-5-5 | 108 | 2 | 641278 | 44176 | $1.144 | 0 |
| claude-haiku-5-5 | 42 | 0 | 234351 | 194084 | $0.1098 | 0 |
| openai/gpt-6.1-sol | 43 | 0 | 177082 | 5025 | $0.2807 | 0 |
| moonshotai/kimi-k3.1-pro | 54 | 0 | 232477 | 21454 | $0.5706 | 0 |

Run not capped. Spend: $2.1051 over 247 calls.

**Each AI seat vs its bot-twin seat (same seed):**

| Seed | Seat | Model | Job | AI viewer-h | Twin viewer-h | AI interactions | Twin interactions | AI moments | Twin moments | AI place | Twin place | AI failed turns |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | a06 | claude-sonnet-5-5 | chemist | 2919 | 2741 | 41 | 14 | 12 | 20 | 6 | 8 | 1 |
| 1 | a07 | claude-sonnet-5-5 | chemist | 864 | 3744 | 34 | 57 | 2 | 34 | 10 | 4 | 1 |
| 1 | a08 | claude-haiku-5-5 | dealer | 4142 | 4539 | 43 | 37 | 12 | 5 | 4 | 2 | 0 |
| 1 | a09 | openai/gpt-6.1-sol | dealer | 4956 | 3034 | 61 | 23 | 18 | 7 | 1 | 7 | 0 |
| 1 | a10 | moonshotai/kimi-k3.1-pro | dealer | 3979 | 3824 | 74 | 16 | 26 | 22 | 5 | 3 | 0 |

**Styles in play** (did the owner's setting change what the agent did?):

| Seed | Seat | Name | Brain | Style | Risk / clout / loyalty | Risk moves | Clout moves | Gear bought | Promises made / kept / broken |
|---|---|---|---|---|---|---|---|---|---|
| 1 | a01 | Vex | hothead | reckless | 0.95 / 0.47 / 0.45 | 14 | 3 | gun 1 | 0 / 0 / 0 |
| 1 | a02 | Kim | hustler | reckless, lowkey | 0.80 / 0.28 / 0.42 | 5 | 1 | gun 1 | 3 / 0 / 3 |
| 1 | a03 | Penny | showboat | show-off | 0.43 / 0.90 / 0.63 | 2 | 24 | none | 0 / 0 / 0 |
| 1 | a04 | Dutch | snake | snake | 0.53 / 0.44 / 0.27 | 20 | 3 | gun 1 | 10 / 1 / 9 |
| 1 | a05 | Moss | saint | safe, ride-or-die | 0.18 / 0.57 / 0.87 | 0 | 28 | none | 2 / 2 / 0 |
| 1 | a06 | Juno | ai:claude-sonnet-5-5 | reckless, snake | 0.95 / 0.50 / 0.05 | 6 | 12 | none | 0 / 0 / 0 |
| 1 | a07 | Rook | ai:claude-sonnet-5-5 | safe, ride-or-die | 0.05 / 0.50 / 0.95 | 2 | 11 | none | 0 / 0 / 0 |
| 1 | a08 | Tally | ai:claude-haiku-5-5 | show-off | 0.50 / 0.95 / 0.50 | 4 | 11 | none | 0 / 0 / 0 |
| 1 | a09 | Sable | ai:openai/gpt-6.1-sol | reckless, ride-or-die | 0.90 / 0.50 / 0.90 | 13 | 8 | grill 1, gun 1 | 0 / 0 / 0 |
| 1 | a10 | Wren | ai:moonshotai/kimi-k3.1-pro | mid | 0.50 / 0.50 / 0.50 | 8 | 13 | none | 0 / 0 / 0 |

