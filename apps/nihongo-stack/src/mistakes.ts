import { readings, listeningSources, type ChoiceQuestion } from './catalog'
import type { Attempt } from './db'
import { independentPlayback } from './learning'

export function practiceEvidence(attempt: Attempt, attempts: Attempt[]): string {
  if (attempt.kind === 'reading') return attempt.readingHelp === undefined ? '阅读 · 辅助状态未记录' : attempt.readingHelp ? '阅读 · 使用过振假名' : '阅读 · 未使用振假名'
  const clip = listeningSources.find(x => x.id === attempt.materialId)
  const source = attempt.listening?.sourceKind ?? (clip ? ('audioKind' in clip ? clip.audioKind : 'human') : undefined)
  if (source === undefined) return '听音 · 来源类型未记录'
  if (source === 'synthetic') return '听音 · 合成语音练习'
  if (!attempt.listening) return '听音 · 真人录音，辅助状态未记录'
  if (!independentPlayback(attempt.listening)) return '听音 · 真人录音，辅助练习'
  const first = [...attempts].filter(x => x.kind === 'listening' && x.materialId === attempt.materialId).sort(compareAttempts)[0]
  return first?.id === attempt.id ? '听音 · 真人独立首遍' : '听音 · 真人独立重练'
}
function compareAttempts(a: Attempt, b: Attempt) {
  return a.completedAt.localeCompare(b.completedAt) || a.id.localeCompare(b.id)
}
export type Mistake = { attempt: Attempt; question: ChoiceQuestion; index: number; evidence: string }
export function latestMistakes(attempts: Attempt[]): { items: Mistake[]; unavailable: number } {
  const latest = new Map<string, Attempt>()
  for (const attempt of [...attempts].sort(compareAttempts)) {
    if (attempt.kind !== 'baseline') latest.set(`${attempt.kind}:${attempt.materialId}`, attempt)
  }
  const items: Mistake[] = []
  let unavailable = 0
  for (const attempt of [...latest.values()].sort((a,b) => compareAttempts(b,a))) {
    const material = attempt.kind === 'reading' ? readings.find(x => x.id === attempt.materialId) : listeningSources.find(x => x.id === attempt.materialId)
    if (!material || material.questions.length !== attempt.answers.length || material.questions.some((q,i) => attempt.answers[i] < -2 || attempt.answers[i] >= q.options.length || attempt.answers[i] === -1)) { unavailable++; continue }
    material.questions.forEach((question, index) => {
      if (attempt.answers[index] !== question.answer) items.push({ attempt, question, index, evidence: practiceEvidence(attempt, attempts) })
    })
  }
  return { items, unavailable }
}
