// The town (SPEC §2): a 3x3 grid, moves are up/down/left/right, 1 hour per block. The jail is not walkable.
export const GRID = [
  ['home', 'market', 'bank'],
  ['corner', 'bar', 'park'],
  ['docks', 'precinct', 'jail'],
];
export const BLOCKS = GRID.flat();
export const WALKABLE = BLOCKS.filter(b => b !== 'jail');

const POS = {};
GRID.forEach((row, r) => row.forEach((b, c) => { POS[b] = [r, c]; }));

export const isWalkable = b => WALKABLE.includes(b);

// Walkable neighbours of a block, in grid order (deterministic).
export function adjacent(block) {
  const [r, c] = POS[block];
  const out = [];
  for (const [dr, dc] of [[-1, 0], [0, -1], [0, 1], [1, 0]]) {
    const b = GRID[r + dr]?.[c + dc];
    if (b && isWalkable(b)) out.push(b);
  }
  return out;
}

// Walking distance between two walkable blocks (BFS over walkable blocks).
const DIST = {};
for (const a of WALKABLE) {
  DIST[a] = { [a]: 0 };
  const queue = [a];
  while (queue.length) {
    const x = queue.shift();
    for (const y of adjacent(x)) if (DIST[a][y] === undefined) { DIST[a][y] = DIST[a][x] + 1; queue.push(y); }
  }
}
export const dist = (a, b) => (a === b ? 0 : DIST[a]?.[b] ?? Infinity);

// Blocks reachable in 1..steps steps (not the block itself), sorted by grid order.
export function reachable(block, steps) {
  if (!isWalkable(block)) return [];
  return WALKABLE.filter(b => b !== block && dist(block, b) <= steps);
}

// The next block on a shortest path from `from` toward `to`, moving at most `steps` blocks. Ties go to grid order.
export function stepToward(from, to, steps = 1) {
  if (!isWalkable(from) || !isWalkable(to)) return from;
  let at = from;
  for (let i = 0; i < steps && at !== to; i++) {
    at = adjacent(at).filter(b => dist(b, to) < dist(at, to))[0] ?? at;
  }
  return at;
}

export const TOWN_TEXT =
  'A 3x3 town. Top row: home (the apartments: everyone lives and sleeps here; chemists cook and gunrunners build here), ' +
  'market (the shop for gear and supplies, straight shifts, pickpocketing), bank (scouting and the bank job). Middle row: ' +
  'corner, bar, park (dealing spots; parties at the bar or the park; evicted agents sleep in the park). Bottom row: docks ' +
  '(smuggling runs, straight shifts, the crate\'s favourite spot), precinct (cops start here; nothing happens here), jail ' +
  '(not walkable). Moving to a neighbouring block (up, down, left, right) takes 1 hour; a car moves up to 2 blocks.';
