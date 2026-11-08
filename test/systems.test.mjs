// Every system can be switched off and a season still runs (SPEC §1, §15.6); switched-off systems leave no trace.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSeason } from '../src/season.mjs';
import { defaultConfig } from '../src/config.mjs';
import { loadLineup } from '../src/lineups.mjs';

const MOVES_BY_SYSTEM = {
  crate: ['crate'], bounties: ['bounty'], callOuts: ['call_out'], parties: ['party'], king: ['kill_king'], battles: ['battle'],
  mugging: ['mug'], carTheft: ['steal_car'], bankJob: ['scout', 'bank_job'], shooting: ['shoot', 'drive_by'], fistfights: ['fistfight'],
  cops: ['run_cops'],
};
const EVENTS_BY_SYSTEM = { cops: ['arrest'], crate: ['crate_drop'], promises: ['promise_made'], messages: ['message'], steals: ['steal'], rent: ['eviction', 'rent_paid'], getaway: ['getaway'] };

for (const sys of Object.keys(defaultConfig().systems)) {
  test(`a season runs with ${sys} off`, async () => {
    const cfg = defaultConfig();
    cfg.systems[sys] = false;
    const res = await runSeason({ seed: 21, config: cfg, lineup: loadLineup('default') });
    assert.equal(res.feed.length, 54);
    const moves = new Set(res.feed.flatMap(l => l.agents.map(e => e.move)));
    for (const m of MOVES_BY_SYSTEM[sys] ?? []) assert.ok(!moves.has(m), `${m} happened with ${sys} off`);
    const evs = new Set(res.feed.flatMap(l => l.events.map(e => e.type)));
    for (const e of EVENTS_BY_SYSTEM[sys] ?? []) assert.ok(!evs.has(e), `${e} happened with ${sys} off`);
  });
}

test('a season runs with every system off at once', async () => {
  const cfg = defaultConfig();
  for (const k of Object.keys(cfg.systems)) cfg.systems[k] = false;
  const res = await runSeason({ seed: 22, config: cfg, lineup: loadLineup('all-greedy') });
  assert.equal(res.feed.length, 54);
});
