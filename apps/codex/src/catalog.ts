import starter from '../../../shared/content/starter-pack.v1.json'
import foundation from '../../../shared/content/foundation-week.v2.json'

export type Segment = { text: string; reading?: string }
export type ChoiceQuestion = {
  id: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
}
export type StudyCard = {
  id: string
  kind: 'kana' | 'vocabulary' | 'grammar'
  front: string
  reading?: string
  back: string
  example: string
  note?: string
  unitId?: string
}
export type Reading = {
  id: string
  title: string
  level: string
  minutes: number
  segments: Segment[]
  translation: string
  focus: string[]
  questions: ChoiceQuestion[]
  unitId?: string
}
export type Listening = {
  id: string
  title: string
  level: string
  minutes?: number
  audio: string
  audioKind: 'human' | 'synthetic'
  transcript: string
  translation: string
  credit: string
  sourceUrl?: string
  questions: ChoiceQuestion[]
  unitId?: string
}
export type CourseUnit = {
  id: string
  order: number
  title: string
  goal: string
  prerequisiteIds: string[]
  cardIds: string[]
  readingId: string
  listeningId: string
  reflection: string
  estimatedMinutes: number
}
export const cards = [...starter.cards, ...foundation.cards] as StudyCard[]
export const readings = [
  ...starter.readings,
  ...foundation.readings,
] as Reading[]
export const baselineQuestions = starter.baselineQuestions as ChoiceQuestion[]
export const courseUnits = foundation.units as CourseUnit[]
export const contentManifest = [
  { id: starter.id, revision: 1 },
  { id: foundation.packId, revision: foundation.revision },
]
export const listeningSources = [
  ...starter.listenings,
  ...foundation.listenings,
]
