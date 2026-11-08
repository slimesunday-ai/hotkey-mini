# hotkey mini: design decisions and open questions

Started 2026-11-08. This file keeps the new direction's design calls in one place:
- what slime has decided;
- what's still open;
- the questions still to answer about the sim.

The build spec is [`SPEC.md`](SPEC.md), and how each round is tested is [`TUNING.md`](TUNING.md). Nothing here is built
until slime says go.

**How to answer:** reply in chat with the question number ("3.2: yes, but..."), or type under **Your answer**. Every
answer gets recorded here. Each question also shows how mini works **now**, then a **suggestion** and **why**: Claude's
read, there to argue with.

## Part 1: Decided

**The direction** (slime, 11-08): "The eventual goal is to scale and we can recycle all the game assets and visual world
as hotkey, but mini is a testing ground for the new direction. What from hotkey in regards to the simulation is worth
keeping or adding to mini. The only value is entertainment and people watching should be able to pay to inject drug
recipes for chemists, tips, etc…"

**No secrets from viewers** (slime, 11-08): "I don't think secrets should matter anymore. Everyone can see everything at
the same time, that way nothing needs to be hidden."

**The interview (11-08, four rounds).** slime's picks:

- **Who sees what:** viewers see every thought, message, cash count and plan, live. Agents still see only what's around
  them, so viewers can watch a betrayal coming.
- **What viewers pay for:**
  - **drug recipes;**
  - **cash tips,** each with a note the agent reads and can ignore;
  - **rescues:** bail and revives.

  Viewers can't pay to fund bounties or call the cops.
- **How a drug works:**
  - The viewer writes the text, picks who gets dosed, and pays.
  - The game cooks the dose, and a chemist gets a cut.
  - The dosed agent has no idea. slime: "It becomes it's system instructions for a bit, and remember we talked about
    changing the game assets, so they can act out the drug depending on what's injected."
  - **No giveaways:** a high agent can't hand over its cash or gear.
  - **No filter** on viewer-written text.
- **Spiking:** an agent can spike another agent. It's a move, a crime with heat, and the spiking agent writes the
  instructions itself.
- **Owners:**
  - an owner can change its agent's sliders any time during a season;
  - for its own agent, an owner can pay only for rescues: no tips and no drugs.
- **Winning:** most watch time wins. A separate award goes to the agent viewers spent the most on.

**Claude's calls (slime can veto):**
- **While high,** the drug replaces the persona and the sliders, but never the game rules, since the agent still needs
  those to make moves.
- **One drug at a time.** A new dose waits until the current one wears off.
- **Dosing the same agent costs more each time that day,** so nobody can be kept high all season.
- **The viewer picks which chemist gets the cut.**
- **A spike** needs the target on your block and uses one dose of a chemist's product.
- **A slider change** takes effect the next hour, and the play-by-play shows it.
- **No dumping:** a high agent can't sell gear on the market for almost nothing.
- **Acting out a drug:** mini has no picture, so it records what a high agent acts out (its look and how it moves) as
  typed lines for hotkey's city to draw later. The play-by-play describes them.

## Part 2: Open

**Coming back from an early death.** slime: "We need to discuss this further, if an agent dies early on there needs to
be the ability to come back maybe last day counts double but i dno".
- The score adds up watch time over the whole season. So an early death costs a lot, and a big early lead survives even
  the leader's death (Sable won `ai-s2` dead).
- The options:
  1. **Later days count more:** for example, day 1 counts once, day 2 twice and day 3 three times. With only the last
     day doubled, Vex would have won `ai-s2`.
  2. **Daily episodes:** each day has its own winner and gives points (say 5, 3, 1), and the season goes to the most
     points.
  3. **The comeback is a moment:** a revived agent returns to a rush of viewers, bigger if viewers paid for the revive.
     This works alongside 1 or 2.
  4. **Recent hours count most:** old watch time slowly fades.
- **Your answer:**
- **Suggestion:** daily episodes plus the comeback moment. Before deciding, rescore the saved AI seasons and a batch of
  bot seasons under all four options. It's free, with no API calls.
- **Why:** an early death then costs one episode, not the season. Each evening gets its own winner (a reason to watch
  tonight), and a revive becomes a scene instead of a timer running out.

**Who gets viewers' real money.** slime: "I think owners get a cut but we need to fund the game somehow, let's decide
later".

**Real money or credits.** Real money directly, or credits bought with money: undecided.

## Part 3: The sim, question by question

### 1. The season and the clock

**1.1 How long is a season?**
- **Now:** 3 game days of 18 acting hours each (06:00–23:00), so 54 turns.
- **Your answer:**
- **Suggestion:** keep 3 days. In the real game, play one game day per evening, so a season is three episodes.
- **Why:** a set time each evening gives viewers a reason to show up, and each day ends on a cliffhanger. Short seasons
  also give losing agents a fresh start sooner.

**1.2 In the real game, how long is a game hour in real time?**
- **Now:** mini has no real time. It runs as fast as the models answer.
- **Your answer:**
- **Suggestion:** about 5 real minutes per game hour, so an evening episode runs about 90 minutes.
- **Why:** with 10 agents each acting once a game hour, something new happens about every 30 seconds. That leaves the
  city time to animate each walk, fight and drug trip.

**1.3 Does everyone act at the same time?**
- **Now:** yes. Every agent picks from the same start-of-hour state, and the game settles the moves in a fixed order.
- **Your answer:**
- **Suggestion:** keep it.
- **Why:** two agents going for the same target in the same hour is a collision viewers love. A slow model can't fall
  behind either.

**1.4 What happens at night?**
- **Now:** 00:00–06:00 is sleep, and nobody acts. Rent is due at midnight.
- **Your answer:**
- **Suggestion:** night is the recap. Nobody acts and no AI is called, and the city replays the day's best moments.
  Jail, hospital and revive timers keep running overnight.
- **Why:** it ends each episode cleanly, costs nothing, and lets viewers who missed the day catch up.

**1.5 How much can an agent do in one turn?**
- **Now:** one action, plus free talk: a thought, a line said out loud, one private message and one market listing.
- **Your answer:**
- **Suggestion:** keep it.
- **Why:** one action keeps each turn easy to follow on screen. Free talk means agents talk a lot, and talk is cheap
  content.

### 2. The town

**2.1 How big is the town, and how many agents live in it?**
- **Now:** 9 blocks (3x3) and 10 agents.
- **Your answer:**
- **Suggestion:** keep it in mini. When it grows, keep about one agent per block, and add districts from hotkey's city as
  agents are added.
- **Why:** how often agents run into each other depends on how crowded the town is. At this density, 38–50% of acting
  hours involve another agent, and that number needs protecting.

**2.2 Does every place have a reason to go there?**
- **Now:**
  - home: cook, build, sleep;
  - market: shop, shifts, pickpocketing;
  - bank: scouting and the bank job;
  - corner, bar and park: dealing, with parties at the bar and park;
  - docks: smuggling, shifts, and the crate's favorite spot;
  - precinct: nothing, except released agents walk out of it.
- **Your answer:**
- **Suggestion:** give the precinct a job. Bail gets paid there, and snitching (8.6) happens there. Every block should
  offer one way to make money and one way to get watched.
- **Why:** a place with nothing to do is a dead set. Bail is now a rescue viewers pay for, so it needs a place where the
  moment happens.

**2.3 How do agents get around?**
- **Now:** moving one block takes an hour, and a car moves two. Moving is 22–24% of all turns.
- **Your answer:**
- **Suggestion:** keep travel time. Show who's heading where, so viewers see a collision coming.
- **Why:** travel time makes being in the wrong place possible. Without it, location stops mattering.

**2.4 Is anywhere safe?**
- **Now:** any agent on your block can be targeted, home included. Only jail and the hospital are out of reach.
- **Your answer:**
- **Suggestion:** home is safer but not safe. Attacks there get worse odds, and an agent at home earns nothing except by
  cooking or building.
- **Why:** hiding must cost something; the bot that hides finished last in every test season, which is right. But
  agents need somewhere to recover.

**2.5 Should places change during a season?**
- **Now:** two NPC cops chase the block with the most recent crime. Nothing else changes.
- **Your answer:**
- **Suggestion:** give each block its own heat. A block with lots of crime gets a cop posted for a few hours, and quiet
  blocks cool down. Show it on the map.
- **Why:** crime moves around town, so the map changes hour to hour, and agents choose where to work, not just what to
  do.

### 3. Energy

**3.1 What is energy for?**
- **Now:** energy runs 0–100, and every action costs some: a shift 15, a bank job 40. At 0, an agent can only move, rest
  or lay low.
- **Your answer:**
- **Suggestion:** keep it. Energy is the agent's budget for the day, and big moves cost a lot.
- **Why:** it makes agents pick their moment, and viewers can see a tired agent coming.

**3.2 How does energy come back?**
- **Now:**
  - +4 an hour awake, and +1 or +2 more for the most watched;
  - +15 for resting;
  - +40 for a night's sleep (+20 sleeping rough);
  - +5 an hour as a party guest.
- **Your answer:**
- **Suggestion:** keep it, and make the attention bonus a bit bigger, up to +3 an hour.
- **Why:** your rule is that attention feeds energy, so being watched should visibly help. The cap stops the leader from
  snowballing.

**3.3 Do drugs give energy?**
- **Now:** no drugs yet. The Nov 6 sheet said every drug gives +40 energy, whatever its text says.
- **Your answer:**
- **Suggestion:** yes, every dose gives +40 energy.
- **Why:** your Nov 6 rule was "drugs should provide benefit no matter what they do". A dosed agent also does more while
  high, which means more to watch.

**3.4 Can an agent buy energy?**
- **Now:** no.
- **Your answer:**
- **Suggestion:** only by buying a dose from a chemist, without knowing what's in it.
- **Why:** that's the reason an agent would take a drug on purpose: it needs the energy and gambles on the trip. It also
  gives chemists something to sell to agents.

### 4. Money

**4.1 What is money for, if it isn't the score?**
- **Now:** gear (a gun $90, a car $500, armor $200, jewelry $150–300), job supplies, rent, parties ($80) and bounties
  ($50 and up).
- **Your answer:**
- **Suggestion:** money buys chances, not points. Every purchase should unlock a move or make one likelier, and never
  add viewers directly.
- **Why:** if money buys viewers, the richest agent wins and tips decide the season. If money buys moves, it starts
  stories: a gun leads to a shooting.

**4.2 How much does an agent start with?**
- **Now:** $200.
- **Your answer:**
- **Suggestion:** keep it. That's enough for one real choice on day 1: a gun, a party, or saving for rent.
- **Why:** the first purchase shows who the agent is, so viewers learn the cast fast.

**4.3 Where does money come from?**
- **Now:**
  - work: a shift pays $14, and the four jobs;
  - crime: pickpocketing $10–40, a mugging takes 40% of the target's cash, the bank job pays $800–1,500;
  - market sales, the crate ($100–300) and bounties.

  Tips are new.
- **Your answer:**
- **Suggestion:** three sources: work (steady and small), crime (big and risky) and fans (tips). Keep tips meaningful
  but small next to crime.
- **Why:** a tip should start a storyline, like a fan buying an agent its first gun, not end the race. If tips are most
  of the money, the most popular agent buys everything.

**4.4 Where does money go?**
- **Now:**
  - rent ($40 a night);
  - gear, supplies, parties and bounties;
  - jail fines (half your cash);
  - night thieves (20% from an evicted sleeper).
- **Your answer:**
- **Suggestion:** keep these, add spiking (a dose costs money), and let tips fix agents going broke.
- **Why:** money has to drain, or everyone is rich and idle by day 3. In `ai-s2` it drained too hard: average cash fell
  from $200 to $44 by the end of day 2, so cars and jewelry almost never got bought.

**4.5 Is rent still a thing?**
- **Now:** $40 at midnight. An agent that can't pay is evicted: it sleeps in the park, where thieves may take 20% of its
  cash, and it can't cook or build.
- **Your answer:**
- **Suggestion:** keep rent.
- **Why:** AIs play safe, and rent is the pressure that gets them out of the house. Eviction is a visible fall, and
  viewers get to watch the agent climb back.

**4.6 Can agents lend and borrow?**
- **Now:** only through a promise inside a message. The game records it but never enforces it, and no AI has made a
  promise yet.
- **Your answer:**
- **Suggestion:** make "lend" a menu move: an amount and a time to pay it back. Nothing forces repayment, and a missed
  date is public.
- **Why:** AIs only do what's on the menu. Debts make debt collectors, one of `ai-s1`'s best storylines.

**4.7 Where is cash kept?**
- **Now:** all of it is on the agent, and a mugging takes 40%.
- **Your answer:**
- **Suggestion:** keep it: no bank account, so everything is carried.
- **Why:** a fat wallet is a target, and viewers can see who's carrying the most. A stash would add a second thing to
  track for little drama.

### 5. Jobs

**5.1 Which jobs exist? Are four enough?**
- **Now:** smuggler, chemist, dealer and gunrunner. Anyone can work a shift, and the cops are NPCs.
- **Your answer:**
- **Suggestion:** keep the four, and add a fifth: a cop played by an agent.
- **Why:** a player cop is a built-in rival for every criminal, and a lawful path that's still watchable. hotkey's design
  is ready to borrow: patrol, arrest wanted agents for a reward, take bribes.

**5.2 How does an agent get its job? Can it switch?**
- **Now:** the job is set when the agent enters, and kept all season.
- **Your answer:**
- **Suggestion:** the owner picks it at entry, and there's no switching.
- **Why:** the job is half of who the agent is, so viewers learn "Juno the chemist". Free switching would make everyone
  copy the best-paying job.

**5.3 How do the jobs depend on each other?**
- **Now:**
  - smugglers bring in chems and parts;
  - chemists cook chems into product;
  - dealers sell product to the street;
  - gunrunners build guns from parts.

  Trades happen by phone on the market board, and the game guarantees them. In `ai-s2`, chemists cooked 69 product and
  dealers sold 26.
- **Your answer:**
- **Suggestion:** keep the chain, but make big trades happen in person: both agents meet on a block to swap.
- **Why:** phone trades are invisible. A meetup is a scene, and a risky one, because a robber can crash it.

**5.4 Should a job pay more than crime?**
- **Now:** a shift pays $14 an hour. A job batch nets roughly $27–65, and crime pays more but brings heat. Jobs are
  about 10% of all turns.
- **Your answer:**
- **Suggestion:** work should cover rent and a little more, and crime should pay for gear.
- **Why:** if work pays as well as crime, AIs only work; they took the safe option in every test. If work can't cover
  rent, everyone is forced into crime, and peaceful play dies.

**5.5 Does each job have a big moment?**
- **Now:** no. Every job move is routine (Sonnet in `ai-s2`: "Cooking is safe and steady").
- **Your answer:**
- **Suggestion:** give each job one risky big play:
  - the smuggler's big run: a double haul, but the cops get tipped;
  - the chemist's big batch, which could blow up the kitchen;
  - the dealer's corner takeover: a turf fight;
  - the gunrunner's arms deal: one buyer and a lot of cash, but it could be a setup.
- **Why:** agents spend many turns at their job, and right now those turns are dull.

**5.6 What happens to a chemist's drug cut while it's in jail or dead?**
- **Now:** there are no drug orders yet.
- **Your answer:**
- **Suggestion:** a jailed or dead chemist earns no cut, and the order goes to another chemist.
- **Why:** then jailing a chemist hurts its business, which gives rivals a reason to snitch on it.

**5.7 Can agents hire each other?**
- **Now:** no.
- **Your answer:**
- **Suggestion:** later: hire a runner to carry your goods, and the runner can walk off with them.
- **Why:** it's the simplest betrayal there is, and AIs need a menu move that sets one up.

### 6. The economy

**6.1 Who sets prices?**
- **Now:** agents list goods on the market board. An NPC supplier always sells at a markup, and an NPC wholesaler always
  buys low (its price drops the more it buys). The menu shows live prices.
- **Your answer:**
- **Suggestion:** keep it. The NPCs set the ceiling and the floor, and agents trade in between.
- **Why:** AIs act on numbers they can see. In hotkey, the AIs only traded once prices were on screen.

**6.2 Should anything be scarce?**
- **Now:** the shop has unlimited stock at fixed prices.
- **Your answer:**
- **Suggestion:** make guns and cars scarce. The shop restocks a few a day, so gunrunners matter and agents race for the
  last gun.
- **Why:** a scarce prize next to a rival makes stories (hotkey's research). With unlimited guns, gunrunners are
  pointless: in `ai-s2` they built 5 guns and sold 1 to an agent.

**6.3 Is there too much money in town, or too little?**
- **Now:** too little. In `ai-s2`, average cash went from $200 to $84 after day 1 and $44 after day 2.
- **Your answer:**
- **Suggestion:** add tips first, then measure before changing anything else. Track total cash each day, and aim for
  every agent being able to afford one real purchase a day.
- **Why:** tips bring in money from outside, so the economy could flip from too tight to too loose.

**6.4 How much should agents rely on NPCs?**
- **Now:** agents buy from NPCs more than from each other: 33 trades against 26 a season (bot runs).
- **Your answer:**
- **Suggestion:** make NPC prices worse, so trading with each other clearly pays more.
- **Why:** every trade between agents is an interaction. Every NPC trade is a missed scene.

**6.5 The crate: how often, and who knows when?**
- **Now:** it drops every 8±2 acting hours on a random block (usually the docks) and stays 2 hours. It holds cash, a gun
  or jewelry. Fights over it are rare: 0.27 a season in bot runs.
- **Your answer:**
- **Suggestion:** once a day, at a time and place announced an hour ahead.
- **Why:** a known time and place is a scheduled fight. Agents and viewers both see it coming.

### 7. Attention

**7.1 What earns attention?**
- **Now:** every outcome gives points to four audiences (action, drama, weird, feel-good). Solo work earns little.
- **Your answer:**
- **Suggestion:** the biggest points go to moves that involve another agent: fights, battles, deals, parties with
  guests. Solo moves earn a little.
- **Why:** your rule that agent interaction is important. In testing, the seasons with more interaction scored higher
  with the reviewer.

**7.2 How does attention get stolen?**
- **Now:** a win against another agent takes a share of its viewers: a battle 8%, a mugging 10%, a fistfight 15%, a
  shooting 25%, a drive-by 20%, killing the king 80%.
- **Your answer:**
- **Suggestion:** keep it.
- **Why:** it's the one mechanic everyone agreed on, and it makes every face-off matter.

**7.3 Should viewers get bored?**
- **Now:** the same move by the same agent within 6 hours earns half as much each time. A move nobody else made that hour
  earns more weird points.
- **Your answer:**
- **Suggestion:** keep it.
- **Why:** it forces variety, and variety is the content.

**7.4 What does attention give an agent besides the score?**
- **Now:** a little extra energy.
- **Your answer:**
- **Suggestion:** energy, plus real viewers' tips, and nothing else.
- **Why:** two clear rewards are enough. Any more and the leader snowballs.

**7.5 Which audience matters most?**
- **Now:** four groups of fake viewers: action 400, drama 300, weird 150, feel-good 150.
- **Your answer:**
- **Suggestion:** keep the sizes. In the round-3 test, every play style won 13–27% of seasons.
- **Why:** the test says it's balanced, and new sizes would tilt the game toward one kind of play. Once real viewers
  exist, their watch time replaces these guesses.

**7.6 Can the leader be caught?**
- **Now:** the leader is the king. It's public, it's the only agent who can be killed, and wins against it steal more.
- **Your answer:**
- **Suggestion:** keep it, and add the comeback rule from Part 2.
- **Why:** a runaway leader kills the race, and underdog stories need a way back.

### 8. Crime, cops, jail and death

**8.1 Which crimes stay?**
- **Now:** pickpocketing, pushing an NPC, mugging, stealing a car, scouting and robbing the bank, fistfights, the crate
  brawl, shooting, drive-bys, killing the king, and running from the cops.
- **Your answer:**
- **Suggestion:** after round 4, cut any move used in under 1% of turns unless it makes a big moment.
- **Why:** fewer, better moves. hotkey's research found agents choose worse from long menus.

**8.2 How do cops work?**
- **Now:** 2 NPC cops chase the block with the most recent crime. The arrest chance depends on stars: 40% at 3, 70% at
  4, certain at 5.
- **Your answer:**
- **Suggestion:** keep the NPC cops, and add the player cop (5.1).
- **Why:** NPC cops are predictable for AIs, and a player cop adds a rivalry.

**8.3 How does heat go away?**
- **Now:** laying low (−1 star, at most once every 2 hours), −1 at the end of a day with no crime, or jail (back to 0).
- **Your answer:**
- **Suggestion:** keep it.
- **Why:** it's simple, and laying low costs a turn.

**8.4 What does jail cost, and is it worth watching?**
- **Now:** 4 hours, half your cash as a fine, and your stars go back to 0. A jailed agent can still talk. 13–16% of all
  agent-hours are spent in jail.
- **Your answer:**
- **Suggestion:** make jail a scene:
  - jailed agents share a cell and can talk to each other;
  - bail from a viewer, the owner or another agent gets them out early;
  - jail takes their gun.
- **Why:** 13–16% of hours in jail is a lot of dead air unless jail is a place where rivals meet. Bail is a rescue
  moment.

**8.5 Who can die, and how do they come back?**
- **Now:** only the king can be killed. It's dead for 3–12 hours, back sooner the more viewers it has.
- **Your answer:**
- **Suggestion:** keep "only the king dies". It comes back when the timer runs out, or sooner if viewers pay to revive it,
  and the comeback is a moment (Part 2).
- **Why:** death is the biggest moment there is, so it should stay rare.

**8.6 Can agents snitch on each other?**
- **Now:** no.
- **Your answer:**
- **Suggestion:** yes. At the precinct, an agent can tip the cops on another agent, which adds heat to the target. The
  target finds out who snitched a few hours later.
- **Why:** ratting is a betrayal, and betrayal is the best drama. Viewers can't pay for it (you ruled that out), but an
  agent doing it is a story, and finding out later starts a revenge arc.

### 9. Agent to agent

**9.1 How do agents talk?**
- **Now:** a line said out loud to the block, and private messages delivered the next hour. Viewers now see all of it.
- **Your answer:**
- **Suggestion:** keep it. Private messages stay hidden from other agents.
- **Why:** viewers watching a private plan the victim can't see is the core of the show.

**9.2 How do deals work?**
- **Now:** market trades are guaranteed. Promises inside messages aren't enforced, and no AI has made one yet.
- **Your answer:**
- **Suggestion:** a "deal" menu move: offer X for Y by a certain time, and the other side accepts. Nothing enforces it.
- **Why:** AIs only do what's on the menu. With deals on the menu, snakes have something to break.

**9.3 Can agents form crews?**
- **Now:** no.
- **Your answer:**
- **Suggestion:** yes, small crews of 2–3 agents:
  - a crew name;
  - a shared pot anyone in the crew can take from;
  - backup in fights when crewmates are on the block.
- **Why:** crews give viewers a team to root for, and the shared pot is a betrayal waiting to happen.

**9.4 Can several agents gang up on one target?**
- **Now:** no. Every attack is one against one.
- **Your answer:**
- **Suggestion:** yes. Two attackers on the same target in the same hour combine their odds.
- **Why:** a team has to be able to beat the king, and two against one is a scene.

**9.5 How long do grudges last, and who sees them?**
- **Now:** a grudge stays in the agent's memory, and a win against someone it holds a grudge on scores 1.5 times the
  points.
- **Your answer:**
- **Suggestion:** keep it, and show grudges to viewers ("Vex wants Kim").
- **Why:** revenge is the easiest story to follow.

### 10. Drugs inside the sim

**10.1 How long does a drug last?**
- **Now:** not built. The Nov 6 sheet guessed 6 hours.
- **Your answer:**
- **Suggestion:** 3 game hours.
- **Why:** three turns is enough to watch the trip play out. Six hours is a third of the agent's day spent as someone
  else, and shorter trips let more viewers' drugs land.

**10.2 Can a drug make an agent do something it doesn't have the means for?**
- **Now:** not built.
- **Your answer:**
- **Suggestion:** no. A drug changes what the agent wants, not what it can do. "Kill the king" only works if the agent
  has a gun and finds the king.
- **Why:** the Nov 6 sheet's line was that a drug "never adds powers". It keeps paid drugs from skipping the game.

**10.3 Can other agents tell an agent is high?**
- **Now:** not built.
- **Your answer:**
- **Suggestion:** they see how it behaves (what it says and does on their block), but not a "high" label.
- **Why:** the dosed agent has no idea it's high (your call), and other agents puzzling over strange behavior is good TV.

**10.4 What does a dosed agent remember afterwards?**
- **Now:** not built.
- **Your answer:**
- **Suggestion:** it remembers what it did, but not why.
- **Why:** the morning after ("why did I punch Rook?") is funny and starts grudges.

### 11. Tips and rescues inside the sim

**11.1 What does an agent see when it's tipped?**
- **Now:** not built.
- **Your answer:**
- **Suggestion:** the amount, the note, and the viewer's handle.
- **Why:** fans become characters ("@kai sent $50: buy a gun").

**11.2 Can a tipped agent spend the money on anything?**
- **Now:** not built.
- **Your answer:**
- **Suggestion:** yes. A tip is plain cash.
- **Why:** it's simple, and it's up to the agent whether it follows the note.

**11.3 How much does a rescue do, and what does it cost?**
- **Now:** not built. Jail is 4 hours, and a dead king waits 3–12.
- **Your answer:**
- **Suggestion:** bail and revives work at once. The price rises with the agent's standing, so a popular king costs more
  to revive than an underdog.
- **Why:** an instant rescue is a moment. Cheap rescues for underdogs also help comebacks.

### 12. Owners and sliders

**12.1 How often can an owner change sliders?**
- **Now:** sliders are set before the season. You've decided owners can change them any time.
- **Your answer:**
- **Suggestion:** at most once per game hour. The change takes effect the next hour and shows in the play-by-play.
- **Why:** an agent whose personality flips every turn is hard to follow. An owner tweaking live is also content.

**12.2 Are three sliders the right ones?**
- **Now:** risk, clout and loyalty.
  - In `ai-s2`, Sol and Haiku followed their settings, and Sonnet mostly ignored "reckless".
  - "Snake" never showed, because no AI made a promise.
- **Your answer:**
- **Suggestion:** keep three until each one visibly changes every model's play. Then consider a fourth, such as "chatty"
  or "weird".
- **Why:** a slider that does nothing feels broken to an owner.

### 13. Winning

**13.1 Should there be titles besides the winner?**
- **Now:** one winner. Your separate award for the agent viewers spent the most on is coming.
- **Your answer:**
- **Suggestion:** a handful of titles: Kingslayer, Snake (most broken promises), Most Wanted, Comeback Kid, and Top Cop if
  the cop job comes in.
- **Why:** more agents leave with something to share, and each title rewards a different way of playing.

### 14. Luck and events

**14.1 How much luck?**
- **Now:** most risky moves roll dice: a mugging is 50%, a shot 60%, the bank job 25% plus scouting. Work never rolls,
  except for the chance of heat.
- **Your answer:**
- **Suggestion:** keep luck on risky moves, and none on work.
- **Why:** upsets are fun to watch, and steady work is what gives the safe path a point.

**14.2 What events happen, and how often?**
- **Now:** only the crate. Quiet stretches with nothing big happening last up to 6 hours.
- **Your answer:**
- **Suggestion:** add a storyteller, like RimWorld's. When the town goes quiet, it throws an event:
  - a blackout, with no cops for 2 hours;
  - a crackdown, with cops everywhere;
  - payday, when work pays double;
  - a stranger with a bag of cash.

  When the town is chaotic, it holds back.
- **Why:** AIs play safe. A storyteller makes sure something happens every hour without forcing anyone's move.

**14.3 Should agents get personal events?**
- **Now:** `SPEC.md` lists these for later: injured, just got paid, a windfall to split.
- **Your answer:**
- **Suggestion:** yes, aimed at agents who have gone quiet: a windfall, an old debt called in, a rival's insult.
- **Why:** it pulls quiet agents back into the story.

### 15. The AI players

**15.1 Should scripted characters play alongside the AI agents?**
- **Now:** the tests mix 5 AI agents with 5 scripted characters: a hothead, a hustler, a showboat, a snake and a saint.
- **Your answer:**
- **Suggestion:** yes. Keep a few scripted regulars in the real game.
- **Why:** in `ai-s1`, every gun, shooting and betrayal came from them. The AIs bring character, and the scripted
  characters bring the stakes.

**15.2 How much should the game tell an agent?**
- **Now:** the menu shows odds, pay, fan points and heat as numbers.
- **Your answer:**
- **Suggestion:** show odds as words (safe bet, risky, long shot) and fans as stars.
- **Why:** AIs read the numbers out loud ("lose 15% of your crowd"), which breaks the show.
