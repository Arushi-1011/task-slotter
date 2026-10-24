import { describe, it, expect } from "vitest";
import { schedule } from "../src/schedule.js";
import { toMs, fromMs } from "../src/windows.js";

// Seeded PRNG (mulberry32): same seed, same sequence, so failures are reproducible
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE = toMs("2026-10-24T00:00");
const at = (min) => fromMs(BASE + min * 60_000);

function randomCase(rand) {
  const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const start = int(0, 600);
  const end = start + int(120, 3 * 1440);

  const busy = Array.from({ length: int(0, 4) }, () => {
    const s = int(0, end + 120);
    return { start: at(s), end: at(s + int(10, 240)) };
  });
  const tasks = Array.from({ length: int(0, 8) }, (_, i) => ({
    id: `t${i}`,
    duration: int(5, 180),
    priority: int(1, 5),
    ...(rand() < 0.4 ? { deadline: at(int(start, end)) } : {}),
  }));
  const options = { start: at(start), end: at(end), busy, breakMinutes: int(0, 15) };
  if (rand() < 0.5) options.workingHours = { start: "09:00", end: "17:00" };
  return { tasks, options };
}

function check({ tasks, options }) {
  const { scheduled, unscheduled } = schedule(tasks, options);
  const s = toMs(options.start);
  const e = toMs(options.end);
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
  const spans = scheduled
    .map((x) => ({ id: x.id, start: toMs(x.start), end: toMs(x.end) }))
    .sort((a, b) => a.start - b.start);

  // P1: every task is either scheduled or unscheduled, exactly once
  const ids = [...scheduled, ...unscheduled].map((x) => x.id).sort();
  expect(ids).toEqual(tasks.map((t) => t.id).sort());

  spans.forEach((x, i) => {
    const task = byId[x.id];
    // P2: inside the window, with the right length
    expect(x.start).toBeGreaterThanOrEqual(s);
    expect(x.end).toBeLessThanOrEqual(e);
    expect(x.end - x.start).toBe(task.duration * 60_000);
    // P3: deadline respected
    if (task.deadline) expect(x.end).toBeLessThanOrEqual(toMs(task.deadline));
    // P4: no overlap with the previous task
    if (i > 0) expect(x.start).toBeGreaterThanOrEqual(spans[i - 1].end);
    // P5: never inside a busy block
    for (const b of options.busy) {
      expect(x.end <= toMs(b.start) || x.start >= toMs(b.end)).toBe(true);
    }
    // P6: inside working hours on its own day
    if (options.workingHours) {
      const d = new Date(x.start);
      const open = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0).getTime();
      const close = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 17, 0).getTime();
      expect(x.start).toBeGreaterThanOrEqual(open);
      expect(x.end).toBeLessThanOrEqual(close);
    }
  });
}

describe("properties", () => {
  it("hold across 300 random inputs", () => {
    for (let seed = 1; seed <= 300; seed++) {
      try {
        check(randomCase(rng(seed)));
      } catch (err) {
        err.message = `seed ${seed}: ${err.message}`;
        throw err;
      }
    }
  });

  it("is deterministic and never mutates its input", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const c = randomCase(rng(seed));
      const before = JSON.stringify(c);
      const a = schedule(c.tasks, c.options);
      const b = schedule(c.tasks, c.options);
      expect(a).toEqual(b);
      expect(JSON.stringify(c)).toBe(before);
    }
  });
});