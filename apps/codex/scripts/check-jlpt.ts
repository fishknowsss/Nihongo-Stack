import assert from 'node:assert/strict'
import { jlptLevelGuides, jlptLevels, jlptOfficialPracticeLinks, jlptQuestions, jlptSets, jlptYears } from '../src/jlpt'
import { importedJLPTCompleteExample, importedJLPTExample, parseImportedJLPTPack } from '../src/jlpt-import'

assert.equal(jlptSets.length, jlptYears.length * jlptLevels.length)
assert.equal(new Set(jlptSets.map((set) => set.id)).size, jlptSets.length)
for (const level of jlptLevels) {
  const sets = jlptSets.filter((set) => set.level === level)
  assert.equal(sets.length, jlptYears.length)
  const levelQuestions = jlptQuestions.filter((question) => question.level === level)
  assert.equal(levelQuestions.length, 12)
  for (const section of ['文字・語彙', '文法', '読解'] as const) assert.equal(levelQuestions.filter((question) => question.section === section).length, 4)
  assert.equal(jlptOfficialPracticeLinks[level].length, 6)
  assert.ok(jlptLevelGuides[level].japaneseFocus.length > 0)
  assert.equal(jlptLevelGuides[level].steps.length, 3)
}
for (const question of jlptQuestions) {
  assert.ok(question.prompt.length > 0)
  assert.equal(question.options.length, 4)
  assert.ok(question.answer >= 0 && question.answer < question.options.length)
  assert.ok(question.explanation.length > 0)
  assert.ok(question.studySteps.length >= 2)
}
const imported = parseImportedJLPTPack(importedJLPTExample)
assert.equal(imported.level, 'N5')
assert.equal(imported.questions[0].source, 'licensed-import')
assert.equal(imported.questions.length, 1)
assert.equal(imported.complete, false)
const complete = parseImportedJLPTPack(importedJLPTCompleteExample)
assert.equal(complete.complete, true)
assert.equal(complete.questionCount, complete.questions.length)
assert.equal(complete.sourceUrl, 'https://example.com/fixture-source')
assert.deepEqual(complete.sectionQuestionCounts, { '文字・語彙': 4, '文法': 4, '読解': 4, '聴解': 4 })
assert.equal(complete.questions.filter((question) => question.section === '聴解').every((question) => question.audioUrl), true)
assert.throws(() => parseImportedJLPTPack(importedJLPTCompleteExample.replace('https://example.com/fixture-source', 'javascript:alert(1)')), /sourceUrl必须是 http\(s\) URL/)
console.log(`JLPT checks passed: ${jlptSets.length} year-level packs, ${jlptQuestions.length} teaching questions (12 per level), complete-pack validation, official links for ${jlptLevels.join('/')}`)
