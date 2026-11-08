# Tuning hotkey mini

slime (2026-11-07): "it needs to be entertaining so when tuning ask are agents interacting, are interesting results
happening, would people find this entertaining?"

The orchestrator runs the tuning loop. The builders only apply the changes it asks for.

## The marks

These are starting guesses, written before any run, and slime can change them.

**1. Interacting**
- At least 40% of acting hours involve another agent: an action on another agent, a message, or a board trade with
  another agent.
- Every agent interacts with at least 4 others per season.
- At least 2 rivalries per season.

**2. Interesting**
- At least 1 broken promise per season, and a lead change in most seasons.
- At least 1 king attempt in most seasons.
- The top agent finishes in the top third again in 50–70% of seeds.
- The turtle finishes in the bottom third in at least 80% of seeds.
- Each job wins between 0.5x and 1.5x its share of seats.
- Each style (reckless, safe, show-off, lowkey, ride-or-die, snake, or mid) wins between 0.5x and 1.5x its share of seats
  (round 3).
- **Copycat check:** in the `all-greedy` lineup, the most common action takes 40% or less of acting hours on average.
  Run it with viewer tastes both on and off: real viewers are the part we can't control, so money and energy have to
  spread the agents out on their own.

**3. Entertaining**
- The fake audience ends the season at least as big as it started.
- The longest dull stretch is 3 acting hours or less.
- The fresh viewer (below) scores the season 7/10 or more and can name a one-sentence story someone would post.

**4. Styles show (round 3)**

slime (2026-11-08): "if a user sets their agent to high risk, the game surfaces the riskier moves".
- In an AI season, the fresh viewer can name the style of at least 3 of 5 AI agents from the play-by-play alone.
- Two seats with the same model and opposite settings act visibly differently: risk moves, gear and promises.

## One round

1. Run `node run.mjs --bots --seeds 30` with the default lineup, then `--lineup all-greedy` twice: once as is, and once
   with `--off audienceTastes`.
2. Read `report.md`, check it against the marks, and write the numbers down.
3. **The viewer.** A fresh Opus agent that hasn't seen the code, the config or the report reads 3 play-by-plays (from
   different seeds) and answers:
   1. Are the agents dealing with each other, or living separate lives?
   2. The 3 best moments, and the 3 dullest stretches.
   3. Would you keep watching? Score it 1–10 and say why.
   4. The one-sentence story someone would post.
   5. Which agent would you follow, and why?
   6. What would make it more fun? Answer in terms of what happens on screen, not code.
4. **Decide.** The orchestrator picks the changes. Numbers come first; a rule change comes only when numbers can't fix
   it. One theme per round.
5. **Apply and compare.** A builder applies the changes. Rerun the same seeds plus 10 new ones, and run
   `tools/compare.mjs`. Keep a change if it helped; revert it if it didn't.
6. **Log.** Write a short entry in `notes/tuning-log.md`: the change, the before and after numbers, and the viewer's
   score.

## When AI runs happen

A bot bench proves the mechanics, not the balance. In the past, bot-tuned balance didn't survive the first model
season, so an AI season comes early:
- after at most 3 bot rounds;
- or sooner, as soon as the mechanics look sane.

**Paid calls:** each one needs slime's go, in his own words, plus a cost estimate.
- The dry run is about 4 calls, roughly 2 cents.
- One AI season is about 216 calls. At OpenRouter's 11-07 prices that's about $1, capped at $3.
- The first real AI season (11-07: 2 Sonnet, Haiku, Sol, Kimi) took 270 calls and cost $2.04: Anthropic $1.29,
  OpenRouter $0.76.

**Every AI season:**
- runs its bot twin (free) on the same seed;
- gets read by a fresh viewer;
- is judged on several seeds before anything is concluded. Single runs swung more than most of the effects being
  chased.
