import type { Attempt, CardProgress, Preference } from './db'

export const DEFAULT_JLPT_EXAM_DATE = '2026-12-06'

export type StudyPlan = {
  examDate: string
  daysRemaining: number
  urgency: 'critical' | 'tight' | 'steady'
  totalMinutes: number
  foundationMinutes: number
  jlptMinutes: number
  foundationTarget: string
  jlptTarget: string
  foundationCount: number
  jlptQuestionCount: number
  rationale: string
}

function dayStart(value: string): number {
  const date = new Date(`${value}T00:00:00`)
  return Number.isFinite(date.getTime()) ? date.getTime() : Number.NaN
}

function daysBetween(today: string, examDate: string): number {
  const start = dayStart(today)
  const end = dayStart(examDate)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0
  return Math.max(0, Math.ceil((end - start) / 86_400_000))
}

function mistakeCount(preferences: Preference[]): number {
  return preferences.reduce((total, row) => {
    if (!row.key.startsWith('jlptMistakes:') || typeof row.value !== 'string') return total
    try {
      const values = JSON.parse(row.value) as unknown
      return total + (Array.isArray(values) ? values.length : 0)
    } catch {
      return total
    }
  }, 0)
}

export function buildStudyPlan(input: {
  today: string
  availableMinutes: number
  preferences: Preference[]
  baseline?: Attempt
  dueCards: CardProgress[]
  jlptCompletedCount: number
}): StudyPlan {
  const savedDate = input.preferences.find((row) => row.key === 'jlptExamDate')?.value
  const examDate = typeof savedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(savedDate)
    ? savedDate
    : DEFAULT_JLPT_EXAM_DATE
  const daysRemaining = daysBetween(input.today, examDate)
  const urgency = daysRemaining <= 21 ? 'critical' : daysRemaining <= 60 ? 'tight' : 'steady'
  const totalMinutes = Math.max(10, Math.min(300, Math.floor(input.availableMinutes)))
  const baselineRatio = input.baseline && input.baseline.total > 0
    ? input.baseline.correct / input.baseline.total
    : 0
  const foundationHeavy = !input.baseline || baselineRatio < 0.6
  const foundationShare = urgency === 'critical'
    ? foundationHeavy ? 0.35 : 0.25
    : foundationHeavy ? 0.45 : 0.3
  const foundationMinutes = Math.max(10, Math.round(totalMinutes * foundationShare))
  const jlptMinutes = Math.max(0, totalMinutes - foundationMinutes)
  const mistakes = mistakeCount(input.preferences)
  const foundationCount = Math.max(3, Math.min(12, Math.floor(foundationMinutes / 4)))
  const jlptQuestionCount = Math.max(3, Math.min(20, Math.floor(jlptMinutes / 5)))

  const foundationTarget = !input.baseline
    ? '起点小测 + 五十音认读 + N5 句子骨架'
    : input.dueCards.length > 0
      ? `先复习 ${Math.min(input.dueCards.length, foundationCount)} 张到期卡，再补基础句型`
      : foundationHeavy
        ? '假名、助词、动词基本活用与短句理解'
        : '保留基础复习，重点巩固当天错词和例句'
  const jlptTarget = mistakes > 0
    ? `先复盘 ${Math.min(mistakes, jlptQuestionCount)} 道 JLPT 错题，再做 N2 分科题`
    : urgency === 'critical'
      ? `N2 分科定时训练 ${jlptQuestionCount} 题，完成后立即复盘`
      : `N2 词汇/语法与短阅读训练 ${jlptQuestionCount} 题`
  const rationale = !input.baseline
    ? '先建立最低理解能力，同时每天保留 N2 接触，避免基础和考试训练互相断开。'
    : urgency === 'critical'
      ? '距离考试已很近，基础只保留高频补强，主要时间用于 N2 题型、计时和错题回收。'
      : `已完成 ${input.jlptCompletedCount} 个教学包；按当前基础与剩余时间并行推进。`

  return {
    examDate,
    daysRemaining,
    urgency,
    totalMinutes,
    foundationMinutes,
    jlptMinutes,
    foundationTarget,
    jlptTarget,
    foundationCount,
    jlptQuestionCount,
    rationale,
  }
}
