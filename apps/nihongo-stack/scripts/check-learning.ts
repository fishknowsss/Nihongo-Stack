import assert from 'node:assert/strict'
import { createEmptyCard } from 'ts-fsrs'
import {
  backupFilename,
  fullyPlayed,
  mergeRanges,
  independentPlayback,
  introducedOn,
  reviewQueue,
  unitPracticed,
  localDate,
  difficultCardIds,
  reviewRound,
  boundedNumber,
} from '../src/learning'
import { courseUnits, cards } from '../src/catalog'
import type { Attempt, ReviewEvent, CardProgress } from '../src/db'
import { latestMistakes, practiceEvidence } from '../src/mistakes'
import { readings, listeningSources } from '../src/catalog'
import { activeDelta, parseStudyTime, splitAtMidnight } from '../src/activityModel'
import { weeklyReport } from '../src/weeklyModel'
// Weekly reports count completed local dates, keep activity separate from submissions,
// and never turn legacy elapsed duration into active time.
const reportNow = new Date('2026-10-18T12:00:00').getTime()
const reportSession = (day: string, view = 'reading', activeMs = 60_000) => ({
  key: `studyTime:v1:${day}:${view}`,
  value: JSON.stringify({ day, view, activeMs, startedAt: `${day}T08:00:00`, updatedAt: `${day}T08:05:00`, status: 'ended' }),
})
const reportPrefs = [reportSession('2026-10-11'), reportSession('2026-10-17'), reportSession('2026-10-17', 'listening'), reportSession('2026-10-10'), reportSession('2026-10-18'), {key: 'studyTime:v1:broken', value: 'invalid'}, {key: 'taskReason:2026-10-17:reading', value: '时间不够'}, {key: 'taskReason:2026-10-18:reading', value: '时间不够'}]
const legacyAttempt: Attempt = { id: 'weekly-legacy', kind: 'reading', materialId: 'v2-u01-reading', answers: [0,0,0], correct: 0, total: 3, completedAt: '2026-10-12T10:00:00', durationMs: 99_000 }
const report = weeklyReport(reportPrefs, [legacyAttempt], [], reportNow)
assert.deepEqual(report.rows.map(row => row.day), ['2026-10-11','2026-10-12','2026-10-13','2026-10-14','2026-10-15','2026-10-16','2026-10-17'])
assert.equal(report.activeDays, 2)
assert.equal(report.todayMs, 60_000, 'today appears separately and does not enter completed-week totals')
assert.equal(report.byKind.find(row => row.view === 'reading')!.activeMs, 120_000)
assert.equal(report.byKind.find(row => row.view === 'listening')!.activeMs, 60_000)
assert.equal(report.rows[1].exercises, 1)
assert.equal(report.rows[1].activeMs, 0, 'legacy submission must not imply active duration')
assert.deepEqual(report.reasons, { '时间不够': 1 })
assert.equal(weeklyReport([], [], [], reportNow).activeDays, 0)
assert.equal(weeklyReport([reportSession('2026-10-17', 'reading', 0)], [], [], reportNow).activeDays, 0)
assert.equal(weeklyReport(reportPrefs, [], [], new Date('2026-11-01T12:00:00').getTime()).rows[0].day, '2026-10-25')
console.log('v0.5 checks passed: completed local days, per-type activity, today separated, legacy duration excluded, task reasons and month boundary')
assert.equal(
  fullyPlayed([[18, 20]], 20),
  false,
  'jumping to the end must not complete playback',
)
assert.equal(
  fullyPlayed(
    [
      [0, 8],
      [15, 20],
    ],
    20,
  ),
  false,
  'seek gap must not complete playback',
)
assert.equal(
  fullyPlayed(
    [
      [0, 8],
      [8, 20],
    ],
    20,
  ),
  true,
  'pause and resume continuously should complete playback',
)
assert.equal(fullyPlayed([[0, 20]], NaN), false)
assert.deepEqual(
  mergeRanges([
    [5, 8],
    [0, 6],
    [10, 12],
  ]),
  [
    [0, 8],
    [10, 12],
  ],
)
const evidence = {
  playCount: 1,
  completedPlayback: true,
  transcriptBeforeSubmit: false,
  seekedBeforeSubmit: false,
}
assert.equal(independentPlayback(evidence), true)
assert.equal(independentPlayback({ ...evidence, playCount: 2 }), false)
assert.equal(
  independentPlayback({ ...evidence, seekedBeforeSubmit: true }),
  false,
)
assert.equal(
  independentPlayback({ ...evidence, transcriptBeforeSubmit: true }),
  false,
)
const now = new Date('2026-10-07T12:00:00+08:00').getTime()
const previous = new Date(now - 86400000).toISOString()
const current = new Date(now).toISOString()
const event = (id: string, date: string): ReviewEvent => ({
  id: crypto.randomUUID(),
  cardId: id,
  reviewedAt: date,
  rating: 3,
  log: {} as ReviewEvent['log'],
})
assert.equal(
  introducedOn(
    [event('kana-01', previous), event('kana-01', current)],
    localDate(new Date(now)),
  ).size,
  0,
  'repeat of an old card must not consume new-card quota',
)
const overdue: CardProgress = {
  id: courseUnits[1].cardIds[0],
  card: createEmptyCard(new Date(previous)),
  dueAt: previous,
  updatedAt: previous,
}
const queue = reviewQueue([overdue], now, courseUnits[0].id, null)
assert.equal(
  queue[0].id,
  overdue.id,
  'due cards from another unit must still be reviewed',
)
assert.ok(queue.slice(1).some((c) => c.unitId !== courseUnits[0].id))
assert.equal(queue.length, cards.length)
assert.equal(
  reviewQueue([overdue], now, courseUnits[0].id, null).length,
  cards.length,
  'learning queue exposes all available cards without a daily quota',
)
const a = (materialId: string): Attempt => ({
  id: materialId,
  materialId,
  kind: materialId.includes('reading') ? 'reading' : 'listening',
  answers: [-2],
  correct: 0,
  total: 1,
  completedAt: current,
})
assert.equal(
  unitPracticed(courseUnits[0].id, [a(courseUnits[0].readingId)]),
  false,
)
assert.equal(
  unitPracticed(courseUnits[0].id, [
    a(courseUnits[0].readingId),
    a(courseUnits[0].listeningId),
  ]),
  true,
)
assert.notEqual(
  backupFilename('backup', new Date(now)),
  backupFilename('backup', new Date(now + 1)),
  'separate exports must not share a daily-only filename',
)
console.log(
  'Learning checks passed: playback coverage and seek gaps, pause/resume, assisted results, first introduction, cross-unit due reviews, course coverage',
)
assert.equal(boundedNumber(NaN, 30, 10, 300), 30)
assert.equal(boundedNumber(-1, 6, 0, 20), 0)
assert.equal(boundedNumber(500, 30, 10, 300), 300)
assert.equal(boundedNumber('invalid', 6, 0, 20), 6)
const hard = { ...event('kana-01', previous), rating: 2 as const }
const recovered = { ...event('kana-01', current), rating: 3 as const }
assert.ok(difficultCardIds([hard]).has('kana-01'))
assert.ok(
  !difficultCardIds([recovered, hard]).has('kana-01'),
  'later recall success removes a card from recent difficulties regardless of event array order',
)
assert.ok(
  difficultCardIds([
    recovered,
    { ...event('kana-02', current), rating: 1 as const },
  ]).has('kana-02'),
)
const batch = reviewRound([cards[0], cards[0], ...cards.slice(1)], 5)
assert.equal(batch.length, 5)
assert.equal(
  new Set(batch).size,
  5,
  'a review round must not repeat the same card',
)
assert.equal(reviewRound([], 10).length, 0)
assert.equal(reviewRound(cards, NaN).length, 20)
console.log(
  'v0.3 checks passed: bounded preferences, latest difficult feedback, recovery, distinct finite review rounds',
)
const passage = readings[0]
const missed: Attempt = { id: 'old', materialId: passage.id, kind: 'reading', answers: passage.questions.map(()=>-2), correct: 0, total: passage.questions.length, completedAt: previous, readingHelp: true }
const fixed: Attempt = { ...missed, id: 'new', completedAt: current, answers: passage.questions.map(q=>q.answer), correct: passage.questions.length, readingHelp: false }
assert.equal(latestMistakes([missed]).items.length, passage.questions.length)
assert.equal(latestMistakes([fixed,missed]).items.length, 0, 'latest correct attempt removes old errors even when input is unordered')
assert.equal(latestMistakes([{...missed, materialId:'removed-material'}]).unavailable, 1)
assert.equal(latestMistakes([{...missed, answers: [-1]}]).items.length, 0, 'unsubmitted or mismatched history cannot become a wrong question')
assert.equal(practiceEvidence(missed,[missed]), '阅读，使用过振假名')
assert.equal(practiceEvidence({...missed, readingHelp: undefined},[missed]), '阅读，辅助状态未记录')
const human: Attempt = { ...missed, id:'human-first', kind:'listening', materialId:listeningSources[0].id, listening:{...evidence,sourceKind:'human'} }
const replay: Attempt = {...human, id:'human-repeat', completedAt:current}
assert.equal(practiceEvidence(human,[replay,human]), '听力，真人独立首遍')
assert.equal(practiceEvidence(replay,[replay,human]), '听力，真人独立重练')
assert.equal(practiceEvidence({...human,listening:{...human.listening!,sourceKind:'synthetic'}},[human]), '听力，合成语音练习')
assert.equal(practiceEvidence({...human, materialId:'unknown-clip', listening:{...human.listening!,sourceKind:undefined}},[human]), '听力，来源类型未记录', 'unknown historic audio must not be guessed to be a human recording')
assert.equal(activeDelta(0,10000,0,true),10000)
assert.equal(activeDelta(10000,120000,0,true),50000,'long idle or suspension stops at last input plus 60 seconds')
assert.equal(activeDelta(120000,130000,0,true),0)
assert.equal(activeDelta(0,10000,0,false),0,'background and manual pause add no time')
assert.equal(activeDelta(5000,1000,0,true),0,'clock anomalies never subtract duration')
assert.deepEqual(splitAtMidnight(5000,3000,0),[2000,3000], 'foreground interval crossing midnight splits between the two days')
assert.deepEqual(splitAtMidnight(60000,-3600000,0),[60000,0], 'idle time measured before sleep remains on the previous day after a midnight wake')
const time = {day:localDate(new Date(now)),view:'reading',startedAt:previous,updatedAt:current,activeMs:12345,status:'ended'}
assert.equal(parseStudyTime(JSON.stringify(time))?.activeMs,12345)
for (const invalid of [{...time,activeMs:-1},{...time,day:'2026-02-30'},{...time,status:'bad'}, {...time,updatedAt:'bad'}]) assert.equal(parseStudyTime(JSON.stringify(invalid)),null)
console.log('v0.4 checks passed: latest mistakes, evidence boundaries, unknown materials, monotonic foreground time, idle cutoff and invalid timer records')
