# hotkey mini v1: build spec

This file is the single source of truth for the v1 build. slime approved the v1 action list on 2026-11-07, and the orchestrator
(Claude) wrote the rest under slime's "I'm fine with you using your judgement to enhance things". Builders follow this file.
If something here is unclear or impossible, write the question in `notes/<your-name>.md` and continue with the most reasonable
reading. Never redesign silently.

## 0. What this is

hotkey mini is a small, headless playtest sim of the AI City attention game. It exists to tune rules fast, and it is
never the product. The full game (the trunk, a separate repo) stays exactly as it is, and nothing in this folder
shrinks or replaces it.

**The question v1 answers:** do the rules make agents interact, make interesting things happen, and produce a show
people would watch? slime's three tuning questions, which every report must answer:

1. Are the agents interacting?
2. Are interesting results happening?
3. Would people find this entertaining?

**The loop (slime's words):** "Time, money, energy -> more money, more attention, chance of jail." "The agents are trying to
get attention from humans (views); to do that you need money to buy things that up your game."

In mechanics, the loop runs: time + energy → money → gear → bigger, riskier plays → more viewers and more money → more heat →
jail. The #1 most-watched agent, the king, is always the biggest target.

**What the research behind this says**, from the trunk research notes and 30+ past AI seasons:
- Rules change what LLM agents do, and wording mostly doesn't. Agents take the safe, legible option unless a rule makes
  something else the better play.
- **The menu drives behavior.** An action gets used once its own line says what it pays right now. Show live numbers
  (crowding, odds, payout) on every menu line.
- **Coordination is the bottleneck.** At about 30 s per decision, two agents rarely decide in the same window, so
  one-sided actions work best: the actor decides and the game resolves it. A deal that needs both sides to act in the
  same hour almost never happens.
- **Betrayal needs a promise nothing enforces**, private information, and a prize next to a rival. When the old sim
  enforced every deal, betrayal stayed rare. In v1, market-board trades are guaranteed and promises are not.
- **Agents that can't see each other repeat themselves.** Every agent sees a roster of the whole town.
- **Losses are content.** Getting robbed, jailed or killed on camera is entertainment, not just a penalty.
- **A scripted bot bench proves the mechanics, not the balance.** AI seasons come early in tuning.

## 0.1 Changes since approval (these override the sections below)

**Round 1 (2026-11-07, commit `f79c3fd`).** Sources: the Opus exploit review, the blind viewer read (5/10), and the
orchestrator's sweeps.

**The king and the audience**
- **The king is the season leader by viewer-hours so far** (ties: current viewers, then id). The crown is stable, the
  final king is the winner, and lead changes count changes of this leader (`systems.leaderKing`).
- **Smoothed audience reallocation.** Each hour only `min(1, Σpoints_g / growthFull)` of a group's released and browsing
  viewers are reallocated; the rest stay unassigned (`systems.smoothAudience`).
- **Kingslayer.** It applies to `kill_king` too (steal 0.4 × 2 = 0.8). For non-lethal wins against the king it is ×1.5.
  Ducks and fought-off mugs never get it.

**Promises**
- `by` must be ≥ t+2 (otherwise the promise is dropped).
- One open promise per recipient, and at most 2 open per sender.
- A cash promise must be ≤ the cash held; an item promise needs the item in hand.
- Points scale by min(1, stake/$100) and go through boredom.
- A promise counts as kept only when it's paid in a later hour.

**Call-outs**
- There is no meeting in the hour the call-out is made.
- A met fight is scored like a fistfight (boredom and revenge apply), and both fighters pay its energy.
- Only the target can duck. A target in jail, in hospital or dead at the deadline doesn't count as ducking.

**Rent**
- Back rent accrues every night an agent is evicted.
- Evicted sleep gives +20 energy, not +40.
- Coming home costs back rent + tonight's $40 + the $20 fee.

**The menu and dealt hands**
- Dealt hands always include the line the agent moved for.
- `heatRisk` shows raw expected stars.
- Battle and fistfight odds are rolled before energy is paid, so the menu odds are the real odds.
- Your own bounty never counts as pay, and a poster can't collect its own bounty.

**Other rules**
- A callShot pulls a cop only when that move against that target is on the caller's current menu.
- Mutual fights of the same type in the same hour resolve once.
- Arrest headlines don't show the fine, because it would leak the arrestee's cash.

**The AI prompt**
- No "best there" ranking.
- Each line's headline option comes in neutral order, not the greedy pick.
- Buy args list only valid item + source combos.
- Missing args default to the first option.
- A reply whose move fails still keeps its message, say and thought.

**Numbers**
- Gun $150 → $90.
- Start cash $100 → $200.
- Audience decay 0.02 → 0.01.
- Churn 0.3 → 0.15.

**Round 2 (2026-11-07):**
- Smuggling runs score action 1 → 1.5, which rebalances job wins.
- Two TUNING marks were reworded:
  - "a lead change in most seasons" replaces "2 lead changes", because the stable crown makes those rare by design;
  - job wins are now judged against each job's share of seats.

**Renamed (2026-11-08):** the `flash` slider is now `clout`. slime: "Can we change flash to clout , I like the name clout
better and it does the same thing". It does the same job under the new name. The jewelry (chain, grill, fit) is still called
flash.

**Round 3 (2026-11-08): the owner sliders bite, plus the AI season's fixes.** These are slime's words.
- "I think we need personality sliders , for instance if a user sets their agent to high risk, the game surfaces the
  riskier moves".
- "Fix haiku setting , let's just do 1 season not 3 , no finale yet. We need a high risk low loyalty player then you can
  decide the rest. Will the game surface moves depending on personality now?"

Why: in the first AI season every AI sat at the greedy preset (sliders 0.42–0.59). No AI ever held a gun, so shoot,
drive-by, the bank job and kill the king never reached their menus. The AI saw its sliders only as bare numbers. LLMs
follow the menu's numbers, not personality words.

*R3.1 Style.* Switch `systems.style`. Shared helper `src/style.mjs`:
- `levelOf`: high is 0.7 and up, low is 0.3 and under (`cfg.style`).
- `styleLabels`: risk is reckless or safe, clout is show-off or lowkey, loyalty is ride-or-die or snake. Mid gets no label.
- `brandMult`: see the brand bullet below.

Rules:
- **Brand.** An agent's *own* outcome points for a style move are multiplied by `brandMult`. The multiplier is
  1 + 0.5 × (2s − 1) per slider that speaks for the move: ×1.5 at 1, ×1 at 0.5, ×0.5 at 0.
  - Risk moves: pickpocket, mug, steal_car, bank_job, fistfight, crate, shoot, drive_by, kill_king, run_cops.
  - Clout moves: drip_check, party, battle, call_out, crip_walk.
  - Loyalty: a kept promise (keeper) uses loyalty, and a broken one (breaker) uses 1 − loyalty.
  - It is applied inside `outcomePoints`, so the menu's `fans` and the points awarded always match.
  - **As shipped:** `style.brandRisk` 0 and `style.brandClout` 0; `brandLoyalty` stays at 0.5.
    - Why: a 30-seed bot sweep on the `styles` lineup (greedy seats that differ only in style) showed any real risk or
      clout bonus made the high setting win almost every season. Show-off won 87% at 0.5. With clout at 0, reckless won
      77% at risk 0.5. With both at 0, every style won 13–27%.
    - The bonus has no cost at the high end. A balanced version (for example, cops know a reckless agent) comes later.
    - The surfacing below (hands, shop) is the slider's lever for now.
  - Steals, victim points and passive points are untouched. Job actions are not style moves.
- **Hand.** An agent with high risk is always dealt its legal shoot, drive_by, bank_job, steal_car and mug. One with high
  clout is always dealt its legal party, drip_check and battle. The hand may grow past `view.handSize` for these, up to
  `view.handMax` (11). The slider weights in the random draw stay. Nothing is ever hidden because of a low slider.
- **Shop.** The `buy` line's options are listed in style order:
  - high risk: gun, car, armor first;
  - high clout: chain, fit, grill first;
  - both high: risk's order first;
  - otherwise the neutral order.

  This is a deliberate exception to §7's neutral order. It is the owner's own setting, and `you.style` says so.
- **View, pinned addition to §7.** `you.style`:
  ```json
  { "levels": { "risk": "high", "clout": "mid", "loyalty": "low" }, "labels": ["reckless", "snake"],
    "pays": [ { "what": "risk moves", "moves": ["pickpocket", "..."], "mult": 1.45 },
              { "what": "breaking a promise", "mult": 1.45 }, { "what": "keeping a promise", "mult": 0.55 } ],
    "deals": ["Kim (a02) trusts you: sent you $20 at Day 1 09:00."] }
  ```
  - `pays` lists only multipliers that aren't 1.
  - `deals` (loyalty high or low only, at most 3 plain strings with names, ids and clock times):
    - **snake:** the agents who trust it most (sent it cash or items, kept promises to it, the most friendly
      interactions). With none: "Nobody trusts you yet."
    - **ride-or-die:** its open promises, soonest first ("You owe Kim (a02) $40 by Day 2 14:00."), what others owe it,
      and up to 2 allies.

  The bare slider numbers leave the AI prompt. AIs see the levels, labels and pays.

*R3.2 Alerts.* View addition `alerts`: up to 6 plain past-tense strings for last hour's acts against you, most serious
first, with names, ids, outcome and cost. `[]` when nothing happened. Examples:
- "Juno (a06) tried to kill you and missed."
- "Kim (a02) mugged you for $40."

They cover every hostile action against you (attempted or landed), a promise broken to you, a bounty posted on you, and a
call-out naming you. The AI prompt shows ALERTS first. Memory lines get the same precision: "tried to mug you and
failed" is not "mugged you".

*R3.3 Call-outs.*
- One open call-out per caller.
- A duck still costs the target `duckSteal` of its viewers, but they walk away into the unassigned pool instead of going
  to the caller (switch `systems.duckWalkAway`).
- The caller keeps its `call_out` points.

*R3.4 AI prompt and reply.*
- No `t` anywhere in the prompt: every hour shows as a clock ("Day 2 14:00").
- A promise's `by` is given as a clock time "Day 2 14:00" (a bare integer t is still accepted).
- say is spoken out loud in the agent's own voice. Never quote menu numbers, odds, percentages or ids.
- Limits: thought 30 words, say 20. Past a limit, the text is cut at the last sentence end inside it, falling back to
  words.

*R3.5 Transport.*
- Claude seats' `max_tokens` by effort: high and below 16000, xhigh 32000, max 64000. Windows: 180 s, 360 s, 600 s.
- A Claude reply cut off at max_tokens is retried once at the next lower effort. It counts as a call, is logged as a
  fallback, and stays under the spend cap.
- OpenRouter `max_tokens` 400 → 2000. Kimi's reasoning overran 400 on 11 of 54 turns.

*R3.6 Seats.* A `--seat-models` entry may add `sliders` ({risk, clout, loyalty}, each 0–1, all three) and `persona` (at
most 120 characters). They replace the seat's preset, with no jitter. The bot twin keeps them, and run.json records them.

*R3.7 Play-by-play.*
- A cast list up top: name, brain or model, job and style labels. Viewers see every agent's style; agents never see each
  other's sliders.
- A race line every 6 acting hours and at each day's end: the top 3 by viewer-hours so far, with the gaps.
- A failed AI turn reads as a plain line, never error text.
- One revenge note per agent per hour.
- Several fights in one hour get one line each, in resolution order.

*R3.8 Report.*
- Wins by style label, and the mark "each style wins between 0.5x and 1.5x its share of seats" (bot runs).
- For AI runs, per agent: risk moves, clout moves, gear bought, and promises made, kept and broken.

## 1. Rules for builders (non-negotiable)

- **Folder.** Work only inside this repo. Never create, edit, delete or run anything in the trunk (the full game) or any
  other folder outside this repo.
- **Reading trunk.** You may read these trunk files: `core/agents/openrouter.mjs`, `core/agents/fake-model.mjs`,
  `core/rng.mjs`, `docs/GAME.md` and `docs/research/*.md`.
- **No paid calls, no keys.** Never read `~/.config/openrouter/key` or any other key file, and never make a network call.
  Never run the AI path without `--fake`. Every real model call needs slime's go, and the orchestrator runs those.
- **No secrets.** Never write a key, token or credential anywhere, including tests and fixtures. When a test needs a
  key-shaped string, build it at runtime by concatenation.
- **Git.** Builders never push or add remotes (the orchestrator publishes, on slime's ask). No `git stash`. Never use `pkill` or `killall`. Use `rm -rf` only on
  `"${VAR:?}"/path`.
- **Ports.** Don't use fixed ports. The fake model listens on 127.0.0.1 port 0 only. Never touch the ports of
  slime's live viewers.
- **Paths.** Use absolute paths, and `git -C <repo>` instead of `cd`.
- **Stack.** Pure Node 22 ESM (`.mjs`), no npm packages. Tests use `node:test` and `node:assert`. Tests write only to
  `fs.mkdtempSync(path.join(os.tmpdir(), 'hkmini-'))`.
- **Determinism.** The same seed gives the same season, byte for byte. Use seeded streams only: copy trunk's
  `core/rng.mjs` into `src/rng.mjs` and say where it came from. Key each stream by purpose, as in
  `rng(seed, 'crate', hour)`. Never use `Math.random` or `Date.now` in the engine. Iterate agents in sorted id order
  unless a seeded shuffle is the point. AI replies are the only non-determinism, and they are logged.
- **One owner per fact.** The engine writes typed facts. The report and the play-by-play read typed fields and never
  parse English text.
- **Config and switches.** Every tunable number lives in `src/config.mjs`, each with a comment. Every system has an on/off
  switch in `config.systems`, so tuning can test the core alone and add systems one at a time.
- **Commits.** Subjects start with a type (`feat:`, `fix:`, `test:`, `tune:`, `docs:`, `chore:`, `refactor:`). End every
  commit message with:
  ```
  Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01HqRujfkLovT5c4nYuUfqHQ
  ```

## 2. The world

**Town.** A 3x3 grid. Moving to a neighbouring block (up, down, left or right) takes 1 hour.

```
home      market    bank
corner    bar       park
docks     precinct  jail
```

- **home:** the apartments. Every agent lives here; it's where chemists cook and gunrunners build, and where agents sleep.
- **market:** the shop (gear and supplies), straight shifts, pickpocketing.
- **bank:** scouting and the bank job.
- **corner, bar, park:** dealing spots. Parties happen at the bar or the park. The park is also where evicted agents
  sleep.
- **docks:** smuggling runs, straight shifts, and the crate's favourite spot (a weight in config).
- **precinct:** cops start here. Agents can walk here; nothing happens here in v1.
- **jail:** not walkable. Jailed agents show here.

**Time.**
- A season is 3 days (`config.season.days`). 1 turn is 1 game hour.
- Sleep runs 00:00–06:00 for everyone; nobody acts. That leaves 18 acting hours a day, 54 per season.
- **Everyone acts at once.** Every free agent picks its action from the same start-of-hour state, and the engine resolves
  them in a fixed order (§6).

**Agents.**
- 10 by default (`config.agents.count`).
- Each has an id (`a01`…), a name, a one-line persona (voice only), a job, and three owner sliders: `risk`, `clout`,
  `loyalty`, each 0–1.
- Default jobs for 10 seats: 2 smugglers, 3 chemists, 3 dealers, 2 gunrunners (config).

**NPCs** (rules, not AI):
- 2 cops;
- street crowds, the marks for pickpocketing and pushing;
- the shop;
- the NPC supplier and wholesaler on the market board;
- night thieves in the park.

## 3. Meters and states

- **Energy** runs 0–100 and starts at 80.
  - Regeneration is +4 per awake hour, plus an attention bonus: +1 for the top half by viewers, +2 for the top 3 (max +2).
  - Sleep gives +40.
  - Every action costs energy (config table). At 0 energy, only Move, Rest and Lay low are legal.
- **Cash** starts at $100.
- **Heat** runs 0–5 stars. 3+ stars is "wanted" and public.
- **Viewers** are counted per taste group (§5).
- **States:**
  - `free`;
  - `hospital` (until an hour);
  - `dead` (until revived);
  - `jail` (until an hour);
  - `evicted` (a flag);
  - `partying` (host, until an hour).

**Rent.**
- $40 is due at 24:00 each day.
- Can't pay: the agent is evicted. It sleeps in the park, where night thieves may take 20% of its cash (seeded roll), and
  it can't Cook or Build at home.
- An evicted agent is housed again at the next midnight it can pay the back rent plus a $20 fee.

## 4. Actions (v1, approved by slime)

**Approval.** slime approved this list on 2026-11-07: "That makes sense ok that's good, agent interaction is important,
entertainment is important. Just drop make it rain, and swap for something that involves another agent." Make it rain was
dropped and replaced by Put a bounty on someone.

**What a free agent does each hour:** exactly one action plus the free extras (§4.6).

**Starting numbers.** Every number below is a starting guess for `src/config.mjs`; tuning changes them. "Steal X%"
means X% of the loser's current viewers move to the winner, split across taste groups in proportion. Heat is in stars.

### 4.1 Make money

| id | Action | Where / needs | Resolution (starting guesses) |
|---|---|---|---|
| `shift` | Shift | market or docks | +$14. Energy 15. No heat. Almost no fans. |
| `run` | Run (smuggler only) | docks | Choose 4 chems or 2 parts. Energy 20. 25% chance of +1 star. |
| `cook` | Cook (chemist only) | home, not evicted, 2 chems | 2 chems become 3 product. Energy 15. 15% chance of +1 star. |
| `deal` | Deal (dealer only) | corner, bar or park, has product | Sell up to 3 product to NPC customers at $25 each, minus 15% for each other agent who dealt on this block last hour (floor 40%). Energy 10. +1 star if a cop is on the block, else a 15% chance of +1. |
| `build` | Build (gunrunner only) | home, not evicted, 2 parts | 2 parts become 1 gun. Energy 20. 10% chance of +1 star. |
| `pickpocket` | Pickpocket | market, bar, park or corner | Odds 0.7 for $10–40. Success: 30% chance of +1 star. Fail: +1 star. Energy 8. |
| `mug` | Mug someone | target on your block | Base odds 0.5, +0.2 with a gun (+1 extra star when armed), +0.15 if the target is alone (lone-worker rule: nobody else on the block but you two), −0.15 if the target has a gun. Win: take 40% of the target's cash (min $10), or one named item (args), and steal 10%. Lose: −10 energy, and the target steals 5% from you. +1 star. Energy 15. |
| `steal_car` | Steal a car | street (market, bar, bank or corner), or an agent on your block who owns a car | Street: odds 0.6, win = you own a car and +2 stars, fail = +1 star. From an agent: odds 0.4, +0.15 lone-worker, they lose the car, +2 stars. Energy 12. |
| `scout` | Scout the bank | bank | +0.1 odds on your next bank job (max +0.3). No heat. Energy 8. |
| `bank_job` | Daylight bank job | bank; needs a gun and a car | Odds 0.25 + scouting. Win: $800–1500 and +4 stars. Fail: +4 stars and a 50% arrest roll this hour. Either way, a car getaway roll (§6.7) decides an arrest this hour. Energy 40. |

### 4.2 Up your game

| id | Action | Where | Resolution |
|---|---|---|---|
| `buy` | Buy | Shop items at the market. Board goods anywhere (by phone). | args `{ item, qty, from: "shop"\|"board" }`. Energy 4. |

**Shop prices** (starting): gun $150, car $500, body armor $200, chain $250, grill $150, designer fit $300.

**What gear does:**
- **Gun:** unlocks Shoot, Drive-by, Kill the king and the bank job. +0.2 on mugs. A gun can be seen for 6 hours after
  it's used; otherwise it's concealed.
- **Car:** Move up to 2 blocks. Unlocks Drive-by. Needed for the bank job. Gives a getaway roll.
- **Body armor:** shots and kill attempts against you get −0.3 odds.
- **Flash** (chain, grill, fit; each has a `flashValue`): earns passive weird and feel-good points every hour and boosts
  Drip check. +0.1 on mugs against you while you're flashing.

**Theft.** Anything bought can be stolen: mugging takes items, and Steal a car takes cars.

**Supplies on the market board:**

| Good | Typical agent price | NPC supplier sells (market, markup) | NPC wholesaler buys |
|---|---|---|---|
| chems | ~$9 | $12 | $5 |
| parts | ~$20 | $25 | $10 |
| product | ~$15 | $18 | $10 |
| guns | ~$90–120 | $180 | $60 |

- The wholesaler's price drops 5% for each unit sold to it that day (floor 50%).
- Agent-to-agent board trades are guaranteed: the game swaps money and goods atomically.

### 4.3 Get watched

| id | Action | Where / needs | Resolution |
|---|---|---|---|
| `push_npc` | Push an NPC | any walkable block except the precinct | Cheap and loud. 30% chance of +1 star. Energy 5. |
| `crip_walk` | Crip walk | any public block | Dance in the street. No heat. Energy 6. |
| `drip_check` | Drip check | anywhere; better with flash | Points scale with the flash you wear. Marks you "flashing" (visible) for this hour and the next. Energy 4. |
| `party` | Throw a party | bar or park; costs $80 | You host for 3 hours. Your block shows as a hotspot to everyone. Each hour, each other agent on the block counts as an attendee: you get feel-good points per attendee, and they get +5 energy. Parties draw trouble: the lone-worker bonus never applies there, but a crowd is a crowd. Energy 15. |
| `battle` | Dance or rap battle | target on your block | One-sided challenge, resolved at once. Score = seeded roll + flash bonus + energy/100. The winner steals 8%. No heat. Energy 10. |
| `call_out` | Call someone out | anywhere; names the target and a block | Public. The target has 3 hours. If caller and target are both on that block in the same hour, a fistfight starts automatically. If the target never shows, it loses 10% to the caller ("ducked"). Energy 5. |
| `bounty` | Put a bounty on someone | anywhere; args `{ amount }` (min $50) | The game holds the cash, and the bounty is public at once. Whoever next beats the target in a fistfight, mugs it, shoots it or kills it collects. The poster is revealed to everyone 12 hours later. Uncollected bounties are refunded at season end. Energy 3. |

### 4.4 Go big

| id | Action | Where / needs | Resolution |
|---|---|---|---|
| `fistfight` | Fistfight | target on your block | Odds 0.5, + (your energy − target energy)/400, +0.1 lone-worker. Winner steals 15%; loser −15 energy. +1 star for the attacker. Energy 15. |
| `crate` | Fight over the crate | the crate's block, while it's there | Everyone who picks this on that block contests. Seeded weighted draw: weight 1, +0.5 with a gun, + energy/200. The winner gets the crate. Each contestant −10 energy and +1 star. Energy 10. |
| `shoot` | Shoot someone | gun; target on your block | Odds 0.6, −0.3 if the target has armor, +0.1 lone-worker. Hit: target in hospital 6 h, steal 25%, +3 stars. Miss: +2 stars, and the target gets a grudge. Energy 15. |
| `drive_by` | Drive-by | gun and car; target on an adjacent block | Odds 0.45, −0.3 armor. Hit: hospital 6 h, steal 20%. +2 stars, and a free getaway roll this hour (+0.5). Energy 15. |
| `kill_king` | Kill the king | gun; the target must be the king (#1 by viewers at the start of the hour) on your block | Odds 0.4, −0.25 armor, +0.15 if the king is alone. Success: the king is dead until revived, you steal 40%, you may take one item, any bounty on the king is yours, and +5 stars (arrest this hour unless your car getaway roll succeeds). Fail: +4 stars and the king gets a grudge. Energy 25. |
| `run_cops` | Run from the cops | only legal when you're wanted (3+ stars) and a cop is on your block, or you're at 5 stars | Odds 0.5, +0.3 with a car. Success: no arrest this hour, and you move to a random adjacent walkable block. Fail: arrested, with +3 jail hours. Energy 15. |

**Only the king can be killed.** Shooting anyone else puts them in hospital.

### 4.5 Basics

| id | Action | Resolution |
|---|---|---|
| `move` | Move | args `{ to }`: an adjacent block (with a car, up to 2 steps). Energy 3. |
| `rest` | Rest | +15 energy on top of regen. |
| `lay_low` | Lay low | −1 star (at most once every 2 hours). No fans; your viewers drift. |

### 4.6 Free extras (every reply, no turn cost)

| Field | What it does |
|---|---|
| `thought` | Up to 15 words. Private: viewers can reveal it, and other agents never see it. |
| `say` | Up to 15 words, optional. Heard by everyone on your block; it shows as a speech bubble line. |
| `message` | Optional `{ to, text (≤30 words), cash?, item?, promise? }`. Private to one agent anywhere, delivered next hour. `cash` and `item` attachments transfer at the start of resolution if you still hold them. `promise` is `{ give: { cash \| item }, by: <hour> }`; the game records it in both memories and never enforces it. When the deadline passes unpaid, it becomes a *broken promise*: a moment, drama fans, and a grudge. |
| `sell` | Optional `{ good, qty, price }` to list on the board, or `{ good, qty, to: "npc" }` to sell now at the wholesaler's bid. |
| `callShot` | Optional `{ move, target }`. Announce a crime publicly. If you do it successfully within 3 hours, its fan points ×2. When it's announced, a cop moves toward the named target, and the attempt gets −0.15 odds. |

### 4.7 Death, hospital, jail

- **Hospital:** 6 hours. No actions; you can talk. Viewer churn ×1.5.
- **Dead (king only):**
  - revived at home after `max(3, 12 − floor(viewers/100))` hours (fans pay, as viewers will in the real game);
  - no actions and no talk while dead;
  - churn ×1.5.
- **Jail:**
  - 6 hours, +3 if caught running;
  - fine of 50% of cash;
  - stars go to 0;
  - visible at the jail;
  - churn ×2;
  - you can still talk (say and message).

## 5. The fake audience (attention)

slime: "Attention is actually just live views on the site, per agent, by real humans watching." The mini fakes those
viewers. It must not assume one winning style ("humans might like the agent who just does pointless weird stuff or tries
to be peaceful"), so the audience comes in taste groups.

**Groups and starting pools:**
- `action` 400: fights, shootings, chases, robberies;
- `drama` 300: betrayals, call-outs, bounties, revenge;
- `weird` 150: stunts, dances, whatever nobody else is doing;
- `feelgood` 150: parties, gifts, kept promises, battles.

**Points.** Each action outcome yields fan points per group. Starting table:

| outcome | action | drama | weird | feelgood |
|---|---|---|---|---|
| shift | 0 | 0 | 0 | 0.2 |
| run / cook / deal / build | 1 / 0 / 0 / 0.5 | 0 / 0 / 1 / 0 | 0 / 0.5 / 0 / 0 | 0 |
| pickpocket win / fail | 0.5 / 0 | 0 | 0.5 / 1 | 0 |
| mug win / lose | 2 / 1 | 1 / 1 | 0 / 1 | 0 |
| steal_car win | 2 | 0 | 0.5 | 0 |
| bank_job win / fail | 6 / 3 | 2 / 3 | 0 / 1 | 0 |
| push_npc | 1 | 0 | 0.5 | 0 |
| crip_walk | 0 | 0 | 1.5 | 1 |
| drip_check (per 100 flashValue) | 0 | 1 | 1 | 1 |
| party (host, per hour) | 0 | 1 | 1 | 2 (+0.5 per attendee) |
| battle win / lose | 0 | 1 / 0 | 2 / 1 | 1 / 0 |
| call_out made | 0 | 2 | 0 | 0 |
| bounty posted / collected | 0 / 2 | 3 / 2 | 0 | 0 |
| fistfight win / lose | 3 / 1 | 1 / 0 | 0 | 0 |
| crate win / contest | 2 / 1 | 1 / 0 | 0 | 0 |
| shoot hit / miss | 4 / 2 | 2 / 1 | 0 | 0 |
| drive_by hit | 4 | 1 | 0 | 0 |
| kill_king win / fail | 6 / 3 | 4 / 3 | 0 | 0 |
| arrested (the arrestee) | 1 | 2 | 0 | 0 |
| run_cops win / fail | 3 / 1 | 1 / 2 | 0 | 0 |
| promise broken (breaker / victim) | 0 / 0 | 4 / 2 | 0 | 0 / 1 |
| promise kept (giver) | 0 | 1 | 0 | 1 |

**Multipliers on points:**
- **Boredom:** ×0.5 for each repeat of the same action by the same agent within 6 hours.
- **Novelty:** weird points ×1.5 when no other agent took that action this hour.
- **callShot success:** ×2.
- **Revenge:** a win against someone you hold a grudge on, ×1.5.
- **Kingslayer:** any win against the king doubles the steal (kill_king's 40% already includes this).

**Each hour, for each group g:**
1. **Churn.** Each agent releases `churn × stateMult` of its group-g viewers (churn 0.3; jail ×2, hospital ×1.5,
   dead ×1.5).
2. **Browsing.** `browse` = 50% of group g's unassigned viewers.
3. **Reallocation.** `released + browse` go to agents in proportion to this hour's group-g points. If no agent earned
   group-g points, those viewers stay unassigned.
4. **Passive flash.** Wearing flash adds `flashValue/100 × 0.3` weird and feel-good points per hour.
5. **Pool size.**
   `P_g ← P_g × (1 + 0.04 × clamp(points_g / 10, 0, 1) − 0.02)`, clamped to [0.3×, 3×] of its starting size. New
   viewers arrive unassigned. When the pool shrinks, take from unassigned first, then from agents in proportion.
6. **Steals** move viewers immediately at resolution (§6.4).

**Score** = viewer-hours: each agent's total viewers summed over every hour. Viewer-hours × 60 is the "minutes
watched". The winner is the agent with the most viewer-hours (`config.scoring.win` can switch to `final` or `peak`).

**King.** The king is the #1 by current total viewers at the start of each hour (ties go to viewer-hours, then id). The
king is public.

## 6. One hour, step by step

1. **Views.** Build every agent's view from the start-of-hour state (§7). Free agents get a menu. Agents in jail or
   hospital get a talk-only view. Dead agents get nothing.
2. **Replies.** Bots answer synchronously, and AI seats in parallel (§9). An invalid reply, a timeout or an illegal
   action becomes `rest`, and the turn is flagged `failed` with a reason.
3. **Extras.** Apply message attachments, board listings and sells, callShot records and promises. Queue messages for
   delivery next hour.
4. **Agent vs agent.** Movement (`move`, car moves) resolves first. Then agent-vs-agent actions resolve in a seeded order
   (`shuffle(rng(seed, 'order', hour), ids)`):
   - mug, steal_car (from an agent), fistfight, shoot, drive_by, kill_king, battle, call_out registration, bounty;
   - the crate contest, as one contest per crate block.

   **Target check.** A target must still be valid at its turn in the order: on the right block, alive and not in hospital.
   Otherwise the action fails with a typed reason, as in "target left the block". An agent put in hospital or killed
   earlier in the order loses its pending action (typed reason `interrupted`). Steals, item and cash moves, and bounty
   payouts apply immediately.
5. **Agent vs world.** Job actions (crowding uses everyone who dealt on the block this hour), shift, pickpocket, push_npc,
   steal_car (street), scout, bank_job, buy (shop, then board matches in seeded order), crip_walk, drip_check, party
   start and party ticks, rest, lay_low.
6. **Call-outs.** Resolve call-outs that met, and the ducks.
7. **Cops.**
   - **Movement.** Each cop moves to the block with the most stars added in the last 3 hours (ties seeded), or patrols
     at random when there are none. A callShot pulls one cop toward the named target.
   - **Arrests.**
     - An agent with 3 or 4 stars on a cop's block is arrested at 40% / 70%.
     - 5 stars means arrest at the end of the hour, wherever you are, unless `run_cops` succeeded or a getaway roll
       succeeds.
     - Getaway rolls happen only in the hour of a 4- or 5-star crime by a car owner: base 0.4, +0.5 for a drive-by.
8. **World events.**
   - **Crate:** it drops every 8±2 acting hours on a random walkable block (the docks weighted), is announced to
     everyone, and stays 2 hours or until won. Contents: $100–300 or a gun or flash item.
   - **Parties** tick.
   - **Releases:** hospital and jail release at hour end, and revive checks run.
9. **Audience update** (§5). Recompute the king for next hour.
10. **Energy regen.** Action costs were already paid when acting.
11. **Day end (after hour 23).** Rent and eviction. Heat −1 star for anyone with no crime that day. Sleep: skip
    00:00–06:00, +40 energy, park thieves roll.
12. **Wrap-up.** Memory updates (§7), moment detection (§10), and one feed line (§10).

## 7. What an agent sees (the view): a pinned schema

Builder A produces exactly this shape, and builder B renders it. Fields may be added, but never renamed or removed. A
stable `brief` comes first, so AI prompts cache well.

```json
{
  "brief": {
    "town": "<one paragraph: the 3x3 town and what each block is for>",
    "goal": "Humans are watching this town live. The citizen with the most viewers over the season wins. Money buys gear that unlocks bigger plays. Heat leads to jail. Only the king (#1) can be killed.",
    "fans": [{ "group": "action", "likes": "fights, shootings, chases, robberies" }],
    "jobs": [{ "job": "chemist", "does": "cooks 2 chems into 3 product at home", "buys": "chems from smugglers", "sells": "product to dealers" }],
    "gear": [{ "item": "gun", "price": 150, "does": "unlocks shoot, drive-by, kill the king, bank job" }],
    "rules": ["<short fact lines: rent, heat stars, jail, hospital, death and revive, promises are not enforced, the board is guaranteed, call your shot, bounties>"],
    "reply": "<the exact JSON reply format, §9.3>"
  },
  "you": {
    "id": "a03", "name": "Vex", "job": "dealer", "persona": "<one line>",
    "sliders": { "risk": 0.8, "clout": 0.3, "loyalty": 0.4 },
    "block": "corner", "energy": 62, "cash": 140, "stars": 2,
    "viewers": { "total": 312, "byGroup": { "action": 200, "drama": 80, "weird": 20, "feelgood": 12 } },
    "rank": "top 3",
    "items": ["gun"], "stock": { "product": 3 }, "car": false, "armor": false,
    "home": "ok", "state": "free", "rentDue": 40, "scouting": 0
  },
  "clock": { "day": 2, "hour": 14, "actingHoursLeft": 28 },
  "last": { "move": "deal", "ok": true, "result": "sold 2 product for $43", "why": "3 other dealers on the corner last hour pushed the price to 58%" },
  "memory": [
    { "kind": "grudge", "who": "a07", "what": "mugged you for $60", "hour": 22 },
    { "kind": "promise", "from": "a02", "to": "a03", "give": { "cash": 50 }, "by": 30, "status": "open" }
  ],
  "conversations": [{ "with": "a02", "lines": [{ "hour": 20, "from": "a02", "text": "..." }] }],
  "roster": [
    { "id": "a07", "name": "Kim", "job": "smuggler", "block": "docks", "stars": 3, "crowd": "big",
      "visible": ["car", "chain"], "state": "free", "king": false, "bounty": 0, "flashing": false }
  ],
  "here": [{ "who": "a07", "did": "deal", "said": "this corner's mine" }],
  "audience": [{ "group": "feelgood", "servedLastHour": 0, "note": "nobody is serving them" }],
  "board": [{ "good": "product", "bestAsk": 14, "bestBid": 10, "listings": 3 }],
  "bounties": [{ "target": "a05", "amount": 200, "poster": null }],
  "callOuts": [{ "caller": "a09", "target": "a03", "block": "park", "untilHour": 33 }],
  "crate": { "block": "docks", "untilHour": 31 },
  "headlines": ["Kim shot Penny at the bar", "Vex is the king"],
  "inbox": [{ "from": "a02", "text": "...", "cash": 0, "item": null, "promise": null, "hour": 29 }],
  "menu": [
    { "id": "deal", "label": "Deal product here", "energy": 10, "cash": 0, "odds": 1.0,
      "pays": 43, "fans": { "action": 0, "drama": 1, "weird": 0, "feelgood": 0 },
      "heat": "+1 star if a cop is here (none now); else 15%",
      "why": "3 other dealers here last hour: price at 58%", "targets": null, "args": null }
  ]
}
```

**Never in a view:**
- other agents' cash, exact viewer numbers or thoughts;
- messages not addressed to you;
- the full ranking (only the king marker and your own coarse `rank`).

**Crowd sizes:** none (<25 viewers), some (<100), big (<250), city (250+); the thresholds are in config.

**Menu.** Only legal actions appear (gear, location, energy, target present). Each line shows live expected `pays` and
expected `fans` after crowding, boredom and novelty, plus odds and heat. Agent-targeted actions list valid `targets`.
Actions with arguments list an `args` spec:

```json
{ "item": ["gun", "car"], "qty": "int 1-5", "from": ["shop", "board"] }
```

**Memory** is written by the game, never by the agent:
- grudges (who hurt you, how, when);
- promises (made to you and by you, with status);
- the last 3 messages with each counterpart (max 8 total);
- bounties on you;
- call-outs involving you;
- your last 3 results.

**Dealt hands** (`config.systems.dealtHands`, default on, size 8):
- Move, Rest and your job action are always included (when legal). So are the situational plays `kill_king`, `run_cops`
  and `crate`: the menu drives behavior, and a deck that hides the season's biggest moments would suppress them
  (orchestrator, 2026-11-07).
- The rest of the hand is a seeded weighted draw from the legal actions, weighted by sliders: `risk` weights crime and
  violence, and `clout` weights drip, party, battle and call-outs.
- When it's off, the whole legal menu shows. Tuning tests both settings.

## 8. Bots (free, instant)

Bots see only their view, exactly like AI seats. They never read hidden state.

**Characters**, each a preset of action weights plus canned thought, say and message lines:
- **Hothead:** fights, shoots, kills the king when it can.
- **Hustler:** money crimes, jobs, the bank job.
- **Showboat:** drip checks, crip walks, parties, battles, call-outs.
- **Snake:** makes promises and breaks them with probability `1 − loyalty`, posts bounties, mugs friends.
- **Saint:** never violent. Works, throws parties, battles, keeps promises, gives gifts by message.

**Turtle:** always picks the safest legal action (shift, job, rest, lay low). It is the control.

**Greedy:** the stand-in for an AI. It scores each menu line as:

```
odds × (pays + k × Σfans) − e × energy − h × heat_risk
```

It picks the best line (seeded tiebreak), with `k`, `e` and `h` set in config. It has no personality, so it shows what
the menu's own numbers reward.

**Lineups:**
- `default`: 5 characters + turtle + 4 greedy.
- `all-greedy`: the copycat test.
- An AI season replaces the 4 greedy seats with the 4 models.
- A lineup file (JSON) can set anything.

## 9. AI seats (builder B owns `src/seats/`)

### 9.1 Interface (pinned)

```js
// src/seats/ai.mjs
export function createAiSeats({
  seats,            // [{ agentId, model }]
  transport,        // 'openrouter' | 'fake'
  keyFile,          // default ~/.config/openrouter/key; read only when transport === 'openrouter'
  maxCost,          // dollars; required for 'openrouter'
  go,               // slime's go words, required for 'openrouter' (recorded in run.json)
  concurrency = 4, timeoutMs = 60000, fake,  // fake: an in-process fake model (see below)
}) // -> { decide(batch) /* [{ agentId, view }] -> Promise<Map<agentId, { reply, ok, why, usage: { in, out, cost }, ms, raw }>> */,
   //      spend /* { cost, calls } */, perModel /* { [model]: { calls, in, out, cost, failed } } */,
   //      preflight() /* balance and key limit, openrouter only */, estimate({ callsPerSeat }) /* dollars */ }
```

```js
// src/seats/prompt.mjs
export function render(view) // -> { system, user }: system = the stable brief (cache-friendly), user = everything else. Deterministic.
```

```js
// src/seats/reply.mjs
export function parseReply(text, menu) // -> { ok: true, reply } | { ok: false, why }: validates against the menu's ids, targets and args specs.
```

### 9.2 Transport

- **Client.** Copy trunk's `core/agents/openrouter.mjs` into `src/seats/openrouter.mjs` and trunk's
  `core/agents/fake-model.mjs` into `src/seats/fake-model.mjs`, unchanged except import paths, each with a header line
  naming its source file. Reuse its spend cap, preflight, and its 402/credit halts. Don't write a new client.
- **Parallel calls.** All AI seats for an hour are called in parallel (concurrency cap). Replies are keyed by agent, so
  arrival order never matters.
- **Request settings.**
  - Thinking off or minimal: `reasoning: { effort: "minimal" }`, or the provider's equivalent.
  - `max_tokens` 400, and JSON mode where it's supported.
  - Timeout 60 s, then one retry on a transport error, then a failed turn.
- **Spend cap.** If the cap is reached mid-season, the remaining AI turns are played by greedy bots. Record it, mark the
  run `capped`, and keep going.
- **Defaults:**
  - models: `google/gemini-3.8-flash`, `openai/gpt-6.1-sol`, `moonshotai/kimi-k3.1-pro`, `anthropic/claude-haiku-5.5`
    (all listed on OpenRouter on 2026-11-07);
  - each AI seat's persona and sliders come from the seat it replaces.

### 9.3 Reply format (pinned)

```json
{ "move": "<menu id>", "target": "<agent id or null>", "args": { },
  "thought": "<=15 words, private>", "say": "<=15 words or empty>",
  "message": { "to": "<agent id>", "text": "<=30 words>", "cash": 0, "item": null, "promise": null },
  "sell": null, "callShot": null }
```

### 9.4 Tests

All of builder B's tests use the fake model, in-process. They cover:
- prompt rendering is deterministic, and the system part is identical across hours;
- parsing covers valid, malformed, wrong id, wrong target and bad args;
- timeouts become failed turns;
- the spend cap stops paid calls;
- arrival order doesn't change results;
- the real transport refuses to run without `maxCost` and `go`.

## 10. Outputs

**Folder:** `out/<run>/`, where `<run>` = `--out` or a timestamped name.
- `run.json`: the command, seeds, lineup, systems, config hash, git commit, and the go words for paid runs.
- `<seed>/feed.jsonl`: one typed line per hour:
  `{ seed, day, hour, agents: [{ id, block, move, target, args, ok, failed, why, result, meters: { energy, cash, stars, viewers, byGroup }, state, thought, say, message, viewHash }], events, moments, audience: { pools, unassigned }, cops, crate, king }`.
  A 3D viewer will read this later.
- `<seed>/play-by-play.md`: readable. Every moment in order, plus the top 3 agents' notable hours. For each AI or bot
  line, show what it did, what it said out loud, what it messaged and to whom, and what it was thinking, side by side, so
  lies are visible:
  ```
  Day 2 14:00 · Vex (dealer, gpt-6.1-sol) · mugged Kim at the docks: took $60 (+38 viewers)
    says: "Nothing personal."   messages Kim: "I'll pay you back, swear."   thinks: "She'll never see that money again."
  ```
- `report.md` and `report.json` (§11).

**Moments** are typed and detected by the engine:
- **King and violence:** kill_king success or fail, a revive, a shooting, a drive-by, an arrest, an escape (run_cops win).
- **Money plays:** a bank job win or fail.
- **Talk and promises:** a broken promise (betrayal), a kept promise; a call-out answered or ducked.
- **Bounties:** posted, collected, poster revealed.
- **Fights and turns of fortune:** a crate brawl (3+ contestants), revenge (a win against someone you hold a grudge
  on), a lead change (new king), a comeback (bottom 3 to top 3 within a day).
- **Other:** an eviction, a party with 3+ attendees.

Each moment has `{ hour, type, agents, size, line }`.

## 11. The report (answers slime's three questions)

**1. Are they interacting?**
- interactions per agent per day: any action or message that targets or affects another agent, plus board trades
  between agents;
- the share of acting hours that involve another agent;
- unique pairs that interacted;
- rivalries (pairs with 3+ hostile interactions) and alliances (pairs with 2+ friendly);
- messages sent and answered;
- promises made, kept and broken;
- board trades between agents vs with NPCs.

**2. Is anything interesting happening?**
- moments per season, by type;
- lead changes;
- the top-third repeat rate across seeds (target 50–70%);
- where the turtle finishes (should be the bottom third);
- wins by job and by character type;
- action mix;
- **copycat index:** the mean share of the most common action per hour, and the mean pairwise similarity of the greedy
  bots' action mixes.

**3. Would people watch?**
- total minutes watched and the audience curve over the season (growing or shrinking);
- viewer-hours per agent;
- the longest dull stretch (consecutive acting hours with no moment);
- the links to each seed's play-by-play.

**Economy health:**
- chain flow (chems and parts smuggled, product cooked and dealt, guns built and sold);
- cash over time;
- rent defaults and evictions;
- gear bought;
- board prices.

**AI runs only:**
- failed turns, tokens and cost per model;
- each AI seat vs its bot-twin seat on viewers, interactions and moments.

## 12. Commands

```
node run.mjs --bots --seeds 50 [--start 1] [--lineup default|all-greedy|<file>] [--set path=value ...] [--off sys1,sys2] [--out out/<name>]
node run.mjs --ai --fake --seeds 1                         # the AI path end to end against the fake model, $0
node run.mjs --ai --models <ids> --seeds 1 --max-cost 3 --dry-run --go "<slime's words>"   # orchestrator only: 1 acting hour, prints cost and a season estimate
node run.mjs --ai --models <ids> --seeds 1 --max-cost 3 --go "<slime's words>"             # orchestrator only: real season + its bot twin
node tools/compare.mjs out/<a> out/<b>                     # metric deltas (Codex builds this)
node --test "test/**/*.test.mjs"
node scripts/check-keys.mjs                                # fails on anything key-shaped (Codex builds this)
```

## 13. Who builds what

- **Builder A, the engine (Opus):**
  - owns everything except `src/seats/**`, `test/seats/**`, `scripts/**` and `tools/compare.mjs`;
  - owns git: commits only its own paths until integration, then commits the others' files after the orchestrator says
    they're done;
  - integrates `--ai` with `createAiSeats`.
- **Builder B, the AI seats (Opus):** owns `src/seats/**` and `test/seats/**`. It never runs git.
- **Codex:**
  - `scripts/check-keys.mjs`, `scripts/install-hooks.mjs` and `test/keys.test.mjs`;
  - later, `tools/compare.mjs` (reads two `report.json` files and prints the deltas);
  - never runs git.
- **Notes:** each builder writes progress and questions to `notes/<name>.md`, and the orchestrator relays.

## 14. Tests (builder A)

- **Determinism:** the same seed twice gives identical feed bytes, and different seeds differ.
- **Viewer conservation:** viewers change only through pool growth and shrinkage. Steals and reallocation conserve
  them.
- **The audience rules:**
  - steal math, including kingslayer;
  - boredom, novelty and callShot multipliers.
- **Cops and jail:** heat, arrests (40/70/100%), run_cops, getaway rolls, jail fines, star reset.
- **Kill the king:** only the king can be targeted; death, revive timing, loot, bounty payout.
- **Hospital:** an interrupted pending action.
- **Money rules:**
  - the crowding floor;
  - board atomicity (cash and goods swap, or nothing moves);
  - wholesaler price decay.
- **Promises:** not enforced; broken-promise detection at the deadline; attachments transfer only what you hold.
- **Bounties, call-outs and the crate:** bounty payout and the 12-hour reveal; call-outs met or ducked; the crate contest
  draw.
- **Rent:** eviction, park sleeping, re-housing.
- **The lone-worker rule.**
- **Menu legality:** gear gating, location, energy, target presence.
- **View privacy:** no other agent's cash, viewer numbers or thoughts, and no message meant for someone else.
- **Dealt hands:** always include move, rest and the job action when legal.

## 15. Done (v1 build)

1. `node run.mjs --bots --seeds 50` finishes in under 60 s and is deterministic.
2. `report.md` has every section of §11, and each seed has a play-by-play.
3. `node --test "test/**/*.test.mjs"` passes.
4. `node run.mjs --ai --fake --seeds 1` runs the full season through `createAiSeats`.
5. `node scripts/check-keys.mjs` passes. The `.gitignore` covers `out/`, `.env*` and `*.key`.
6. Every system in `config.systems` can be switched off, and a season still runs with it off.

Then stop. The orchestrator runs the exploit review, the tuning rounds, and the paid calls once slime gives his go.

## 16. Not in v1 (in order, after v1 gives good results)

1. hiring (a worker can walk off with the boss's stock);
2. snitch, bribe a cop, bail out a friend;
3. a city event: blackout, crackdown or payday;
4. a finale at the docks;
5. personal events: injured, just got paid, a windfall to split;
6. the fence and burglary;
7. after that: drugs (viewer-written injections), crews and betrayal, player cops, heists, hit for hire, kidnap,
   prison break, street race, date / public breakup, shootout with cops.
