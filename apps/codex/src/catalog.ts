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
const readingSegmentOverrides: Record<string, Record<number, string>> = {
  'reading-01': { 7: 'じゅうじに', 13: 'へいきました', 17: 'かいました', 19: 'はいえでそのほんをよみました' },
  'reading-02': { 11: 'へいく', 14: 'でも、あめなら', 16: 'をみにいきます', 17: 'ともだちにめっせーじをおくって、', 19: 'をきめます' },
  'v2-u01-reading': { 6: 'からきました。いま、', 8: 'にすんでいます', 14: 'しています。どうぞよろしくおねがいします' },
  'v2-u02-reading': { 4: 'におきます', 8: 'をでます', 20: 'します。よる', 22: 'にねます' },
  'v2-u03-reading': { 5: 'へいきます', 25: 'にあります。かえりは', 27: 'にのります' },
  'v2-u04-reading': { 1: 'にすーぱーへいきました。りんごをみっつと', 6: 'いました。りんごはひとつ' },
  'v2-u05-reading': { 3: 'さんからめーるがきました。「', 11: 'をみませんか。にじに', 13: 'のまえであいましょう。」', 17: 'にあるばいとがありますから、いけません。「' },
  'v2-u06-reading': { 5: 'へいく', 15: 'へいきません', 17: 'のちかくの', 19: 'であいます。はれなら、', 23: 'をたべます。どちらのばあいも、じゅうじに', 25: 'であいます' },
  'v2-u07-reading': { 7: 'へでかけました', 9: 'はんに', 11: 'であって、ばすで', 13: 'へいきました', 15: 'でに', 17: 'じかんすごしました。そのあと、', 19: 'でひるごはんをたべました。かえるまえに、', 23: 'のほんを' },
}

function applyReadingOverrides(reading: Reading): Reading {
  const overrides = readingSegmentOverrides[reading.id]
  if (!overrides) return reading
  return { ...reading, segments: reading.segments.map((segment, index) => ({ ...segment, reading: segment.reading ?? overrides[index] })) }
}

export const readings = [
  ...starter.readings,
  ...foundation.readings,
].map((reading) => applyReadingOverrides(reading as Reading))
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
