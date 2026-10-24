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
  transcriptSegments?: Segment[]
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

const listeningTranscriptSegments: Record<string, Segment[]> = {
  'listening-01': [{ text: '明日', reading: 'あした' }, { text: 'は', reading: 'は' }, { text: '何か', reading: 'なにか' }, { text: '予定', reading: 'よてい' }, { text: 'ある？', reading: 'ある？' }],
  'listening-02': [{ text: '駅', reading: 'えき' }, { text: 'までは', reading: 'までは' }, { text: '歩いて', reading: 'あるいて' }, { text: '1時間', reading: 'いちじかん' }, { text: 'です。', reading: 'です' }],
  'listening-03': [{ text: '今週末', reading: 'こんしゅうまつ' }, { text: 'は', reading: 'は' }, { text: '暇？', reading: 'ひま？' }],
  'v2-u01-listening': [{ text: 'はじめまして。', reading: 'はじめまして' }, { text: '私', reading: 'わたし' }, { text: 'は', reading: 'は' }, { text: '田中', reading: 'たなか' }, { text: 'です。', reading: 'です' }, { text: '大阪', reading: 'おおさか' }, { text: 'に', reading: 'に' }, { text: '住んでいます。', reading: 'すんでいます' }, { text: '会社員', reading: 'かいしゃいん' }, { text: 'です。', reading: 'です' }, { text: 'よろしくお願いします。', reading: 'よろしくおねがいします' }],
  'v2-u02-listening': [{ text: '明日', reading: 'あした' }, { text: 'の', reading: 'の' }, { text: '授業', reading: 'じゅぎょう' }, { text: 'は', reading: 'は' }, { text: '十時', reading: 'じゅうじ' }, { text: 'からです。', reading: 'からです' }, { text: '私', reading: 'わたし' }, { text: 'は', reading: 'は' }, { text: '九時半', reading: 'くじはん' }, { text: 'に', reading: 'に' }, { text: '家', reading: 'いえ' }, { text: 'を', reading: 'を' }, { text: '出ます。', reading: 'でます' }, { text: '授業', reading: 'じゅぎょう' }, { text: 'のあと、', reading: 'のあと' }, { text: '図書館', reading: 'としょかん' }, { text: 'で', reading: 'で' }, { text: '勉強します。', reading: 'べんきょうします' }],
  'v2-u03-listening': [{ text: '駅', reading: 'えき' }, { text: 'から', reading: 'から' }, { text: '病院', reading: 'びょういん' }, { text: 'まで', reading: 'まで' }, { text: 'バス', reading: 'ばす' }, { text: 'で', reading: 'で' }, { text: '十五分', reading: 'じゅうごふん' }, { text: 'です。', reading: 'です' }, { text: '病院', reading: 'びょういん' }, { text: 'は', reading: 'は' }, { text: 'スーパー', reading: 'すーぱー' }, { text: 'の隣', reading: 'のとなり' }, { text: 'に', reading: 'に' }, { text: 'あります。', reading: 'あります' }, { text: '私', reading: 'わたし' }, { text: 'は', reading: 'は' }, { text: '明日、', reading: 'あした' }, { text: 'バス', reading: 'ばす' }, { text: 'で', reading: 'で' }, { text: '病院', reading: 'びょういん' }, { text: 'へ行きます。', reading: 'へいきます' }],
  'v2-u04-listening': [{ text: 'このパン', reading: 'このぱん' }, { text: 'は', reading: 'は' }, { text: '一つ', reading: 'ひとつ' }, { text: '百五十円', reading: 'ひゃくごじゅうえん' }, { text: 'です。', reading: 'です' }, { text: '二つ', reading: 'ふたつ' }, { text: 'ください。', reading: 'ください' }, { text: '牛乳', reading: 'ぎゅうにゅう' }, { text: 'は', reading: 'は' }, { text: '買いません。', reading: 'かいません' }, { text: 'パンだけ', reading: 'ぱんだけ' }, { text: 'で', reading: 'で' }, { text: '三百円', reading: 'さんびゃくえん' }, { text: 'ですね。', reading: 'ですね' }],
  'v2-u05-listening': [{ text: '日曜日', reading: 'にちようび' }, { text: 'に', reading: 'に' }, { text: '一緒に', reading: 'いっしょに' }, { text: '昼ご飯', reading: 'ひるごはん' }, { text: 'を', reading: 'を' }, { text: '食べませんか。', reading: 'たべませんか' }, { text: '十二時', reading: 'じゅうにじ' }, { text: 'に', reading: 'に' }, { text: '駅', reading: 'えき' }, { text: 'の前', reading: 'のまえ' }, { text: 'で', reading: 'で' }, { text: '会いましょう。', reading: 'あいましょう' }, { text: '私', reading: 'わたし' }, { text: 'は', reading: 'は' }, { text: '午前中', reading: 'ごぜんちゅう' }, { text: '、授業', reading: 'じゅぎょう' }, { text: 'がありますから、', reading: 'がありますから' }, { text: '十一時', reading: 'じゅういちじ' }, { text: 'には', reading: 'には' }, { text: '行けません。', reading: 'いけません' }],
  'v2-u06-listening': [{ text: '明日', reading: 'あした' }, { text: 'は', reading: 'は' }, { text: '雨', reading: 'あめ' }, { text: 'の予報', reading: 'のよほう' }, { text: 'です。', reading: 'です' }, { text: '雨', reading: 'あめ' }, { text: 'なら、', reading: 'なら' }, { text: '図書館', reading: 'としょかん' }, { text: 'で', reading: 'で' }, { text: '勉強します。', reading: 'べんきょうします' }, { text: '晴れ', reading: 'はれ' }, { text: 'なら、', reading: 'なら' }, { text: '公園', reading: 'こうえん' }, { text: 'へ行きます。', reading: 'へいきます' }, { text: '友達', reading: 'ともだち' }, { text: 'とは', reading: 'とは' }, { text: '午後一時', reading: 'ごごいちじ' }, { text: 'に', reading: 'に' }, { text: '会います。', reading: 'あいます' }],
  'v2-u07-listening': [{ text: '昨日、', reading: 'きのう' }, { text: '友達', reading: 'ともだち' }, { text: 'と', reading: 'と' }, { text: '買い物', reading: 'かいもの' }, { text: 'に行きました。', reading: 'にいきました' }, { text: '十時', reading: 'じゅうじ' }, { text: 'に', reading: 'に' }, { text: '駅', reading: 'えき' }, { text: 'で', reading: 'で' }, { text: '会いました。', reading: 'あいました' }, { text: '本屋', reading: 'ほんや' }, { text: 'で', reading: 'で' }, { text: '本', reading: 'ほん' }, { text: 'を', reading: 'を' }, { text: '二冊', reading: 'にさつ' }, { text: '買いました。', reading: 'かいました' }, { text: '来週', reading: 'らいしゅう' }, { text: 'の日曜日', reading: 'のにちようび' }, { text: 'は', reading: 'は' }, { text: '一緒に', reading: 'いっしょに' }, { text: '映画', reading: 'えいが' }, { text: 'を見る予定です。', reading: 'をみるよていです' }],
}

export const baselineQuestions = starter.baselineQuestions as ChoiceQuestion[]
export const courseUnits = foundation.units as CourseUnit[]
export const contentManifest = [
  { id: starter.id, revision: 1 },
  { id: foundation.packId, revision: foundation.revision },
]
export const listeningSources = [
  ...starter.listenings,
  ...foundation.listenings,
].map((clip) => ({ ...clip, transcriptSegments: listeningTranscriptSegments[clip.id] }))
