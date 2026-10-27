import { cards, courseUnits, type StudyCard } from './catalog'
import type { Attempt, ReviewEvent, CardProgress } from './db'
export function localDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}
export function boundedNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.floor(value)))
    : fallback
}
export function difficultCardIds(events: ReviewEvent[]): Set<string> {
  const latest = new Map<string, ReviewEvent>()
  for (const event of events) {
    const previous = latest.get(event.cardId)
    if (!previous || event.reviewedAt >= previous.reviewedAt)
      latest.set(event.cardId, event)
  }
  return new Set(
    [...latest.values()]
      .filter((event) => event.rating <= 2)
      .map((event) => event.cardId),
  )
}
export function reviewRound(queue: StudyCard[], limit: number): string[] {
  const unique = [...new Set(queue.map((card) => card.id))]
  if (limit <= 0) return unique
  if (!Number.isFinite(limit)) return unique.slice(0, 20)
  return unique.slice(0, Math.max(1, Math.floor(limit)))
}
export function introducedOn(events: ReviewEvent[], day: string): Set<string> {
  const first = new Map<string, string>()
  for (const event of events) {
    const old = first.get(event.cardId)
    if (!old || event.reviewedAt < old)
      first.set(event.cardId, event.reviewedAt)
  }
  return new Set(
    [...first]
      .filter(([, date]) => localDate(new Date(date)) === day)
      .map(([id]) => id),
  )
}
export function unitPracticed(id: string, attempts: Attempt[]): boolean {
  const unit = courseUnits.find((x) => x.id === id)
  return (
    !!unit &&
    [unit.readingId, unit.listeningId].every((materialId) =>
      attempts.some((x) => x.materialId === materialId),
    )
  )
}
export function reviewQueue(
  progress: CardProgress[],
  now: number,
  unitId: string,
  focus: StudyCard['kind'] | null,
): StudyCard[] {
  const states = new Map(progress.map((x) => [x.id, x]))
  const due = cards
    .filter(
      (x) =>
        states.has(x.id) && new Date(states.get(x.id)!.dueAt).getTime() <= now,
    )
    .sort((a, b) =>
      states.get(a.id)!.dueAt.localeCompare(states.get(b.id)!.dueAt),
    )
  // Keep the selected unit first, then expose every unintroduced card. Learning has no daily quota.
  const fresh = cards
    .filter((x) => !states.has(x.id) && (!x.unitId || x.unitId === unitId))
    .sort(
      (a, b) =>
        Number(b.unitId === unitId) - Number(a.unitId === unitId) ||
        Number(b.kind === focus) - Number(a.kind === focus),
    )
  const remaining = cards
    .filter((x) => !states.has(x.id) && x.unitId && x.unitId !== unitId)
    .sort(
      (a, b) =>
        Number(b.kind === focus) - Number(a.kind === focus),
    )
  return [...due, ...fresh, ...remaining]
}
export function independentPlayback(meta: Attempt['listening']): boolean {
  return (
    !!meta &&
    meta.playCount === 1 &&
    meta.completedPlayback &&
    !meta.transcriptBeforeSubmit &&
    meta.seekedBeforeSubmit === false &&
    !meta.rateChangedBeforeSubmit
  )
}
export type PlayedRange = [number, number]
export function mergeRanges(ranges: PlayedRange[]): PlayedRange[] {
  const merged: PlayedRange[] = []
  for (const [start, end] of ranges
    .filter(
      ([s, e]) => Number.isFinite(s) && Number.isFinite(e) && s >= 0 && e > s,
    )
    .sort((a, b) => a[0] - b[0])) {
    const previous = merged.at(-1)
    if (previous && start <= previous[1] + 0.15)
      previous[1] = Math.max(previous[1], end)
    else merged.push([start, end])
  }
  return merged
}
export function fullyPlayed(ranges: PlayedRange[], duration: number): boolean {
  const covered = mergeRanges(ranges)
  // Require coverage from the beginning through the end, not merely an ended event.
  return (
    Number.isFinite(duration) &&
    duration > 0 &&
    covered.length === 1 &&
    covered[0][0] <= 0.35 &&
    covered[0][1] >= duration - 0.35
  )
}

export function backupFilename(
  kind: 'backup' | 'before-restore',
  now = new Date(),
): string {
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((x) => String(x).padStart(2, '0'))
    .join('')
  return `nihongo-stack-${kind}-${localDate(now)}-${time}-${String(now.getMilliseconds()).padStart(3, '0')}.json`
}
