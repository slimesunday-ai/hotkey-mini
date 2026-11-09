# DESIGN.md against the research and past projects (11-08)

slime: "compare our sim to the research dossier and look for anything that would help. Mainly the web search stuff we
have on sims and past failures in degen bettable, degen, minfluenfer, and hot key".

Five read-only agents each compared one body of sources with DESIGN.md:
- web research on how agents behave;
- web research on economy, pacing and audiences;
- degen-bettable;
- mintfluencer and degen;
- hotkey.

Claude checked the key quotes against the sources. Paths are shortened as follows:
- **R/** is hotkey's research folder (`docs/research/` in the hotkey repo).
- **W/** is the Claude Brain wiki.
- **GAME** is hotkey's `docs/GAME.md`.

## What it adds up to

### 1. Nobody has proven people will watch, and only a human panel can tell
- mintfluencer was killed when about 30 target people saw it and "NOT ONE was excited or understood it"
  (W/learning/2026-08-03-n30-legibility-kill-and-ai-legibility-bias.md:18-21).
- Claude's judgment of "people will get this" is "UNTRUSTWORTHY — the only valid legibility test is a small human
  panel" (same file, 35-39).
- In hotkey, "every text-first surface failed the 30-person panel" (GAME:931).
- degen's survival season: "We proved agents scheme; we have NOT proven anyone would WATCH"
  (W/learning/2026-06-15-degen-survival-game-v1-experiment.md:34).
- Mini's score, watch time, comes from a guessed audience, and fake fans would be guesses too.

### 2. Rules move AI agents; wording mostly doesn't
- In hotkey, "Changing the mechanics changed behaviour; changing the wording mostly didn't". Under a criminal Creed,
  strong models led no crime. One rule (a hit wins a tie against a lone worker) brought crime out
  (R/2026-11-06-what-the-agent-experiments-showed.md:16-18, GAME:1983-1990).
- In degen, "Two prompt attempts to make the LLM trade failed — don't keep prompting; go structural"
  (W/learning/2026-06-07-degen-part-b-market-and-anti-convergence.md:50).
- degen's drama engine: "39 directives, 14 complied (36%)". Confrontational forms fired least (callout 0/9)
  (W/learning/2026-06-11-degen-fresh-run-results.md:23-24).
- degen-bettable fixed caution with a rising clock, not with menus or odds: "the water rises", "the LINE does the
  killing, not the knife". Its judge still picked LAY_LOW 48 times out of 240
  (W/learning/2026-07-07-degen-bettable-death-pressure-shipped.md:19-20; W/learning/2026-07-09-degen-bettable-season3-run.md:27-30).
- Market research calls LLM conservatism "intrinsic, not a prompt artefact" (R/2026-06-08-llm-agent-market-simulations.md:56-57).
- Showing a move's pay does work: unused moves "came into use as soon as each had its own line saying what it pays"
  (R/2026-11-06:19-20).

### 3. The shift is the safe option, and slime already ruled on it in hotkey
- hotkey's AI chemists took "the safe shift with the goods to work" ("Steady cash keeps the home paid"). slime, 10-21:
  "no one wants to watch their agent work a boring shift. they should be robbing npcs, doing crime". The shift was
  replaced by hustles (GAME:2127-2135).
- Mini keeps the shift. Its 5.4 and 14.1 lean on work as the safe path.

### 4. Agents trade when the game holds the goods, not when they have to meet
- An escrowed board doubled trades. With standing plans as well, contracts settled 53% of the time against 1.5% for
  face-to-face offers (R/2026-11-06:53-55).
- Model seats opened 11 sit-downs and settled 1 deal; their bot twins opened 81 and settled 68 (R/2026-11-06:121-122).
- Showing prices didn't fix it: R9d's target was 10 deals and $500, and it got "2 deals and $105". "The models read the
  run numbers and took shifts" (GAME:2051-2062). Standing orders raised cash paid in by agents from $240 to $645 (GAME:2116).
- This corrects DESIGN.md 6.1's "the AIs only traded once prices were on screen". Prices were needed but not enough.
- "A bottomless buyer on every corner — dopewars — has no cooperation at all"
  (R/2026-09-25-open-source-game-economies-interdependence.md:9).

### 5. Viewer text is both a security hole and a way to cheat
- **Ghosting:** viewers who see plans live can warn the target. hotkey kept "Thoughts, plans, stashes and cash" a game
  day late (GAME:874), and a short live delay means "no viewer can ever tip an agent off in real time"
  (R/2026-10-09-spectator-cameras-and-replays.md:536).
- **Injection:**
  - invisible tag characters "raised Claude Haiku's compliance from 0.8% to 49.2%";
  - actions pulled out of prose let "a quoted con" run, and a probe moved $50;
  - a con written into an agent's own memory comes back on every call
  (W/learning/2026-10-19-ai-city-prompt-injection-review.md:25-41).
- **Ignored doses:** "The SUDO prompt instruction can be ignored mechanically"
  (W/reference/2026-10-10-ai-city-deep-structural-audit.md:24).
- **Spikes:** hotkey's rule is "Your own AI never reads what another agent wrote" (GAME:820). Mini's agent-written
  spikes break that rule.
- **Alt accounts:** "Multi-accounting is the first thing that breaks" (R/2026-10-13-spacemolt-agent-mmo-precedent.md:22).
  It defeats the owner bans and the most-spent-on award.
- **Real money:** hotkey's rule was "chance, tradable, cashable: pick at most two" (GAME §28). degen-bettable worked
  around "the paid-entry+prize+chance triangle" (W/project/degen-bettable.md:191).

### 6. Finales, events and comebacks need structure
- Finales don't explode on their own. Anthropic models "sustain 57 per cent cooperation in the final round"
  (R/2026-10-15-ai-city-pacing-and-openings-without-dice.md:16). Finales "converge, escalate and switch off the relax
  valve" (same file, :14).
- Safe AIs skip fights they read as losing ("Solo attacks cannot beat defence", R/2026-11-06:108). The king duel makes
  a failed attack deadly, so it needs a visible payoff to be worth trying.
- Events keyed to quiet invite "quiet-farming", so key them to the calendar and let state only escalate (pacing:52).
  Events that hit everyone alike make agents converge (W/learning/2026-06-07-degen-part-b-market-and-anti-convergence.md:33).
- Openings are seeded, not waited for (pacing:13).
- Comebacks should be "Earned comebacks, never handouts": headwinds on leaders, and bounties scaled by a rival's wealth
  (R/2026-06-14-agents-under-stakes-and-competition-formats.md:68-70).
- A winner must be frozen at the end, because degen's v2 winner "bled out after winning"
  (W/learning/2026-06-15-degen-survival-ui-builds-v2-run.md:40).

### 7. Moves agents rarely pick
- degen-bettable's social moves went DARE 2, PACT 1, FEINT 0 in 240 picks. A gate and a cooldown took FEINT from 0 to 70
  offers (W/learning/2026-07-09-degen-bettable-season3-run.md:27; W/project/degen-bettable.md:80).
- So DESIGN.md 8.1 ("cut any move used in under 1% of turns") would cut deals before they had a chance.
- Scams stopped once exposure became a public, automatic tag (correlation only). Betrayal needs cheap talk, private
  information and "exposure by word of mouth" (R/2026-09-25-agent-game-harness-and-betrayal-research.md:17-27).
  Lending's public missed date (4.6) runs against this.

### 8. Loops and numbers read aloud have cheap fixes
- **An output-side check.** "Input-cleaning can't catch the model re-emitting a verbatim line"
  (W/learning/2026-06-02-mintfluencer-self-looping-fixed-dedup-backstop.md:24-25). Shared openers are invisible to
  whole-text checks (W/learning/2026-06-06-mintfluencer-sim-quality-fixes.md:34).
- **Semantic loops need a ledger, not a threshold.** A 0.40 similarity guard caught "0 of the prophet's 7 same-day
  sermons" (W/learning/2026-07-09-degen-bettable-waves-1-4-shipped.md:74-76). The rule is "escalate or call back, never
  repeat flat".
- **Show money only when it matters.** mintfluencer's own prompt "literally mandates" money talk; gating it cut the
  money-word share from 20% to 10% (W/learning/2026-06-06-mintfluencer-sim-quality-fixes.md:22, 36).
- **Re-inject the voice every turn.** degen-bettable's lexicon was "creation-only — never re-injected at runtime"
  (W/learning/2026-07-02-degen-bettable-forensic-audit.md:50), and persona attention decays "within 8 conversation
  rounds" (R/2026-05-18-lexical-convergence-in-multi-agent-llm-simulations.md:17).
- **Examples help, but they get parroted.** Few-shot exemplars match style 23× better than descriptions (lexical:78),
  but "Seeded examples get parroted — in narrators too" (W/learning/2026-07-02-degen-bettable-sections-1-4-shipped.md:44).
- **A free voice metric:** post-to-author attribution (degen: 75.3%, 11.3× chance).
- **Don't let one narrator model voice every agent.** It flattened 11 voices
  (W/learning/2026-06-08-degen-register-distance-launch-readiness.md:32).
- **Thoughts need a prompt.** The wiretap "was decorative" until thoughts were prompted for who you're using, what
  you're bluffing, and the fear behind the confidence (W/reference/2026-06-29-degen-bettable-wiretap-and-audience-staging.md:23, 35).

### 9. Testing method
- **Bots mispredict AI play.** A bot stood in for the AI and lost about $45 a seat, where real AI seats lost about $205
  (runs/2026-10-21-verdict/RESULTS.md). The stall learning says "Tuned on bots, AI players last"
  (W/learning/2026-10-19-why-the-sims-stall.md).
- **Thinking has a cost.** At high effort, "Haiku spent its whole output on thinking on 28 of 66 calls"
  (R/2026-11-06:186). Empty output is a reasoning model's "signature failure"
  (W/learning/2026-07-09-degen-bettable-season3-run.md:42-43).
- **Model mix moves crime more than wording.** Emergence World had Gemini at 683 crimes and Claude at 0, but the harness
  file notes Claude's world prohibited crime (R/2026-09-22-what-blew-up-agent-and-ai-games-2026.md:7-8;
  R/2026-09-25-agent-game-harness-and-betrayal-research.md:25).
- **Measure the show by clips and quotes.** Track "clips/quotes/repeat-viewers", and make "Every elimination … land as
  the death of someone known" (W/reference/2026-06-24-attention-anatomy-agent-virality-playbook.md:34, 95).

## Where the sources disagree
- **Wording:** the crime-briefing note says framing produces crime, and the experiments say wording didn't
  (R/2026-10-19-how-crime-sims-brief-agents.md:13-17 against R/2026-11-06:17-18).
- **Example lines:** few-shot examples match style best (lexical:78), but they get parroted (degen-bettable, above).
- **Numbers:** the comedy dossier finds odd, specific numbers funny, so a ban fits generic menu stats better than every
  number.
- **Model personality:** the market research says to move decisions into code, and the what-blew-up file treats model
  personality as the content.

## Second pass (11-08): every file, with a ledger

slime: "Run the additional review". The first pass skimmed its two biggest piles, so four more agents read all 54
files and logged each one as "nothing new" or a finding:
- all 18 mintfluencer learnings and 2 topic pages;
- the 16 degen learnings from 06-07 to 06-15, and the hub;
- the 11 degen-bettable files the first pass didn't quote;
- the 6 sources it missed: transit, stylometry, and the conversations vault's mintfluencer arc, overview and abandoned
  convergence fix.

Claude checked the key quotes. New, beyond the first pass:

### Relationships and drama
- **AIs don't start the chains.**
  - mintfluencer's DM → leak → severed-tie chain never ran: "Still 0 DMs", and ties stayed "NEUTRAL/intensity-1"
    (W/learning/2026-06-06-mintfluencer-bug-audit-p0p1-fixes.md:41; W/learning/2026-06-06-mintfluencer-sim-quality-fixes.md:23).
  - In mini's `ai-s2`, every promise came from a scripted bot (Dutch 10, Kim 3, Moss 2), and the AI seats made none.
- **Standings plus a license to scheme made agents gang up on the leader.** degen's survival season injected "the
  leaderboard, the rival just ahead, explicit license to scheme/ally/betray". The result: "a coalition ganged up on the
  leader" (W/learning/2026-06-15-degen-survival-game-v1-experiment.md:22, 26).
- **Victims need a right of reply.** degen-bettable's feed was "ten parallel monologues; attacks invisible to victims"
  until "WHAT-JUST-HIT-YOU" event shadows went in (W/learning/2026-07-10-degen-bettable-chronicle-jul03-jul07.md:42).
  Mini already has alert lines for acts against an agent.
- **The night story needs an editor.**
  - degen's survival season found "the showrunner EDIT is the moat" (W/learning/2026-06-15-degen-survival-game-v1-experiment.md:31).
  - mintfluencer ran one narrator call per sim-day on the gap between the post and the private state, and it was the
    best part of the run (W/learning/2026-06-06-mintfluencer-sim-quality-fixes.md:30).

### Voices and loops
- **slime's rule from mintfluencer:** "the more we try to fix convergence the worse it gets, they need to be able to
  read all context... we need to strive for maximum continued conversation as it's more interesting than convergence"
  (W/learning/2026-05-22-mintfluencer-anti-convergence-arc.md:38). Loop fixes must not hide what other agents said.
- **Fixes that measured:**
  - holding back tics on about 65% of turns, rotating examples and excluding openers took repeats from 91% to 50%
    (W/learning/2026-06-14-degen-voice-gravity-chatroom.md:20);
  - a guard on the agent's own recent lines plus a rotating conversational move took near-copies from 7% to 2% (same
    file, :25).
- **The root cause was the agent's own memory replayed verbatim.** Beliefs had "no limit, no importance ranking, no
  decay", and the last 5 outputs were replayed every tick
  (W/learning/2026-06-02-mintfluencer-intra-agent-looping-binding-constraint.md:25-26).
- **Facts printed every turn get echoed.** mintfluencer's rent countdown was "always-on, removed for too-constant
  priming" (W/topic/mintfluencer-context-briefing.md:128).
- **Specific beats generic.** Genericizing gigs to "Work a shift" caused a "narrative loss" and was "reverted". The
  lesson: "micro-event seeds + specific gig types are sufficient content fuel"
  (W/learning/2026-05-22-mintfluencer-anti-convergence-arc.md:76, 80).
- **A fingerprint fixes typing, not concepts.** It "helped surface markers but not conceptual vocabulary absorption"
  (conversations vault, Themes/Abandoned/vocabulary-convergence-multi-agent-fix.md:13). Voice instructions in prompts
  leak, so enforce them in code (~/Desktop/research compass 2730aaef:31).
- **The cast needs a mix of agreeable and contrarian agents.** "Outcomes are worst when all agents are agreeable"
  (compass 2730aaef:40).

### Drugs, events and money
- **A dose should also change play in code.** degen-bettable's code picked the move and the thought previewed it; a dose
  could likewise override sliders and menu for its hours, so an ignored recipe still changes play
  (W/learning/2026-06-30-degen-bettable-strategy-engine-and-judge.md:21-23).
- **Compliance varies.** It depends on the persona and on whether an order is self-directed or aimed at someone, so log
  it by recipe type and model (W/learning/2026-06-11-degen-fresh-run-results.md:24).
- **Events need a stake and a move for everyone.**
  - Each event needs a good move for both bold and cautious agents (W/learning/2026-06-07-degen-part-b-market-and-anti-convergence.md:59).
  - Handing one headline "to 15/15 agents" made a monoculture (W/learning/2026-06-14-degen-voice-gravity-chatroom.md:23).
  - Shared mood events converge agents, while stakes events split them.
- **Loops need restoring forces.** degen's lead share ran "9% → … → 100%", and its first cull was "a 4-clump"
  (W/learning/2026-06-15-degen-survival-ui-builds-v2-run.md:34). Stagger rent and give every loop a sink.
- **Paid actions need curating.** slime on degen-bettable's first bet board: "you took my two examples and made them
  the whole surface … needs curation" (W/learning/2026-07-09-degen-bettable-wave-1-5-bet-surface.md:14-15).

### Rides and testing
- **Rides need a rule difference, not just speed.** At equal pace, "a kerb-riding scooter beat the cab on 35 of 60 long
  trips" (R/2026-10-09-traffic-transit-and-crowds.md:91).
- **Every run should prove each system fired.** degen-bettable's watched "snowball" runs were deathless because the
  runner skipped the elimination pass.
- **The cheapest test was never run.** mintfluencer's "10-manual-videos-on-X validation test has not been run"
  (conversations vault, Themes/Project-arcs/mintfluencer-arc.md:74). Mini can cut recap clips from `ai-s1` and `ai-s2`
  for free.
