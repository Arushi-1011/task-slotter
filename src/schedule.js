// src/schedule.js
import { getFreeWindows, toMs, fromMs } from "./windows.js";

const MIN = 60_000;

const byDeadlineThenPriority = (a, b) => {
  const da = a.deadline ? toMs(a.deadline) : Infinity;
  const db = b.deadline ? toMs(b.deadline) : Infinity;
  if (da !== db) return da - db;                 // earliest deadline first
  return (a.priority ?? 5) - (b.priority ?? 5);  // then 1 before 2 before 3
};

export function schedule(tasks, options) {
  const { start, end, busy = [], breakMinutes = 0 } = options;
  const windows = getFreeWindows(start, end, busy);

  const scheduled = [];
  const unscheduled = [];

  for (const task of [...tasks].sort(byDeadlineThenPriority)) {
    const need = task.duration * MIN;
    const deadline = task.deadline ? toMs(task.deadline) : Infinity;

    const w = windows.find(
      (w) => w.start + need <= w.end && w.start + need <= deadline
    );

    if (!w) {
      const fitsAnywhere = windows.some((w) => w.start + need <= w.end);
      unscheduled.push({
        id: task.id,
        reason: fitsAnywhere ? "would miss deadline" : "no free slot long enough",
      });
      continue;
    }

    scheduled.push({ id: task.id, start: fromMs(w.start), end: fromMs(w.start + need) });
    w.start += need + breakMinutes * MIN; // shrink the window from the left
  }

  return { scheduled, unscheduled };
}