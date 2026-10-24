// src/hours.js
import { toMs } from "./windows.js";

const parse = (hhmm) => hhmm.split(":").map(Number);

// Everything outside [open, close] on each day, as busy blocks (ms timestamps).
export function outsideHours(start, end, hours) {
  const [sh, sm] = parse(hours.start);
  const [eh, em] = parse(hours.end);
  if (sh * 60 + sm >= eh * 60 + em) {
    throw new RangeError("workingHours.start must be before workingHours.end");
  }

  const e = toMs(end);
  const day = new Date(toMs(start));
  day.setHours(0, 0, 0, 0);

  const blocks = [];
  while (day.getTime() < e) {
    const y = day.getFullYear(), m = day.getMonth(), d = day.getDate();
    blocks.push(
      { start: new Date(y, m, d, 0, 0).getTime(),   end: new Date(y, m, d, sh, sm).getTime() },
      { start: new Date(y, m, d, eh, em).getTime(), end: new Date(y, m, d + 1, 0, 0).getTime() }
    );
    day.setDate(d + 1);
  }
  return blocks;
}