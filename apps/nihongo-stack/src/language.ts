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
  jlptLevel?: string
  source?: string
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
  { surface: 'は', reading: 'は', romaji: 'wa', gloss: '主题助词：说到……', kind: 'grammar', explanation: '把句子的主题提出来；写作「は」，读作 wa。' },
  { surface: 'が', reading: 'が', romaji: 'ga', gloss: '主语助词；标记新信息', kind: 'grammar', explanation: '常用于指出谁或什么具有某种状态，也可回答“谁／什么”。' },
  { surface: 'を', reading: 'を', romaji: 'o', gloss: '动作对象助词', kind: 'grammar', explanation: '标记动作直接作用的对象，例如「映画を見ます」。' },
  { surface: 'に', reading: 'に', romaji: 'ni', gloss: '时间、到达点或对象', kind: 'grammar', explanation: '可表示具体时间、移动到达点或动作对象，要结合动词判断。' },
  { surface: 'で', reading: 'で', romaji: 'de', gloss: '动作场所或手段', kind: 'grammar', explanation: '表示在哪里做动作，或用什么交通工具、方法完成动作。' },
  { surface: 'の', reading: 'の', romaji: 'no', gloss: '所属或名词修饰', kind: 'grammar', explanation: '连接两个名词，常对应中文“的”，也可表示类别或内容。' },
  { surface: 'へ', reading: 'へ', romaji: 'e', gloss: '移动方向', kind: 'grammar', explanation: '表示朝向某地；写作「へ」，在移动表达中读作 e。' },
  { surface: 'と', reading: 'と', romaji: 'to', gloss: '和；与；引用内容', kind: 'grammar', explanation: '可连接共同动作的对象，也可引出说话、思考等内容。' },
  { surface: 'も', reading: 'も', romaji: 'mo', gloss: '也；同样', kind: 'grammar', explanation: '把前面信息扩展到另一个对象，常对应中文“也”。' },
  { surface: 'から', reading: 'から', romaji: 'kara', gloss: '从；因为', kind: 'grammar', explanation: '接地点或时间表示起点，接句子时也可说明原因。' },
  { surface: 'まで', reading: 'まで', romaji: 'made', gloss: '到；直到', kind: 'grammar', explanation: '表示范围的终点，例如「駅まで歩きます」。' },
  { surface: 'だけ', reading: 'だけ', romaji: 'dake', gloss: '只；仅', kind: 'grammar', explanation: '限定范围，表示只有前面的对象或数量。' },
  { surface: 'しか', reading: 'しか', romaji: 'shika', gloss: '只有……（后接否定）', kind: 'grammar', explanation: '「しか」后面通常接否定，强调范围很小，例如「一つしかありません」。' },
  { surface: 'ので', reading: 'ので', romaji: 'node', gloss: '因为；由于', kind: 'grammar', explanation: '较客观、缓和地说明原因，比直接的「から」更适合解释情况。' },
  { surface: 'けど', reading: 'けど', romaji: 'kedo', gloss: '但是；不过', kind: 'grammar', explanation: '连接前后相反或补充的信息，也常用于委婉地引出请求。' },
  { surface: 'ても', reading: 'ても', romaji: 'temo', gloss: '即使……也……', kind: 'grammar', explanation: '表示让步条件，前项成立也不改变后项结果。' },
  { surface: 'なら', reading: 'なら', romaji: 'nara', gloss: '如果是……；既然……', kind: 'grammar', explanation: '以对方提到的信息为前提提出建议或判断。' },
  { surface: 'だけでなく', reading: 'だけでなく', romaji: 'dake denaku', gloss: '不仅……还……', kind: 'grammar', explanation: '先否定“只有前项”，再追加后项；后面常接「も」。' },
  { surface: 'というわけではない', reading: 'というわけではない', romaji: 'to iu wake dewa nai', gloss: '并不是说……；不一定……', kind: 'grammar', explanation: '部分否定前面推导出的结论，不是把前面的事实全部否定。' },
  { surface: 'うえで', reading: 'うえで', romaji: 'ue de', gloss: '在……之后；以……为基础', kind: 'grammar', explanation: '完成前项后，以前项结果为基础进行后项；正式文章中常见「Vたうえで」。' },
  { surface: 'わけではない', reading: 'わけではない', romaji: 'wake dewa nai', gloss: '并不是……；未必……', kind: 'grammar', explanation: '表示部分否定，语气比完全否定柔和。' },
  { surface: 'わけがない', reading: 'わけがない', romaji: 'wake ga nai', gloss: '不可能……；不会……', kind: 'grammar', explanation: '根据理由或常识强烈判断某事不可能成立。' },
  { surface: 'わけにはいかない', reading: 'わけにはいかない', romaji: 'wake niwa ikanai', gloss: '不能……；不能置之不理', kind: 'grammar', explanation: '不是能力上的“做不到”，而是受责任、常识或立场限制不能做。' },
  { surface: 'ことになっている', reading: 'ことになっている', romaji: 'koto ni natte iru', gloss: '规定为……；安排为……', kind: 'grammar', explanation: '表示制度、约定或既定安排，不一定是说话人当下决定的。' },
  { surface: 'に違いない', reading: 'にちがいない', romaji: 'ni chigai nai', gloss: '一定……；肯定……', kind: 'grammar', explanation: '根据迹象作出很有把握的推测，语气比「でしょう」强。' },
  { surface: 'ものの', reading: 'ものの', romaji: 'mono no', gloss: '虽然……但是……', kind: 'grammar', explanation: '承认前项事实，同时指出与预期不同的后项；偏书面。' },
  { surface: 'にともなって', reading: 'にともなって', romaji: 'ni tomonatte', gloss: '随着……；伴随……', kind: 'grammar', explanation: '前项变化或发展时，后项也随之发生变化。' },
  { surface: 'に応じて', reading: 'におうじて', romaji: 'ni oujite', gloss: '根据……；按照……', kind: 'grammar', explanation: '按照条件、需要或程度进行相应调整。' },
  { surface: 'ほど〜ない', reading: 'ほど〜ない', romaji: 'hodo nai', gloss: '没有……那么……', kind: 'grammar', explanation: '比较实际程度和预想程度，常见结构是「思ったほど難しくない」。' },
  { surface: 'にもかかわらず', reading: 'にもかかわらず', romaji: 'nimo kakawarazu', gloss: '尽管……；却……', kind: 'grammar', explanation: '承认前项事实，但后项出现与预期相反的结果；语气较正式。' },
  { surface: 'につれて', reading: 'につれて', romaji: 'ni tsurete', gloss: '随着……', kind: 'grammar', explanation: '前项逐渐变化时，后项也随之发生变化。' },
  { surface: 'ように見える', reading: 'ようにみえる', romaji: 'you ni mieru', gloss: '看起来……；似乎……', kind: 'grammar', explanation: '表示从外观或表面印象作判断，后面常接「が」补充实际限制。' },
  { surface: 'ように見えますが', reading: 'ようにみえますが', romaji: 'you ni miemasu ga', gloss: '看起来……但是……', kind: 'grammar', explanation: '先承认表面印象，再用「が」转向实际问题或限制。' },
  { surface: 'だけでは', reading: 'だけでは', romaji: 'dake dewa', gloss: '仅仅……的话；只……还不够', kind: 'grammar', explanation: '指出只做前项会产生不足，后面通常提出补充条件或结果。' },
  { surface: 'ばかりか', reading: 'ばかりか', romaji: 'bakari ka', gloss: '不仅……而且……', kind: 'grammar', explanation: '在「だけでなく」基础上进一步强调后项，常用于书面表达。' },
  { surface: 'にほかならない', reading: 'にほかならない', romaji: 'ni hoka naranai', gloss: '正是……；无非是……', kind: 'grammar', explanation: '强调原因、身份或结论没有别的可能，语气正式。' },
  { surface: 'にほかなりません', reading: 'にほかなりません', romaji: 'ni hoka narimasen', gloss: '正是……；无非是……', kind: 'grammar', explanation: '「にほかならない」的礼貌表达，用于正式判断或说明。' },
  { surface: 'ながら', reading: 'ながら', romaji: 'nagara', gloss: '一边……一边……；虽然……但是……', kind: 'grammar', explanation: '接动词ます形词干可表示同时进行，接名词或形容词时也可表示让步。' },
  { surface: 'ておく', reading: 'ておく', romaji: 'te oku', gloss: '事先……；先做好……', kind: 'grammar', explanation: '表示为了之后使用或应对而提前完成动作，并保留结果。' },
  { surface: 'ないように', reading: 'ないように', romaji: 'nai you ni', gloss: '为了不……；以免……', kind: 'grammar', explanation: '表示为了避免某种结果而采取措施，前面接动词ない形。' },
  { surface: 'ために', reading: 'ために', romaji: 'tame ni', gloss: '为了……；因为……', kind: 'grammar', explanation: '接名词或动词时可表示目的，也可在正式语境中说明原因。' },
  { surface: 'ことがある', reading: 'ことがある', romaji: 'koto ga aru', gloss: '有时会……；有过……的经历', kind: 'grammar', explanation: '接动词原形表示偶尔发生，接た形表示曾经有过某种经历。' },
  { surface: 'ようになる', reading: 'ようになる', romaji: 'you ni naru', gloss: '变得会……；变得开始……', kind: 'grammar', explanation: '表示能力、习惯或状态发生变化，常接动词可能形或辞书形。' },
  { surface: 'ばかり', reading: 'ばかり', romaji: 'bakari', gloss: '只；光是……；刚刚……', kind: 'grammar', explanation: '根据接续表示限定范围或动作刚完成，需要结合句型判断具体含义。' },
  { surface: 'ほど', reading: 'ほど', romaji: 'hodo', gloss: '达到……程度；越……越……', kind: 'grammar', explanation: '可表示程度、比较或数量范围；「ほど〜ない」表示没有那么……。' },
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
  const normalized = normalizeLookupText(text)
  if (bySurface.has(normalized)) return bySurface.get(normalized)
  return inferredEntry(normalized)
}

function normalizeLookupText(text: string): string {
  return text.trim().replace(/[。！？、，．,.!?\s]+$/u, '').replace(/^(?:「(.+)」|『(.+)』|【(.+)】)$/u, (_, corner, doubleCorner, bracket) => corner ?? doubleCorner ?? bracket)
}

type OfflineLookupIndex = {
  entries: Record<string, { reading: string; gloss: string; level: string }>
}
let offlineLookupPromise: Promise<OfflineLookupIndex | null> | undefined

async function loadOfflineLookup(): Promise<OfflineLookupIndex | null> {
  offlineLookupPromise ??= fetch('/data/openjlpt-jlpt.json')
    .then((response) => response.ok ? response.json() as Promise<OfflineLookupIndex> : null)
    .catch(() => null)
  return offlineLookupPromise
}

function phraseGloss(text: string, index: OfflineLookupIndex): string | undefined {
  const keys = Object.keys(index.entries).sort((a, b) => b.length - a.length)
  const found: Array<{ surface: string; gloss: string }> = []
  const grammarNoise = new Set(['です', 'ます', 'ません', 'あります', 'います'])
  for (const entry of bySurface.values()) {
    if (entry.kind === 'grammar' && entry.surface.length >= 2 && !grammarNoise.has(entry.surface) && text.includes(entry.surface)) {
      found.push({ surface: entry.surface, gloss: entry.gloss ?? '语法结构' })
    }
  }
  let rest = text
  let offset = 0
  while (rest) {
    const match = keys.find((surface) => {
      if (!rest.startsWith(surface)) return false
      if (!/^[\u3040-\u309fー・]+$/u.test(surface)) return true
      const previous = text.slice(offset - 1, offset)
      const next = rest.slice(surface.length, surface.length + 1)
      return !/^[\u3040-\u309fー・]$/u.test(previous) && !/^[\u3040-\u309fー・]$/u.test(next)
    })
    if (match) {
      const entry = index.entries[match]
      if (!found.some((item) => item.surface === match)) found.push({ surface: match, gloss: entry.gloss })
      rest = rest.slice(match.length)
      offset += match.length
    } else {
      rest = rest.slice(1)
      offset += 1
    }
  }
  if (!found.length) return undefined
  const useful = found.filter((item) => !/^[\u3040-\u309fー・]$/u.test(item.surface))
  return useful.slice(0, 6).map((item) => item.surface + '：' + item.gloss).join('；') || undefined
}

/** Supplement the small curated dictionary with the bundled CC BY-SA lookup index. */
export async function lookupJapaneseAsync(text: string): Promise<LexiconEntry | undefined> {
  const normalized = normalizeLookupText(text)
  const curated = lookupJapanese(normalized)
  if (curated?.reading || curated?.gloss && !curated.gloss.includes('暂未收录')) return curated
  const index = await loadOfflineLookup()
  const entry = index?.entries[normalized]
  if (!entry) {
    if (curated?.kind === 'phrase') {
      const gloss = index ? phraseGloss(normalized, index) : undefined
      if (gloss) return {
        ...curated,
        gloss,
        explanation: '已从离线词典识别出部分词汇；完整句子的语气和句法仍需结合上下文。',
        source: 'Tomoshi open data（CC BY-SA 4.0）',
      }
    }
    return curated
  }
  return {
    surface: normalized,
    reading: entry.reading,
    romaji: kanaToRomaji(entry.reading),
    gloss: entry.gloss,
    kind: isKatakana(normalized) ? 'katakana' : /^[\u3040-\u309fー・\s]+$/u.test(normalized) ? 'hiragana' : 'kanji',
    explanation: '来自 N' + entry.level.slice(1) + ' 词汇辅助索引；等级为社区估计，不是官方考纲。',
    jlptLevel: entry.level,
    source: 'Tomoshi open data（CC BY-SA 4.0）',
  }
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
    const match = sorted.find((entry) => {
      if (!rest.startsWith(entry.surface)) return false
      // Do not split a longer kana word into a one-token grammar particle.
      // For example, はじめまして must stay intact instead of becoming は + じめまして.
      const nextChar = rest.slice(entry.surface.length, entry.surface.length + 1)
      if (entry.kind === 'grammar' && /^[\u3040-\u309fー・]+$/u.test(entry.surface) && /^[\u3040-\u309fー・]$/u.test(nextChar)) return false
      return true
    })
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
