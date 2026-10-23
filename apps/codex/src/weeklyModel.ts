import type { Attempt, Preference, ReviewEvent } from './db'
import { STUDY_TIME_PREFIX, parseStudyTime, type StudyTime } from './activityModel'
import { localDate } from './learning'

export const studyKinds = [
  { view: 'review', label: '卡片复习' },
  { view: 'reading', label: '阅读' },
  { view: 'listening', label: '听音' },
  { view: 'baseline', label: '起点小测' },
] as const

// Use completed calendar days so a partly studied today does not distort the report.
export function weeklyReport(preferences: Preference[], attempts: Attempt[], events: ReviewEvent[], now: number) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setDate(date.getDate() - 7 + index)
    return localDate(date)
  })
  const allSessions = preferences
    .filter(item => item.key.startsWith(STUDY_TIME_PREFIX))
    .map(item => parseStudyTime(item.value))
    .filter((item): item is StudyTime => item !== null)
  const sessions = allSessions.filter(item => days.includes(item.day))
  const today = localDate(new Date(now))
  const todayMs = allSessions.filter(item => item.day === today).reduce((sum, item) => sum + item.activeMs, 0)
  const rows = days.map(day => ({
    day,
    activeMs: sessions.filter(item => item.day === day).reduce((sum, item) => sum + item.activeMs, 0),
    reviews: events.filter(item => localDate(new Date(item.reviewedAt)) === day).length,
    exercises: attempts.filter(item => item.kind !== 'baseline' && localDate(new Date(item.completedAt)) === day).length,
  }))
  const byKind = studyKinds.map(kind => ({
    ...kind,
    activeMs: sessions.filter(item => item.view === kind.view).reduce((sum, item) => sum + item.activeMs, 0),
  }))
  const reasons = preferences.filter(item => {
    const [prefix, day] = item.key.split(':')
    return prefix === 'taskReason' && days.includes(day) && typeof item.value === 'string' && item.value.length > 0
  }).reduce<Record<string, number>>((counts, item) => {
    const reason = String(item.value)
    counts[reason] = (counts[reason] ?? 0) + 1
    return counts
  }, {})
  return { rows, byKind, reasons, todayMs, activeDays: rows.filter(row => row.activeMs > 0).length }
}
