// Owner sliders as a play style (SPEC §0.1, round 3): levels, plain labels, and the brand multiplier on an agent's own
// fan points. One source for the engine (audience, menu, view), the play-by-play and the AI prompt.

// The moves each slider speaks for. Risk: crimes and violence beyond the job; clout: the show.
export const RISK_MOVES = ['pickpocket', 'mug', 'steal_car', 'bank_job', 'fistfight', 'crate', 'shoot', 'drive_by', 'kill_king', 'run_cops'];
export const CLOUT_MOVES = ['drip_check', 'party', 'battle', 'call_out', 'crip_walk'];
// Loyalty speaks for promises: the breaker's points for a broken one (reversed) and the keeper's for a kept one.
export const LOYALTY_MOVES = { promise_broken: -1, promise_kept: 1 };
export const SLIDERS = ['risk', 'clout', 'loyalty'];

export const LABELS = {
  risk: { high: 'reckless', low: 'safe' },
  clout: { high: 'show-off', low: 'lowkey' },
  loyalty: { high: 'ride-or-die', low: 'snake' },
};

const DEFAULTS = { high: 0.7, low: 0.3, brand: 0.5 };
const settings = cfg => ({ ...DEFAULTS, ...(cfg?.style ?? {}) });

// 'high' | 'mid' | 'low'. A missing slider is mid.
export function levelOf(x, cfg) {
  const s = settings(cfg);
  if (!Number.isFinite(x)) return 'mid';
  return x >= s.high ? 'high' : x <= s.low ? 'low' : 'mid';
}

// The plain words for a slider set, in risk, clout, loyalty order: ['reckless', 'snake']. Mid sliders have none.
export function styleLabels(sliders, cfg) {
  const out = [];
  for (const k of SLIDERS) {
    const lv = levelOf(sliders?.[k], cfg);
    if (lv !== 'mid') out.push(LABELS[k][lv]);
  }
  return out;
}

// One slider's factor: 1 + brand × (2s − 1), so 1 -> ×1.5, 0.5 -> ×1, 0 -> ×0.5 at brand 0.5. A missing slider is 0.5.
const factor = (b, s) => 1 + b * (2 * (Number.isFinite(s) ? s : 0.5) - 1);

// The brand multiplier on an agent's own fan points for `move`: the factor of each slider that speaks for the move
// (loyalty reversed for a broken promise). 1 with systems.style off, without sliders, or for any other move.
export function brandMult(cfg, sliders, move) {
  if (!cfg?.systems?.style || !move || !sliders) return 1;
  const set = settings(cfg);
  // Each slider's strength: brandRisk, brandClout, brandLoyalty, each falling back to brand.
  const b = k => (Number.isFinite(set[`brand${k}`]) ? set[`brand${k}`] : set.brand);
  let m = 1;
  if (RISK_MOVES.includes(move)) m *= factor(b('Risk'), sliders.risk);
  if (CLOUT_MOVES.includes(move)) m *= factor(b('Clout'), sliders.clout);
  if (Object.hasOwn(LOYALTY_MOVES, move)) {
    const s = Number.isFinite(sliders.loyalty) ? sliders.loyalty : 0.5;
    m *= factor(b('Loyalty'), LOYALTY_MOVES[move] > 0 ? s : 1 - s);
  }
  return m;
}
