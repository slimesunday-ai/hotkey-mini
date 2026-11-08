import fs from 'node:fs';
import path from 'node:path';

const usage = 'Usage: node tools/compare.mjs <runA> <runB> [--json]';
const fields = {
  interacting: [
    'involvedShare', 'interactionsPerAgentPerDay', 'everyoneMet4', 'minPartners',
    'rivalries', 'alliances', 'messagesSent', 'promisesMade', 'promisesKept',
    'promisesBroken', 'tradesAgentAgent',
  ],
  interesting: [
    'momentsPerSeason', 'leadChanges', 'seasonsWithKingAttempt', 'topThirdRepeat',
    'copycatTopShare', 'greedySimilarity',
  ],
  watch: ['minutesWatched', 'audienceEndRatio', 'seasonsGrowing', 'longestDull', 'longestDullMax',
    'longestStrongDull', 'longestStrongDullMax', 'seasonsStrongDullAtMost3'],
  economy: [
    'dealCash', 'gunsBuilt', 'evictions', 'arrests', 'jailShare', 'hospitalShare',
    'deaths', 'seasonsWithAGun',
  ],
};
const shares = new Set([
  'involvedShare', 'everyoneMet4', 'seasonsWithKingAttempt', 'topThirdRepeat',
  'copycatTopShare', 'seasonsGrowing', 'seasonsStrongDullAtMost3', 'jailShare', 'hospitalShare', 'seasonsWithAGun',
]);
const finite = value => Number.isFinite(value) ? value : null;

function inputError(message) {
  return Object.assign(new Error(message), { exitCode: 2 });
}

function readReport(folder) {
  let stat;
  try {
    stat = fs.statSync(folder);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      throw inputError(`Run folder is missing: ${folder}`);
    }
    throw error;
  }
  if (!stat.isDirectory()) throw inputError(`Run path is not a folder: ${folder}`);

  const file = path.join(folder, 'report.json');
  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') throw inputError(`report.json is missing: ${file}`);
    throw new Error(`Cannot read ${file}: ${error.message}`);
  }
  let report;
  try {
    report = JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in ${file}: ${error.message}`);
  }
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new Error(`Expected a report object in ${file}`);
  }
  return report;
}

function runInfo(folder, report) {
  const meta = Object.fromEntries(['run', 'lineup', 'off', 'sets', 'configHash']
    .map(key => [key, report.meta?.[key] ?? null]));
  meta.seasons = report.seasons ?? report.meta?.seasons ?? null;
  return { folder, meta };
}

function metricRow(metric, a, b, unit = 'number') {
  a = finite(a);
  b = finite(b);
  const delta = a === null || b === null ? null : finite(b - a);
  const percentChange = a === null || a === 0 || delta === null
    ? null : finite(delta / a * 100);
  return { metric, a, b, delta, percentChange, unit };
}

const markText = mark => typeof mark?.mark === 'string' && mark.mark.length ? mark.mark : null;
const markStatus = mark => mark === undefined ? 'missing'
  : mark?.pass === true ? 'pass' : mark?.pass === false ? 'fail' : 'n/a';

function compareMarks(a = [], b = []) {
  const matches = new Map();
  const used = new Set();
  // Reserve text matches before falling back to indices for marks without text.
  a.forEach((mark, i) => {
    const text = markText(mark);
    const j = text === null ? -1 : b.findIndex((other, index) =>
      !used.has(index) && markText(other) === text);
    if (j !== -1) {
      matches.set(i, j);
      used.add(j);
    }
  });
  a.forEach((mark, i) => {
    if (!matches.has(i) && i < b.length && !used.has(i)
        && (markText(mark) === null || markText(b[i]) === null)) {
      matches.set(i, i);
      used.add(i);
    }
  });
  const row = (left, right, index) => {
    const a = markStatus(left), b = markStatus(right);
    return {
      text: markText(left) ?? markText(right) ?? `Mark #${index + 1}`,
      a, b, changed: a !== b,
    };
  };
  const rows = a.map((mark, i) => row(mark, b[matches.get(i)], i));
  b.forEach((mark, i) => {
    if (!used.has(i)) rows.push(row(undefined, mark, i));
  });
  return rows;
}

function compare(a, b, runA, runB) {
  const metrics = [];
  for (const [section, keys] of Object.entries(fields)) {
    const left = a[section] ?? {}, right = b[section] ?? {};
    for (const key of keys) {
      if (Object.hasOwn(left, key) || Object.hasOwn(right, key)) {
        metrics.push(metricRow(`${section}.${key}`, left[key], right[key],
          shares.has(key) ? 'share' : 'number'));
      }
    }
    if (section === 'interesting') {
      for (const group of ['momentsByType', 'winsByJob', 'winsByBrain']) {
        const leftGroup = left[group] ?? {}, rightGroup = right[group] ?? {};
        const union = [...new Set([...Object.keys(leftGroup), ...Object.keys(rightGroup)])].sort();
        for (const key of union) {
          metrics.push(metricRow(`${section}.${group}.${key}`,
            Object.hasOwn(leftGroup, key) ? leftGroup[key] : 0,
            Object.hasOwn(rightGroup, key) ? rightGroup[key] : 0,
            group === 'momentsByType' ? 'number' : 'share'));
        }
      }
    }
    if (section === 'economy') {
      const leftDays = left.cashByDay ?? [], rightDays = right.cashByDay ?? [];
      for (let day = 0; day < Math.max(leftDays.length, rightDays.length); day++) {
        metrics.push(metricRow(`economy.cashByDay.day${day + 1}`,
          leftDays[day] ?? 0, rightDays[day] ?? 0));
      }
    }
  }
  return {
    runs: { a: runInfo(runA, a), b: runInfo(runB, b) },
    metrics,
    marks: compareMarks(a.marks ?? [], b.marks ?? []),
  };
}

function number(value, signed = false) {
  const rounded = Number(value.toFixed(2));
  return `${signed && rounded > 0 ? '+' : ''}${rounded}`;
}

function metricValue(value, unit, delta = false) {
  if (value === null) return 'n/a';
  return unit === 'share'
    ? `${number(value * 100, delta)}${delta ? ' pp' : '%'}`
    : number(value, delta);
}

function table(headers, rows) {
  const widths = headers.map((header, i) => Math.max(header.length, ...rows.map(row => row[i].length)));
  const line = row => row.map((cell, i) => i === 0 ? cell.padEnd(widths[i]) : cell.padStart(widths[i])).join('  ');
  return [line(headers), line(widths.map(width => '-'.repeat(width))), ...rows.map(line)].join('\n');
}

function formatText(comparison) {
  const lines = Object.entries(comparison.runs).map(([label, { folder, meta }]) =>
    `${label.toUpperCase()}: ${folder} | ${Object.entries(meta).map(([key, value]) =>
      `${key}=${value === null ? 'n/a' : typeof value === 'object' ? JSON.stringify(value) : value}`).join(' | ')}`);
  lines.push('', 'Shares use %; share deltas use pp (percentage points). Change % = (B-A)/A; zero base = n/a.',
    table(['metric', 'A', 'B', 'delta (B-A)', 'change %'], comparison.metrics.map(row => [
      row.metric, metricValue(row.a, row.unit), metricValue(row.b, row.unit),
      metricValue(row.delta, row.unit, true),
      row.percentChange === null ? 'n/a' : `${number(row.percentChange, true)}%`,
    ])), '', 'marks',
    table(['mark', 'A', 'B', 'change'], comparison.marks.map(row => [
      row.text, row.a, row.b, row.changed ? `${row.a} -> ${row.b}` : 'unchanged',
    ])));
  return lines.join('\n');
}

try {
  const args = process.argv.slice(2);
  if ((args.length !== 2 && args.length !== 3)
      || args.slice(0, 2).some(arg => arg.startsWith('--'))
      || (args.length === 3 && args[2] !== '--json')) {
    throw inputError(usage);
  }
  const [runA, runB] = args;
  const result = compare(readReport(runA), readReport(runB), runA, runB);
  console.log(args[2] === '--json' ? JSON.stringify(result, null, 2) : formatText(result));
} catch (error) {
  console.error(`compare: ${error.message}`);
  process.exitCode = error.exitCode ?? 1;
}
