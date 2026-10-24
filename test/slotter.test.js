// test/slotter.test.js
import { describe, it, expect } from "vitest";
import { getFreeWindows, toMs } from "../src/windows.js";
import { schedule } from "../src/schedule.js";

const t = (hhmm) => `2026-10-24T${hhmm}`;
const w = (a, b) => ({ start: toMs(t(a)), end: toMs(t(b)) });
const day = { start: t("09:00"), end: t("21:00") };

describe("getFreeWindows", () => {
  it("returns the whole day when nothing is busy", () => {
    expect(getFreeWindows(day.start, day.end)).toEqual([w("09:00", "21:00")]);
  });
  it("splits around one busy block", () => {
    const busy = [{ start: t("13:00"), end: t("14:00") }];
    expect(getFreeWindows(day.start, day.end, busy)).toEqual([w("09:00", "13:00"), w("14:00", "21:00")]);
  });
  it("handles overlapping and nested busy blocks", () => {
    const busy = [{ start: t("10:00"), end: t("15:00") }, { start: t("11:00"), end: t("12:00") }];
    expect(getFreeWindows(day.start, day.end, busy)).toEqual([w("09:00", "10:00"), w("15:00", "21:00")]);
  });
  it("ignores busy blocks outside the day", () => {
    const busy = [{ start: t("06:00"), end: t("08:00") }];
    expect(getFreeWindows(day.start, day.end, busy)).toEqual([w("09:00", "21:00")]);
  });
  it("returns nothing when busy covers the whole day", () => {
    const busy = [{ start: t("08:00"), end: t("22:00") }];
    expect(getFreeWindows(day.start, day.end, busy)).toEqual([]);
  });
});

describe("schedule", () => {
  it("orders by deadline, then priority", () => {
    const tasks = [
      { id: "a", duration: 60, priority: 1 },
      { id: "b", duration: 60, priority: 3, deadline: t("11:00") },
    ];
    const { scheduled } = schedule(tasks, { start: t("09:00"), end: t("12:00") });
    expect(scheduled.map((s) => s.id)).toEqual(["b", "a"]);
  });
  it("uses priority 1 before 2 when there are no deadlines", () => {
    const tasks = [
      { id: "a", duration: 30, priority: 2 },
      { id: "b", duration: 30, priority: 1 },
    ];
    const { scheduled } = schedule(tasks, { start: t("09:00"), end: t("12:00") });
    expect(scheduled.map((s) => s.id)).toEqual(["b", "a"]);
  });
  it("never overlaps busy time", () => {
    const { scheduled } = schedule(
      [{ id: "a", duration: 90, priority: 1 }],
      { start: t("09:00"), end: t("15:00"), busy: [{ start: t("09:00"), end: t("11:00") }] }
    );
    expect(scheduled).toEqual([{ id: "a", start: t("11:00"), end: t("12:30") }]);
  });
  it("reports tasks that fit nowhere", () => {
    const { scheduled, unscheduled } = schedule(
      [{ id: "a", duration: 90, priority: 1 }, { id: "b", duration: 60, priority: 2 }],
      { start: t("09:00"), end: t("12:00"), busy: [{ start: t("10:00"), end: t("11:00") }] }
    );
    expect(unscheduled).toEqual([{ id: "a", reason: "no free slot long enough" }]);
    expect(scheduled).toEqual([{ id: "b", start: t("09:00"), end: t("10:00") }]);
  });
  it("reports a missed deadline", () => {
    const { unscheduled } = schedule(
      [{ id: "a", duration: 30, deadline: t("10:00") }],
      { start: t("09:00"), end: t("12:00"), busy: [{ start: t("09:00"), end: t("11:00") }] }
    );
    expect(unscheduled).toEqual([{ id: "a", reason: "would miss deadline" }]);
  });
  it("inserts break time between tasks", () => {
    const { scheduled } = schedule(
      [{ id: "a", duration: 60, priority: 1 }, { id: "b", duration: 60, priority: 2 }],
      { start: t("09:00"), end: t("12:00"), breakMinutes: 15 }
    );
    expect(scheduled[1].start).toBe(t("10:15"));
  });
  it("does not mutate its input", () => {
    const tasks = Object.freeze([{ id: "a", duration: 30, priority: 1 }]);
    expect(() => schedule(tasks, { start: t("09:00"), end: t("10:00") })).not.toThrow();
  });
});