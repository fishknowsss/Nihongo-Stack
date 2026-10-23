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
  itemType?: string
  audioUrl?: string
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
  questionCount?: number
  sectionQuestionCounts?: Partial<Record<JLPTSection, number>>
}

// 近七年先建立稳定的学习索引。官方历年试卷不作为可再分发原文打包，页面提供公开官方入口；题目为按官方题型原创的逐步教学练习。
export const jlptYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025]
export const jlptLevels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2']

export const jlptExamBlueprint: Record<JLPTLevel, { sections: string[]; minutes: number[] }> = {
  N5: { sections: ['文字・語彙', '文法・読解', '聴解'], minutes: [20, 40, 30] },
  N4: { sections: ['文字・語彙', '文法・読解', '聴解'], minutes: [25, 55, 35] },
  N3: { sections: ['文字・語彙', '文法・読解', '聴解'], minutes: [30, 70, 40] },
  N2: { sections: ['言語知識・読解', '聴解'], minutes: [105, 50] },
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
    { label: '2018 官方练习册 · 词汇', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N5V.pdf' },
    { label: '2018 官方练习册 · 语法·阅读', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N5G.pdf' },
    { label: '2018 官方练习册 · 听力', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N5L.pdf' },
    { label: '2012 官方样题 · 词汇', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N5V.pdf' },
    { label: '2012 官方样题 · 语法·阅读', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N5G.pdf' },
    { label: '2012 官方样题 · 听力', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N5L.pdf' },
  ],
  N4: [
    { label: '2018 官方练习册 · 词汇', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N4V.pdf' },
    { label: '2018 官方练习册 · 语法·阅读', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N4G.pdf' },
    { label: '2018 官方练习册 · 听力', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N4L.pdf' },
    { label: '2012 官方样题 · 词汇', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N4V.pdf' },
    { label: '2012 官方样题 · 语法·阅读', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N4G.pdf' },
    { label: '2012 官方样题 · 听力', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N4L.pdf' },
  ],
  N3: [
    { label: '2018 官方练习册 · 词汇', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N3V.pdf' },
    { label: '2018 官方练习册 · 语法·阅读', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N3G.pdf' },
    { label: '2018 官方练习册 · 听力', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N3L.pdf' },
    { label: '2012 官方样题 · 词汇', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N3V.pdf' },
    { label: '2012 官方样题 · 语法·阅读', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N3G.pdf' },
    { label: '2012 官方样题 · 听力', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N3L.pdf' },
  ],
  N2: [
    { label: '2018 官方练习册 · 词汇', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N2V.pdf' },
    { label: '2018 官方练习册 · 语法·阅读', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N2G.pdf' },
    { label: '2018 官方练习册 · 听力', url: 'https://www.jlpt.jp/samples/sample2018/pdf/N2L.pdf' },
    { label: '2012 官方样题 · 词汇', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N2V.pdf' },
    { label: '2012 官方样题 · 语法·阅读', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N2G.pdf' },
    { label: '2012 官方样题 · 听力', url: 'https://www.jlpt.jp/samples/sample2012/pdf/N2L.pdf' },
  ],
}
