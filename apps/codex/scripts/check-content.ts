import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { listeningSources as catalogListenings, readings as catalogReadings } from '../src/catalog'
const root = resolve(import.meta.dirname, '../../..')
const originalPath = resolve(root, 'shared/content/starter-pack.v1.json')
const original = JSON.parse(readFileSync(originalPath, 'utf8'))
const expanded = JSON.parse(
  readFileSync(resolve(root, 'shared/content/foundation-week.v2.json'), 'utf8'),
)
const originalHash = readFileSync(
  resolve(root, 'output/product-improvement/2026-10-07/v1-sha256.txt'),
  'utf8',
).trim()
assert.equal(
  createHash('sha256').update(readFileSync(originalPath)).digest('hex'),
  originalHash,
  'v1 IDs, text and question semantics must remain unchanged',
)
const ids = new Set<string>()
function unique(id: string) {
  assert.equal(typeof id, 'string')
  assert.ok(id)
  assert.ok(!ids.has(id), `duplicate id: ${id}`)
  ids.add(id)
}
function checkQuestions(items: any[]) {
  for (const q of items) {
    unique(q.id)
    assert.ok(q.prompt)
    assert.ok(q.explanation)
    assert.ok(q.options.length >= 3)
    assert.equal(new Set(q.options).size, q.options.length)
    assert.ok(
      Number.isInteger(q.answer) &&
        q.answer >= 0 &&
        q.answer < q.options.length,
    )
  }
}
for (const pack of [original, expanded]) {
  for (const card of pack.cards) {
    unique(card.id)
    assert.ok(['kana', 'vocabulary', 'grammar'].includes(card.kind))
    assert.ok(card.front && card.back && card.example)
  }
  for (const r of pack.readings) {
    unique(r.id)
    assert.ok(
      r.segments.length && r.translation && r.focus.length && r.minutes > 0,
    )
    for (const s of r.segments) {
      assert.ok(s.text)
      if (s.reading)
        assert.ok(
          !/[一-龯]/.test(s.reading),
          `furigana contains kanji: ${s.reading}`,
        )
    }
    checkQuestions(r.questions)
  }
  for (const l of pack.listenings) {
    unique(l.id)
    assert.ok(l.transcript && l.translation && l.credit)
    checkQuestions(l.questions)
    const audio = resolve(root, 'shared/content/audio', l.audioFile)
    assert.ok(existsSync(audio))
    const metadata = JSON.parse(
      execFileSync(
        '/opt/homebrew/bin/ffprobe',
        ['-v', 'error', '-show_format', '-of', 'json', audio],
        { encoding: 'utf8' },
      ),
    )
    assert.ok(Number(metadata.format.duration) > 1)
    execFileSync('/opt/homebrew/bin/ffmpeg', [
      '-v',
      'error',
      '-i',
      audio,
      '-f',
      'null',
      '-',
    ])
    if (pack === expanded) {
      assert.equal(l.audioKind, 'synthetic')
      assert.equal(l.reviewStatus, 'machine_reviewed_teacher_pending')
    }
  }
}
for (const reading of catalogReadings) {
  for (const segment of reading.segments) {
    assert.ok(!/[一-龯]/u.test(segment.text) || typeof segment.reading === 'string', `runtime reading missing furigana: ${reading.id} · ${segment.text}`)
  }
}
for (const listening of catalogListenings) {
  assert.ok(listening.transcriptSegments?.length, `runtime transcript segments missing: ${listening.id}`)
  for (const segment of listening.transcriptSegments ?? []) {
    assert.ok(!/[一-龯]/u.test(segment.text) || typeof segment.reading === 'string', `runtime transcript reading missing: ${listening.id} · ${segment.text}`)
  }
}
checkQuestions(original.baselineQuestions)
assert.equal(expanded.units.length, 7)
for (const unit of expanded.units) {
  unique(unit.id)
  assert.equal(unit.cardIds.length, 6)
  assert.ok(unit.goal && unit.reflection)
  assert.ok(
    unit.cardIds.every((id: string) =>
      expanded.cards.some((c: any) => c.id === id && c.unitId === unit.id),
    ),
  )
  assert.ok(
    expanded.readings.some(
      (r: any) =>
        r.id === unit.readingId &&
        r.unitId === unit.id &&
        r.questions.length === 3,
    ),
  )
  assert.ok(
    expanded.listenings.some(
      (l: any) =>
        l.id === unit.listeningId &&
        l.unitId === unit.id &&
        l.questions.length === 2,
    ),
  )
  assert.ok(
    unit.prerequisiteIds.every((id: string) =>
      expanded.units.some((u: any) => u.id === id && u.order < unit.order),
    ),
  )
}
assert.equal(
  expanded.sources.find((s: any) => s.id === 'ns-speech-v2')
    .redistributionStatus,
  'personal_reference_only',
)
console.log(
  'Content checks passed: v1 unchanged; 7 units; 62 cards; 9 readings; 10 decoded audio files; unique IDs, questions, references and trial labels',
)
