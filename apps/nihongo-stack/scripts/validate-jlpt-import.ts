import fs from 'node:fs'
import process from 'node:process'
import { parseImportedJLPTPack } from '../src/jlpt-import'

const file = process.argv[2]
if (!file) {
  console.error('用法：npm run validate:jlpt -- path/to/pack.json')
  process.exit(1)
}
try {
  const pack = parseImportedJLPTPack(fs.readFileSync(file, 'utf8'))
  const sections = [...new Set(pack.questions.map((question) => question.section))].join('、')
  const status = pack.complete ? `complete exam · session ${pack.session} · ${pack.questionCount} questions verified` : `${pack.questions.length} questions · teaching excerpt`
  console.log(`JLPT import valid: ${pack.title} · ${pack.level} · ${status} · sections ${sections}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
