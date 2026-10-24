import { buildStudyPlan, DEFAULT_JLPT_EXAM_DATE } from '../src/studyPlan'

const base = {
  today: '2026-10-24',
  availableMinutes: 60,
  preferences: [],
  dueCards: [],
  jlptCompletedCount: 0,
}

const starter = buildStudyPlan(base)
if (starter.examDate !== DEFAULT_JLPT_EXAM_DATE || starter.daysRemaining !== 43) throw new Error('默认目标日期或剩余天数错误')
if (starter.foundationMinutes + starter.jlptMinutes !== 60) throw new Error('双轨时间没有守恒')
if (!starter.foundationTarget.includes('五十音') || !starter.jlptTarget.includes('N2')) throw new Error('初学者双轨目标缺失')

const critical = buildStudyPlan({ ...base, today: '2026-11-20', preferences: [{ key: 'jlptMistakes:pack', value: JSON.stringify([{ id: 'q1' }]) }] })
if (critical.urgency !== 'critical' || !critical.jlptTarget.includes('错题')) throw new Error('冲刺阶段没有优先错题')

const baseline = { id: 'baseline', materialId: 'baseline', kind: 'baseline' as const, answers: [0, 1, 2], correct: 3, total: 3, completedAt: '2026-10-23T00:00:00.000Z' }
const adjusted = buildStudyPlan({ ...base, baseline })
if (adjusted.foundationMinutes >= starter.foundationMinutes) throw new Error('完成基础小测后没有释放 JLPT 时间')

console.log('Study plan checks passed: deadline, split, beginner route, critical mistakes and baseline adjustment')
