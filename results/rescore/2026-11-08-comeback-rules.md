# Comeback rules: the same seasons rescored under each candidate win rule

1. None of the rules we could rescore gives early strugglers a real way back. Across 500 bot seasons, an agent in trouble on day 1 wins 5–9% of the time under every rule, and a random agent would win 10%. Daily episodes (C), the picked rule, leaves it at 5%, the same as today.
2. C keeps day 1 meaningful, and in fact more than today: the day-1 leader takes the season 35–40% of the time under C, against 29–33% today. That is the opposite of a comeback, because a big day banks 5 points the same way it banks viewer-hours.
3. C does not stop dead or jailed winners. In ai-s2, Sable still wins under C (3 + 5 points, none on day 3, dead for the last 12 hours). Bot winners sat dead or in jail through the last 3 hours in 5–15% of seasons under C, against 7–16% today.
4. Doubling the last day (B2) is the gentlest change that fixes ai-s2 (Vex wins). It changes 16–23% of winners, opens the last day a little (the leader at its start loses in 51–64% of seasons, against 37–50%) and keeps day 1 alive (its leader wins 18–29%). It doesn't help early losers much either (6–7% wins).
5. Only a steep "recent hours" rule (D, 9-hour half-life) moves comebacks toward chance (7–9% wins). The cost: 40–47% of winners change and day 1 barely counts (its leader wins 7–15%). Our reading, not a measurement: a real way back probably needs a change to play, like the comeback moment, which can't be rescored.

## What was measured, and how

Every season was played once under today's rules. Each rule rescores the same hourly feed, so play is identical across rules and only the scoring differs. Hourly viewers are the step in `meters.viewerHours`. The ai-s1 feed predates that field, so its rounded `meters.viewers` are summed instead. Under rule A, the winner the tool computes matches the saved standings in all 502 seasons, and the known facts check out: under A, Sable wins ai-s2 while dead, and under B2, Vex wins it.

- **Rules:**
  - **A**, today: total viewer-hours.
  - **B1**: days weighted ×1, ×2, ×3.
  - **B2**: the last day ×2.
  - **C**: each day ranked by that day's viewer-hours, with 5/3/1 points for the top three. The most points wins, and ties go to total viewer-hours.
  - **D18** and **D9**: each hour weighted 0.5^(age/H), where age is acting hours before the season's last hour.
- **The fifth idea, the comeback moment**, makes a revived agent return to a rush of viewers. That changes play, so it can't be rescored, and it is skipped.
- **Day-1 trouble:** dead or jailed for 6+ of day 1's acting hours, or bottom 3 by raw viewer-hours at the end of day 1. The same agents count as in trouble under every rule. "Held 6+ h" is the dead-or-jailed subset. "Killed day 1" means any dead hour on day 1.
- **Day-3 start leader loses:** the leader under the rule's own running score after day 2 doesn't win.
  - **Lead changes, day 3:** the hours on day 3 when that running leader changes.
  - For C, the running score counts day 3 as if it ended that hour, which is a live table.
  - D's ranking at any hour doesn't depend on the reference hour.
- **Dead/jailed winner:** the winner was dead or in jail for each of the season's last 3+ acting hours. The "dead" figure counts dead only.
- **Top score tied:** the top two had equal scores, so the tiebreak (total viewer-hours) picked the winner. Apart from 1% of styles seasons under B1, this only happens under C.
- **Day-1 leader wins:** the agent with the most viewer-hours on day 1 takes the season. This was added as the measure of whether day 1 still matters.
- **Balance:** win share next to seat share. A cell is **bold** when a group wins at least 2× its seat share, on 5+ wins. Jobs are shuffled per seed, so job and character are not tied to a seat.

## Key table: default lineup (200 seeds) and the two AI seasons

| Rule | Winner flips vs A | Trouble → top 3 / win | Day-3 start leader loses | Lead changes, day 3 | Winner dead/jailed last 3+ h | Day-1 leader wins | ai-s1 winner | ai-s2 winner |
|---|---|---|---|---|---|---|---|---|
| A | 0% | 16% / 5% | 50% | 0.93 | 12% (dead 2%) | 33% | Sable | Sable (dead) |
| B1 | 20% | 18% / 6% | 56% | 1.07 | 11% (dead 2%) | 20% | Sable | Vex |
| B2 | 16% | 18% / 6% | 61% | 1.25 | 13% (dead 1%) | 24% | Sable | Vex |
| C | 27% | 18% / 5% | 45% | 1.67 | 14% (dead 3%) | 40% | Sable | Sable (dead) |
| D18 | 30% | 20% / 6% | 62% | 1.31 | 9% (dead 1%) | 16% | Sable | Vex |
| D9 | 40% | 21% / 7% | 69% | 1.78 | 9% (dead 0%) | 15% | Sable | Dutch |

## Findings worth knowing

- **Being jailed or killed on day 1 is not the handicap it looks like.**
  - Agents held 6+ hours on day 1 finish top 3 in 36–41% of cases under A, above the 30% chance level.
  - They are the aggressive players: in the default lineup the 217 are hothead, greedy, hustler and snake, with showboat once.
  - The real strugglers are the bottom 3 at the end of day 1. They are mostly turtle, greedy and saint seats (default: turtle 187, greedy 188, saint 129 of 600 bottom-3 slots).
  - So in the mixed lineups, comeback power partly measures bot skill. The all-greedy and styles lineups are the fairer test, and they show the same picture.
- **An early death is too rare in bot play to measure.**
  - 9 day-1 kills in 200 default seasons, 5 in 100 ai5 seasons, and none in all-greedy or styles.
  - None of those 14 killed agents won under any rule. C put 2 of 9 (default) and 2 of 5 (ai5) in the top 3. A put 1 of 9 and 0 of 5 there.
- **Under C, today's rule still decides 8–22% of bot seasons**, because the top points are tied and total viewer-hours breaks the tie.
- **C's higher lead-change count overstates suspense.** Its live table swings early on day 3, when one hour of day-3 viewers sets the provisional points. The leader at the start of day 3 actually holds on more often under C (it loses 38–45% of the time) than under A (37–50%) or B2 (51–64%).
- **Balance:** no candidate rule creates a hard tilt.
  - The only flag is today's rule A: hothead wins 22% of default seasons from 10% of seats (×2.1). B2 and C keep it at 19–20%, and D brings it down to 14–15%.
  - D pushes wins further toward greedy seats (default 62% → 71%, ai5 71% → 79%).
  - Saint and turtle win 0–2% under every rule.
  - In the styles lineup, C slightly evens things out (safe 26% → 21%).
- **Limits:**
  - Rescoring holds play fixed. Players told a new rule, especially AIs, would play differently, and bots don't read the rule at all.
  - Two AI seasons are anecdotes, not rates.

## Tables (output of `tools/rescore.mjs`)

Rules: A: total viewer-hours (today); B1: days ×1, ×2, ×3; B2: last day ×2; C: daily episodes, 5/3/1 points; D: recent hours, half-life 18 h; D: recent hours, half-life 9 h. In trouble on day 1: dead or jailed 6+ acting hours of day 1, or bottom 3 by viewer-hours at its end.

### results/ai-seasons/ai-s1/1, lineup ai5

Day-1 leader by viewer-hours: Wren. Day-1 trouble: Kim (held 7 h), Moss (bottom 3), Juno (bottom 3).

| Rule | Winner | Differs from A | Winner dead/jailed last 3+ h | Day-3 start leader | Leader at start wins | Lead changes, day 3 | Day-1 trouble finishes |
|---|---|---|---|---|---|---|---|
| A: total viewer-hours (today) | Sable (dealer, gpt-6.1-sol) | no | no | Wren | no | 1 | Kim 7th, Moss 10th, Juno 9th |
| B1: days ×1, ×2, ×3 | Sable (dealer, gpt-6.1-sol) | no | no | Wren | no | 1 | Kim 7th, Moss 10th, Juno 9th |
| B2: last day ×2 | Sable (dealer, gpt-6.1-sol) | no | no | Wren | no | 1 | Kim 7th, Moss 10th, Juno 9th |
| C: daily episodes, 5/3/1 points | Sable (dealer, gpt-6.1-sol) | no | no | Wren | no | 1 | Kim 7th, Moss 10th, Juno 9th |
| D: recent hours, half-life 18 h | Sable (dealer, gpt-6.1-sol) | no | no | Sable | yes | 0 | Kim 8th, Moss 10th, Juno 9th |
| D: recent hours, half-life 9 h | Sable (dealer, gpt-6.1-sol) | no | no | Sable | yes | 2 | Kim 9th, Moss 10th, Juno 7th |

### results/ai-seasons/ai-s2/1, lineup ai5

Day-1 leader by viewer-hours: Tally. Day-1 trouble: Moss (bottom 3), Juno (bottom 3), Rook (bottom 3).

| Rule | Winner | Differs from A | Winner dead/jailed last 3+ h | Day-3 start leader | Leader at start wins | Lead changes, day 3 | Day-1 trouble finishes |
|---|---|---|---|---|---|---|---|
| A: total viewer-hours (today) | Sable (dealer, gpt-6.1-sol) | no | **yes** | Sable | yes | 0 | Moss 8th, Juno 6th, Rook 10th |
| B1: days ×1, ×2, ×3 | Vex (smuggler, hothead) | **yes** | no | Sable | no | 1 | Moss 8th, Juno 6th, Rook 10th |
| B2: last day ×2 | Vex (smuggler, hothead) | **yes** | no | Sable | no | 1 | Moss 8th, Juno 6th, Rook 10th |
| C: daily episodes, 5/3/1 points | Sable (dealer, gpt-6.1-sol) | no | **yes** | Sable | yes | 0 | Moss 8th, Juno 6th, Rook 10th |
| D: recent hours, half-life 18 h | Vex (smuggler, hothead) | **yes** | no | Sable | no | 1 | Moss 8th, Juno 6th, Rook 10th |
| D: recent hours, half-life 9 h | Dutch (chemist, snake) | **yes** | no | Sable | no | 4 | Moss 8th, Juno 4th, Rook 9th |

### out/rescore-default, lineup default

200 seasons. Day-1 trouble: 800 agents (4.0 a season), 217 of them dead or jailed 6+ h on day 1. Killed on day 1: 9 agents. Chance level for one agent of 10: top 3 30%, win 10%.

| Rule | Winner flips vs A | Trouble → top 3 | Trouble → win | Held 6+ h → top 3 / win | Killed day 1 → top 3 / win | Day-3 start leader loses | Lead changes, day 3 | Winner dead/jailed last 3+ h | Top score tied (tiebreak decides) | Day-1 leader wins |
|---|---|---|---|---|---|---|---|---|---|---|
| A: total viewer-hours (today) | 0% | 16% | 5% | 41% / 13% | 1 / 0 of 9 | 50% | 0.93 | 12% (dead 2%) | 0% | 33% |
| B1: days ×1, ×2, ×3 | 20% | 18% | 6% | 37% / 12% | 0 / 0 of 9 | 56% | 1.07 | 11% (dead 2%) | 0% | 20% |
| B2: last day ×2 | 16% | 18% | 6% | 39% / 13% | 0 / 0 of 9 | 61% | 1.25 | 13% (dead 1%) | 0% | 24% |
| C: daily episodes, 5/3/1 points | 27% | 18% | 5% | 38% / 9% | 2 / 0 of 9 | 45% | 1.67 | 14% (dead 3%) | 12% | 40% |
| D: recent hours, half-life 18 h | 30% | 20% | 6% | 39% / 11% | 0 / 0 of 9 | 62% | 1.31 | 9% (dead 1%) | 0% | 16% |
| D: recent hours, half-life 9 h | 40% | 21% | 7% | 39% / 12% | 1 / 0 of 9 | 69% | 1.78 | 9% (dead 0%) | 0% | 15% |

Wins by job (win share, ×seat share; **bold** = at least 2× its seat share on 5+ wins):

| Job | Seat share | A | B1 | B2 | C | D18 | D9 |
|---|---|---|---|---|---|---|---|
| chemist | 30% | 40% (×1.3) | 40% (×1.3) | 41% (×1.4) | 40% (×1.3) | 39% (×1.3) | 38% (×1.3) |
| dealer | 30% | 29% (×0.9) | 33% (×1.1) | 30% (×1.0) | 33% (×1.1) | 32% (×1.1) | 35% (×1.1) |
| gunrunner | 20% | 17% (×0.8) | 15% (×0.7) | 16% (×0.8) | 14% (×0.7) | 17% (×0.8) | 15% (×0.7) |
| smuggler | 20% | 15% (×0.7) | 13% (×0.7) | 14% (×0.7) | 14% (×0.7) | 12% (×0.6) | 13% (×0.6) |

Wins by character (win share, ×seat share; **bold** = at least 2× its seat share on 5+ wins):

| Character | Seat share | A | B1 | B2 | C | D18 | D9 |
|---|---|---|---|---|---|---|---|
| greedy | 40% | 62% (×1.5) | 67% (×1.7) | 66% (×1.6) | 62% (×1.5) | 71% (×1.8) | 71% (×1.8) |
| hothead | 10% | **22% (×2.1)** | 19% (×1.8) | 20% (×1.9) | 19% (×1.9) | 15% (×1.4) | 14% (×1.4) |
| hustler | 10% | 3% (×0.3) | 4% (×0.4) | 4% (×0.4) | 3% (×0.3) | 4% (×0.4) | 6% (×0.6) |
| saint | 10% | 1% (×0.0) | 0% (×0.0) | 0% (×0.0) | 1% (×0.0) | 0% (×0.0) | 0% (×0.0) |
| showboat | 10% | 5% (×0.4) | 5% (×0.4) | 5% (×0.4) | 6% (×0.5) | 4% (×0.4) | 3% (×0.3) |
| snake | 10% | 9% (×0.9) | 7% (×0.7) | 7% (×0.7) | 10% (×1.0) | 8% (×0.8) | 7% (×0.7) |
| turtle | 10% | 0% (×0.0) | 0% (×0.0) | 0% (×0.0) | 1% (×0.0) | 0% (×0.0) | 0% (×0.0) |

### out/rescore-ai5, lineup ai5

100 seasons. Day-1 trouble: 415 agents (4.2 a season), 136 of them dead or jailed 6+ h on day 1. Killed on day 1: 5 agents. Chance level for one agent of 10: top 3 30%, win 10%.

| Rule | Winner flips vs A | Trouble → top 3 | Trouble → win | Held 6+ h → top 3 / win | Killed day 1 → top 3 / win | Day-3 start leader loses | Lead changes, day 3 | Winner dead/jailed last 3+ h | Top score tied (tiebreak decides) | Day-1 leader wins |
|---|---|---|---|---|---|---|---|---|---|---|
| A: total viewer-hours (today) | 0% | 18% | 5% | 37% / 10% | 0 / 0 of 5 | 37% | 0.75 | 7% (dead 2%) | 0% | 33% |
| B1: days ×1, ×2, ×3 | 20% | 21% | 7% | 32% / 10% | 0 / 0 of 5 | 48% | 1.09 | 7% (dead 1%) | 0% | 24% |
| B2: last day ×2 | 16% | 20% | 7% | 35% / 11% | 0 / 0 of 5 | 51% | 1.17 | 8% (dead 1%) | 0% | 29% |
| C: daily episodes, 5/3/1 points | 23% | 20% | 5% | 32% / 10% | 2 / 0 of 5 | 43% | 1.39 | 5% (dead 1%) | 8% | 35% |
| D: recent hours, half-life 18 h | 27% | 21% | 7% | 32% / 9% | 0 / 0 of 5 | 54% | 1.39 | 8% (dead 1%) | 0% | 21% |
| D: recent hours, half-life 9 h | 43% | 22% | 7% | 26% / 9% | 0 / 0 of 5 | 68% | 2.08 | 10% (dead 0%) | 0% | 14% |

Wins by job (win share, ×seat share; **bold** = at least 2× its seat share on 5+ wins):

| Job | Seat share | A | B1 | B2 | C | D18 | D9 |
|---|---|---|---|---|---|---|---|
| chemist | 30% | 40% (×1.3) | 36% (×1.2) | 38% (×1.3) | 36% (×1.2) | 35% (×1.2) | 33% (×1.1) |
| dealer | 30% | 33% (×1.1) | 33% (×1.1) | 31% (×1.0) | 38% (×1.3) | 37% (×1.2) | 43% (×1.4) |
| gunrunner | 20% | 7% (×0.4) | 10% (×0.5) | 9% (×0.4) | 10% (×0.5) | 9% (×0.4) | 7% (×0.4) |
| smuggler | 20% | 20% (×1.0) | 21% (×1.0) | 22% (×1.1) | 16% (×0.8) | 19% (×0.9) | 17% (×0.8) |

Wins by character (win share, ×seat share; **bold** = at least 2× its seat share on 5+ wins):

| Character | Seat share | A | B1 | B2 | C | D18 | D9 |
|---|---|---|---|---|---|---|---|
| greedy | 50% | 71% (×1.4) | 73% (×1.5) | 71% (×1.4) | 68% (×1.4) | 79% (×1.6) | 79% (×1.6) |
| hothead | 10% | 18% (×1.8) | 16% (×1.6) | 17% (×1.7) | 19% (×1.9) | 12% (×1.2) | 10% (×1.0) |
| hustler | 10% | 2% (×0.2) | 4% (×0.4) | 3% (×0.3) | 3% (×0.3) | 2% (×0.2) | 3% (×0.3) |
| saint | 10% | 1% (×0.1) | 1% (×0.1) | 1% (×0.1) | 2% (×0.2) | 1% (×0.1) | 1% (×0.1) |
| showboat | 10% | 1% (×0.1) | 1% (×0.1) | 1% (×0.1) | 3% (×0.3) | 2% (×0.2) | 4% (×0.4) |
| snake | 10% | 7% (×0.7) | 5% (×0.5) | 7% (×0.7) | 5% (×0.5) | 4% (×0.4) | 3% (×0.3) |

### out/rescore-all-greedy, lineup all-greedy

100 seasons. Day-1 trouble: 387 agents (3.9 a season), 93 of them dead or jailed 6+ h on day 1. Killed on day 1: 0 agents. Chance level for one agent of 10: top 3 30%, win 10%.

| Rule | Winner flips vs A | Trouble → top 3 | Trouble → win | Held 6+ h → top 3 / win | Killed day 1 → top 3 / win | Day-3 start leader loses | Lead changes, day 3 | Winner dead/jailed last 3+ h | Top score tied (tiebreak decides) | Day-1 leader wins |
|---|---|---|---|---|---|---|---|---|---|---|
| A: total viewer-hours (today) | 0% | 17% | 5% | 37% / 11% | none | 49% | 1.08 | 7% (dead 0%) | 0% | 29% |
| B1: days ×1, ×2, ×3 | 26% | 22% | 6% | 17% / 4% | none | 66% | 1.42 | 7% (dead 0%) | 0% | 12% |
| B2: last day ×2 | 23% | 19% | 6% | 27% / 6% | none | 64% | 1.68 | 8% (dead 0%) | 0% | 18% |
| C: daily episodes, 5/3/1 points | 29% | 22% | 5% | 38% / 11% | none | 43% | 1.82 | 7% (dead 0%) | 17% | 36% |
| D: recent hours, half-life 18 h | 34% | 22% | 6% | 19% / 3% | none | 70% | 1.69 | 8% (dead 0%) | 0% | 11% |
| D: recent hours, half-life 9 h | 47% | 26% | 8% | 13% / 3% | none | 74% | 1.98 | 8% (dead 0%) | 0% | 7% |

Wins by job (win share, ×seat share; **bold** = at least 2× its seat share on 5+ wins):

| Job | Seat share | A | B1 | B2 | C | D18 | D9 |
|---|---|---|---|---|---|---|---|
| chemist | 30% | 42% (×1.4) | 33% (×1.1) | 37% (×1.2) | 39% (×1.3) | 33% (×1.1) | 27% (×0.9) |
| dealer | 30% | 29% (×1.0) | 31% (×1.0) | 29% (×1.0) | 24% (×0.8) | 29% (×1.0) | 31% (×1.0) |
| gunrunner | 20% | 11% (×0.5) | 17% (×0.8) | 15% (×0.7) | 9% (×0.4) | 19% (×0.9) | 27% (×1.4) |
| smuggler | 20% | 18% (×0.9) | 19% (×0.9) | 19% (×0.9) | 28% (×1.4) | 19% (×0.9) | 15% (×0.7) |

### out/rescore-styles, lineup styles

100 seasons. Day-1 trouble: 373 agents (3.7 a season), 77 of them dead or jailed 6+ h on day 1. Killed on day 1: 0 agents. Chance level for one agent of 10: top 3 30%, win 10%.

| Rule | Winner flips vs A | Trouble → top 3 | Trouble → win | Held 6+ h → top 3 / win | Killed day 1 → top 3 / win | Day-3 start leader loses | Lead changes, day 3 | Winner dead/jailed last 3+ h | Top score tied (tiebreak decides) | Day-1 leader wins |
|---|---|---|---|---|---|---|---|---|---|---|
| A: total viewer-hours (today) | 0% | 16% | 5% | 36% / 9% | none | 49% | 1.10 | 16% (dead 0%) | 0% | 29% |
| B1: days ×1, ×2, ×3 | 24% | 17% | 6% | 23% / 5% | none | 71% | 1.57 | 15% (dead 0%) | 1% | 15% |
| B2: last day ×2 | 21% | 18% | 6% | 30% / 9% | none | 64% | 1.63 | 18% (dead 0%) | 0% | 21% |
| C: daily episodes, 5/3/1 points | 31% | 20% | 5% | 39% / 8% | none | 38% | 1.77 | 15% (dead 0%) | 22% | 36% |
| D: recent hours, half-life 18 h | 31% | 21% | 6% | 22% / 5% | none | 73% | 1.64 | 17% (dead 0%) | 0% | 13% |
| D: recent hours, half-life 9 h | 41% | 25% | 9% | 19% / 8% | none | 82% | 2.40 | 18% (dead 0%) | 0% | 12% |

Wins by job (win share, ×seat share; **bold** = at least 2× its seat share on 5+ wins):

| Job | Seat share | A | B1 | B2 | C | D18 | D9 |
|---|---|---|---|---|---|---|---|
| chemist | 30% | 40% (×1.3) | 40% (×1.3) | 40% (×1.3) | 37% (×1.2) | 39% (×1.3) | 37% (×1.2) |
| dealer | 30% | 41% (×1.4) | 37% (×1.2) | 41% (×1.4) | 38% (×1.3) | 40% (×1.3) | 39% (×1.3) |
| gunrunner | 20% | 10% (×0.5) | 14% (×0.7) | 12% (×0.6) | 11% (×0.5) | 14% (×0.7) | 19% (×0.9) |
| smuggler | 20% | 9% (×0.4) | 9% (×0.4) | 7% (×0.4) | 14% (×0.7) | 7% (×0.4) | 5% (×0.3) |

Wins by style (win share, ×seat share; **bold** = at least 2× its seat share on 5+ wins):

| Style | Seat share | A | B1 | B2 | C | D18 | D9 |
|---|---|---|---|---|---|---|---|
| lowkey | 20% | 15% (×0.7) | 15% (×0.7) | 15% (×0.7) | 17% (×0.8) | 17% (×0.8) | 18% (×0.9) |
| mid | 20% | 16% (×0.8) | 18% (×0.9) | 18% (×0.9) | 18% (×0.9) | 20% (×1.0) | 18% (×0.9) |
| reckless | 20% | 15% (×0.7) | 16% (×0.8) | 16% (×0.8) | 18% (×0.9) | 12% (×0.6) | 14% (×0.7) |
| safe | 20% | 26% (×1.3) | 26% (×1.3) | 26% (×1.3) | 21% (×1.0) | 28% (×1.4) | 27% (×1.4) |
| show-off | 20% | 28% (×1.4) | 25% (×1.3) | 25% (×1.3) | 26% (×1.3) | 23% (×1.1) | 23% (×1.1) |


## Commands and seeds

The runs were on commit `61ddf03` with config hash `b12f0f38`, under today's rules and with no `--set` or `--off`. All the seasons are free bot seasons, with no model calls. Seeds start at 1: 1–200 for the default lineup and 1–100 for each other lineup. The run folders are in `out/` (ignored).

```
node run.mjs --bots --seeds 200 --out out/rescore-default --quiet
node run.mjs --bots --seeds 100 --lineup ai5 --out out/rescore-ai5 --quiet
node run.mjs --bots --seeds 100 --lineup all-greedy --out out/rescore-all-greedy --quiet
node run.mjs --bots --seeds 100 --lineup styles --out out/rescore-styles --quiet
node tools/rescore.mjs results/ai-seasons/ai-s1/1 results/ai-seasons/ai-s2/1 out/rescore-default out/rescore-ai5 out/rescore-all-greedy out/rescore-styles
```

As a determinism check, the ai5 run was replayed into a scratch folder, and its rescore output was identical. `npm test` passed 249 of 249 tests after `tools/rescore.mjs` was added.
