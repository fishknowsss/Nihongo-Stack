import assert from 'node:assert/strict'
import { jlptExamSessionsByYear, jlptFullExamSlotCount, jlptLevelGuides, jlptLevels, jlptOfficialPracticeLinks, jlptQuestions, jlptResourceRoutes, jlptSets, jlptYears } from '../src/jlpt'
import { downloadJLPTCoverageManifest, importedJLPTCompleteExample, importedJLPTCompleteTemplate, importedJLPTExample, minimumCompleteQuestionCount, parseImportedJLPTPack } from '../src/jlpt-import'

assert.equal(jlptSets.length, jlptYears.length * jlptLevels.length)
assert.equal(new Set(jlptSets.map((set) => set.id)).size, jlptSets.length)
assert.deepEqual(jlptExamSessionsByYear[2020], ['12'])
assert.equal(jlptFullExamSlotCount, 52)
assert.equal(minimumCompleteQuestionCount('N5', 2025, '07'), 67)
assert.equal(minimumCompleteQuestionCount('N5', 2019, '07'), 91)
assert.equal(minimumCompleteQuestionCount('N4', 2025, '12'), 85)
assert.equal(minimumCompleteQuestionCount('N2', 2025, '12'), 107)
assert.ok(jlptResourceRoutes.length >= 7)
assert.equal(new Set(jlptResourceRoutes.map((route) => route.url)).size, jlptResourceRoutes.length)
assert.ok(jlptResourceRoutes.every((route) => route.japaneseGoal.length > 0 && route.chineseMethod.length > 0 && route.studySteps.length >= 3 && route.url.startsWith('https://')))
for (const level of jlptLevels) {
  const sets = jlptSets.filter((set) => set.level === level)
  assert.equal(sets.length, jlptYears.length)
  const levelQuestions = jlptQuestions.filter((question) => question.level === level)
  assert.equal(levelQuestions.length, 16)
  for (const section of ['文字・語彙', '文法', '読解', '聴解'] as const) assert.equal(levelQuestions.filter((question) => question.section === section).length, 4)
  assert.equal(levelQuestions.filter((question) => question.section === '聴解').every((question) => question.audioText), true)
  assert.equal(jlptOfficialPracticeLinks[level].length, 8)
  assert.equal(new Set(jlptOfficialPracticeLinks[level].map((link) => link.url)).size, 8)
  assert.ok(jlptOfficialPracticeLinks[level].every((link) => link.url.startsWith('https://')))
  assert.ok(jlptLevelGuides[level].japaneseFocus.length > 0)
  assert.equal(jlptLevelGuides[level].steps.length, 3)
}
for (const question of jlptQuestions) {
  assert.ok(question.prompt.length > 0)
  assert.equal(question.options.length, 4)
  assert.ok(question.answer >= 0 && question.answer < question.options.length)
  assert.ok(question.reading && question.gloss, `${question.id} must include reading and Chinese gloss`)
  assert.ok(question.explanation.length > 0)
  assert.ok(question.studySteps.length >= 2)
}
assert.ok(jlptQuestions.filter((question) => question.reading).length >= 60)
const imported = parseImportedJLPTPack(importedJLPTExample)
assert.equal(imported.level, 'N5')
assert.equal(imported.questions[0].source, 'licensed-import')
assert.equal(imported.questions.length, 1)
assert.equal(imported.complete, false)
const complete = parseImportedJLPTPack(importedJLPTCompleteExample)
assert.equal(complete.complete, true)
assert.equal(complete.questionCount, complete.questions.length)
assert.equal(complete.sourceUrl, 'https://fixture.invalid/source')
assert.equal(complete.rightsBasis, '内部测试 fixture，仅用于自动化校验')
assert.equal(complete.rightsEvidenceUrl, 'https://fixture.invalid/terms')
assert.equal(complete.questions.length, 67)
assert.deepEqual(complete.sectionQuestionCounts, { '文字・語彙': 21, '文法': 15, '読解': 7, '聴解': 24 })
assert.equal(complete.questions.every((question) => Number.isInteger(question.questionNumber)), true)
assert.equal(complete.questions.filter((question) => question.section === '聴解').every((question) => question.audioUrl), true)
const missingTeaching = JSON.parse(importedJLPTCompleteExample) as Record<string, unknown>
missingTeaching.questions = (missingTeaching.questions as Array<Record<string, unknown>>).map((question, index) => index === 0 ? { ...question, reading: '' } : question)
assert.throws(() => parseImportedJLPTPack(JSON.stringify(missingTeaching)), /平假名读音和中文释义/)
const emptyStudyStep = JSON.parse(importedJLPTCompleteExample) as Record<string, unknown>
emptyStudyStep.questions = (emptyStudyStep.questions as Array<Record<string, unknown>>).map((question, index) => index === 0 ? { ...question, studySteps: ['', '第二步'] } : question)
assert.throws(() => parseImportedJLPTPack(JSON.stringify(emptyStudyStep)), /至少两步非空学习步骤/)
assert.throws(() => parseImportedJLPTPack(importedJLPTCompleteTemplate), /模板占位符/)
const unfinishedQuestions = JSON.parse(importedJLPTCompleteExample) as Record<string, unknown>
unfinishedQuestions.questions = (unfinishedQuestions.questions as Array<Record<string, unknown>>).map((question) => ({ ...question, prompt: '填写日文题干' }))
assert.throws(() => parseImportedJLPTPack(JSON.stringify(unfinishedQuestions)), /题目占位符/)
const tooSmall = JSON.parse(importedJLPTCompleteExample) as Record<string, unknown>
tooSmall.questions = (tooSmall.questions as unknown[]).filter((_, index) => index % 4 === 0)
tooSmall.questionCount = (tooSmall.questions as unknown[]).length
tooSmall.sectionQuestionCounts = { '文字・語彙': 6, '文法': 4, '読解': 2, '聴解': 5 }
assert.throws(() => parseImportedJLPTPack(JSON.stringify(tooSmall)), /至少需要/)
assert.throws(() => parseImportedJLPTPack(importedJLPTCompleteExample.replace('"year":2025', '"year":2020')), /没有 07 场/)
const unsafeAudio = JSON.parse(importedJLPTExample) as Record<string, unknown>
;(unsafeAudio.questions as Array<Record<string, unknown>>)[0].audioUrl = 'javascript:alert(1)'
assert.throws(() => parseImportedJLPTPack(JSON.stringify(unsafeAudio)), /audioUrl必须是 http\(s\) URL/)
assert.throws(() => parseImportedJLPTPack(importedJLPTCompleteExample.replace('https://fixture.invalid/source', 'javascript:alert(1)')), /sourceUrl必须是 http\(s\) URL/)
const missingRightsBasis = JSON.parse(importedJLPTCompleteExample) as Record<string, unknown>
delete missingRightsBasis.rightsBasis
assert.throws(() => parseImportedJLPTPack(JSON.stringify(missingRightsBasis)), /必须填写 rightsBasis/)
let manifest = ''
downloadJLPTCoverageManifest((text) => { manifest = text })
const parsedManifest = JSON.parse(manifest) as { slots: Array<unknown> }
assert.equal(parsedManifest.slots.length, jlptFullExamSlotCount)
console.log(`JLPT checks passed: ${jlptSets.length} year-level packs, ${jlptQuestions.length} teaching questions (16 per level, four sections), complete-pack validation, official links for ${jlptLevels.join('/')}`)
