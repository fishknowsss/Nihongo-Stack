import { readings } from './catalog'

export type StudyLayer = 'off' | 'furigana' | 'gloss' | 'romaji' | 'full'

export function isStudyLayer(value: unknown): value is StudyLayer {
  return value === 'off' || value === 'furigana' || value === 'gloss' || value === 'romaji' || value === 'full'
}

export type LexiconEntry = {
  surface: string
  reading: string
  romaji: string
  gloss?: string
  kind?: 'kanji' | 'katakana' | 'grammar' | 'hiragana'
  explanation?: string
}

const kanaBase: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo', ら: 'ra', り: 'ri', る: 'ru',  れ: 're', ろ: 'ro',
  わ: 'wa', を: 'o', が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo', だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo', ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  ゔ: 'vu', ゐ: 'wi', ゑ: 'we',
}
const kanaDigraph: Record<string, string> = {
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo', しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho', にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo', みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo', ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo', びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo', てぃ: 'ti', でぃ: 'di', ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo',
}

export function kanaToRomaji(value: string): string {
  const hiragana = [...value].map((char) => {
    const code = char.charCodeAt(0)
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char
  }).join('')
  let output = ''
  let geminate = false
  for (let index = 0; index < hiragana.length; index += 1) {
    const pair = hiragana.slice(index, index + 2)
    if (kanaDigraph[pair]) { output += (geminate ? kanaDigraph[pair][0] : '') + kanaDigraph[pair]; geminate = false; index += 1; continue }
    const char = hiragana[index]
    if (char === 'っ') { geminate = true; continue }
    if (char === 'ん') { output += 'n'; geminate = false; continue }
    if (char === 'ー') { output += '-'; continue }
    const roman = kanaBase[char]
    if (roman) { output += (geminate ? roman[0] : '') + roman; geminate = false }
    else output += char
  }
  return output
}

// 词条是学习辅助，不替代上下文。没有匹配词条时仍保留原文可读。
export const lexicon: LexiconEntry[] = [
  { surface: '私', reading: 'わたし', romaji: 'watashi', gloss: '我', kind: 'kanji', explanation: '第一人称；正式场合和日常都常用。' },
  { surface: '大学生', reading: 'だいがくせい', romaji: 'daigakusei', gloss: '大学生', kind: 'kanji' },
  { surface: '会社員', reading: 'かいしゃいん', romaji: 'kaishain', gloss: '公司职员', kind: 'kanji' },
  { surface: '住んでいます', reading: 'すんでいます', romaji: 'sunde imasu', gloss: '住在……', kind: 'kanji' },
  { surface: '京都', reading: 'きょうと', romaji: 'kyōto', gloss: '京都', kind: 'kanji' },
  { surface: '時間', reading: 'じかん', romaji: 'jikan', gloss: '时间', kind: 'kanji' },
  { surface: '毎日', reading: 'まいにち', romaji: 'mainichi', gloss: '每天', kind: 'kanji' },
  { surface: '電車', reading: 'でんしゃ', romaji: 'densha', gloss: '电车', kind: 'kanji' },
  { surface: '駅', reading: 'えき', romaji: 'eki', gloss: '车站', kind: 'kanji' },
  { surface: '買い物', reading: 'かいもの', romaji: 'kaimono', gloss: '购物', kind: 'kanji' },
  { surface: '天気', reading: 'てんき', romaji: 'tenki', gloss: '天气', kind: 'kanji' },
  { surface: '予定', reading: 'よてい', romaji: 'yotei', gloss: '计划；安排', kind: 'kanji' },
  { surface: '林', reading: 'リン', romaji: 'rin', gloss: '林（姓氏读音）', kind: 'kanji' },
  { surface: '中国', reading: 'ちゅうごく', romaji: 'chuugoku', gloss: '中国', kind: 'kanji' },
  { surface: '日本語', reading: 'にほんご', romaji: 'nihongo', gloss: '日语', kind: 'kanji' },
  { surface: '勉強', reading: 'べんきょう', romaji: 'benkyou', gloss: '学习', kind: 'kanji' },
  { surface: '今日', reading: 'きょう', romaji: 'kyō', gloss: '今天', kind: 'kanji' },
  { surface: '明日', reading: 'あした', romaji: 'ashita', gloss: '明天', kind: 'kanji' },
  { surface: '土曜日', reading: 'どようび', romaji: 'doyōbi', gloss: '星期六', kind: 'kanji' },
  { surface: '本屋', reading: 'ほんや', romaji: 'honya', gloss: '书店', kind: 'kanji' },
  { surface: '公園', reading: 'こうえん', romaji: 'kōen', gloss: '公园', kind: 'kanji' },
  { surface: '映画', reading: 'えいが', romaji: 'eiga', gloss: '电影', kind: 'kanji' },
  { surface: '何か', reading: 'なにか', romaji: 'nanika', gloss: '什么；某件事', kind: 'kanji' },
  { surface: 'あります', reading: 'あります', romaji: 'arimasu', gloss: '有；存在（无生命物）', kind: 'grammar' },
  { surface: '歩いて', reading: 'あるいて', romaji: 'aruite', gloss: '走着；步行', kind: 'grammar' },
  { surface: '行きます', reading: 'いきます', romaji: 'ikimasu', gloss: '去', kind: 'grammar' },
  { surface: '行きました', reading: 'いきました', romaji: 'ikimashita', gloss: '去了', kind: 'grammar' },
  { surface: '買いました', reading: 'かいました', romaji: 'kaimashita', gloss: '买了', kind: 'grammar' },
  { surface: '降る', reading: 'ふる', romaji: 'furu', gloss: '下（雨、雪）', kind: 'grammar' },
  { surface: 'そうです', reading: 'そうです', romaji: 'sou desu', gloss: '听说……；看起来……', kind: 'grammar' },
  { surface: '週末', reading: 'しゅうまつ', romaji: 'shuumatsu', gloss: '周末', kind: 'kanji' },
  { surface: '今週末', reading: 'こんしゅうまつ', romaji: 'konshuumatsu', gloss: '本周末', kind: 'kanji' },
  { surface: '空いています', reading: 'あいています', romaji: 'aite imasu', gloss: '有空；空着', kind: 'grammar' },
  { surface: '決めましょう', reading: 'きめましょう', romaji: 'kimemashou', gloss: '一起决定吧', kind: 'grammar' },
  { surface: '読みます', reading: 'よみます', romaji: 'yomimasu', gloss: '读', kind: 'grammar' },
  { surface: '昨日', reading: 'きのう', romaji: 'kinou', gloss: '昨天', kind: 'kanji' },
  { surface: '見る', reading: 'みる', romaji: 'miru', gloss: '看', kind: 'grammar' },
  { surface: 'つもりです', reading: 'つもりです', romaji: 'tsumori desu', gloss: '打算……', kind: 'grammar' },
  { surface: '田中', reading: 'たなか', romaji: 'tanaka', gloss: '田中（姓氏）', kind: 'kanji' },
  { surface: '来ました', reading: 'きました', romaji: 'kimashita', gloss: '来了', kind: 'grammar' },
  { surface: '七時', reading: 'しちじ', romaji: 'shichiji', gloss: '七点', kind: 'kanji' },
  { surface: '十一時', reading: 'じゅういちじ', romaji: 'juuichiji', gloss: '十一点', kind: 'kanji' },
  { surface: '九時', reading: 'くじ', romaji: 'kuji', gloss: '九点', kind: 'kanji' },
  { surface: '九時半', reading: 'くじはん', romaji: 'kujihan', gloss: '九点半', kind: 'kanji' },
  { surface: '十時', reading: 'じゅうじ', romaji: 'juuji', gloss: '十点', kind: 'kanji' },
  { surface: '十二時', reading: 'じゅうにじ', romaji: 'juuniji', gloss: '十二点', kind: 'kanji' },
  { surface: '授業', reading: 'じゅぎょう', romaji: 'jugyou', gloss: '课；上课', kind: 'kanji' },
  { surface: '家', reading: 'いえ', romaji: 'ie', gloss: '家', kind: 'kanji' },
  { surface: '出ます', reading: 'でます', romaji: 'demasu', gloss: '出去；离开', kind: 'grammar' },
  { surface: '病院', reading: 'びょういん', romaji: 'byouin', gloss: '医院', kind: 'kanji' },
  { surface: '美術館', reading: 'びじゅつかん', romaji: 'bijutsukan', gloss: '美术馆', kind: 'kanji' },
  { surface: '来週', reading: 'らいしゅう', romaji: 'raishuu', gloss: '下周', kind: 'kanji' },
  { surface: '図書館', reading: 'としょかん', romaji: 'toshokan', gloss: '图书馆', kind: 'kanji' },
  { surface: '昼ご飯', reading: 'ひるごはん', romaji: 'hirugohan', gloss: '午饭', kind: 'kanji' },
  { surface: '食べませんか', reading: 'たべませんか', romaji: 'tabemasen ka', gloss: '要不要吃……？', kind: 'grammar' },
  { surface: 'アルバイト', reading: 'アルバイト', romaji: 'arubaito', gloss: '兼职；打工', kind: 'katakana' },
  { surface: '天気予報', reading: 'てんきよほう', romaji: 'tenki yohou', gloss: '天气预报', kind: 'kanji' },
  { surface: '晴れ', reading: 'はれ', romaji: 'hare', gloss: '晴天', kind: 'kanji' },
  { surface: '喫茶店', reading: 'きっさてん', romaji: 'kissaten', gloss: '咖啡店；茶馆', kind: 'kanji' },
  { surface: '出かけました', reading: 'でかけました', romaji: 'dekakemashita', gloss: '出门了', kind: 'grammar' },
  { surface: '町', reading: 'まち', romaji: 'machi', gloss: '街道；城镇', kind: 'kanji' },
  { surface: '過ごしました', reading: 'すごしました', romaji: 'sugoshimashita', gloss: '度过了', kind: 'grammar' },
  { surface: 'コンビニ', reading: 'コンビニ', romaji: 'konbini', gloss: '便利店', kind: 'katakana', explanation: 'コンビニエンスストア的缩略词。' },
  { surface: 'ホテル', reading: 'ホテル', romaji: 'hoteru', gloss: '酒店', kind: 'katakana' },
  { surface: 'レストラン', reading: 'レストラン', romaji: 'resutoran', gloss: '餐厅', kind: 'katakana' },
  { surface: 'スーパー', reading: 'スーパー', romaji: 'sūpā', gloss: '超市', kind: 'katakana', explanation: 'スーパーマーケット的缩略词。' },
  { surface: 'バス', reading: 'バス', romaji: 'basu', gloss: '公交车', kind: 'katakana' },
  { surface: 'メール', reading: 'メール', romaji: 'mēru', gloss: '邮件；电子邮件', kind: 'katakana' },
  { surface: 'ニュース', reading: 'ニュース', romaji: 'nyūsu', gloss: '新闻', kind: 'katakana' },
  { surface: 'です', reading: 'です', romaji: 'desu', gloss: '是……；礼貌判断', kind: 'grammar' },
  { surface: 'ます', reading: 'ます', romaji: 'masu', gloss: '礼貌体词尾', kind: 'grammar' },
  { surface: 'ません', reading: 'ません', romaji: 'masen', gloss: '不……（礼貌否定）', kind: 'grammar' },
  { surface: 'たいです', reading: 'たいです', romaji: 'tai desu', gloss: '想要……', kind: 'grammar' },
  { surface: '一緒に', reading: 'いっしょに', romaji: 'issho ni', gloss: '一起', kind: 'kanji' },
  { surface: '行きませんか', reading: 'いきませんか', romaji: 'ikimasen ka', gloss: '要不要一起去？', kind: 'grammar' },
  { surface: 'どうして', reading: 'どうして', romaji: 'dōshite', gloss: '为什么', kind: 'hiragana' },
  { surface: 'そして', reading: 'そして', romaji: 'soshite', gloss: '然后；而且', kind: 'hiragana' },
]

const materialLexicon: LexiconEntry[] = readings.flatMap((reading) => reading.segments.flatMap((segment) => segment.reading ? [{ surface: segment.text.replace(/[。！？、，．,.!?]+$/u, ''), reading: segment.reading, romaji: kanaToRomaji(segment.reading), kind: 'kanji' as const }] : []))
const allEntries = [...lexicon, ...materialLexicon]
// Keep context readings from materials while retaining stable glosses and
// explanations from the curated dictionary. A material-only entry must not
// erase the Chinese help for a word already in the static lexicon.
const bySurface = new Map<string, LexiconEntry>()
for (const entry of allEntries) {
  const current = bySurface.get(entry.surface)
  bySurface.set(entry.surface, current
    ? { ...current, ...entry, gloss: entry.gloss ?? current.gloss, explanation: entry.explanation ?? current.explanation }
    : entry)
}

export function lookupJapanese(text: string): LexiconEntry | undefined {
  const normalized = text.trim().replace(/[。！？、，．,.!?\s]+$/u, '')
  return bySurface.get(normalized) ?? allEntries.find((entry) => normalized.includes(entry.surface))
}

export function segmentText(text: string, suppliedReading?: string): Array<{ text: string; entry?: LexiconEntry; reading?: string }> {
  if (!text) return []
  if (suppliedReading) {
    const normalized = text.trim().replace(/[。！？、，．,.!?\s]+$/u, '')
    const exact = bySurface.get(normalized)
    return [{ text, entry: exact, reading: suppliedReading }]
  }
  const result: Array<{ text: string; entry?: LexiconEntry; reading?: string }> = []
  let rest = text
  const sorted = [...allEntries].sort((a, b) => b.surface.length - a.surface.length)
  while (rest) {
    const match = sorted.find((entry) => rest.startsWith(entry.surface))
    if (match) {
      result.push({ text: match.surface, entry: match })
      rest = rest.slice(match.surface.length)
      continue
    }
    const nextIndex = sorted.reduce((nearest, entry) => {
      const index = rest.indexOf(entry.surface)
      return index > 0 && index < nearest ? index : nearest
    }, rest.length)
    const chunk = rest.slice(0, nextIndex)
    result.push({ text: chunk })
    rest = rest.slice(nextIndex)
  }
  return result
}
