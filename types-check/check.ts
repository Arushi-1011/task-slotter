import { schedule, type ScheduleResult } from "task-slotter";

const r: ScheduleResult = schedule(
  [{ id: "a", duration: 30, priority: 1 }],
  {
    start: "2026-10-24T09:00",
    end: "2026-10-24T12:00",
    workingHours: { start: "09:00", end: "17:00" },
  }
);
r.scheduled[0].start.toUpperCase(); // string method: must compile

// @ts-expect-error duration must be a number
schedule([{ id: "a", duration: "30" }], { start: "x", end: "y" });