// The run.mjs command line (SPEC §12). main(argv) returns { outDir, report, ... } so tests can drive it in-process.
//   node run.mjs --bots --seeds 50 [--start 1] [--lineup default|all-greedy|<file>] [--set path=value ...] [--off a,b] [--out out/<name>]
//   node run.mjs --ai --fake --seeds 1
//   node run.mjs --ai --models <ids> --seeds 1 --max-cost 3 --dry-run --go "<slime's words>"   (orchestrator only)
//   node run.mjs --ai --models <ids> --seeds 1 --max-cost 3 --go "<slime's words>"             (orchestrator only)
//   --seat-models '<json>' in place of --models: the AI seats in order, [{ "model", "api": "openrouter"|"claude",
//   "effort"?: "low"|"medium"|"high"|"xhigh"|"max", "sliders"?: { "risk", "clout", "loyalty" } (each 0-1, all three),
//   "persona"?: "<at most 120 characters>" }] (effort for claude seats only; sliders and persona replace the seat's
//   preset, with no jitter, and its bot twin keeps them), e.g. with --lineup ai5:
//   node run.mjs --ai --lineup ai5 --seat-models '[{"model":"claude-sonnet-5-5","api":"claude","effort":"high",
//     "sliders":{"risk":0.95,"clout":0.5,"loyalty":0.05},"persona":"Charming, fearless."},...]'
//     --seeds 1 --max-cost 3 --go "<slime's words>" [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultConfig, setPath, switchOff, configHash } from './config.mjs';
import { loadLineup, withAiSeats, twinOf } from './lineups.mjs';
import { runSeason } from './season.mjs';
import { seasonStats } from './stats.mjs';
import { aggregate, renderMarkdown, aiComparison, aiTotals } from './report.mjs';
import { renderPlayByPlay } from './playbyplay.mjs';
import { APIS } from './seats/defaults.mjs';
import { CLAUDE_EFFORTS, PRICES } from './seats/anthropic.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_MODELS = ['google/gemini-3.8-flash', 'openai/gpt-6.1-sol', 'moonshotai/kimi-k3.1-pro', 'anthropic/claude-haiku-5.5'];

const SEAT_KEYS = ['model', 'api', 'effort', 'sliders', 'persona'];
const SLIDER_KEYS = ['risk', 'clout', 'loyalty'];
// A seat's persona, at most this many characters (SPEC §0.1 R3.6).
const PERSONA_MAX = 120;

// --seat-models: a JSON array of { model, api, effort?, sliders?, persona? }, checked here so a typo stops the run
// before any call.
export function parseSeatModels(text) {
  let list;
  try {
    list = JSON.parse(text);
  } catch (e) {
    throw new Error(`--seat-models is not JSON: ${e.message}`);
  }
  if (!Array.isArray(list) || list.length === 0) throw new Error('--seat-models is a JSON array of { model, api, effort?, sliders?, persona? }, with at least one seat');
  return list.map((m, i) => {
    const at = `--seat-models[${i}]`;
    if (!m || typeof m !== 'object' || Array.isArray(m)) throw new Error(`${at} is not an object`);
    const extra = Object.keys(m).filter(k => !SEAT_KEYS.includes(k));
    if (extra.length) throw new Error(`${at} has unknown keys: ${extra.join(', ')} (it takes ${SEAT_KEYS.join(', ')})`);
    if (typeof m.model !== 'string' || !m.model.trim()) throw new Error(`${at} needs a model`);
    if (!APIS.includes(m.api)) throw new Error(`${at} needs an api: ${APIS.join(' or ')}`);
    if (m.effort !== undefined && m.api !== 'claude') throw new Error(`${at}: effort is for claude seats only`);
    if (m.effort !== undefined && !CLAUDE_EFFORTS.includes(m.effort)) throw new Error(`${at}: effort is one of ${CLAUDE_EFFORTS.join(', ')}`);
    if (m.api === 'claude' && !Object.hasOwn(PRICES, m.model)) throw new Error(`${at}: ${m.model} has no Claude price (known: ${Object.keys(PRICES).join(', ')})`);
    if (m.sliders !== undefined) {
      const s = m.sliders;
      if (!s || typeof s !== 'object' || Array.isArray(s)) throw new Error(`${at}: sliders is an object { risk, clout, loyalty }, each a number from 0 to 1`);
      const unknown = Object.keys(s).filter(k => !SLIDER_KEYS.includes(k));
      if (unknown.length) throw new Error(`${at}: sliders has unknown keys: ${unknown.join(', ')} (it takes ${SLIDER_KEYS.join(', ')})`);
      const missing = SLIDER_KEYS.filter(k => !Object.hasOwn(s, k));
      if (missing.length) throw new Error(`${at}: sliders needs all three of ${SLIDER_KEYS.join(', ')}; missing ${missing.join(', ')}`);
      for (const k of SLIDER_KEYS) {
        if (typeof s[k] !== 'number' || !Number.isFinite(s[k]) || s[k] < 0 || s[k] > 1) throw new Error(`${at}: sliders.${k} is a number from 0 to 1, not ${JSON.stringify(s[k])}`);
      }
    }
    if (m.persona !== undefined && (typeof m.persona !== 'string' || !m.persona.trim() || m.persona.trim().length > PERSONA_MAX)) {
      throw new Error(`${at}: persona is a non-empty string of at most ${PERSONA_MAX} characters`);
    }
    return {
      model: m.model, api: m.api, ...(m.effort !== undefined ? { effort: m.effort } : {}),
      ...(m.sliders !== undefined ? { sliders: Object.fromEntries(SLIDER_KEYS.map(k => [k, m.sliders[k]])) } : {}),
      ...(m.persona !== undefined ? { persona: m.persona.trim() } : {}),
    };
  });
}

// "claude-sonnet-5-5 (claude, high)", "openai/gpt-6.1-sol (openrouter)".
const seatLabel = m => `${m.model} (${m.api}${m.effort ? `, ${m.effort}` : ''})`;
const dollars = x => (x === null || x === undefined ? 'n/a' : `$${x.toFixed(4)}`);
const secs = ms => (ms === null || ms === undefined ? 'n/a' : `${(ms / 1000).toFixed(1)} s`);

export function parseArgs(argv) {
  const o = { bots: false, ai: false, fake: false, seeds: 1, start: 1, lineup: 'default', sets: [], off: [], out: null, models: null, seatModels: null, maxCost: null, go: null, dryRun: false, quiet: false, pbp: 'all' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    switch (a) {
      case '--bots': o.bots = true; break;
      case '--ai': o.ai = true; break;
      case '--fake': o.fake = true; break;
      case '--seeds': o.seeds = Number(val()); break;
      case '--start': o.start = Number(val()); break;
      case '--lineup': o.lineup = val(); break;
      case '--set': o.sets.push(val()); break;
      case '--off': o.off.push(...val().split(',').map(s => s.trim()).filter(Boolean)); break;
      case '--out': o.out = val(); break;
      case '--models': o.models = val().split(',').map(s => s.trim()).filter(Boolean); break;
      case '--seat-models': o.seatModels = parseSeatModels(val()); break;
      case '--max-cost': o.maxCost = Number(val()); break;
      case '--go': o.go = val(); break;
      case '--dry-run': o.dryRun = true; break;
      case '--quiet': o.quiet = true; break;
      default: throw new Error(`unknown option ${a}`);
    }
  }
  if (!Number.isInteger(o.seeds) || o.seeds < 1) throw new Error('--seeds needs a whole number of at least 1');
  if (!Number.isInteger(o.start)) throw new Error('--start needs a whole number');
  if (!o.bots && !o.ai) throw new Error('say --bots or --ai');
  if (o.bots && o.ai) throw new Error('--bots and --ai are separate runs');
  if (o.models && o.seatModels) throw new Error('--seat-models replaces --models: give one of them');
  if ((o.models || o.seatModels) && !o.ai) throw new Error('--models and --seat-models are for --ai runs');
  if (o.ai && !o.fake) {
    // Real model calls need both a spend cap and slime's go words (SPEC §1, §12).
    if (!(Number.isFinite(o.maxCost) && o.maxCost > 0)) throw new Error('refusing a real AI run without --max-cost');
    if (!o.go || !String(o.go).trim()) throw new Error('refusing a real AI run without --go "<slime\'s words>"');
  }
  return o;
}

function gitCommit() {
  try {
    const head = fs.readFileSync(path.join(ROOT, '.git', 'HEAD'), 'utf8').trim();
    if (!head.startsWith('ref: ')) return head;
    const ref = head.slice(5);
    const p = path.join(ROOT, '.git', ref);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim();
    const packed = fs.readFileSync(path.join(ROOT, '.git', 'packed-refs'), 'utf8');
    return packed.split('\n').find(l => l.endsWith(` ${ref}`))?.split(' ')[0] ?? null;
  } catch {
    return null;
  }
}

function buildConfig(o, lineup) {
  const cfg = defaultConfig();
  if (lineup.config) for (const [k, v] of Object.entries(lineup.config)) setPath(cfg, k, v);
  for (const s of o.sets) {
    const eq = s.indexOf('=');
    if (eq < 1) throw new Error(`--set needs path=value, got ${s}`);
    setPath(cfg, s.slice(0, eq), s.slice(eq + 1));
  }
  switchOff(cfg, o.off);
  return cfg;
}

function writeSeason(dir, res, runName, stats) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'feed.jsonl'), res.feed.map(l => JSON.stringify(l)).join('\n') + '\n');
  fs.writeFileSync(path.join(dir, 'play-by-play.md'), renderPlayByPlay({ feed: res.feed, setup: res.setup, standings: res.standings, run: runName, cfg: res.state.cfg }));
  fs.writeFileSync(path.join(dir, 'season.json'), JSON.stringify({ setup: res.setup, standings: res.standings, stats: { ...stats, watch: { ...stats.watch, audienceCurve: undefined, watchingCurve: undefined } } }, null, 2) + '\n');
}

export async function main(argv, { log = console.log } = {}) {
  const o = parseArgs(argv);
  const say = o.quiet ? () => {} : log;
  const baseLineup = loadLineup(o.lineup);
  const cfg = buildConfig(o, baseLineup);
  const seatModels = o.seatModels ?? (o.models ?? DEFAULT_MODELS).map(model => ({ model, api: 'openrouter' }));
  const models = seatModels.map(m => m.model);
  const lineup = o.ai ? withAiSeats(baseLineup, seatModels) : baseLineup;
  const twinLineup = o.ai ? twinOf(lineup) : null;
  const mode = o.ai ? (o.dryRun ? (o.fake ? 'ai-fake-dry-run' : 'ai-dry-run') : o.fake ? 'ai-fake' : 'ai') : 'bots';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const outDir = path.resolve(ROOT, o.out ?? path.join('out', `${stamp}-${mode}-${baseLineup.name}`));
  const runName = path.basename(outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const seeds = Array.from({ length: o.seeds }, (_, i) => o.start + i);
  const started = Date.now();
  const runJson = {
    command: `node run.mjs ${argv.map(a => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}`,
    mode, seeds, lineup: baseLineup.name, seats: lineup.seats, systems: cfg.systems, off: o.off, sets: o.sets,
    configHash: configHash(cfg), gitCommit: gitCommit(), startedAt: new Date(started).toISOString(),
    ...(o.ai ? { models, seatModels, apis: [...new Set(seatModels.map(m => m.api))], transport: o.fake ? 'fake' : 'live', maxCost: o.maxCost, go: o.fake ? null : o.go } : {}),
  };

  let aiSeats = null;
  if (o.ai) {
    const aiIds = lineup.seats.map((s, i) => ({ s, id: `a${String(i + 1).padStart(2, '0')}` })).filter(x => x.s.brain === 'ai');
    if (!aiIds.length) throw new Error('this lineup has no greedy seats for the AI to take');
    const { createAiSeats } = await import('./seats/ai.mjs');
    aiSeats = createAiSeats({
      seats: aiIds.map(x => ({ agentId: x.id, model: x.s.model, api: x.s.api ?? 'openrouter', ...(x.s.effort ? { effort: x.s.effort } : {}) })),
      transport: o.fake ? 'fake' : 'live',
      // Every AI seat of an hour in one wave: the hour waits for its slowest call anyway.
      concurrency: aiIds.length,
      // A fake run takes --max-cost too (optional there): it caps the fake-priced spend, to rehearse a cap for $0.
      ...(o.fake ? (Number.isFinite(o.maxCost) && o.maxCost > 0 ? { maxCost: o.maxCost } : {}) : { maxCost: o.maxCost, go: o.go }),
    });
    runJson.aiSeats = aiSeats.seats;
    if (!o.fake) {
      // OpenRouter's balance and key limit against --max-cost; the Claude API has none to read (its note says so).
      runJson.preflight = await aiSeats.preflight();
      if (runJson.preflight.claude) say(`claude: ${runJson.preflight.claude}`);
      if (runJson.preflight.refused) {
        runJson.finishedAt = new Date().toISOString();
        fs.writeFileSync(path.join(outDir, 'run.json'), JSON.stringify(runJson, null, 2) + '\n');
        throw new Error(`preflight refused: ${runJson.preflight.refused}`);
      }
    }
  }

  if (o.dryRun) {
    // One acting hour of the first seed, then the cost so far and a season estimate.
    const res = await runSeason({ seed: seeds[0], config: cfg, lineup, ai: { seats: aiSeats, maxCost: o.maxCost }, maxHours: 1 });
    const detail = aiSeats.estimateDetail({ callsPerSeat: res.setup.hours });
    runJson.dryRun = {
      hours: 1, callsPerSeat: res.setup.hours, spend: aiSeats.spend, perModel: aiSeats.perModel, halted: aiSeats.halted,
      estimate: detail, estimateSeason: detail.total, turns: aiSeats.turns,
    };
    runJson.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(outDir, 'run.json'), JSON.stringify(runJson, null, 2) + '\n');
    say(`dry run (${o.fake ? 'fake: nothing billed, Claude seats priced from the fake\'s token counts' : 'live'}, 1 acting hour, seed ${seeds[0]}): ${aiSeats.spend.calls} calls, ${dollars(aiSeats.spend.cost)}`);
    for (const tr of aiSeats.turns) {
      const u = tr.usage;
      say(`  ${tr.agentId} ${seatLabel(tr)}: ${tr.ok ? 'ok' : `failed (${tr.why})`} | parsed ${tr.parsed ? 'yes' : 'no'} | finish ${tr.finish ?? 'n/a'} | in ${u.in} out ${u.out} reasoning ${u.reasoning ?? 'n/a'} | ${dollars(u.cost)} | ${secs(tr.ms)}${tr.tries > 1 ? ` | ${tr.tries} tries` : ''}${tr.fallback ? ` | cut off at ${tr.fallback.from}, fell back to ${tr.fallback.to}: ${tr.fallback.ok ? 'ok' : 'failed'}` : ''}`);
    }
    say('per model:');
    for (const [m, v] of Object.entries(aiSeats.perModel)) {
      const e = detail.perModel[m];
      say(`  ${m} (${v.api}${v.efforts.length ? `, ${v.efforts.join('/')}` : ''}; ${v.seats} seat${v.seats === 1 ? '' : 's'}): ${v.calls} calls | in ${v.in} out ${v.out} reasoning ${v.reasoning ?? 'n/a'} | ${dollars(v.cost)} | failed ${v.failed} | cut-offs ${v.cutoffs} | fallbacks ${v.fallbacks} (rescued ${v.rescued}) | finishes ${JSON.stringify(v.finishes)} | median ${secs(v.medianMs)} p90 ${secs(v.p90Ms)} | season ${dollars(e?.season)} (${e?.seats ?? 0} × ${detail.callsPerSeat} calls × ${dollars(e?.perCall)}${e && !e.measured ? ': no costed call yet, the other models\' mean' : ''})`);
    }
    say(`season estimate: ${dollars(detail.total)} (${detail.callsPerSeat} calls per seat × each model's measured cost per call, ${aiSeats.seats.length} AI seats)`);
    say(`halted: ${aiSeats.halted ? `${aiSeats.halted.kind}: ${aiSeats.halted.why}` : 'no'}`);
    await aiSeats.close?.();
    return { outDir, runJson };
  }

  const stats = [];
  const twinStats = [];
  const links = [];
  const aiStops = [];
  for (const seed of seeds) {
    const res = await runSeason({ seed, config: cfg, lineup, ai: aiSeats ? { seats: aiSeats, maxCost: o.maxCost } : null });
    if (aiSeats && res.halted) {
      // The cap or a halt: greedy played the AI seats from this hour on (season.mjs), and the run says so.
      const first = res.feed.find(l => l.agents.some(e => e.by === 'bot-halted'));
      const stop = { seed, kind: res.halted.kind, why: res.halted.why, greedyFromT: first ? first.t : null };
      aiStops.push(stop);
      say(`seed ${seed}: AI ${stop.kind === 'cap' ? 'capped' : `halted (${stop.kind})`}: ${stop.why}; greedy played the AI seats from t=${stop.greedyFromT ?? 'n/a'}`);
    }
    const st = seasonStats({ feed: res.feed, setup: res.setup, standings: res.standings, cfg, aiTurns: res.aiTurns });
    stats.push(st);
    writeSeason(path.join(outDir, String(seed)), res, runName, st);
    links.push({ seed, path: `${seed}/play-by-play.md` });
    if (o.ai) {
      // Every AI season runs its bot twin on the same seed (free), with the AI seats' own sliders and persona (R3.6).
      const twin = await runSeason({ seed, config: cfg, lineup: twinLineup });
      const tst = seasonStats({ feed: twin.feed, setup: twin.setup, standings: twin.standings, cfg });
      twinStats.push(tst);
      writeSeason(path.join(outDir, `${seed}-twin`), twin, runName, tst);
    }
  }
  const meta = { run: runName, lineup: baseLineup.name, off: o.off, sets: o.sets, configHash: runJson.configHash, mode, ...(o.ai ? { ai: `${o.fake ? 'fake' : 'live'} (${seatModels.map(seatLabel).join(', ')})` } : {}) };
  const report = aggregate(stats, meta);
  let aiSection = null;
  if (o.ai) {
    report.ai = {
      totals: aiTotals(stats), spend: { cost: Math.round(aiSeats.spend.cost * 1e4) / 1e4, calls: aiSeats.spend.calls }, perModel: aiSeats.perModel, capped: !!aiSeats.halted, halted: aiSeats.halted,
      compare: aiComparison(stats, twinStats), twin: aggregate(twinStats, { ...meta, run: `${runName} (bot twins)` }),
    };
    aiSection = report.ai;
    runJson.ai = {
      seatModels, maxCost: aiSeats.maxCost, go: aiSeats.go, spend: aiSeats.spend, perModel: aiSeats.perModel,
      capped: aiSeats.capped, halted: aiSeats.halted, stops: aiStops,
      ...(o.fake ? {} : { openRouterKeyUsage: await aiSeats.keyUsage() }),
    };
    await aiSeats.close?.();
  }
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'report.md'), renderMarkdown(report, { links, ai: aiSection }));
  runJson.finishedAt = new Date().toISOString();
  runJson.ms = Date.now() - started;
  fs.writeFileSync(path.join(outDir, 'run.json'), JSON.stringify(runJson, null, 2) + '\n');
  say(`${seeds.length} season${seeds.length === 1 ? '' : 's'} (${mode}, lineup ${baseLineup.name}) in ${runJson.ms} ms -> ${path.relative(process.cwd(), outDir) || outDir}`);
  for (const m of report.marks) say(`  [${m.pass === null ? 'n/a' : m.pass ? 'pass' : 'FAIL'}] ${m.mark}: ${m.value}`);
  return { outDir, report, runJson, stats };
}
