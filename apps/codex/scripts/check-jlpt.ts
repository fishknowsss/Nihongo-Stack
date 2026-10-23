import assert from 'node:assert/strict'
import { jlptLevels, jlptOfficialPracticeLinks, jlptQuestions, jlptSets, jlptYears } from '../src/jlpt'
import { importedJLPTCompleteExample, importedJLPTExample, parseImportedJLPTPack } from '../src/jlpt-import'

assert.equal(jlptSets.length, jlptYears.length * jlptLevels.length)
assert.equal(new Set(jlptSets.map((set) => set.id)).size, jlptSets.length)
for (const level of jlptLevels) {
  const sets = jlptSets.filter((set) => set.level === level)
  assert.equal(sets.length, jlptYears.length)
  assert.ok(jlptQuestions.some((question) => question.level === level))
  assert.equal(jlptOfficialPracticeLinks[level].length, 6)
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
assert.deepEqual(complete.sectionQuestionCounts, { '文字・語彙': 1, '文法': 1, '読解': 1, '聴解': 1 })
assert.equal(complete.questions.filter((question) => question.section === '聴解').every((question) => question.audioUrl), true)
console.log(`JLPT checks passed: ${jlptSets.length} year-level packs, ${jlptQuestions.length} teaching questions, complete-pack validation, official links for ${jlptLevels.join('/')}`)
