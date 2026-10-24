# task-slotter
[![test](https://github.com/Arushi-1011/task-slotter/actions/workflows/test.yml/badge.svg)](https://github.com/Arushi-1011/task-slotter/actions)
[![npm](https://img.shields.io/npm/v/task-slotter)](https://www.npmjs.com/package/task-slotter)

Fit tasks into your free time. A tiny, dependency-free scheduler that places tasks around busy blocks by deadline and priority.

**[Live demo](https://arushi-1011.github.io/task-slotter/)**

## Install

```bash
npm install task-slotter
```

## Usage

```js
import { schedule } from "task-slotter";

const result = schedule(
  [
    { id: "dsa",    title: "DSA practice", duration: 90, priority: 1, deadline: "2026-10-25T18:00" },
    { id: "report", title: "SE report",    duration: 60, priority: 2 },
  ],
  {
    start: "2026-10-24T09:00",
    end:   "2026-10-24T21:00",
    busy:  [{ start: "2026-10-24T13:00", end: "2026-10-24T14:00" }],
    breakMinutes: 10,
  }
);

// result.scheduled   -> [{ id, start, end }]
// result.unscheduled -> [{ id, reason }]
```

## API

### `schedule(tasks, options)`

| Task field | Type | Notes |
|---|---|---|
| `id` | string | required |
| `duration` | number | minutes, required |
| `priority` | number | **1 = most important**, default 5 |
| `deadline` | string | optional, `YYYY-MM-DDTHH:mm` |

| Option | Type | Notes |
|---|---|---|
| `start`, `end` | string | the scheduling window |
| `busy` | `{start, end}[]` | blocked time, may overlap |
| `breakMinutes` | number | gap after each task, default 0 |

Returns `{ scheduled, unscheduled }`. Unscheduled reasons: `"no free slot long enough"` or `"would miss deadline"`.

### `getFreeWindows(start, end, busy)`

Returns the free gaps between busy blocks as `{start, end}` millisecond timestamps.

## How it works

1. Subtract busy blocks from the window with a left-to-right sweep (O(b log b)).
2. Sort tasks by earliest deadline, then priority (O(n log n)).
3. Place each task greedily in the first window that fits.

## Limitations

Greedy first-fit is fast but not optimal. Fitting tasks into windows is a bin-packing variant, so some inputs have a valid arrangement this will miss.

## License

MIT
