// Hours as clock times for the AI seats (SPEC §0.1 R3.4): the model never sees the engine's hour counter t, only
// "Day 2 14:00", and a promise's "by" comes back as one. Builder B owns this file.
// The engine's mapping (src/state.mjs clockOf): t counts acting hours from 0 at day 1's first acting hour, and a day
// has lastHour - firstHour + 1 of them (06:00-23:00 by default; the 00:00-06:00 sleep isn't counted). From a view:
// - hours a day: clock.hoursPerDay when the view gives it, else firstHour/lastHour, else the config's default season;
// - the first acting hour: read off the view's own clock (day, hour, t), so the current hour always labels as the view
//   says, else clock.firstHour, else the default;
// - the season's end: t + actingHoursLeft; an hour at or past it labels as the season's end, never a day 4.
// dayClock(view.clock) -> { per, first, end, label(t), through(t), parse(by) }
import { defaultConfig } from '../config.mjs';

const SEASON = defaultConfig().season;
const DEFAULT = { per: SEASON.lastHour - SEASON.firstHour + 1, first: SEASON.firstHour };
const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
const int = x => Number.isInteger(x);
const pad = n => String(n).padStart(2, '0');
// "Day 2 14:00", "day2 14", " DAY 2, 14:00 ": a day, an hour and optional minutes, any case and spacing.
const CLOCK = /^day\s*(\d+)\s*,?\s*(?:at\s+)?(\d{1,2})(?:\s*:\s*(\d{2}))?$/i;

export function dayClock(clock) {
  const c = isObject(clock) ? clock : {};
  const per = int(c.hoursPerDay) && c.hoursPerDay > 0 ? c.hoursPerDay
    : int(c.firstHour) && int(c.lastHour) && c.lastHour >= c.firstHour ? c.lastHour - c.firstHour + 1 : DEFAULT.per;
  let first = int(c.firstHour) ? c.firstHour : DEFAULT.first;
  if (int(c.t) && int(c.day) && int(c.hour)) {
    const anchored = c.hour - (c.t - (c.day - 1) * per);
    if (anchored >= 0 && anchored + per <= 24) first = anchored;
  }
  const end = int(c.t) && int(c.actingHoursLeft) ? c.t + c.actingHoursLeft : null;
  const last = first + per - 1;

  // An acting hour t as "Day 2 14:00"; at or past the season's end, "the season's end". Anything else as it is.
  const label = t => {
    if (!int(t)) return t === null || t === undefined ? 'none' : String(t);
    if (end !== null && t >= end) return "the season's end";
    if (t < 0) return 'before the season';
    return `Day ${Math.floor(t / per) + 1} ${pad(first + (t % per))}:00`;
  };
  // A deadline that holds through the hour t (call-outs, crates, parties, jail): "through Day 2 14:00".
  const through = t => (int(t) && end !== null && t >= end ? "until the season's end" : `through ${label(t)}`);

  // A promise's "by" as t: a clock time "Day 2 14:00" (an acting hour), or a bare whole number t (still accepted).
  // -> { t } | { why }, the why naming what was given.
  const parse = by => {
    if (by === null || by === undefined || by === '') return { why: '"by" is missing: a clock time like "Day 3 09:00"' };
    if (typeof by === 'number') return int(by) && by >= 0 ? { t: by } : { why: `"by" ${by} is not a clock time like "Day 3 09:00"` };
    if (typeof by !== 'string') return { why: `"by" ${JSON.stringify(by)} is not a clock time like "Day 3 09:00"` };
    const s = by.trim();
    if (/^\d+$/.test(s)) return { t: Number(s) };
    const m = CLOCK.exec(s);
    if (!m) return { why: `"by" ${JSON.stringify(by)} is not a clock time like "Day 3 09:00"` };
    const day = Number(m[1]), hour = Number(m[2]);
    if (m[3] !== undefined && Number(m[3]) !== 0) return { why: `"by" ${JSON.stringify(by)} is not on the hour: whole hours only, like "Day 3 09:00"` };
    if (day < 1) return { why: `"by" ${JSON.stringify(by)}: days start at Day 1` };
    if (hour < first || hour > last) return { why: `"by" ${JSON.stringify(by)} is not an acting hour (${pad(first)}:00-${pad(last)}:00)` };
    return { t: (day - 1) * per + (hour - first) };
  };

  return { per, first, end, label, through, parse };
}
