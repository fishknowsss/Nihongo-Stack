export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2'
export type JLPTSection = '文字・語彙' | '文法' | '読解' | '聴解'

export type JLPTQuestion = {
  id: string
  level: JLPTLevel
  section: JLPTSection
  prompt: string
  options: string[]
  answer: number
  reading?: string
  gloss?: string
  explanation: string
  studySteps: string[]
  source: 'original-practice'
}

export type JLPTSet = {
  id: string
  year: number
  level: JLPTLevel
  title: string
  status: 'practice' | 'official-sample'
  questionIds: string[]
  note: string
}

// 近七年先建立稳定的学习索引。官方历年试卷不作为可再分发原文打包，页面提供公开官方入口；题目为按官方题型原创的逐步教学练习。
export const jlptYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025]
export const jlptLevels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2']

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
]

export const jlptSets: JLPTSet[] = jlptYears.flatMap((year) => jlptLevels.map((level) => {
  const questions = jlptQuestions.filter((question) => question.level === level)
  return {
    id: `jlpt-${year}-${level.toLowerCase()}`,
    year,
    level,
    title: `${year} · ${level} 题型训练`,
    status: 'practice' as const,
    questionIds: questions.map((question) => question.id),
    note: '原创仿真练习：按官方题型拆解，逐题显示读音、中文义和解题步骤。',
  }
}))

export const jlptSources = [
  { label: 'JLPT 官方题型与题目构成', url: 'https://www.jlpt.jp/e/guideline/testsections.html' },
  { label: 'JLPT 官方样题与练习册', url: 'https://samplequestions.jlpt.jp/e/samples/sampleindex.html' },
  { label: 'JLPT 官方教师说明材料', url: 'https://www.jlpt.jp/e/reference/forteachers.html' },
]

export const jlptOfficialPracticeLinks: Record<JLPTLevel, Array<{ label: string; url: string }>> = {
  N5: [
    { label: '词汇 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N5V.pdf' },
    { label: '语法·阅读 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N5G.pdf' },
    { label: '听力 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N5L.pdf' },
  ],
  N4: [
    { label: '词汇 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N4V.pdf' },
    { label: '语法·阅读 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N4G.pdf' },
    { label: '听力 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N4L.pdf' },
  ],
  N3: [
    { label: '词汇 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N3V.pdf' },
    { label: '语法·阅读 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N3G.pdf' },
    { label: '听力 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N3L.pdf' },
  ],
  N2: [
    { label: '词汇 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N2V.pdf' },
    { label: '语法·阅读 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N2G.pdf' },
    { label: '听力 PDF', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N2L.pdf' },
  ],
}
