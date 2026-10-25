import { additionalJLPTQuestions } from './jlpt-practice'
import {
  jlptLevels,
  jlptYears,
  type JLPTLevel,
} from './jlpt-index'

export type JLPTSection = '文字・語彙' | '文法' | '読解' | '聴解'

export {
  jlptExamSessionsByYear,
  jlptFullExamSlotCount,
  jlptLevels,
  jlptYears,
} from './jlpt-index'
export type { JLPTLevel } from './jlpt-index'

export type JLPTQuestion = {
  id: string
  /** Original question number within its source section. Required for complete imported exams. */
  questionNumber?: number
  level: JLPTLevel
  section: JLPTSection
  prompt: string
  /** Japanese text for local speech synthesis when no licensed recording is bundled. */
  audioText?: string
  options: string[]
  answer: number
  reading?: string
  gloss?: string
  explanation: string
  studySteps: string[]
  itemType?: string
  audioUrl?: string
  imageUrl?: string
  sourceUrl?: string
  source: 'original-practice' | 'licensed-import'
}

export type JLPTSet = {
  id: string
  year: number
  level: JLPTLevel
  title: string
  status: 'practice' | 'official-sample' | 'licensed-import'
  questionIds: string[]
  note: string
  complete?: boolean
  session?: string
  sourceUrl?: string
  questionCount?: number
  sectionQuestionCounts?: Partial<Record<JLPTSection, number>>
}

export const jlptExamBlueprint: Record<JLPTLevel, { sections: string[]; minutes: number[] }> = {
  N5: { sections: ['文字・語彙', '文法・読解', '聴解'], minutes: [20, 40, 30] },
  N4: { sections: ['文字・語彙', '文法・読解', '聴解'], minutes: [25, 55, 35] },
  N3: { sections: ['文字・語彙', '文法・読解', '聴解'], minutes: [30, 70, 40] },
  N2: { sections: ['言語知識・読解', '聴解'], minutes: [105, 50] },
}

export type JLPTLevelGuide = {
  title: string
  japaneseFocus: string
  chineseStrategy: string
  steps: string[]
}

export const jlptLevelGuides: Record<JLPTLevel, JLPTLevelGuide> = {
  N5: {
    title: '先建立句子骨架',
    japaneseFocus: '助词「は・が・を・に・で」、です／ます和时间地点表达。',
    chineseStrategy: '中文常省略助词；做题时先找“谁、做什么、在哪里、什么时候”，再判断助词。',
    steps: ['先读平假名和句尾，再看汉字。', '把助词前后的词组成短语。', '最后用中文复述整句，不只背选项。'],
  },
  N4: {
    title: '把动作连成场景',
    japaneseFocus: 'て形、过去式、原因「ので」、同时动作「ながら」和日常安排。',
    chineseStrategy: '中文语序容易让时间、原因和动作混在一起；先按时间线拆句，再恢复自然中文。',
    steps: ['圈出时间、条件和原因。', '确认动词形式表示完成、进行还是计划。', '用一条时间线检查选项是否与原文一致。'],
  },
  N3: {
    title: '读懂句间关系',
    japaneseFocus: '转折、追加、条件、部分否定和抽象名词搭配。',
    chineseStrategy: '不要逐词翻译；先找「しかし・だけでなく・ほど・ように」等连接信号，再判断作者关系。',
    steps: ['先标出连接词和句尾。', '区分事实、理由、建议和作者评价。', '把长句压缩成“前提→关系→结论”。'],
  },
  N2: {
    title: '抓住论点和限制',
    japaneseFocus: '正式词汇、抽象论证、让步转折、依据与结论的对应关系。',
    chineseStrategy: '中文学习者容易被汉字表面意思带偏；必须结合搭配、语气和段落功能判断。',
    steps: ['先找主张、依据和限制条件。', '再检查词语在句中的搭配与语气。', '最后用一句中文说明作者真正想强调什么。'],
  },
}

export const jlptQuestions: JLPTQuestion[] = [
  {
    id: 'practice-n5-vocab-01', level: 'N5', section: '文字・語彙', prompt: '「毎日」の読み方はどれですか。', options: ['まいにち', 'まいげつ', 'まいとし', 'まいしゅう'], answer: 0, reading: 'まいにち', gloss: '每天', explanation: '毎日（まいにち）由「毎」和「日」组成，表示每天。', studySteps: ['先记「日」在日期里的读音 ひ／にち／じつ。', '这里是惯用词「まいにち」，先整体记忆，再回到句子。'], source: 'original-practice',
  },
  {
    id: 'practice-n5-grammar-01', level: 'N5', section: '文法', prompt: 'わたしは まいにち でんしゃ（　）学校へ 行きます。', options: ['を', 'で', 'に', 'が'], answer: 1, reading: 'で', gloss: '用；通过', explanation: '交通工具后用「で」表示手段：電車で学校へ行きます。', studySteps: ['先找“用什么方式”这个动作。', '交通工具 + で + 移动，是 N5 高频句型。'], source: 'original-practice',
  },
  {
    id: 'practice-n5-reading-01', level: 'N5', section: '読解', prompt: '「あしたは 9時に 駅で 会いましょう。」何時に 会いますか。', options: ['8時', '9時', '10時', '駅では会いません'], answer: 1, reading: 'あしたは くじに えきで あいましょう', gloss: '明天 9 点在车站见吧', explanation: '「9時に」直接说明约定时间；「で」说明会面的地点。', studySteps: ['先圈出时间词，再看「に」后面的动作。', '地点和时间同时出现时，分别回答“在哪儿”和“几点”。'], source: 'original-practice',
  },
  {
    id: 'practice-n4-vocab-01', level: 'N4', section: '文字・語彙', prompt: '「予定」の意味に近いものはどれですか。', options: ['计划', '天气', '理由', '方法'], answer: 0, reading: 'よてい', gloss: '计划；安排', explanation: '予定（よてい）表示已经安排或打算做的事情。', studySteps: ['把「予定」和「計画」放在一起记，先理解“将来要做的安排”。', '例：週末の予定を決めます。'], source: 'original-practice',
  },
  {
    id: 'practice-n4-grammar-01', level: 'N4', section: '文法', prompt: '雨が 降って（　）、出かけません。', options: ['いるので', 'いたら', 'いれば', 'いるのに'], answer: 0, reading: 'あめが ふっているので、でかけません', gloss: '因为正在下雨，所以不出门', explanation: '「ので」说明较客观的原因；「降っている」表示正在下雨。', studySteps: ['先判断前后是“原因→结果”。', '动作正在进行时用「ている」，礼貌、客观说明原因常用「ので」。'], source: 'original-practice',
  },
  {
    id: 'practice-n4-reading-01', level: 'N4', section: '読解', prompt: '「図書館は月曜日が休みです。火曜日から土曜日までは 9時から 6時までです。」正しいものはどれですか。', options: ['月曜日も開いています。', '火曜日は朝9時からです。', '日曜日は6時までです。', '毎日同じ時間です。'], answer: 1, reading: 'としょかんは げつようびが やすみです', gloss: '图书馆周一休息', explanation: '文中明确说周一休息，周二到周六 9 点到 6 点开放；其他日期没有给出开放时间。', studySteps: ['先把星期和时间做成两列。', '选择只复述原文明确信息的选项。'], source: 'original-practice',
  },
  {
    id: 'practice-n3-vocab-01', level: 'N3', section: '文字・語彙', prompt: '「必要」の用法として最も自然なものはどれですか。', options: ['申込書に住所を書く必要があります。', '必要を食べました。', '駅を必要しました。', '必要な昨日です。'], answer: 0, reading: 'ひつよう', gloss: '必要', explanation: '「必要がある／必要です」表示需要；「Vる必要がある」是常见结构。', studySteps: ['记住搭配「〜する必要がある」。', '先看名词或动词是否能接在「必要」前后。'], source: 'original-practice',
  },
  {
    id: 'practice-n3-grammar-01', level: 'N3', section: '文法', prompt: '説明を読めば、初めての人（　）分かるように書いてあります。', options: ['でも', 'しか', 'ほど', 'こそ'], answer: 0, reading: 'せつめいを よめば、はじめてのひとでも わかる', gloss: '即使是第一次接触的人也能明白', explanation: '「Nでも」表示举出极端或代表性例子：连第一次接触的人也能理解。', studySteps: ['看到“连……也……”先检查「でも」。', '「ば」在这里表示条件：读了说明之后。'], source: 'original-practice',
  },
  {
    id: 'practice-n3-reading-01', level: 'N3', section: '読解', prompt: '「便利さだけでなく、店員に相談できることもこの店の良さだ。」作者认为这家店的优点是什么？', options: ['只有方便', '价格最低', '既方便又能向店员咨询', '店员不会说话'], answer: 2, reading: 'べんりさだけでなく、てんいんにそうだんできる', gloss: '不仅方便，还能向店员咨询', explanation: '「だけでなく〜も」是“不仅……还……”；选项 3 同时保留了两个优点。', studySteps: ['先找转折或追加结构，再压缩成中文。', '不要只看「便利さ」而漏掉后半句。'], source: 'original-practice',
  },
  {
    id: 'practice-n2-vocab-01', level: 'N2', section: '文字・語彙', prompt: '「見直す」に最も近い意味はどれですか。', options: ['重新检查并调整', '完全忘记', '马上提交', '大声朗读'], answer: 0, reading: 'みなおす', gloss: '重新检查；重新审视', explanation: '「見直す」可以指重新检查内容，也可以指改变原先的评价或方案。', studySteps: ['把「見る」和「直す」合起来理解成“看过后修正”。', '阅读中要根据宾语判断是检查文件还是重新评价。'], source: 'original-practice',
  },
  {
    id: 'practice-n2-grammar-01', level: 'N2', section: '文法', prompt: '状況を確認した（　）、担当者に連絡してください。', options: ['うえで', 'ところで', 'かわりに', 'ばかりに'], answer: 0, reading: 'じょうきょうを かくにんしたうえで', gloss: '在确认情况之后', explanation: '「Vたうえで」表示完成前项之后，以该结果为基础进行后项。', studySteps: ['先确认前项是后项的准备步骤。', '「うえで」强调“做完并据此行动”，比单纯的「あとで」更正式。'], source: 'original-practice',
  },
  {
    id: 'practice-n2-reading-01', level: 'N2', section: '読解', prompt: '「効率を上げるには、作業を速くするだけでなく、途中で立ち止まって手順を見直すことが大切だ。」作者最想强调什么？', options: ['速度越快越好', '不要改变工作流程', '效率也来自检查和调整流程', '工作中不能停下来'], answer: 2, reading: 'こうりつを あげるには、てじゅんを みなおす', gloss: '提高效率也需要重新检查流程', explanation: '「だけでなく」否定只追求速度；后半句明确提出检查和调整步骤的重要性。', studySteps: ['先找作者的主张句，不只看例子。', '把「速さ」与「見直し」对比，识别作者真正的取舍。'], source: 'original-practice',
  },
  {
    id: 'practice-n5-vocab-02', level: 'N5', section: '文字・語彙', prompt: '「学校」的读音是哪一个？', options: ['がっこう', 'がくせい', 'せんせい', 'こうこう'], answer: 0, reading: 'がっこう', gloss: '学校', explanation: '学校读作「がっこう」；「っ」表示短促停顿，不能读成「がこう」。', studySteps: ['把「学」和「校」作为一个固定词记忆。', '朗读时在「が」和「こ」之间做一个短停顿。'], source: 'original-practice',
  },
  {
    id: 'practice-n5-grammar-02', level: 'N5', section: '文法', prompt: 'これは だれ（　）かばんですか。', options: ['の', 'を', 'で', 'へ'], answer: 0, reading: 'これは だれの かばんですか', gloss: '这是谁的包？', explanation: '「NのN」表示所属关系；「だれのかばん」就是“谁的包”。', studySteps: ['看到中文“谁的”先找「だれの」。', '所有者放在「の」前，被拥有的东西放在后面。'], source: 'original-practice',
  },
  {
    id: 'practice-n5-reading-02', level: 'N5', section: '読解', prompt: '「田中さんは 7時に 起きて、8時に 会社へ 行きます。」田中さんは何時に会社へ行きますか。', options: ['7時', '8時', '9時', '会社へ行きません'], answer: 1, reading: 'たなかさんは しちじに おきて、はちじに かいしゃへ いきます', gloss: '田中 7 点起床，8 点去公司', explanation: '「起きて」是前一个动作，「8時に会社へ行きます」才是问题询问的时间。', studySteps: ['按时间顺序列出动作，避免把起床时间当成出发时间。', '问题问「何時に行きますか」时只寻找「行きます」附近的时间。'], source: 'original-practice',
  },
  {
    id: 'practice-n4-vocab-02', level: 'N4', section: '文字・語彙', prompt: '「忘れ物」の意思最接近哪一个？', options: ['忘记带来的东西', '新买的东西', '贵重的东西', '借来的东西'], answer: 0, reading: 'わすれもの', gloss: '遗忘物品；忘带的东西', explanation: '「忘れ物」由「忘れる」和「物」组成，常指落下或忘记带走的物品。', studySteps: ['先把动词「忘れる」和名词「物」连接起来。', '车站广播中的「忘れ物」通常指失物或遗落物。'], source: 'original-practice',
  },
  {
    id: 'practice-n4-grammar-02', level: 'N4', section: '文法', prompt: '音楽を 聞き（　）宿題をします。', options: ['ながら', 'ので', 'ために', 'そうに'], answer: 0, reading: 'おんがくを ききながら しゅくだいをします', gloss: '一边听音乐一边做作业', explanation: '「Vます去ます + ながら」表示两个动作同时进行，后项是主要动作。', studySteps: ['看到“一边……一边……”先检查「ながら」。', '前项动词去掉「ます」，再接「ながら」。'], source: 'original-practice',
  },
  {
    id: 'practice-n4-reading-02', level: 'N4', section: '読解', prompt: '「駅の前の店は、朝はパンを売り、午後はケーキを売ります。」下午可以在店里买什么？', options: ['面包', '蛋糕', '车票', '咖啡机'], answer: 1, reading: 'えきのまえのみせは、あさはパンをうり、ごごはケーキをうります', gloss: '车站前的店早上卖面包，下午卖蛋糕', explanation: '「午後はケーキを売ります」直接说明下午的商品；不要把早上的面包带入下午。', studySteps: ['把「朝」和「午後」分成两栏。', '阅读短文时先找时间词，再对应动作和对象。'], source: 'original-practice',
  },
  {
    id: 'practice-n3-vocab-02', level: 'N3', section: '文字・語彙', prompt: '「影響を与える」的意思最接近哪一个？', options: ['产生影响', '减少数量', '提出问题', '改变地址'], answer: 0, reading: 'えいきょうを あたえる', gloss: '产生影响', explanation: '「影響を与える」是固定搭配，表示某件事对人或结果产生作用。', studySteps: ['整体记忆「影響を与える／受ける」两个相反方向。', '判断主语是影响的来源还是接受影响的一方。'], source: 'original-practice',
  },
  {
    id: 'practice-n3-grammar-02', level: 'N3', section: '文法', prompt: '忘れない（　）、手帳に書いておきます。', options: ['ように', 'ためで', 'ばかりに', 'ことから'], answer: 0, reading: 'わすれないように、てちょうに かいておきます', gloss: '为了不忘记，先写在记事本上', explanation: '「Vないように」表示为了避免某种结果而采取措施；「書いておきます」表示提前做好准备。', studySteps: ['看到“为了不……”先检查「ないように」。', '「ておく」有“事先做完并保留效果”的意思。'], source: 'original-practice',
  },
  {
    id: 'practice-n3-reading-02', level: 'N3', section: '読解', prompt: '「このアプリは便利だが、通知が多すぎると集中できない。必要な通知だけ残すとよい。」作者的建议是什么？', options: ['关闭所有通知', '增加通知数量', '只保留必要的通知', '停止使用应用'], answer: 2, reading: 'ひつような つうちだけ のこすと よい', gloss: '只保留必要的通知比较好', explanation: '「〜すぎると」说明过量带来的问题，后句「必要な通知だけ残す」给出具体建议。', studySteps: ['先区分问题句和建议句。', '「だけ」表示限定范围，不是全部保留。'], source: 'original-practice',
  },
  {
    id: 'practice-n2-vocab-02', level: 'N2', section: '文字・語彙', prompt: '「方針」的意思最接近哪一个？', options: ['方针；基本方向', '临时价格', '详细地址', '身体状况'], answer: 0, reading: 'ほうしん', gloss: '方针；基本方向', explanation: '「方針」常用于组织或个人长期行动的基本方向，比一次性的计划更稳定。', studySteps: ['把「方針」和「予定」区分：前者是方向，后者是具体安排。', '正式文章中常见「方針を示す／決める」。'], source: 'original-practice',
  },
  {
    id: 'practice-n2-grammar-02', level: 'N2', section: '文法', prompt: '便利だからといって、何でも買えばいい（　）。', options: ['というわけではない', 'ことになっている', 'に違いない', 'ものがある'], answer: 0, reading: 'べんりだからといって、なんでも かえば いいというわけではない', gloss: '并不是因为方便就什么都可以买', explanation: '「〜というわけではない」部分否定前面的推论；不是完全否定“方便”，而是否定“因此什么都该买”。', studySteps: ['看到“并不是说……”先找「というわけではない」。', '注意它通常否定的是前面推导出的结论。'], source: 'original-practice',
  },
  {
    id: 'practice-n2-reading-02', level: 'N2', section: '読解', prompt: '「新しい制度は作業を簡単にする一方、最初は覚えることが多い。導入前に短い研修を行う。」为什么安排培训？', options: ['让制度更复杂', '帮助使用者适应新制度', '取消新制度', '减少工作时间'], answer: 1, reading: 'どうにゅうまえに みじかい けんしゅうを おこなう', gloss: '在引入前进行简短培训', explanation: '「一方」呈现新制度的优点和初期负担；培训是为了降低“需要记的内容多”带来的适应成本。', studySteps: ['先找对比结构「一方」。', '把措施和它要解决的问题对应起来，而不是只看制度的优点。'], source: 'original-practice',
  },
  ...additionalJLPTQuestions,
]

export const jlptSets: JLPTSet[] = jlptYears.flatMap((year) => jlptLevels.map((level) => {
  const questions = jlptQuestions.filter((question) => question.level === level)
  return {
    id: `jlpt-${year}-${level.toLowerCase()}`,
    year,
    level,
    title: `${year} 年 ${level} 题型训练`,
    status: 'practice' as const,
    questionIds: questions.map((question) => question.id),
    note: '原创分级教学包：词汇、语法、阅读、听力各 4 题，逐题显示读音、中文义和解题步骤；听力为合成朗读练习，完整原卷可授权导入。',
  }
}))

export const jlptSources = [
  { label: '日语语法指南（Tae Kim 中文译本）', url: 'https://res.wokanxing.info/jpgramma/', note: '公开中文语法教程，覆盖书写系统、基本语法、复合句、条件、敬语与高级表达；按原站目录学习并保留署名与 CC BY-NC-SA 许可。' },
  { label: 'JLPT 官方题型与题目构成', url: 'https://www.jlpt.jp/e/guideline/testsections.html' },
  { label: 'JLPT 官方样题与练习册', url: 'https://samplequestions.jlpt.jp/e/samples/sampleindex.html' },
  { label: 'JLPT 官方 FAQ：历年原卷公开范围', url: 'https://www.jlpt.jp/sp/e/faq/', note: '官方说明不会公开每场考试的完全相同原题；应用仅内置官方公开资料入口，完整授权题库可从本机批量导入。' },
  { label: 'JLPT 官方站点政策：版权与引用', url: 'https://www.jlpt.jp/e/policy.html', note: '查看官方版权、引用和第三方材料授权说明；公开链接不等于允许复制原题。' },
  { label: 'JLPT 官方教师说明材料', url: 'https://www.jlpt.jp/e/reference/forteachers.html' },
  { label: 'Japan Foundation Erin 场景教材', url: 'https://www.erin.jpf.go.jp/en/', note: '个人学习或教育使用；应用只提供入口，不复制站内内容。' },
  { label: 'Tatoeba 可署名例句库', url: 'https://tatoeba.org/en/downloads', note: '文本默认 CC BY 2.0 FR；音频必须逐条核对许可。' },
  { label: 'OpenJLPT：CC BY-SA 4.0 词汇与语法数据', url: 'https://github.com/evanclan/OpenJLPT', note: '公开数据包含 N5–N1 词汇、汉字、例句和语法；使用时保留 OpenJLPT 及其上游署名，并遵守 CC BY-SA 4.0。' },
  { label: 'Bunko Commons：开放日语材料', url: 'https://bunkocommons.org/', note: '按每份材料页面的 Creative Commons 许可使用。' },
]

export type JLPTResourceRoute = {
  label: string
  url: string
  level: string
  japaneseGoal: string
  chineseMethod: string
  studySteps: string[]
}

// Public entry points are linked in place. The app explains how to use each
// source without copying material whose license belongs to the publisher.
export const jlptResourceRoutes: JLPTResourceRoute[] = [
  {
    label: '日语语法指南（Tae Kim 中文译本）',
    url: 'https://res.wokanxing.info/jpgramma/',
    level: '语法主线（N5–N2）',
    japaneseGoal: '文の骨格を理解し、助詞・活用・接続を使い分ける。',
    chineseMethod: '按“书写系统→基本语法→语法精要→特定表达→高级话题”顺序学习；先读中文解释，再用日语例句朗读和改写。原站目录覆盖从假名到高级表达的完整教程。',
    studySteps: ['基础阶段先学助词、形容词、动词活用和过去式，每次只处理一个结构。', '进入 N3/N2 后重点复习条件、让步、正式表达和句尾语气，把相似句型并排比较。', '每学一个语法写一条自己的句子，并回到 JLPT 错题检查它在真实题干中的作用。'],
  },
  {
    label: 'Irodori：Japanese for Life in Japan',
    url: 'https://www.irodori.jpf.go.jp/en/',
    level: '基础生活输入（N5–N3 起步）',
    japaneseGoal: '生活の場面で「できること」を増やす。',
    chineseMethod: '先完成每课 Can-do，再听音频跟读；它适合建立场景和句型，不直接替代 JLPT 题型训练。',
    studySteps: ['先读本课 Can-do 和场景图，预测会用到什么表达。', '听音频两遍：第一遍抓任务，第二遍跟读关键句。', '用自己的学校、租房或工作场景改写一句，再回到 JLPT 题型复习。'],
  },
  {
    label: 'Erin’s Challenge! I Can Speak Japanese',
    url: 'https://www.erin.jpf.go.jp/en/',
    level: '场景会话（N5–N3）',
    japaneseGoal: '場面を見て、聞いて、まねて使う。',
    chineseMethod: '先看情境猜意思，再打开语法说明；把例句改成自己的学校、工作或生活场景。',
    studySteps: ['先不看字幕观看情境，记录你猜到的人物关系和目的。', '打开脚本与语法说明，标出礼貌程度和固定表达。', '替换人物、地点或时间，重新说一遍自己的版本。'],
  },
  {
    label: 'Tadoku 分级阅读',
    url: 'https://tadoku.org/japanese/en/graded-readers-en/',
    level: '大量阅读（N5–N2）',
    japaneseGoal: '辞書を引きすぎず、やさしい本をたくさん読む。',
    chineseMethod: '先选能读懂约八成的级别，只查影响主旨的词；读完用中文说出人物、行动和结果。',
    studySteps: ['先按等级选一篇，第一遍不查词，只判断主题和情绪。', '第二遍只查影响主旨的词，把重复出现的表达收藏。', '用三句中文复述人物、行动、结果，再朗读日文一遍。'],
  },
  {
    label: 'JLPT 官方样题与练习册',
    url: 'https://samplequestions.jlpt.jp/e/samples/sampleindex.html',
    level: '题型与计时（N5–N2）',
    japaneseGoal: '問題形式と時間配分に慣れる。',
    chineseMethod: '先按真实时长完成，再按词汇、语法、阅读、听力分别复盘；不要把原始对错直接换算成正式成绩。',
    studySteps: ['先关闭辅助层，按官方时间完成一科或整套。', '逐题打开读音和中文解析，写出错因：词义、句型、信息定位或听辨。', '隔天只重做错题，再用完整模式检查是否能独立作答。'],
  },
  {
    label: 'Marugoto：Japanese Language and Culture',
    url: 'https://marugoto.jpf.go.jp/en/',
    level: '语言与文化（N4–N2 延伸）',
    japaneseGoal: 'ことばと文化を一緒に学び、伝え合う。',
    chineseMethod: '遇到表达差异时，先记录说话目的和关系，再理解为什么不能只按中文直译。',
    studySteps: ['先判断说话人关系和场合，再看表达本身。', '把敬体、语气和文化信息分别记在笔记中。', '用中文解释“为什么这样说”，再写一条同场景日文。'],
  },
  {
    label: 'Tatoeba 可署名例句库',
    url: 'https://tatoeba.org/en/downloads',
    level: '例句复现（N5–N2）',
    japaneseGoal: '短い例文を声に出して、使い方を確かめる。',
    chineseMethod: '用它核对词语搭配和助词；逐条查看许可，收藏时保留来源，不把孤立例句当成语法定论。',
    studySteps: ['先搜索目标词的多个例句，比较它前后的搭配。', '选一条带音频或上下文清楚的例句，朗读并标出助词。', '把例句保存为自己的句型模板，并保留来源信息。'],
  },
  {
    label: 'OpenJLPT：可核对的词汇、汉字与语法数据',
    url: 'https://github.com/evanclan/OpenJLPT',
    level: '词汇与语法复盘（N5–N2）',
    japaneseGoal: '単語・漢字・文法を例文の中で確認する。',
    chineseMethod: '把它当作题后查漏工具：先确认词条的读音和等级，再用例句判断搭配；数据是学习辅助，不代表官方当前考纲或某一道真题。',
    studySteps: ['先用原文中的词搜索，核对汉字、平假名和罗马音。', '再看词性、语法形成和例句，记录中文里容易误解的搭配。', '把复盘结果写入选中笔记，并回到 JLPT 题目重新作答。'],
  },
  {
    label: 'JLPT Practice Test：N3 听力练习与脚本',
    url: 'https://www.jlptpracticetest.com/n3/listening',
    level: '听力策略（N3–N2 过渡）',
    japaneseGoal: '質問を先に聞き、要点・順序・話者の意図をつかむ。',
    chineseMethod: '先不看脚本完成免费样题，再打开日文脚本对照声音；重点练“下一步、理由、主旨、自然回应”五类判断。',
    studySteps: ['第一遍隐藏脚本，只记录人物、目的和结果。', '第二遍打开脚本，圈出转折、顺序词和最后决定。', '把错题按课题理解、要点理解、概要理解、发话表达、即时应答分类收藏。'],
  },
  {
    label: 'JLPT Practice Test：N4/N5 编号练习',
    url: 'https://www.jlptpracticetest.com/n4',
    level: '基础题型复现（N5–N4）',
    japaneseGoal: '基本語彙と文法を、短い文の中ですぐ使えるようにする。',
    chineseMethod: '编号练习是原创题，不当作历年真题；适合先熟悉题型，再回到完整整卷训练时间和耐力。',
    studySteps: ['先选择一个编号套题，关闭罗马音完成一轮。', '逐题看中文解析，把错误分为读音、词形、助词和句意。', '隔天重做错题，再用本机整卷练习检验迁移。'],
  },
]

export const jlptOfficialPracticeLinks: Record<JLPTLevel, Array<{ label: string; url: string }>> = {
  N5: [
    { label: '2018 官方练习册：词汇', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N5V.pdf' },
    { label: '2018 官方练习册：语法与阅读', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N5G.pdf' },
    { label: '2018 官方练习册：听力', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N5L.pdf' },
    { label: '2012 官方样题：词汇', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N5V.pdf' },
    { label: '2012 官方样题：语法与阅读', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N5G.pdf' },
    { label: '2012 官方样题：听力', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N5L.pdf' },
    { label: '2009 官方样题：题目 PDF', url: 'https://www.jlpt.jp/e/samples/pdf/N5-mondai.pdf' },
    { label: '2009 官方样题：听力 MP3', url: 'https://www.jlpt.jp/e/samples/mp3/N5Sample.mp3' },
  ],
  N4: [
    { label: '2018 官方练习册：词汇', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N4V.pdf' },
    { label: '2018 官方练习册：语法与阅读', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N4G.pdf' },
    { label: '2018 官方练习册：听力', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N4L.pdf' },
    { label: '2012 官方样题：词汇', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N4V.pdf' },
    { label: '2012 官方样题：语法与阅读', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N4G.pdf' },
    { label: '2012 官方样题：听力', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N4L.pdf' },
    { label: '2009 官方样题：题目 PDF', url: 'https://www.jlpt.jp/e/samples/pdf/N4-mondai.pdf' },
    { label: '2009 官方样题：听力 MP3', url: 'https://www.jlpt.jp/e/samples/mp3/N4Sample.mp3' },
  ],
  N3: [
    { label: '2018 官方练习册：词汇', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N3V.pdf' },
    { label: '2018 官方练习册：语法与阅读', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N3G.pdf' },
    { label: '2018 官方练习册：听力', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N3L.pdf' },
    { label: '2012 官方样题：词汇', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N3V.pdf' },
    { label: '2012 官方样题：语法与阅读', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N3G.pdf' },
    { label: '2012 官方样题：听力', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N3L.pdf' },
    { label: '2009 官方样题：题目 PDF', url: 'https://www.jlpt.jp/e/samples/pdf/N3-mondai.pdf' },
    { label: '2009 官方样题：听力 MP3', url: 'https://www.jlpt.jp/e/samples/mp3/N3Sample.mp3' },
  ],
  N2: [
    { label: '2018 官方练习册：词汇', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N2V.pdf' },
    { label: '2018 官方练习册：语法与阅读', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N2G.pdf' },
    { label: '2018 官方练习册：听力', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N2L.pdf' },
    { label: '2012 官方样题：词汇', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N2V.pdf' },
    { label: '2012 官方样题：语法与阅读', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N2G.pdf' },
    { label: '2012 官方样题：听力', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N2L.pdf' },
    { label: '2009 官方样题：题目 PDF', url: 'https://www.jlpt.jp/e/samples/pdf/N2-mondai.pdf' },
    { label: '2009 官方样题：听力 MP3', url: 'https://www.jlpt.jp/e/samples/mp3/N2Sample.mp3' },
  ],
}
