import 'fake-indexeddb/auto'
import assert from 'node:assert/strict'
import { Rating } from 'ts-fsrs'

const {
  createBackup,
  db,
  gradeCard,
  inspectBackup,
  recordAttempt,
  restoreBackup,
  setPreference,
} = await import('../src/db')

try {
  await gradeCard('kana-01', Rating.Good)
  await recordAttempt('baseline-01', 'baseline', [0, 1], 2, 2)
  await setPreference('studyLayer:reading:v2-u01-reading', 'full')
  await setPreference('studyLayer:cards', 'romaji')
  await setPreference('annotationNote:毎日', '每天都要复习这个词。')
  await setPreference('annotationFavorite:毎日', true)
  const backup = await createBackup()
  const parsed = JSON.parse(backup)
  const invalidTime = structuredClone(parsed)
  invalidTime.preferences.push({key:'studyTime:v1:invalid',value:JSON.stringify({activeMs:-1})})
  await assert.rejects(restoreBackup(JSON.stringify(invalidTime)), /学习计时记录无效/)
  assert.equal(await db.reviewEvents.count(), 1, 'invalid time metadata must preserve actual learning data')
  assert.equal(parsed.progress.length, 1)
  assert.equal(parsed.reviewEvents.length, 1)
  assert.equal(parsed.attempts.length, 1)

  await db.progress.clear()
  await db.reviewEvents.clear()
  await db.attempts.clear()
  await restoreBackup(backup)
  const restored = await db.progress.get('kana-01')
  assert.ok(
    restored?.card.due instanceof Date,
    'restored FSRS due date must be a Date',
  )
  assert.equal((await db.preferences.get('studyLayer:reading:v2-u01-reading'))?.value, 'full')
  assert.equal((await db.preferences.get('studyLayer:cards'))?.value, 'romaji')
  assert.equal((await db.preferences.get('annotationNote:毎日'))?.value, '每天都要复习这个词。')
  assert.equal((await db.preferences.get('annotationFavorite:毎日'))?.value, true)
  assert.ok(
    restored.card.last_review instanceof Date,
    'restored last review must be a Date',
  )
  await gradeCard('kana-01', Rating.Again)
  assert.equal(
    await db.reviewEvents.count(),
    2,
    'review after restore must append one log',
  )

  const invalid = structuredClone(parsed)
  invalid.progress[0].card.due = 'not-a-date'
  await assert.rejects(restoreBackup(JSON.stringify(invalid)), /复习日期无效/)
  assert.equal(
    await db.reviewEvents.count(),
    2,
    'invalid import must preserve existing records',
  )

  await Promise.all([
    gradeCard('kana-02', Rating.Good),
    gradeCard('kana-02', Rating.Good),
  ])
  assert.equal(
    await db.reviewEvents.where('cardId').equals('kana-02').count(),
    1,
    'concurrent submissions must record once',
  )
  await recordAttempt('listening-01', 'listening', [0], 1, 1, {
    playCount: 1,
    transcriptBeforeSubmit: false,
    completedPlayback: true,
    seekedBeforeSubmit: false,
  })
  const withListening = await createBackup()
  assert.equal(inspectBackup(withListening).attempts, 2)
  const restoredListening = JSON.parse(withListening)
  await restoreBackup(withListening)
  assert.equal(
    (await db.attempts.where('kind').equals('listening').first())?.listening
      ?.playCount,
    1,
  )

  const malformedAttempt = structuredClone(restoredListening)
  malformedAttempt.attempts[0].completedAt = undefined
  await assert.rejects(
    restoreBackup(JSON.stringify(malformedAttempt)),
    /练习记录字段不完整/,
  )
  assert.equal(
    await db.attempts.count(),
    2,
    'malformed attempt must preserve records',
  )

  const duplicatePreference = structuredClone(restoredListening)
  duplicatePreference.preferences = [
    { key: 'x', value: 1 },
    { key: 'x', value: 2 },
  ]
  await assert.rejects(
    restoreBackup(JSON.stringify(duplicatePreference)),
    /重复 ID/,
  )
  assert.equal(
    await db.reviewEvents.count(),
    3,
    'duplicate preference must preserve records',
  )
  const badLog = JSON.parse(await createBackup())
  badLog.reviewEvents[0].log.due = 'invalid'
  await assert.rejects(restoreBackup(JSON.stringify(badLog)), /日志排程无效/)
  const badScheduling = JSON.parse(await createBackup())
  badScheduling.progress[0].card.state = 7
  await assert.rejects(
    restoreBackup(JSON.stringify(badScheduling)),
    /排程数值无效/,
  )
  const unfinished = JSON.parse(await createBackup())
  unfinished.attempts[0].answers[0] = -1
  await assert.rejects(
    restoreBackup(JSON.stringify(unfinished)),
    /练习记录字段不完整/,
  )
  const safety = await db.preferences.get('restoreSafetySnapshot')
  assert.equal(
    typeof safety?.value,
    'string',
    'restore must retain a durable pre-import snapshot',
  )
  inspectBackup(String(safety!.value))
  const exported = JSON.parse(await createBackup())
  assert.ok(
    !exported.preferences.some(
      (x: { key: string }) => x.key === 'restoreSafetySnapshot',
    ),
    'safety snapshots must not recursively grow exports',
  )
  assert.ok(
    exported.contentPacks.some(
      (x: { id: string }) => x.id === 'foundation-week.v2',
    ),
  )
  await recordAttempt(
    'v2-u01-reading',
    'reading',
    [-2, 1, 2],
    1,
    3,
    undefined,
    [],
    5000,
    true,
  )
  const v2 = await createBackup()
  await restoreBackup(v2)
  const v2Attempt = await db.attempts
    .where('materialId')
    .equals('v2-u01-reading')
    .first()
  assert.equal(v2Attempt?.readingHelp, true)
  assert.equal(v2Attempt?.durationMs, 5000)
  assert.deepEqual(v2Attempt?.answers, [-2, 1, 2])
  console.log(
    'DB smoke test passed: export/restore, post-restore scheduling, concurrent review, listening evidence, invalid import, durable rollback, v2 records',
  )
} finally {
  await db.delete()
}
