export type Time = string | number; // "YYYY-MM-DDTHH:mm" or ms timestamp

export interface Task {
  id: string;
  title?: string;
  /** minutes */
  duration: number;
  /** 1 = most important (default 5) */
  priority?: number;
  /** "YYYY-MM-DDTHH:mm" */
  deadline?: string;
}

export interface TimeRange {
  start: Time;
  end: Time;
}

export interface WorkingHours {
  /** "HH:mm" */
  start: string;
  /** "HH:mm", must be after start (overnight shifts not supported) */
  end: string;
}

export interface ScheduleOptions {
  start: Time;
  end: Time;
  busy?: readonly TimeRange[];
  /** gap in minutes after each task (default 0) */
  breakMinutes?: number;
  workingHours?: WorkingHours;
}

export interface ScheduledTask {
  id: string;
  start: string;
  end: string;
}

export type UnscheduledReason = "no free slot long enough" | "would miss deadline";

export interface UnscheduledTask {
  id: string;
  reason: UnscheduledReason;
}

export interface ScheduleResult {
  scheduled: ScheduledTask[];
  unscheduled: UnscheduledTask[];
}

export interface FreeWindow {
  /** ms timestamps */
  start: number;
  end: number;
}

export function schedule(tasks: readonly Task[], options: ScheduleOptions): ScheduleResult;

export function getFreeWindows(
  start: Time,
  end: Time,
  busy?: readonly TimeRange[]
): FreeWindow[];