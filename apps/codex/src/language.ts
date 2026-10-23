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
  kind?: 'kanji' | 'katakana' | 'grammar' | 'hiragana' | 'phrase'
  explanation?: string
}

function isKatakana(value: string): boolean {
  return /^[\u30a0-\u30ffー・\s]+$/u.test(value)
}

function isHiragana(value: string): boolean {
  return /^[\u3040-\u309fー・\s]+$/u.test(value)
}

function katakanaToHiragana(value: string): string {
  return [...value].map((char) => {
    const code = char.charCodeAt(0)
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char
  }).join('')
}

function inferredEntry(surface: string): LexiconEntry | undefined {
  const normalized = surface.trim()
  if (!normalized) return undefined
  if (/[\s、。！？，．,.!?]/u.test(normalized) && /[\u3040-\u30ff\u3400-\u9fff]/u.test(normalized)) {
    return { surface: normalized, reading: '', romaji: '', gloss: '选中日文片段暂未收录；可先结合上下文并保存笔记', kind: 'phrase', explanation: '这是一个可收藏的上下文片段，本地词典暂未覆盖整段解析。' }
  }
  if (isKatakana(normalized)) {
    const reading = katakanaToHiragana(normalized)
    return { surface: normalized, reading, romaji: kanaToRomaji(reading), gloss: '片假名词汇；请结合上下文确认具体释义', kind: 'katakana', explanation: '片假名常用于外来语、拟声词、品牌名或强调表达。' }
  }
  if (isHiragana(normalized)) {
    return { surface: normalized, reading: normalized, romaji: kanaToRomaji(normalized), gloss: '平假名表达；请结合句型确认含义', kind: 'hiragana', explanation: '平假名可能是助词、活用词尾或完整词语，整句语境会决定含义。' }
  }
  if (/^[\u3400-\u9fff々ー]+$/u.test(normalized)) {
    return { surface: normalized, reading: '', romaji: '', gloss: '汉字词暂未收录；可先结合上下文并保存笔记', kind: 'kanji', explanation: '当前本地词典没有可靠读音，应用不会猜测多音字读法。' }
  }
  if (/[\u3040-\u30ff\u3400-\u9fff]/u.test(normalized)) {
    return { surface: normalized, reading: '', romaji: '', gloss: '选中日文片段暂未收录；可先结合上下文并保存笔记', kind: 'phrase', explanation: '这是一个可收藏的上下文片段，本地词典暂未覆盖整段解析。' }
  }
  return undefined
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
  { surface: '行く', reading: 'いく', romaji: 'iku', gloss: '去（普通形）', kind: 'grammar' },
  { surface: '行けません', reading: 'いけません', romaji: 'ikemasen', gloss: '不能去', kind: 'grammar' },
  { surface: '買いました', reading: 'かいました', romaji: 'kaimashita', gloss: '买了', kind: 'grammar' },
  { surface: 'りんご', reading: 'りんご', romaji: 'ringo', gloss: '苹果', kind: 'hiragana' },
  { surface: '三つ', reading: 'みっつ', romaji: 'mittsu', gloss: '三个', kind: 'kanji' },
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
  { surface: '食べました', reading: 'たべました', romaji: 'tabemashita', gloss: '吃了', kind: 'grammar' },
  { surface: '見', reading: 'み', romaji: 'mi', gloss: '看（词干）', kind: 'grammar' },
  { surface: '午前中', reading: 'ごぜんちゅう', romaji: 'gozenchuu', gloss: '上午；上午期间', kind: 'kanji' },
  { surface: '帰る前に', reading: 'かえるまえに', romaji: 'kaeru mae ni', gloss: '回去之前', kind: 'grammar' },
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
  { surface: 'アプリ', reading: 'アプリ', romaji: 'apuri', gloss: '应用；应用程序', kind: 'katakana' },
  { surface: 'インターネット', reading: 'インターネット', romaji: 'inta-netto', gloss: '互联网', kind: 'katakana' },
  { surface: 'スマートフォン', reading: 'スマートフォン', romaji: 'suma-to fon', gloss: '智能手机', kind: 'katakana' },
  { surface: 'パソコン', reading: 'パソコン', romaji: 'pasokon', gloss: '个人电脑', kind: 'katakana' },
  { surface: 'データ', reading: 'データ', romaji: 'de-ta', gloss: '数据', kind: 'katakana' },
  { surface: 'ファイル', reading: 'ファイル', romaji: 'fairu', gloss: '文件', kind: 'katakana' },
  { surface: 'メニュー', reading: 'メニュー', romaji: 'menyu-', gloss: '菜单', kind: 'katakana' },
  { surface: 'ボタン', reading: 'ボタン', romaji: 'botan', gloss: '按钮', kind: 'katakana' },
  { surface: 'テスト', reading: 'テスト', romaji: 'tesuto', gloss: '测试；测验', kind: 'katakana' },
  { surface: 'エラー', reading: 'エラー', romaji: 'era-', gloss: '错误', kind: 'katakana' },
  { surface: 'オンライン', reading: 'オンライン', romaji: 'onrain', gloss: '在线', kind: 'katakana' },
  { surface: 'オフライン', reading: 'オフライン', romaji: 'ofurain', gloss: '离线', kind: 'katakana' },
  { surface: 'デザイン', reading: 'デザイン', romaji: 'dezain', gloss: '设计', kind: 'katakana' },
  { surface: 'カメラ', reading: 'カメラ', romaji: 'kamera', gloss: '相机', kind: 'katakana' },
  { surface: 'ビデオ', reading: 'ビデオ', romaji: 'bideo', gloss: '视频', kind: 'katakana' },
  { surface: 'サービス', reading: 'サービス', romaji: 'sa-bisu', gloss: '服务', kind: 'katakana' },
  { surface: 'スケジュール', reading: 'スケジュール', romaji: 'sukeju-ru', gloss: '日程；安排', kind: 'katakana' },
  { surface: 'コース', reading: 'コース', romaji: 'ko-su', gloss: '课程；路线', kind: 'katakana' },
  { surface: 'レベル', reading: 'レベル', romaji: 'reberu', gloss: '等级；水平', kind: 'katakana' },
  { surface: 'システム', reading: 'システム', romaji: 'shisutemu', gloss: '系统', kind: 'katakana' },
  { surface: 'ユーザー', reading: 'ユーザー', romaji: 'yu-za-', gloss: '用户', kind: 'katakana' },
  { surface: 'アカウント', reading: 'アカウント', romaji: 'akaunto', gloss: '账户', kind: 'katakana' },
  { surface: 'アクセス', reading: 'アクセス', romaji: 'akusesu', gloss: '访问；进入', kind: 'katakana' },
  { surface: 'メモ', reading: 'メモ', romaji: 'memo', gloss: '备忘；笔记', kind: 'katakana' },
  { surface: 'ノート', reading: 'ノート', romaji: 'no-to', gloss: '笔记本；笔记', kind: 'katakana' },
  { surface: 'クリック', reading: 'クリック', romaji: 'kurikku', gloss: '点击', kind: 'katakana' },
  { surface: 'タップ', reading: 'タップ', romaji: 'tappu', gloss: '轻触；点击', kind: 'katakana' },
  { surface: 'リンク', reading: 'リンク', romaji: 'rinku', gloss: '链接', kind: 'katakana' },
  { surface: 'コンテンツ', reading: 'コンテンツ', romaji: 'kontentsu', gloss: '内容；内容资源', kind: 'katakana' },
]

const materialLexicon: LexiconEntry[] = readings.flatMap((reading) => reading.segments.flatMap((segment) => segment.reading ? [{ surface: segment.text.replace(/[。！？、，．,.!?]+$/u, ''), reading: segment.reading, romaji: kanaToRomaji(segment.reading), kind: 'kanji' as const }] : []))
const allEntries = [...lexicon, ...materialLexicon].map((entry) => entry.kind === 'katakana'
  ? { ...entry, reading: katakanaToHiragana(entry.reading), romaji: entry.romaji || kanaToRomaji(katakanaToHiragana(entry.reading)) }
  : entry)
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
  if (bySurface.has(normalized)) return bySurface.get(normalized)
  if (normalized.length <= 12 && !/[\s、。！？，．,.!?]/u.test(normalized)) {
    const contained = [...allEntries].sort((a, b) => b.surface.length - a.surface.length).find((entry) => normalized.includes(entry.surface))
    if (contained) return contained
  }
  return inferredEntry(normalized)
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
    result.push({ text: chunk, entry: inferredEntry(chunk.replace(/[。！？、，．,.!?]+$/u, '')) })
    rest = rest.slice(nextIndex)
  }
  return result
}
