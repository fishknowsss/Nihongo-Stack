export const STUDY_TIME_PREFIX = 'studyTime:v1:'
export const IDLE_MS = 60_000
export type StudyTime = {
  day: string
  view: string
  startedAt: string
  updatedAt: string
  activeMs: number
  status: 'running' | 'paused' | 'background' | 'idle' | 'ended'
}
export function parseStudyTime(value: unknown): StudyTime | null {
  try {
    const row = JSON.parse(String(value))
    return row && typeof row.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.day) &&
      new Date(`${row.day}T00:00:00Z`).toISOString().slice(0,10) === row.day &&
      ['review', 'reading', 'listening', 'baseline'].includes(row.view) &&
      typeof row.startedAt === 'string' && typeof row.updatedAt === 'string' &&
      Number.isFinite(Date.parse(row.startedAt)) && Number.isFinite(Date.parse(row.updatedAt)) &&
      Date.parse(row.updatedAt) >= Date.parse(row.startedAt) &&
      Number.isFinite(row.activeMs) && row.activeMs >= 0 && row.activeMs <= 86_400_000 &&
      ['running', 'paused', 'background', 'idle', 'ended'].includes(row.status)
      ? row as StudyTime : null
  } catch { return null }
}
// Monotonic deltas, bounded by the last real activity. Suspension never adds hours.
export function activeDelta(previous: number, now: number, lastInput: number, enabled: boolean): number {
  return enabled ? Math.max(0, Math.min(now, lastInput + IDLE_MS) - previous) : 0
}
export function formatStudyTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
export function splitAtMidnight(delta: number, measuredEnd: number, midnight: number): [number, number] {
  const before = Math.min(delta, Math.max(0, midnight - (measuredEnd - delta)))
  return [before, delta - before]
}
