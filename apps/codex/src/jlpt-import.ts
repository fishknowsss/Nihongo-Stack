import type { JLPTLevel, JLPTQuestion, JLPTSection } from './jlpt'

export type ImportedJLPTPack = {
  schemaVersion: 1
  id: string
  year: number
  session?: string
  level: JLPTLevel
  title: string
  sourceName: string
  license: string
  sourceUrl?: string
  complete?: boolean
  /** The source-declared total. A complete pack must match the imported rows. */
  questionCount?: number
  /** The source-declared count for each learning section. */
  sectionQuestionCounts?: Partial<Record<JLPTSection, number>>
  questions: JLPTQuestion[]
}

/**
 * JLPT publishes approximate item counts, and the actual count may vary slightly
 * by session. These lower bounds reject teaching excerpts while leaving room for
 * the session-to-session variation documented by the official site.
 */
export function minimumCompleteQuestionCount(level: JLPTLevel, year: number, session: string): number {
  if (level === 'N2') return 100
  if (level === 'N3') return 95
  if (level === 'N4') {
    const beforeShortenedFormat = year < 2020 || (year === 2020 && session === '07')
    return beforeShortenedFormat ? 90 : 78
  }
  const beforeShortenedFormat = year < 2020 || (year === 2020 && session === '07')
  return beforeShortenedFormat ? 80 : 60
}

const levels = new Set<JLPTLevel>(['N5', 'N4', 'N3', 'N2'])
const sections = new Set<JLPTSection>(['文字・語彙', '文法', '読解', '聴解'])

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}不能为空`)
  return value.trim()
}

function sourceUrl(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}必须是 http(s) URL`)
  try {
    const parsed = new URL(value.trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error()
  } catch {
    throw new Error(`${label}必须是 http(s) URL`)
  }
  return value.trim()
}

export function parseImportedJLPTPack(raw: string): ImportedJLPTPack {
  if (raw.length > 20 * 1024 * 1024) throw new Error('题库文件超过 20 MB')
  let data: unknown
  try { data = JSON.parse(raw) } catch { throw new Error('题库必须是有效 JSON') }
  if (!data || typeof data !== 'object') throw new Error('题库根对象无效')
  const record = data as Record<string, unknown>
  if (record.schemaVersion !== 1) throw new Error('题库 schemaVersion 必须为 1')
  const level = text(record.level, 'level') as JLPTLevel
  if (!levels.has(level)) throw new Error('level 只能是 N5、N4、N3 或 N2')
  const year = record.year
  const numericYear = typeof year === 'number' ? year : NaN
  if (!Number.isInteger(numericYear) || numericYear < 2010 || numericYear > 2100) throw new Error('year 必须是有效年份')
  if (!Array.isArray(record.questions) || record.questions.length === 0) throw new Error('questions 不能为空')
  const questions: JLPTQuestion[] = record.questions.map((value, index) => {
    if (!value || typeof value !== 'object') throw new Error(`第 ${index + 1} 题格式无效`)
    const question = value as Record<string, unknown>
    const section = text(question.section, `第 ${index + 1} 题 section`) as JLPTSection
    if (!sections.has(section)) throw new Error(`第 ${index + 1} 题 section 无效`)
    if (!Array.isArray(question.options) || question.options.length < 2 || question.options.some((option) => typeof option !== 'string' || !option.trim())) throw new Error(`第 ${index + 1} 题 options 无效`)
    if (!Number.isInteger(question.answer) || Number(question.answer) < 0 || Number(question.answer) >= question.options.length) throw new Error(`第 ${index + 1} 题 answer 无效`)
    const id = text(question.id, `第 ${index + 1} 题 id`)
    return {
      id: `${String(record.id ?? 'imported')}:${id}`,
      level,
      section,
      questionNumber: typeof question.questionNumber === 'number' ? question.questionNumber : undefined,
      prompt: text(question.prompt, `第 ${index + 1} 题 prompt`),
      audioText: typeof question.audioText === 'string' && question.audioText.trim() ? question.audioText.trim() : undefined,
      options: question.options.map((option) => String(option)),
      answer: Number(question.answer),
      reading: typeof question.reading === 'string' ? question.reading : undefined,
      gloss: typeof question.gloss === 'string' ? question.gloss : undefined,
      explanation: typeof question.explanation === 'string' && question.explanation.trim() ? question.explanation : '导入资料未提供解析，请结合原始答案和教材复盘。',
      studySteps: Array.isArray(question.studySteps) && question.studySteps.length ? question.studySteps.map(String) : ['先独立完成，再对照原始答案。', '把不熟的词句加入选中笔记。'],
      itemType: typeof question.itemType === 'string' ? question.itemType : undefined,
      audioUrl: typeof question.audioUrl === 'string' ? question.audioUrl : undefined,
      sourceUrl: sourceUrl(question.sourceUrl, `第 ${index + 1} 题 sourceUrl`),
      source: 'licensed-import',
    }
  })
  if (new Set(questions.map((question) => question.id)).size !== questions.length) throw new Error('题目 id 不能重复')
  const complete = record.complete === true
  if (complete) {
    if ([record.id, record.title, record.sourceName, record.license, record.sourceUrl].some((value) => typeof value === 'string' && (value.includes('replace-with-') || value.includes('填写') || value.includes('example.com')))) throw new Error('完整题库仍包含模板占位符，请先填写真实来源和题目')
    const questionPlaceholders = ['填写日文题干', '填写平假名读音', '填写中文释义', '填写逐题中文解析', '选项 A', '选项 B', '选项 C', '选项 D']
    if (questions.some((question) => questionPlaceholders.some((placeholder) => JSON.stringify(question).includes(placeholder)))) throw new Error('完整题库仍包含题目占位符，请先填写真实题目')
    if (questions.some((question) => !question.reading?.trim() || !question.gloss?.trim())) throw new Error('完整题库每道题都必须提供平假名读音和中文释义')
    if (questions.some((question) => question.explanation === '导入资料未提供解析，请结合原始答案和教材复盘。' || question.studySteps.length < 2)) throw new Error('完整题库每道题都必须提供逐题中文解析和至少两步学习步骤')
    if (typeof record.session !== 'string' || !record.session.trim()) throw new Error('完整题库必须填写 session（例如 07 或 12）')
    if (!Number.isInteger(record.questionCount) || Number(record.questionCount) !== questions.length) throw new Error('完整题库的 questionCount 必须等于 questions 数量')
    const minimum = minimumCompleteQuestionCount(level, numericYear, record.session.trim())
    if (questions.length < minimum) throw new Error(`完整题库至少需要 ${minimum} 题；当前只有 ${questions.length} 题，请导入整场试卷而不是教学节选`)
    if (questions.some((question) => !Number.isInteger(question.questionNumber) || Number(question.questionNumber) < 1)) throw new Error('完整题库每道题都必须填写正整数 questionNumber')
    for (const section of sections) {
      const numbers = questions.filter((question) => question.section === section).map((question) => question.questionNumber as number)
      if (new Set(numbers).size !== numbers.length) throw new Error(`${section} 的 questionNumber 不能重复`)
      const expected = Array.from({ length: numbers.length }, (_, index) => index + 1)
      if (numbers.slice().sort((a, b) => a - b).some((number, index) => number !== expected[index])) throw new Error(`${section} 的 questionNumber 必须从 1 连续编号，不能缺题`)
    }
    if (!record.sectionQuestionCounts || typeof record.sectionQuestionCounts !== 'object' || Array.isArray(record.sectionQuestionCounts)) throw new Error('完整题库必须填写 sectionQuestionCounts')
    const sectionQuestionCounts = record.sectionQuestionCounts as Record<string, unknown>
    for (const section of ['文字・語彙', '文法', '読解', '聴解'] as const) {
      if (!Number.isInteger(sectionQuestionCounts[section]) || Number(sectionQuestionCounts[section]) < 1) throw new Error(`完整题库必须填写 ${section} 的实际题数`)
      const actual = questions.filter((question) => question.section === section).length
      if (actual !== Number(sectionQuestionCounts[section])) throw new Error(`${section} 题量不匹配：声明 ${sectionQuestionCounts[section]}，实际 ${actual}`)
    }
    const declaredTotal = Object.values(sectionQuestionCounts).reduce((sum: number, value) => sum + (typeof value === 'number' ? value : 0), 0)
    if (declaredTotal !== questions.length) throw new Error('sectionQuestionCounts 总数必须等于 questions 数量')
    if (questions.some((question) => question.section === '聴解' && (!question.audioUrl || !/^https?:\/\//.test(question.audioUrl) || question.audioUrl.includes('example.com')))) throw new Error('完整题库的每道聴解题都必须提供真实 http(s) audioUrl')
  }
  return {
    schemaVersion: 1,
    id: text(record.id, 'id'),
    year: numericYear,
    session: typeof record.session === 'string' ? record.session : undefined,
    level,
    title: text(record.title, 'title'),
    sourceName: text(record.sourceName, 'sourceName'),
    license: text(record.license, 'license'),
    sourceUrl: sourceUrl(record.sourceUrl, 'sourceUrl'),
    complete,
    questionCount: typeof record.questionCount === 'number' ? record.questionCount : undefined,
    sectionQuestionCounts: record.sectionQuestionCounts && typeof record.sectionQuestionCounts === 'object' && !Array.isArray(record.sectionQuestionCounts)
      ? Object.fromEntries(Object.entries(record.sectionQuestionCounts as Record<string, unknown>).filter(([key, value]) => sections.has(key as JLPTSection) && Number.isInteger(value)).map(([key, value]) => [key, Number(value)])) as Partial<Record<JLPTSection, number>>
      : undefined,
    questions,
  }
}

export const importedJLPTExample = `{
  "schemaVersion": 1,
  "id": "jlpt-2025-07-n5",
  "year": 2025,
  "session": "07",
  "level": "N5",
  "title": "2025 年 7 月 N5 导入模板",
  "sourceName": "填写授权来源",
  "license": "填写个人使用或再分发许可",
  "sourceUrl": "https://example.com/original-source",
  "complete": false,
  "questionCount": 1,
  "sectionQuestionCounts": { "文字・語彙": 1 },
  "questions": [
    {
      "id": "vocab-001",
      "section": "文字・語彙",
      "prompt": "题干原文",
      "options": ["选项 A", "选项 B", "选项 C", "选项 D"],
      "answer": 0,
      "reading": "读音",
      "gloss": "中文释义",
      "explanation": "逐题中文解析",
      "studySteps": ["先看句子结构", "再核对词义"]
    }
  ]
}`

export const importedJLPTCompleteTemplate = JSON.stringify({
  schemaVersion: 1,
  id: 'replace-with-year-session-level',
  year: 2025,
  session: '07',
  level: 'N5',
  title: '填写年份与场次 · N5 完整题库',
  sourceName: '填写授权来源',
  license: '填写个人使用或再分发许可',
  sourceUrl: 'https://example.com/original-source',
  complete: true,
  questionCount: 67,
  sectionQuestionCounts: { '文字・語彙': 21, '文法': 15, '読解': 7, '聴解': 24 },
  questions: ([
    ['文字・語彙', 21],
    ['文法', 15],
    ['読解', 7],
    ['聴解', 24],
  ] as const).flatMap(([section, count]) => Array.from({ length: count }, (_, index) => ({
    id: `${section}-${String(index + 1).padStart(3, '0')}`,
    section,
    questionNumber: index + 1,
    prompt: '填写日文题干',
    options: ['选项 A', '选项 B', '选项 C', '选项 D'],
    answer: 0,
    reading: '填写平假名读音',
    gloss: '填写中文释义',
    explanation: '填写逐题中文解析',
    studySteps: ['先看句子结构', '再核对词义与选项'],
    ...(section === '聴解' ? { audioUrl: 'https://example.com/replace-with-audio.mp3' } : {}),
  }))),
}, null, 2)

// A tiny fixture used by the importer checks. It proves the complete-pack
// contract without shipping any copyrighted examination material.
export const importedJLPTCompleteExample = JSON.stringify({
  schemaVersion: 1,
  id: 'fixture-complete-2025-07-n5',
  year: 2025,
  session: '07',
  level: 'N5',
  title: '完整题库校验 fixture',
  sourceName: 'Nihongo Stack automated check',
  license: '内部测试资料，不是官方真题',
  sourceUrl: 'https://fixture.invalid/source',
  complete: true,
  questionCount: 67,
  sectionQuestionCounts: { '文字・語彙': 21, '文法': 15, '読解': 7, '聴解': 24 },
  questions: [
    ...([
      ['文字・語彙', 21],
      ['文法', 15],
      ['読解', 7],
      ['聴解', 24],
    ] as const).flatMap(([section, count]) => Array.from({ length: count }, (_, index) => [`${section}-${index + 1}`, section, index + 1] as const)),
  ].map(([id, section, questionNumber]) => ({
    id,
    section,
    questionNumber,
    prompt: `fixture ${id}`,
    options: ['A', 'B'],
    answer: 0,
    reading: `fixture ${id} reading`,
    gloss: 'fixture gloss',
    explanation: 'fixture explanation',
    studySteps: ['fixture step one', 'fixture step two'],
    ...(section === '聴解' ? { audioUrl: 'https://fixture.invalid/audio.mp3' } : {}),
  })),
})

export function downloadImportTemplate(download: (text: string, name: string) => void): void {
  download(importedJLPTExample, 'nihongo-stack-jlpt-import-template.json')
}

export function downloadCompleteImportTemplate(download: (text: string, name: string) => void): void {
  download(importedJLPTCompleteTemplate, 'nihongo-stack-jlpt-complete-template.json')
}
