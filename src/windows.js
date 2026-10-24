// src/windows.js
export const toMs = (t) => (typeof t === "number" ? t : Date.parse(t));

const pad = (n) => String(n).padStart(2, "0");
export function fromMs(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getFreeWindows(start, end, busy = []) {
  const s = toMs(start);
  const e = toMs(end);

  const blocks = busy
    .map((b) => ({ start: Math.max(toMs(b.start), s), end: Math.min(toMs(b.end), e) }))
    .filter((b) => b.start < b.end)
    .sort((a, b) => a.start - b.start);

  const free = [];
  let cursor = s;
  for (const b of blocks) {
    if (b.start > cursor) free.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < e) free.push({ start: cursor, end: e });

  return free;
}