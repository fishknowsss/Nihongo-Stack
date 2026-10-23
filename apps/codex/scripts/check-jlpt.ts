import assert from 'node:assert/strict'
import { jlptLevels, jlptOfficialPracticeLinks, jlptQuestions, jlptSets, jlptYears } from '../src/jlpt'

assert.equal(jlptSets.length, jlptYears.length * jlptLevels.length)
assert.equal(new Set(jlptSets.map((set) => set.id)).size, jlptSets.length)
for (const level of jlptLevels) {
  const sets = jlptSets.filter((set) => set.level === level)
  assert.equal(sets.length, jlptYears.length)
  assert.ok(jlptQuestions.some((question) => question.level === level))
  assert.equal(jlptOfficialPracticeLinks[level].length, 3)
}
for (const question of jlptQuestions) {
  assert.ok(question.prompt.length > 0)
  assert.equal(question.options.length, 4)
  assert.ok(question.answer >= 0 && question.answer < question.options.length)
  assert.ok(question.explanation.length > 0)
  assert.ok(question.studySteps.length >= 2)
}
console.log(`JLPT checks passed: ${jlptSets.length} year-level packs, ${jlptQuestions.length} teaching questions, official links for ${jlptLevels.join('/')}`)
