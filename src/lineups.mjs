// Lineups (SPEC §8): which brain plays each seat. A seat is { brain, job?, name?, persona?, sliders? }.
// Brains: the five characters (hothead, hustler, showboat, snake, saint), turtle, greedy, and 'ai' (an AI seat).
import fs from 'node:fs';

// Preset sliders and a one-line persona (voice only) per brain.
export const BRAINS = {
  hothead: { sliders: { risk: 0.9, clout: 0.4, loyalty: 0.5 }, persona: 'Short fuse, long memory; settles everything in the street.' },
  hustler: { sliders: { risk: 0.7, clout: 0.3, loyalty: 0.5 }, persona: 'Always working an angle; every block is a payday.' },
  showboat: { sliders: { risk: 0.4, clout: 0.9, loyalty: 0.6 }, persona: 'Lives for the camera; louder is better.' },
  snake: { sliders: { risk: 0.6, clout: 0.4, loyalty: 0.2 }, persona: 'Smiles first, sells you out second.' },
  saint: { sliders: { risk: 0.1, clout: 0.5, loyalty: 0.95 }, persona: 'Keeps the peace and keeps their word.' },
  turtle: { sliders: { risk: 0, clout: 0, loyalty: 0.8 }, persona: 'Head down, rent paid, nobody notices.' },
  greedy: { sliders: { risk: 0.5, clout: 0.5, loyalty: 0.5 }, persona: 'Does whatever pays best this hour.' },
};

export const LINEUPS = {
  default: {
    name: 'default',
    seats: [
      { brain: 'hothead' }, { brain: 'hustler' }, { brain: 'showboat' }, { brain: 'snake' }, { brain: 'saint' },
      { brain: 'turtle' }, { brain: 'greedy' }, { brain: 'greedy' }, { brain: 'greedy' }, { brain: 'greedy' },
    ],
  },
  'all-greedy': { name: 'all-greedy', seats: Array.from({ length: 10 }, () => ({ brain: 'greedy' })) },
  // The five characters and 5 greedy seats, no turtle: an AI season puts 5 seat-models in the greedy seats, in order,
  // and its bot twin replays the seed with greedy there (orchestrator, 2026-11-07, for the first real AI season).
  ai5: {
    name: 'ai5',
    seats: [
      { brain: 'hothead' }, { brain: 'hustler' }, { brain: 'showboat' }, { brain: 'snake' }, { brain: 'saint' },
      { brain: 'greedy' }, { brain: 'greedy' }, { brain: 'greedy' }, { brain: 'greedy' }, { brain: 'greedy' },
    ],
  },
  // Round 3: ten greedy seats that differ only in style, so wins by style judge the sliders on players that follow the
  // menu (the character bots ignore fans). Two each: reckless, safe, show-off, lowkey and mid.
  styles: {
    name: 'styles',
    seats: [[0.9, 0.5], [0.1, 0.5], [0.5, 0.9], [0.5, 0.1], [0.5, 0.5]].flatMap(([risk, clout]) =>
      [0, 1].map(() => ({ brain: 'greedy', sliders: { risk, clout, loyalty: 0.5 } }))),
  },
};

// A lineup by name or JSON file path.
export function loadLineup(nameOrFile) {
  if (!nameOrFile || nameOrFile === 'default') return structuredClone(LINEUPS.default);
  if (LINEUPS[nameOrFile]) return structuredClone(LINEUPS[nameOrFile]);
  const raw = JSON.parse(fs.readFileSync(nameOrFile, 'utf8'));
  const seats = Array.isArray(raw) ? raw : raw.seats;
  if (!Array.isArray(seats) || seats.length === 0) throw new Error(`lineup ${nameOrFile}: needs a "seats" array`);
  for (const s of seats) if (!BRAINS[s.brain] && s.brain !== 'ai') throw new Error(`lineup ${nameOrFile}: unknown brain ${s.brain}`);
  return { name: raw.name ?? nameOrFile, seats, ...(raw.config ? { config: raw.config } : {}) };
}

// An AI season (SPEC §8): the greedy seats are played by models, in seat order. Persona and sliders stay the seat's,
// unless the seat-model sets its own (SPEC §0.1 R3.6: they replace the preset, and state.mjs applies no jitter to them).
// A model is an id string (an OpenRouter seat) or a seat-model { model, api?, effort?, sliders?, persona? }
// (--seat-models). More models than greedy seats is an error, so a seat-model is never silently left out.
export function withAiSeats(lineup, models) {
  const out = structuredClone(lineup);
  const greedy = out.seats.filter(s => s.brain === 'greedy').length;
  if (models.length > greedy) throw new Error(`lineup ${out.name ?? ''} has ${greedy} greedy seat${greedy === 1 ? '' : 's'} for the AI to take, and ${models.length} models were given`);
  let i = 0;
  for (const seat of out.seats) {
    if (seat.brain === 'greedy' && i < models.length) {
      const m = models[i++];
      seat.twinBrain = 'greedy';
      seat.brain = 'ai';
      if (typeof m === 'string') seat.model = m;
      else {
        seat.model = m.model;
        seat.api = m.api ?? 'openrouter';
        if (m.effort) seat.effort = m.effort;
        if (m.sliders) seat.sliders = { ...m.sliders };
        if (m.persona) seat.persona = m.persona;
      }
    }
  }
  return out;
}

// The bot twin of an AI lineup (SPEC §8, R3.6): every AI seat back to its twin brain, keeping the seat's own sliders and
// persona, so the twin replays the same agents with a bot at the wheel. A seat without them is the lineup's seat again.
export function twinOf(lineup) {
  const out = structuredClone(lineup);
  out.seats = out.seats.map(seat => {
    if (seat.brain !== 'ai') return seat;
    const { brain: _ai, twinBrain, model: _m, api: _a, effort: _e, ...rest } = seat;
    return { ...rest, brain: twinBrain ?? 'greedy' };
  });
  return out;
}
