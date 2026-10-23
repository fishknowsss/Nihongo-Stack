import { contentManifest } from './catalog'
import { STUDY_TIME_PREFIX, parseStudyTime } from './activityModel'
import Dexie, { type EntityTable } from 'dexie'
import {
  createEmptyCard,
  fsrs,
  type Card,
  type ReviewLog,
  type Grade,
} from 'ts-fsrs'

export type CardProgress = {
  id: string
  card: Card
  dueAt: string
  updatedAt: string
}
export type ReviewEvent = {
  id: string
  cardId: string
  rating: Grade
  reviewedAt: string
  log: ReviewLog
}
export type Attempt = {
  id: string
  materialId: string
  kind: 'reading' | 'listening' | 'baseline'
  answers: number[]
  correct: number
  total: number
  completedAt: string
  durationMs?: number
  readingHelp?: boolean
  listening?: {
    playCount: number
    transcriptBeforeSubmit: boolean
    completedPlayback: boolean
    seekedBeforeSubmit?: boolean
    sourceKind?: 'human' | 'synthetic'
    rateChangedBeforeSubmit?: boolean
    playedRanges?: [number, number][]
    duration?: number
  }
}
export type Preference = { key: string; value: string | number | boolean }

class NihongoDatabase extends Dexie {
  progress!: EntityTable<CardProgress, 'id'>
  reviewEvents!: EntityTable<ReviewEvent, 'id'>
  attempts!: EntityTable<Attempt, 'id'>
  preferences!: EntityTable<Preference, 'key'>

  constructor() {
    super('nihongo-stack-codex')
    this.version(1).stores({
      progress: 'id, dueAt, updatedAt',
      reviewEvents: 'id, cardId, reviewedAt',
      attempts: 'id, kind, materialId, completedAt',
      preferences: 'key',
    })
  }
}

export const db = new NihongoDatabase()
const scheduler = fsrs()
const pendingGrades = new Set<string>()

export async function gradeCard(cardId: string, rating: Grade): Promise<void> {
  if (pendingGrades.has(cardId)) return
  pendingGrades.add(cardId)
  try {
    await db.transaction('rw', db.progress, db.reviewEvents, async () => {
      const now = new Date()
      const previous = await db.progress.get(cardId)
      const input: Card = previous?.card ?? createEmptyCard<Card>(now)
      const result = scheduler.next(input, now, rating)
      await db.progress.put({
        id: cardId,
        card: result.card,
        dueAt: result.card.due.toISOString(),
        updatedAt: now.toISOString(),
      })
      await db.reviewEvents.put({
        id: crypto.randomUUID(),
        cardId,
        rating,
        reviewedAt: now.toISOString(),
        log: result.log,
      })
    })
  } finally {
    pendingGrades.delete(cardId)
  }
}

export async function recordAttempt(
  materialId: string,
  kind: Attempt['kind'],
  answers: number[],
  correct: number,
  total: number,
  listening?: Attempt['listening'],
  draftKeys: string[] = [],
  durationMs?: number,
  readingHelp?: boolean,
): Promise<void> {
  await db.transaction('rw', db.attempts, db.preferences, async () => {
    await db.attempts.put({
      id: crypto.randomUUID(),
      materialId,
      kind,
      answers,
      correct,
      total,
      completedAt: new Date().toISOString(),
      ...(listening ? { listening } : {}),
      ...(durationMs !== undefined ? { durationMs } : {}),
      ...(readingHelp !== undefined ? { readingHelp } : {}),
    })
    if (draftKeys.length) await db.preferences.bulkDelete(draftKeys)
  })
}

export async function setPreference(
  key: string,
  value: Preference['value'],
): Promise<void> {
  await db.preferences.put({ key, value })
}

export async function createBackup(): Promise<string> {
  return db.transaction(
    'r',
    db.progress,
    db.reviewEvents,
    db.attempts,
    db.preferences,
    async () => {
      const [progress, reviewEvents, attempts, preferences] = await Promise.all(
        [
          db.progress.toArray(),
          db.reviewEvents.toArray(),
          db.attempts.toArray(),
          db.preferences.toArray(),
        ],
      )
      return JSON.stringify(
        {
          schemaVersion: 1,
          contentPacks: contentManifest,
          exportedAt: new Date().toISOString(),
          progress,
          reviewEvents,
          attempts,
          preferences: preferences.filter(
            (x) => x.key !== 'restoreSafetySnapshot',
          ),
        },
        null,
        2,
      )
    },
  )
}

export function inspectBackup(json: string): {
  progress: number
  reviews: number
  attempts: number
  preferences: number
  exportedAt: string
} {
  const backup = parseBackup(json)
  return {
    progress: backup.progress.length,
    reviews: backup.reviewEvents.length,
    attempts: backup.attempts.length,
    preferences: backup.preferences.length,
    exportedAt: backup.exportedAt,
  }
}

function parseBackup(json: string): {
  progress: CardProgress[]
  reviewEvents: ReviewEvent[]
  attempts: Attempt[]
  preferences: Preference[]
  exportedAt: string
} {
  if (json.length > 20 * 1024 * 1024)
    throw new Error('备份超过 20 MB，请使用较小的备份文件')
  const data: unknown = JSON.parse(json)
  if (!data || typeof data !== 'object') throw new Error('备份格式无效')
  const backup = data as Record<string, unknown>
  if (
    backup.schemaVersion !== 1 ||
    !Array.isArray(backup.progress) ||
    !Array.isArray(backup.reviewEvents) ||
    !Array.isArray(backup.attempts) ||
    !Array.isArray(backup.preferences) ||
    typeof backup.exportedAt !== 'string' ||
    !Number.isFinite(Date.parse(backup.exportedAt))
  ) {
    throw new Error('备份版本或数据表不正确')
  }
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length)
      throw new Error(`${label}存在重复 ID`)
  }
  const restoredProgress: CardProgress[] = []
  for (const row of backup.progress) {
    if (
      !row ||
      typeof row.id !== 'string' ||
      !row.id ||
      !row.card ||
      typeof row.dueAt !== 'string' ||
      typeof row.updatedAt !== 'string'
    )
      throw new Error('复习记录字段不完整')
    const card = row.card as Card
    const due = new Date(card.due)
    const lastReview =
      card.last_review == null ? undefined : new Date(card.last_review)
    if (
      !Number.isFinite(due.getTime()) ||
      (lastReview && !Number.isFinite(lastReview.getTime())) ||
      !Number.isFinite(new Date(row.dueAt).getTime()) ||
      !Number.isFinite(new Date(row.updatedAt).getTime()) ||
      due.toISOString() !== row.dueAt
    )
      throw new Error('复习日期无效')
    if (
      ![
        card.stability,
        card.difficulty,
        card.state,
        card.reps,
        card.lapses,
        card.elapsed_days,
        card.scheduled_days,
      ].every((value) => typeof value === 'number' && Number.isFinite(value))
    )
      throw new Error('复习排程字段不完整')
    if (
      ![0, 1, 2, 3].includes(card.state) ||
      card.stability < 0 ||
      card.difficulty < 0 ||
      card.difficulty > 10 ||
      ![card.reps, card.lapses, card.elapsed_days, card.scheduled_days].every(
        (x) => Number.isInteger(x) && x >= 0,
      ) ||
      (card.learning_steps !== undefined &&
        (!Number.isInteger(card.learning_steps) || card.learning_steps < 0))
    )
      throw new Error('复习排程数值无效')
    restoredProgress.push({
      ...row,
      card: {
        ...card,
        due,
        ...(lastReview ? { last_review: lastReview } : {}),
      },
    } as CardProgress)
  }
  unique(
    restoredProgress.map((row) => row.id),
    '复习记录',
  )
  for (const row of backup.reviewEvents) {
    if (
      !row ||
      typeof row.id !== 'string' ||
      !row.id ||
      typeof row.cardId !== 'string' ||
      !row.cardId ||
      typeof row.reviewedAt !== 'string' ||
      !Number.isFinite(Date.parse(row.reviewedAt)) ||
      ![1, 2, 3, 4].includes(row.rating) ||
      !row.log ||
      typeof row.log !== 'object'
    )
      throw new Error('复习日志字段不完整')
  }
  for (const row of backup.reviewEvents) {
    const log = row.log
    if (
      ![1, 2, 3, 4].includes(log.rating) ||
      ![0, 1, 2, 3].includes(log.state) ||
      !Number.isFinite(Date.parse(log.due)) ||
      !Number.isFinite(Date.parse(log.review)) ||
      ![
        log.stability,
        log.difficulty,
        log.elapsed_days,
        log.scheduled_days,
        log.last_elapsed_days,
      ].every(
        (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0,
      )
    )
      throw new Error('复习日志排程无效')
  }
  unique(
    (backup.reviewEvents as ReviewEvent[]).map((row) => row.id),
    '复习日志',
  )
  for (const row of backup.attempts) {
    if (
      !row ||
      typeof row.id !== 'string' ||
      !row.id ||
      typeof row.materialId !== 'string' ||
      !row.materialId ||
      !['reading', 'listening', 'baseline'].includes(row.kind) ||
      !Array.isArray(row.answers) ||
      !row.answers.every(
        (answer: unknown) =>
          typeof answer === 'number' &&
          Number.isInteger(answer) &&
          answer >= -2 &&
          answer !== -1,
      ) ||
      !Number.isInteger(row.correct) ||
      !Number.isInteger(row.total) ||
      row.correct < 0 ||
      row.total < 1 ||
      row.correct > row.total ||
      row.answers.length !== row.total ||
      typeof row.completedAt !== 'string' ||
      !Number.isFinite(Date.parse(row.completedAt))
    )
      throw new Error('练习记录字段不完整')
    if (
      row.durationMs !== undefined &&
      (!Number.isFinite(row.durationMs) || row.durationMs < 0)
    )
      throw new Error('练习时长无效')
    if (row.readingHelp !== undefined && typeof row.readingHelp !== 'boolean')
      throw new Error('阅读辅助字段无效')
    if (
      row.listening?.rateChangedBeforeSubmit !== undefined &&
      typeof row.listening.rateChangedBeforeSubmit !== 'boolean'
    )
      throw new Error('听力语速字段无效')
    if (
      row.listening?.sourceKind !== undefined &&
      !['human', 'synthetic'].includes(row.listening.sourceKind)
    )
      throw new Error('听力来源类型无效')
    if (
      row.listening?.playedRanges !== undefined &&
      (!Array.isArray(row.listening.playedRanges) ||
        !row.listening.playedRanges.every(
          (range: unknown) =>
            Array.isArray(range) &&
            range.length === 2 &&
            range.every(
              (x: unknown) =>
                typeof x === 'number' && Number.isFinite(x) && x >= 0,
            ) &&
            range[1] >= range[0],
        ))
    )
      throw new Error('听力覆盖区间无效')
    if (
      row.listening?.duration !== undefined &&
      (!Number.isFinite(row.listening.duration) || row.listening.duration <= 0)
    )
      throw new Error('听力时长无效')
    if (
      row.listening &&
      (row.kind !== 'listening' ||
        !Number.isInteger(row.listening.playCount) ||
        row.listening.playCount < 0 ||
        typeof row.listening.transcriptBeforeSubmit !== 'boolean' ||
        typeof row.listening.completedPlayback !== 'boolean' ||
        (row.listening.seekedBeforeSubmit !== undefined &&
          typeof row.listening.seekedBeforeSubmit !== 'boolean'))
    )
      throw new Error('听力记录字段无效')
  }
  unique(
    (backup.attempts as Attempt[]).map((row) => row.id),
    '练习记录',
  )
  for (const row of backup.preferences) {
    if (
      !row ||
      typeof row.key !== 'string' ||
      !row.key ||
      !['string', 'number', 'boolean'].includes(typeof row.value) ||
      (typeof row.value === 'number' && !Number.isFinite(row.value))
    )
      throw new Error('设置字段不完整')
    if (row.key.startsWith(STUDY_TIME_PREFIX) && !parseStudyTime(row.value))
      throw new Error('学习计时记录无效')
  }
  unique(
    (backup.preferences as Preference[]).map((row) => row.key),
    '设置',
  )
  return {
    progress: restoredProgress,
    reviewEvents: backup.reviewEvents as ReviewEvent[],
    attempts: backup.attempts as Attempt[],
    preferences: backup.preferences as Preference[],
    exportedAt: backup.exportedAt,
  }
}

export async function restoreBackup(json: string): Promise<void> {
  const backup = parseBackup(json)
  await db.transaction(
    'rw',
    db.progress,
    db.reviewEvents,
    db.attempts,
    db.preferences,
    async () => {
      const safetySnapshot = await createBackup()
      await Promise.all([
        db.progress.clear(),
        db.reviewEvents.clear(),
        db.attempts.clear(),
        db.preferences.clear(),
      ])
      await db.progress.bulkPut(backup.progress)
      await db.reviewEvents.bulkPut(backup.reviewEvents)
      await db.attempts.bulkPut(backup.attempts)
      await db.preferences.bulkPut(
        backup.preferences.filter((x) => x.key !== 'restoreSafetySnapshot'),
      )
      await db.preferences.put({
        key: 'restoreSafetySnapshot',
        value: safetySnapshot,
      })
    },
  )
}
