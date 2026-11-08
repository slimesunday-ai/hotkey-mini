// Round 3 style helper (SPEC §0.2): levels, labels and the brand multiplier.
import test from 'node:test';
import assert from 'node:assert/strict';
import { levelOf, styleLabels, brandMult } from '../src/style.mjs';
import { config } from './helpers.mjs';

const near = (a, b) => Math.abs(a - b) < 1e-9;

test('style: levels and labels', () => {
  const cfg = config();
  assert.equal(levelOf(0.7, cfg), 'high');
  assert.equal(levelOf(0.69, cfg), 'mid');
  assert.equal(levelOf(0.3, cfg), 'low');
  assert.equal(levelOf(undefined, cfg), 'mid');
  assert.deepEqual(styleLabels({ risk: 0.95, clout: 0.5, loyalty: 0.05 }, cfg), ['reckless', 'snake']);
  assert.deepEqual(styleLabels({ risk: 0.05, clout: 0.9, loyalty: 0.95 }, cfg), ['safe', 'show-off', 'ride-or-die']);
  assert.deepEqual(styleLabels({ risk: 0.5, clout: 0.5, loyalty: 0.5 }, cfg), []);
});

test('style: brand multiplier', () => {
  const cfg = config({ 'style.brandRisk': 0.5, 'style.brandClout': 0.5 });
  const snake = { risk: 1, clout: 0.5, loyalty: 0 };
  assert.ok(near(brandMult(cfg, snake, 'shoot'), 1.5));
  assert.ok(near(brandMult(cfg, snake, 'party'), 1));
  assert.ok(near(brandMult(cfg, snake, 'promise_broken'), 1.5));
  assert.ok(near(brandMult(cfg, snake, 'promise_kept'), 0.5));
  assert.ok(near(brandMult(cfg, snake, 'cook'), 1), 'job actions are not style moves');
  assert.ok(near(brandMult(cfg, { risk: 0, clout: 1, loyalty: 1 }, 'kill_king'), 0.5));
  assert.ok(near(brandMult(cfg, { risk: 0, clout: 1, loyalty: 1 }, 'drip_check'), 1.5));
  assert.ok(near(brandMult(cfg, { risk: 0.5, clout: 0.5, loyalty: 0.5 }, 'mug'), 1));
  const off = config({ 'style.brandRisk': 0.5 }, ['style']);
  assert.equal(brandMult(off, snake, 'shoot'), 1);
  // As shipped: risk and clout carry no bonus, loyalty does.
  const shipped = config();
  assert.equal(brandMult(shipped, snake, 'shoot'), 1);
  assert.ok(near(brandMult(shipped, snake, 'promise_broken'), 1.5));
});
