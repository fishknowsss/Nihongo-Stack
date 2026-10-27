import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Rating, type Grade } from 'ts-fsrs'
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { BookOpen } from '@phosphor-icons/react/dist/csr/BookOpen'
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank'
import { Cards } from '@phosphor-icons/react/dist/csr/Cards'
import { Stack } from '@phosphor-icons/react/dist/csr/Stack'
import { ChartBar } from '@phosphor-icons/react/dist/csr/ChartBar'
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple'
import { Gear } from '@phosphor-icons/react/dist/csr/Gear'
import { Headphones } from '@phosphor-icons/react/dist/csr/Headphones'
import { Info } from '@phosphor-icons/react/dist/csr/Info'
import { SpeakerHigh } from '@phosphor-icons/react/dist/csr/SpeakerHigh'
import { Play } from '@phosphor-icons/react/dist/csr/Play'
import { Pause } from '@phosphor-icons/react/dist/csr/Pause'
import { Rewind } from '@phosphor-icons/react/dist/csr/Rewind'
import { FastForward } from '@phosphor-icons/react/dist/csr/FastForward'
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { GraduationCap } from '@phosphor-icons/react/dist/csr/GraduationCap'
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown'
import {
  baselineQuestions,
  cards,
  listenings,
  readings,
  courseUnits,
  materialTitle,
  type ChoiceQuestion,
  type Listening,
  type Reading,
  type CourseUnit,
} from './content'
import {
  createBackup,
  db,
  gradeCard,
  inspectBackup,
  recordAttempt,
  restoreBackup,
  setPreference,
  type Attempt,
  type CardProgress,
  type ReviewEvent,
  type Preference,
} from './db'
import {
  localDate,
  backupFilename,
  unitPracticed,
  reviewQueue,
  independentPlayback,
  mergeRanges,
  fullyPlayed,
  boundedNumber,
  reviewRound,
} from './learning'
import { flushDrafts, persistDraft, usePractice } from './drafts'
import CardLibrary from './CardLibrary'
import MistakeReview from './MistakeReview'
import UnitGuide from './UnitGuide'
import WeeklyReport from './WeeklyReport'
import AnnotationControl, { AnnotationNote, type Annotation } from './AnnotationControl'
import StudyLayerControl from './StudyLayerControl'
import LayeredJapanese from './LayeredJapanese'
import { isStudyLayer, type StudyLayer } from './language'
import SelectionExplainer from './SelectionExplainer'
import SelectionNotes from './SelectionNotes'
import JLPTPage from './JLPTPage'
import { jlptFullExamSlotCount, jlptPracticeSetCount } from './jlpt-index'
import { practiceEvidence } from './mistakes'
import { formatStudyTime, useStudyTime } from './activity'
import { DEFAULT_JLPT_EXAM_DATE } from './studyPlan'
import { version as appVersion } from '../package.json'

type View =
  | 'today'
  | 'course'
  | 'review'
  | 'materials'
  | 'jlpt'
  | 'progress'
  | 'settings'
  | 'baseline'
type MaterialMode = 'cards' | 'reading' | 'listening'
type Notify = (text: string, kind?: 'success' | 'error') => void
type JLPTCountdown = { days: number; hours: number; totalHours: number }
const navigation = [
  { id: 'today' as const, label: '首页', icon: CalendarBlank },
  { id: 'course' as const, label: '课程', icon: BookOpen },
  { id: 'review' as const, label: '复习', icon: Cards },
  { id: 'materials' as const, label: '资料', icon: Stack },
  { id: 'jlpt' as const, label: 'JLPT', icon: GraduationCap },
  { id: 'progress' as const, label: '进度', icon: ChartBar },
]
const navigationGroups = [
  { label: '学习', items: navigation.slice(0, 3) },
  { label: '资料', items: navigation.slice(3, 4) },
  { label: '记录', items: navigation.slice(4) },
]
function score(questions: ChoiceQuestion[], answers: number[]) {
  return questions.reduce(
    (total, q, i) => total + Number(q.answer === answers[i]),
    0,
  )
}
function sectionLabel(kind: string) {
  return kind === 'kana' ? '假名' : kind === 'grammar' ? '语法' : '词汇'
}
function pref(
  preferences: Preference[],
  key: string,
  fallback: Preference['value'],
) {
  return preferences.find((x) => x.key === key)?.value ?? fallback
}
function importedCompleteJLPTCount(preferences: Preference[]): number {
  return preferences.filter((row) => row.key.startsWith('jlptImportedPack:') && typeof row.value === 'string').reduce((count, row) => {
    try { return count + (JSON.parse(row.value as string).complete === true ? 1 : 0) } catch { return count }
  }, 0)
}
function jlptCountdown(now: number, date: string): JLPTCountdown {
  const target = Date.parse(`${date}T00:00:00`)
  const remaining = Number.isFinite(target) ? Math.max(0, target - now) : 0
  const totalHours = Math.floor(remaining / 3_600_000)
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
    totalHours,
  }
}
function useClock() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const timer = window.setInterval(refresh, 15000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return now
}
function App() {
  const [view, setView] = useState<View>('today')
  const [materialMode, setMaterialMode] = useState<MaterialMode>('reading')
  const [readingTarget, setReadingTarget] = useState<string | null>(null)
  const [listeningTarget, setListeningTarget] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    text: string
    kind: 'success' | 'error'
  } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const mainRef = useRef<HTMLElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const mounted = useRef(false)
  const now = useClock()
  const progressQuery = useLiveQuery(() => db.progress.toArray(), [])
  const attemptsQuery = useLiveQuery(() => db.attempts.toArray(), [])
  const eventsQuery = useLiveQuery(() => db.reviewEvents.toArray(), [])
  const preferencesQuery = useLiveQuery(() => db.preferences.toArray(), [])
  const progress = progressQuery ?? []
  const attempts = attemptsQuery ?? []
  const events = eventsQuery ?? []
  const preferences = preferencesQuery ?? []
  const ready =
    !!progressQuery && !!attemptsQuery && !!eventsQuery && !!preferencesQuery
  const today = localDate(new Date(now))
  const minutes = boundedNumber(
    pref(
      preferences,
      `todayMinutes:${today}`,
      pref(preferences, 'todayMinutes', 30),
    ),
    30,
    10,
    300,
  )
  const unit =
    courseUnits.find(
      (x) => x.id === pref(preferences, 'activeUnit', courseUnits[0].id),
    ) ?? courseUnits[0]
  const due = progress.filter(
    (x) =>
      cards.some((c) => c.id === x.id) && new Date(x.dueAt).getTime() <= now,
  )
  const reading = readings.find((x) => x.id === unit.readingId)!
  const listening = listenings.find((x) => x.id === unit.listeningId)!
  const newCardsAvailable = cards.filter((card) => !progress.some((row) => row.id === card.id)).length
  const jlptExamDate = String(pref(preferences, 'jlptExamDate', DEFAULT_JLPT_EXAM_DATE))
  const countdown = jlptCountdown(now, jlptExamDate)
  const baseline = [...attempts]
    .filter((x) => x.kind === 'baseline')
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0]
  const weakGroups = [
    { kind: 'kana' as const, label: '假名音形', indexes: [0, 1] },
    { kind: 'vocabulary' as const, label: '词汇读音', indexes: [2] },
    { kind: 'grammar' as const, label: '基础句法', indexes: [3, 4] },
  ]
    .map((g) => ({
      ...g,
      misses: g.indexes.filter(
        (i) => baseline && baseline.answers[i] !== baselineQuestions[i].answer,
      ).length,
    }))
    .sort((a, b) => b.misses - a.misses)
  const focus = weakGroups[0]?.misses ? weakGroups[0] : null
  const queue = reviewQueue(progress, now, unit.id, focus?.kind ?? null)
  const todayEvents = events.filter(
    (x) => localDate(new Date(x.reviewedAt)) === today,
  )
  const todayAttempts = attempts.filter(
    (x) => localDate(new Date(x.completedAt)) === today,
  )
  const onNotify: Notify = (text, kind = 'success') => {
    window.clearTimeout(toastTimer.current)
    setToast({ text, kind })
    toastTimer.current = window.setTimeout(
      () => setToast(null),
      kind === 'error' ? 8000 : 4500,
    )
  }
  const studyView = view === 'materials' ? materialMode : view
  const studyTime = useStudyTime(studyView, ready, onNotify)
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])
  useEffect(() => {
    if (!ready) return
    if (mounted.current) {
      mainRef.current?.scrollTo(0, 0)
      mainRef.current?.focus({ preventScroll: true })
    } else {
      mounted.current = true
      mainRef.current?.focus({ preventScroll: true })
    }
  }, [ready, view])
  useEffect(() => {
    const nav = navRef.current
    if (!nav || !window.matchMedia('(max-width: 760px)').matches) return
    const active = nav.querySelector<HTMLElement>('.nav-item[aria-current="page"]')
    if (!active) return
    const frame = window.requestAnimationFrame(() => {
      const navRect = nav.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      const padding = 8
      let left = nav.scrollLeft
      if (activeRect.left < navRect.left + padding) {
        left += activeRect.left - navRect.left - padding
      } else if (activeRect.right > navRect.right - padding) {
        left += activeRect.right - navRect.right + padding
      } else {
        return
      }
      nav.scrollTo({
        left: Math.max(0, left),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [view])
  async function selectUnit(id: string) {
    try {
      await setPreference('activeUnit', id)
    } catch {
      onNotify('单元选择保存失败，请重试。', 'error')
    }
  }
  function openMaterial(kind: 'reading' | 'listening', id: string) {
    if (kind === 'reading') setReadingTarget(id)
    else setListeningTarget(id)
    setMaterialMode(kind)
    void setPreference(
      kind === 'reading' ? 'activeReading' : 'activeListening',
      id,
    ).catch(() => onNotify('材料位置未保存，请重试。', 'error'))
    setView('materials')
    mainRef.current?.scrollTo(0, 0)
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到学习内容
      </a>
      <aside className="sidebar" aria-label="学习导航">
        <div className="brand">
          <img
            className="brand-icon"
            src="/app-icon-128.png"
            alt=""
            width={48}
            height={48}
          />
          <span className="brand-name">
            Nihongo <strong>Stack</strong>
            <small>本地日语学习</small>
          </span>
        </div>
        <nav className="side-nav" aria-label="主导航" ref={navRef}>
          {navigationGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`nav-item ${view === id ? 'active' : ''}`}
                  aria-current={view === id ? 'page' : undefined}
                  onClick={() => {
                    setReadingTarget(null)
                    setListeningTarget(null)
                    setView(id)
                  }}
                >
                  <Icon size={20} weight={view === id ? 'fill' : 'regular'} />
                  <span>{label}</span>
                  {id === 'review' && due.length > 0 && (
                    <small className="nav-count">{due.length}</small>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {studyTime.session && (
            <StudyTimerDock
              session={studyTime.session}
              onPause={studyTime.pause}
              onResume={studyTime.resume}
              onFinish={studyTime.finish}
            />
          )}
          <button
            className={`nav-item ${view === 'settings' ? 'active' : ''}`}
            aria-current={view === 'settings' ? 'page' : undefined}
            onClick={() => setView('settings')}
          >
            <Gear size={20} />
            <span>设置</span>
          </button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span className="breadcrumb">
            Nihongo Stack <span>/</span>{' '}
            {view === 'baseline'
              ? '起点小测'
              : view === 'settings'
                ? '设置与备份'
                : navigation.find((x) => x.id === view)?.label}
          </span>
          <div className="topbar-right">
            <span className="top-date">
              {new Intl.DateTimeFormat('zh-CN', {
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })
                .format(new Date(now))
                .replace(/(星期[一二三四五六日])$/, '，$1')}
            </span>
            <button className="topbar-action" aria-label="打开设置与备份" onClick={() => setView('settings')}>
              设置
            </button>
          </div>
        </header>
        <main
          className={`main-content ${view === 'today' ? 'main-content-today' : ''}`}
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
        >
          {!ready ? (
            <div className="quiet-empty" role="status">
              正在读取本机学习记录…
            </div>
          ) : (
            <>
              {view === 'today' && (
                <TodayPage
                  {...{
                    unit,
                    reading,
                    listening,
                    minutes,
                    due,
                    queue,
                    newCardsAvailable,
                    jlptExamDate,
                    countdown,
                    today,
                    todayEvents,
                    todayAttempts,
                    preferences,
                    baseline,
                    focusLabel: focus?.label ?? null,
                    onNotify,
                    setView,
                    openMaterial,
                  }}
                />
              )}
              {view === 'course' && (
                <CoursePage
                  unit={unit}
                  attempts={attempts}
                  progress={progress}
                  preferences={preferences}
                  onSelect={(id) => void selectUnit(id)}
                  openMaterial={openMaterial}
                  onNotify={onNotify}
                />
              )}
              {view === 'review' && (
                <ReviewPage
                  queue={queue}
                  progress={progress}
                  onNotify={onNotify}
                  onNext={() => openMaterial('reading', reading.id)}
                  roundSize={boundedNumber(
                    pref(preferences, 'reviewRoundSize', 20),
                    20,
                    0,
                    100,
                  )}
                />
              )}
              {view === 'materials' && (
                <MaterialsPage
                  mode={materialMode}
                  onModeChange={setMaterialMode}
                  progress={progress}
                  events={events}
                  preferences={preferences}
                  now={now}
                  attempts={attempts}
                  readingId={readingTarget ?? String(pref(preferences, 'activeReading', reading.id))}
                  listeningId={listeningTarget ?? String(pref(preferences, 'activeListening', listening.id))}
                  onNotify={onNotify}
                  onReview={() => setView('review')}
                />
              )}
              {view === 'jlpt' && <JLPTPage onNotify={onNotify} />}
              {view === 'progress' && (
                <ProgressPage
                  {...{ progress, attempts, events, preferences, now }}
                  openMaterial={openMaterial}
                  onNotify={onNotify}
                  onStart={() => setView('today')}
                />
              )}
              {view === 'settings' && (
                <SettingsPage preferences={preferences} onNotify={onNotify} />
              )}
              {view === 'baseline' && (
                <BaselinePage
                  onNotify={onNotify}
                  onBack={() => setView('today')}
                />
              )}
            </>
          )}
        </main>
      </div>
      {toast && (
        <div
          className={`toast ${toast.kind}`}
          role={toast.kind === 'error' ? 'alert' : 'status'}
        >
          <Info size={18} />
          {toast.text}
          <button aria-label="关闭提示" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
      <SelectionExplainer onNotify={onNotify} />
    </div>
  )
}

function StudyTimerDock({
  session,
  onPause,
  onResume,
  onFinish,
}: {
  session: ReturnType<typeof useStudyTime>['session']
  onPause: () => void
  onResume: () => void
  onFinish: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  if (!session) return null
  const canResume = session.status === 'paused' || session.status === 'ended'
  const status = session.status === 'paused'
    ? '已暂停'
    : session.status === 'ended'
      ? '本次计时已结束'
      : session.status === 'background'
        ? '后台不计时'
        : session.status === 'idle'
          ? '已闲置，操作后继续'
          : '60 秒无操作后自动暂停'
  return (
    <div className={`study-timer-dock ${expanded ? 'expanded' : ''}`}>
      <button
        className="study-timer-toggle"
        aria-expanded={expanded}
        aria-controls="study-timer-controls"
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="study-timer-pulse" aria-hidden="true" />
        <span className="study-timer-summary">
          <strong>{formatStudyTime(session.activeMs)}</strong>
          <small>本次学习</small>
        </span>
        <CaretDown size={16} weight="bold" />
      </button>
      {expanded && (
        <div className="study-timer-controls" id="study-timer-controls">
          <span>{status}</span>
          <div className="button-row">
            <button className="text-button" onClick={canResume ? onResume : onPause}>
              {canResume ? '继续计时' : '暂停计时'}
            </button>
            <button className="text-button" disabled={session.status === 'ended'} onClick={onFinish}>
              结束计时
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MaterialsPage({
  mode,
  onModeChange,
  progress,
  events,
  preferences,
  now,
  attempts,
  readingId,
  listeningId,
  onNotify,
  onReview,
}: {
  mode: MaterialMode
  onModeChange: (mode: MaterialMode) => void
  progress: CardProgress[]
  events: ReviewEvent[]
  preferences: Preference[]
  now: number
  attempts: Attempt[]
  readingId: string
  listeningId: string
  onNotify: Notify
  onReview: () => void
}) {
  return (
    <div className="materials-page">
      <div className="materials-switcher" role="tablist" aria-label="学习资料类型">
        {([
          ['cards', '卡片'],
          ['reading', '阅读'],
          ['listening', '听力'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={mode === id}
            className={mode === id ? 'active' : ''}
            onClick={() => onModeChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'cards' && (
        <CardLibrary
          {...{ progress, events, preferences, now, onNotify }}
          onReview={onReview}
        />
      )}
      {mode === 'reading' && (
        <ReadingPage initialId={readingId} attempts={attempts} onNotify={onNotify} />
      )}
      {mode === 'listening' && (
        <ListeningPage initialId={listeningId} attempts={attempts} onNotify={onNotify} />
      )}
    </div>
  )
}

type TodayProps = {
  unit: CourseUnit
  reading: Reading
  listening: Listening
  minutes: number
  due: CardProgress[]
  queue: ReturnType<typeof reviewQueue>
  newCardsAvailable: number
  jlptExamDate: string
  countdown: JLPTCountdown
  today: string
  todayEvents: ReviewEvent[]
  todayAttempts: Attempt[]
  preferences: Preference[]
  baseline?: Attempt
  focusLabel: string | null
  onNotify: Notify
  setView: (v: View) => void
  openMaterial: (kind: 'reading' | 'listening', id: string) => void
}
function TodayPage({
  unit,
  reading,
  listening,
  minutes,
  due,
  queue,
  newCardsAvailable,
  jlptExamDate,
  countdown,
  today,
  todayAttempts,
  preferences,
  baseline,
  focusLabel,
  onNotify,
  setView,
  openMaterial,
}: TodayProps) {
  const [quickIndex, setQuickIndex] = useState(() => Math.floor(Math.random() * cards.length))
  const [quickRevealed, setQuickRevealed] = useState(false)
  const quickCard = cards[quickIndex % cards.length]
  const reviewDone = queue.length === 0
  const readingDone = todayAttempts.some((x) => x.materialId === reading.id)
  const listeningDone = todayAttempts.some((x) => x.materialId === listening.id)
  const tasks = [
    {
      id: 'review',
      title: '复习与新卡',
      detail: due.length
        ? `${due.length} 张到期卡优先，再练当前单元`
        : '建立当前单元的词汇与句法记忆',
      minutes:
        Math.ceil(due.length * 0.75) +
        Math.max(0, queue.length - due.length) * 2,
      done: reviewDone,
      action: () => setView('review'),
      icon: Cards,
    },
    {
      id: 'reading',
      title: `阅读：${reading.title}`,
      detail: `${reading.questions.length} 道理解题，提交后查看译文与解析`,
      minutes: reading.minutes,
      done: readingDone,
      action: () => openMaterial('reading', reading.id),
      icon: BookOpen,
    },
    {
      id: 'listening',
      title: `听力：${unit.title}`,
      detail: `${listening.questions.length} 道理解题，合成语音基础练习`,
      minutes: listening.minutes ?? 5,
      done: listeningDone,
      action: () => openMaterial('listening', listening.id),
      icon: Headphones,
    },
  ].map((x) => ({
    ...x,
    state: String(pref(preferences, `task:${today}:${x.id}`, 'active')),
  }))
  const active = tasks.filter((x) => !x.done)
  const doneCount = tasks.filter((x) => x.done).length
  const next = active[0]
  return (
    <div className="today-page">
      <section className="today-overview today-single-overview" aria-label="今日学习概览">
        <div className="today-overview-heading">
          <div>
            <span className="today-date">{today.replaceAll('-', '.')}</span>
            <h1>今日学习</h1>
            <p className="today-current">
              <span>当前单元：{unit.title}</span>
              <span lang="ja">{['はじめまして','一日の時間','場所と交通','買い物','一緒に行きませんか','天気と予定','一週間のふり返り'][unit.order - 1]}</span>
            </p>
          </div>
          <div className="today-overview-actions">
            {!baseline && <button className="text-button" onClick={() => setView('baseline')}>起点小测</button>}
            <button className="outline-button" onClick={() => setView('jlpt')}>JLPT</button>
          </div>
        </div>
        <div className="jlpt-countdown" aria-label="JLPT N2 倒计时">
          <span>N2 目标倒计时</span>
          <strong>{countdown.days}<small>天</small> {countdown.hours}<small>小时</small></strong>
          <span>目标 {jlptExamDate.replaceAll('-', '.')}</span>
        </div>
        <div className="today-metrics" aria-label="当前学习数据">
          <div><strong>{doneCount}</strong><span>今日完成</span></div>
          <div><strong>{minutes}<small> 分钟</small></strong><span>建议时长</span></div>
          <div><strong>{due.length}</strong><span>到期卡</span></div>
          <div><strong>{newCardsAvailable}</strong><span>待学新卡</span></div>
        </div>
        <div className="today-overview-bar" role="progressbar" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={doneCount} aria-label="今日完成进度">
          <span style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
        </div>
      </section>
      <div className="today-single-grid">
        <section className="unit-focus" aria-label="当前学习单元">
          <div className="unit-focus-top">
            <button className="text-button" onClick={() => setView('course')}>
              课程目录
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="unit-focus-title">
            <span className="unit-focus-number">
              {String(unit.order).padStart(2, '0')}
            </span>
            <div>
              <h2>{unit.title}</h2>
              <p className="unit-japanese" lang="ja">
                {
                  [
                    'はじめまして',
                    '一日の時間',
                    '場所と交通',
                    '買い物',
                    '一緒に行きませんか',
                    '天気と予定',
                    '一週間のふり返り',
                  ][unit.order - 1]
                }
              </p>
            </div>
          </div>
          <p className="unit-focus-goal">{unit.goal}</p>
          <div className="unit-focus-action">
            <div>
              <strong>
                {next
                  ? next.id === 'review'
                    ? '下一步：复习与新卡'
                    : next.id === 'reading'
                      ? '下一步：阅读材料'
                      : '下一步：听力理解'
                  : doneCount === tasks.length
                    ? '当前单元的今日任务已完成'
                    : '今日任务已暂停'}
              </strong>
              <span>
                {next
                  ? next.id === 'review'
                    ? due.length
                      ? `${due.length} 张到期卡优先`
                      : `当前还有 ${newCardsAvailable} 张新卡可学`
                    : `约 ${next.minutes} 分钟，${next.detail}`
                  : '今天已完成，也可以继续学习其他材料。'}
              </span>
            </div>
            <button
              className="primary-button"
              onClick={next?.action ?? (() => setView('course'))}
            >
              {next
                ? next.id === 'review'
                  ? '开始复习'
                  : next.id === 'reading'
                    ? '开始阅读'
                    : '开始听力'
                : '选择单元'}
              <ArrowRight size={18} />
            </button>
          </div>
          <UnitGuide unit={unit} onNotify={onNotify} />
          <div className="today-action-list" aria-label="学习入口">
            {tasks.map((task) => {
              const Icon = task.icon
              return (
                <button key={task.id} className="today-action" onClick={task.action}>
                  <Icon size={19} />
                  <span><strong>{task.title}</strong><small>{task.done ? '今天已完成，可继续重练' : task.detail}</small></span>
                  <ArrowRight size={16} />
                </button>
              )
            })}
          </div>
        </section>
        <div className="today-learning-grid">
        <section className="quick-learn" aria-labelledby="quick-learn-title">
        <div className="quick-learn-heading">
          <div>
            <h2 id="quick-learn-title">随手学一题</h2>
            <p>用一张卡复习词汇、语法或假名，想换内容就换一条。</p>
          </div>
          <button
            className="outline-button"
            onClick={() => {
              setQuickIndex((value) => (value + 1) % cards.length)
              setQuickRevealed(false)
            }}
          >
            换一条
            <ArrowRight size={16} />
          </button>
        </div>
        <button
          className={`quick-learn-card ${quickRevealed ? 'revealed' : ''}`}
          onClick={() => setQuickRevealed((value) => !value)}
          aria-label={quickRevealed ? '收起随手学习答案' : '查看随手学习答案'}
        >
          <span className="quick-learn-kind">{sectionLabel(quickCard.kind)}</span>
          <span className="quick-learn-front" lang="ja">{quickCard.front}</span>
          {quickRevealed ? (
            <span className="quick-learn-answer">
              <strong>{quickCard.back}</strong>
              <span lang="ja">{quickCard.example}</span>
            </span>
          ) : (
            <span className="quick-learn-hint">点击查看读音、释义和例句</span>
          )}
        </button>
        </section>
        <section className="today-explanation" aria-labelledby="today-explanation-title">
          <div className="quick-learn-heading">
            <div>
              <h2 id="today-explanation-title">今日详解</h2>
              <p>{reading.title}，直接阅读译文和理解重点。</p>
            </div>
            <button className="text-button" onClick={() => openMaterial('reading', reading.id)}>进入阅读 <ArrowRight size={15} /></button>
          </div>
          <p className="today-explanation-japanese" lang="ja">{reading.segments.map((segment) => segment.text).join('')}</p>
          <p className="today-explanation-translation">{reading.translation}</p>
          <div className="today-explanation-focus">
            {reading.focus.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
          </div>
          {focusLabel && <p className="field-hint"><Info size={15} /> 起点小测建议先巩固：{focusLabel}</p>}
        </section>
        </div>
      </div>
      <p className="today-single-footnote">今日建议时长只用于安排节奏；复习、阅读、听力和 JLPT 都可以继续学习，没有每日学习上限。</p>
    </div>
  )
}
function CoursePage({
  unit,
  attempts,
  progress,
  preferences,
  onSelect,
  openMaterial,
  onNotify,
}: {
  unit: CourseUnit
  attempts: Attempt[]
  progress: CardProgress[]
  preferences: Preference[]
  onSelect: (id: string) => void
  openMaterial: TodayProps['openMaterial']
  onNotify: Notify
}) {
  const completed = courseUnits.filter((x) =>
    unitPracticed(x.id, attempts),
  ).length
  return (
    <div className="page-stack">
      <div className="course-summary">
        <span>
          <strong>{completed} / 7</strong> 单元已练阅读与听力
        </span>
        <span>每单元 6 张卡，1 篇阅读材料，1 段听力音频</span>
      </div>
      <ol className="course-list">
        {courseUnits.map((item) => {
          const practiced = unitPracticed(item.id, attempts)
          const introduced = item.cardIds.filter((id) =>
            progress.some((p) => p.id === id),
          ).length
          const reflection =
            pref(preferences, `reflection:${item.id}`, false) === true
          return (
            <li
              key={item.id}
              className={item.id === unit.id ? 'current-unit' : ''}
            >
              <div className="unit-order">
                {String(item.order).padStart(2, '0')}
              </div>
              <div className="unit-body">
                <div className="unit-title">
                  <h2>{item.title}</h2>
                  <span>
                    {item.id === unit.id
                      ? '正在学习'
                      : practiced
                        ? '已练阅读与听力'
                        : '未开始'}
                  </span>
                </div>
                <p>{item.goal}</p>
                <div className="unit-meta">
                  <span>新卡 {introduced} / 6</span>
                  <span>
                    {attempts.some((x) => x.materialId === item.readingId)
                      ? '阅读已练'
                      : '阅读未练'}
                  </span>
                  <span>
                    {attempts.some((x) => x.materialId === item.listeningId)
                      ? '听力已练'
                      : '听力未练'}
                  </span>
                  <span>
                    {item.order === 1
                      ? '起点：能认读基础假名'
                      : `建议先练：${courseUnits[item.order - 2].title}`}
                  </span>
                </div>
                <div className="unit-actions">
                  <button
                    className={
                      item.id === unit.id ? 'primary-button' : 'outline-button'
                    }
                    onClick={() => onSelect(item.id)}
                  >
                    {item.id === unit.id ? '继续本单元' : '设为当前单元'}
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => openMaterial('reading', item.readingId)}
                  >
                    阅读
                  </button>
                  <button
                    className="text-button"
                    onClick={() => openMaterial('listening', item.listeningId)}
                  >
                    听力
                  </button>
                </div>
                <UnitGuide unit={item} onNotify={onNotify} />
                {practiced && (
                  <label className="reflection">
                    <input
                      type="checkbox"
                      checked={reflection}
                      onChange={(e) =>
                        void setPreference(
                          `reflection:${item.id}`,
                          e.target.checked,
                        ).catch(() =>
                          onNotify('复盘标记未保存，请重试。', 'error'),
                        )
                      }
                    />
                    <span>我做了复盘：{item.reflection}</span>
                  </label>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
function ReviewPage({
  queue,
  progress,
  onNotify,
  onNext,
  roundSize,
}: {
  queue: ReturnType<typeof reviewQueue>
  progress: CardProgress[]
  onNotify: Notify
  onNext: () => void
  roundSize: number
}) {
  const [revealed, setRevealed] = useState(false)
  const [count, setCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const cardRef = useRef<HTMLElement>(null)
  const [roundIds, setRoundIds] = useState(() => reviewRound(queue, roundSize))
  const [finished, setFinished] = useState<string[]>([])
  const current = queue.find(
    (card) => roundIds.includes(card.id) && !finished.includes(card.id),
  )
  useEffect(() => {
    setRevealed(false)
    cardRef.current?.focus({ preventScroll: true })
    cardRef.current?.scrollIntoView({ block: 'nearest' })
  }, [current?.id])
  async function grade(rating: Grade) {
    if (!current || lock.current) return
    lock.current = true
    setBusy(true)
    try {
      await gradeCard(current.id, rating)
      setFinished((ids) => [...ids, current.id])
      setCount((x) => x + 1)
      setRevealed(false)
    } catch {
      onNotify('复习反馈未保存，请重试。', 'error')
    } finally {
      setBusy(false)
      lock.current = false
    }
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (
        !current ||
        busy ||
        event.isComposing ||
        event.keyCode === 229 ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        (target instanceof HTMLElement &&
          target.closest(
            'button, input, select, textarea, audio, a, [contenteditable="true"]',
          ))
      )
        return
      if (event.code === 'Space' && !revealed) {
        event.preventDefault()
        setRevealed(true)
      } else if (revealed && ['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault()
        void grade(Number(event.key) as Grade)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })
  function nextRound() {
    setRoundIds(reviewRound(queue, roundSize))
    setFinished([])
    setCount(0)
  }
  return (
    <div className="page-stack focus-page">
      <div className="review-meta">
        <span>
          本轮最多 {roundIds.length} 张，当前待练 {queue.length} 张
        </span>
        <span>本轮反馈 {count} 次</span>
      </div>
      <div className="review-progress-panel" aria-label="复习进度">
        <div className="review-progress-track"><span style={{ width: `${roundIds.length ? Math.min(100, (count / roundIds.length) * 100) : 100}%` }} /></div>
        <div className="review-progress-stats"><span><strong>{count}</strong> / {roundIds.length} 本轮</span><span>{queue.length} 张仍待练</span><span>{progress.length} 张已进入排程</span></div>
      </div>
      {current && (
        <p className="shortcut-hint">
          空格查看答案。1 再来一次；2 有点困难；3 记得；4 很熟悉
        </p>
      )}
      {current ? (
        <article
          className="flashcard"
          ref={cardRef}
          tabIndex={-1}
          aria-label="当前复习卡片"
        >
          <div className="flashcard-top">
            <span>{sectionLabel(current.kind)}</span>
            <span>
              {progress.some((x) => x.id === current.id) ? '到期复习' : '新卡'}
            </span>
          </div>
          <div className="flashcard-face">
            <p>这个表达的读音和含义是什么？</p>
            <div className="flashcard-word" lang="ja">
              {current.front}
            </div>
            {!revealed && (
              <button
                className="primary-button"
                aria-keyshortcuts="Space"
                onClick={() => setRevealed(true)}
              >
                查看答案
                <ArrowRight size={17} />
              </button>
            )}
          </div>
          {revealed && (
            <div className="flashcard-answer">
              {current.reading && (
                <p className="answer-reading" lang="ja">
                  {current.reading}
                </p>
              )}
              <h2>{current.back}</h2>
              <p lang="ja" className="example-sentence">
                {current.example}
              </p>
              {current.note && <p>{current.note}</p>}
              <p className="field-hint">刚才回忆得怎么样？</p>
              <div className="rating-grid">
                {[
                  { rating: Rating.Again, text: '再来一次', hint: '没想起来' },
                  { rating: Rating.Hard, text: '有点困难', hint: '想起得很慢' },
                  { rating: Rating.Good, text: '记得', hint: '基本答对' },
                  { rating: Rating.Easy, text: '很熟悉', hint: '轻松答对' },
                ].map((x) => (
                  <button
                    key={x.rating}
                    disabled={busy}
                    aria-keyshortcuts={String(x.rating)}
                    onClick={() => void grade(x.rating as Grade)}
                  >
                    {x.text}
                    <span>
                      {x.rating}，{x.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </article>
      ) : (
        <div className="empty-state">
          <CheckCircle size={32} />
          <h2>{queue.length ? '这一轮完成了' : '当前复习完成'}</h2>
          <p>
            本轮已反馈 {count} 张。
            {queue.length
              ? `还有 ${queue.length} 张待练，可以休息一下，再开始下一轮。`
              : '到期卡和今日额度内的新卡已处理，可以继续阅读练习。'}
          </p>
          {queue.length > 0 && (
            <button className="primary-button" onClick={nextRound}>
              再练一轮（最多 {Math.min(roundSize, queue.length)} 张）
              <ArrowRight size={17} />
            </button>
          )}
          <button
            className={queue.length ? 'outline-button' : 'primary-button'}
            onClick={onNext}
          >
            进入当前单元阅读
            <ArrowRight size={17} />
          </button>
        </div>
      )}
    </div>
  )
}
function MaterialPicker({
  kind,
  activeId,
  onSelect,
  attempts,
}: {
  kind: 'reading' | 'listening'
  activeId: string
  onSelect: (id: string) => void
  attempts: Attempt[]
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const items = kind === 'reading' ? readings : listenings
  const filtered = items.filter(
    (x) =>
      (!search || `${x.title} ${x.level}`.includes(search.trim())) &&
      (filter !== 'new' || !attempts.some((a) => a.materialId === x.id)),
  )
  const active = items.find(item => item.id === activeId)!
  const activeOutsideFilter = !filtered.some(item => item.id === activeId)
  return (
    <section className="material-picker" aria-label="选择练习材料">
      <div className="library-summary">
        <strong>{kind === 'reading' ? '阅读材料' : '听力材料'}</strong>
        <span>
          {items.length} 份材料，已练{' '}
          {
            items.filter((x) => attempts.some((a) => a.materialId === x.id))
              .length
          }{' '}
          份
        </span>
      </div>
      <div className="picker-controls">
        <label className="search-field">
          <MagnifyingGlass size={18} />
          <span className="sr-only">搜索材料</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索材料标题"
            type="search"
          />
        </label>
        <label className="filter-field">
          <span className="sr-only">练习状态</span>
          <select
            aria-label="练习状态"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">全部材料</option>
            <option value="new">尚未练习</option>
          </select>
        </label>
        <label className="material-select">
          <span className="sr-only">选择材料</span>
          <select
            aria-label="选择材料"
            value={activeId}
            onChange={(e) => {
              if (e.target.value) onSelect(e.target.value)
            }}
          >
            <option value="" disabled>
              {filtered.length ? '选择一份材料' : '没有匹配材料'}
            </option>
            {activeOutsideFilter && <option value={activeId}>当前：{active.title}（筛选外）</option>}
            {filtered.map((x) => (
              <option key={x.id} value={x.id}>
                {x.unitId
                  ? `单元 ${courseUnits.find((u) => u.id === x.unitId)?.order}：`
                  : '旧版样本：'}
                {x.title}
                {attempts.some((a) => a.materialId === x.id) ? '，已练' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!filtered.length && (
        <p className="filter-feedback" role="status">没有匹配材料，下面保留当前练习。<button className="text-button" onClick={() => { setSearch(''); setFilter('all') }}>清除筛选</button></p>
      )}
      {filtered.length > 0 && activeOutsideFilter && <p className="field-hint" role="status">当前练习在筛选范围外；选择材料后切换。</p>}
    </section>
  )
}
function ReadingPage({
  initialId,
  attempts,
  onNotify,
}: {
  initialId: string
  attempts: Attempt[]
  onNotify: Notify
}) {
  const [activeId, setActiveId] = useState(initialId)
  useEffect(() => setActiveId(initialId), [initialId])
  const reading = readings.find((x) => x.id === activeId) ?? readings[0]
  return (
    <div className="page-stack">
      <MaterialPicker
        kind="reading"
        activeId={reading.id}
        attempts={attempts}
        onSelect={(id) => {
          setActiveId(id)
          void setPreference('activeReading', id).catch(() =>
            onNotify('材料位置未保存。', 'error'),
          )
        }}
      />
      <ReadingExercise key={reading.id} reading={reading} onNotify={onNotify} />
    </div>
  )
}
function ReadingExercise({
  reading,
  onNotify,
}: {
  reading: Reading
  onNotify: Notify
}) {
  const practice = usePractice(
    'reading',
    reading.id,
    reading.questions.length,
    onNotify,
  )
  const [annotation, setAnnotation] = useState<Annotation>('off')
  const [studyLayer, setStudyLayer] = useState<StudyLayer>('off')
  const furigana = annotation !== 'off'
  const [helpUsed, setHelpUsed] = useState<boolean | undefined>(undefined)
  const [metaReady, setMetaReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const metaKey = `draft:reading-help:${reading.id}`
  const studyLayerKey = `studyLayer:reading:${reading.id}`
  const effectiveLayer: StudyLayer = studyLayer !== 'off' ? studyLayer : annotation === 'material' ? 'furigana' : 'off'
  useEffect(() => {
    void db.preferences.get(studyLayerKey).then((row) => { if (isStudyLayer(row?.value)) setStudyLayer(row.value) })
  }, [studyLayerKey])
  useEffect(() => {
    let cancelled = false
    void flushDrafts([metaKey]).then(() => db.preferences.get(metaKey)).then((x) => {
      if (!cancelled) { setHelpUsed(x?.value === true); setMetaReady(true) }
    }).catch(() => {
      if (!cancelled) { setMetaReady(true); onNotify('阅读辅助状态未恢复，本次将标为状态未知。', 'error') }
    })
    return () => { cancelled = true }
  }, [metaKey])
  async function submit() {
    if (
      lock.current ||
      !practice.ready ||
      !metaReady ||
      practice.result ||
      practice.answers.some((x) => x === -1)
    )
      return
    lock.current = true
    setBusy(true)
    try {
      await flushDrafts([practice.key, metaKey])
      const correct = score(reading.questions, practice.answers)
      const durationMs = Date.now() - practice.startedAt.current
      await recordAttempt(
        reading.id,
        'reading',
        practice.answers,
        correct,
        reading.questions.length,
        undefined,
        [practice.key, metaKey],
        durationMs,
        helpUsed,
      )
      practice.setResult({
        id: 'saved',
        materialId: reading.id,
        kind: 'reading',
        answers: practice.answers,
        correct,
        total: reading.questions.length,
        completedAt: new Date().toISOString(),
        durationMs,
        readingHelp: helpUsed,
      })
      onNotify('阅读结果已保存。')
    } catch {
      onNotify('结果未保存，答案已保留，请重试。', 'error')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function changeStudyLayer(next: StudyLayer) {
    setStudyLayer(next)
    try { await setPreference(studyLayerKey, next) } catch { onNotify('学习层偏好未保存，本次仍可继续使用。', 'error') }
    if (next !== 'off' && !practice.result) {
      setHelpUsed(true)
      void persistDraft(metaKey, true).catch(() => onNotify('辅助记录未保存，请重试。', 'error'))
    }
  }
  return (
    <div className="exercise-layout">
      <article className="material-card" id="reading-text" tabIndex={-1}>
        <div className="material-header">
          <div>
            <h2>{reading.title}</h2>
            <p>
              {reading.level}，约 {reading.minutes} 分钟
            </p>
          </div>
          <div className="reading-tools">
            <StudyLayerControl value={studyLayer} onChange={(next) => { void changeStudyLayer(next) }} />
            <AnnotationControl
              label="字体注音"
              material
              value={annotation}
              disabled={!practice.ready || !metaReady || busy}
              onChange={(next) => {
                setAnnotation(next)
                if (next !== 'off' && !practice.result) {
                  setHelpUsed(true)
                  void persistDraft(metaKey, true).catch(() =>
                    onNotify('辅助记录未保存，请重试。', 'error'),
                  )
                }
              }}
            />
          </div>
        </div>
        <LayeredJapanese segments={reading.segments} layer={effectiveLayer} className={`${furigana ? 'show-furigana' : ''} ${annotation === 'font' ? 'font-furigana' : ''}`} />
        {annotation === 'font' && <AnnotationNote material />}
        <a className="exercise-jump" href="#reading-questions">前往理解题 <ArrowRight size={16} /></a>
        <p className="material-help">
          先找出人物、时间、地点和动作。不会时可以选“不知道”。
        </p>
        {practice.result && (
          <section className="analysis-block">
            <h3>译文与观察</h3>
            <p>{reading.translation}</p>
            <ul>
              {reading.focus.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="field-hint">
              {practice.result.readingHelp === undefined
                ? '旧记录没有保存阅读辅助状态。'
                : practice.result.readingHelp
                  ? '本次使用过振假名辅助。'
                  : '本次未使用振假名辅助。'}
            </p>
          </section>
        )}
        <p className="source-credit">
          项目原创试用文本；尚未经过专业日语教师审校。
        </p>
      </article>
      <aside className="question-card" id="reading-questions" aria-label="阅读理解题">
        <a className="exercise-jump" href="#reading-text"><ArrowLeft size={16} /> 返回原文</a>
        <h2>读后理解</h2>
        <SaveStatus
          ready={practice.ready && metaReady}
          saving={practice.saving}
          result={!!practice.result}
        />
        <AnswerProgress questions={reading.questions} answers={practice.answers} submitted={!!practice.result} />
        <QuestionList
          questions={reading.questions}
          answers={practice.answers}
          onChange={practice.change}
          submitted={!!practice.result}
          disabled={!practice.ready || !metaReady || busy}
        />
        <ExerciseFooter
          result={practice.result}
          disabled={
            !practice.ready || !metaReady || busy || practice.answers.some((x) => x === -1)
          }
          busy={busy}
          onSubmit={() => void submit()}
          onRetry={() => {
            practice.retry()
            setAnnotation('off')
            setStudyLayer('off')
            setHelpUsed(false)
            void persistDraft(metaKey, false).catch(() =>
              onNotify('辅助状态未保存，请重试。', 'error'),
            )
          }}
        />
      </aside>
    </div>
  )
}
function ListeningPage({
  initialId,
  attempts,
  onNotify,
}: {
  initialId: string
  attempts: Attempt[]
  onNotify: Notify
}) {
  const [activeId, setActiveId] = useState(initialId)
  useEffect(() => setActiveId(initialId), [initialId])
  const listening = listenings.find((x) => x.id === activeId) ?? listenings[0]
  return (
    <div className="page-stack">
      <MaterialPicker
        kind="listening"
        activeId={listening.id}
        attempts={attempts}
        onSelect={(id) => {
          setActiveId(id)
          void setPreference('activeListening', id).catch(() =>
            onNotify('材料位置未保存。', 'error'),
          )
        }}
      />
      <ListeningExercise
        key={listening.id}
        listening={listening}
        previousAttempts={attempts.filter((x) => x.materialId === listening.id)}
        onNotify={onNotify}
      />
    </div>
  )
}
const emptyPlayback = (): NonNullable<Attempt['listening']> => ({
  playCount: 0,
  completedPlayback: false,
  transcriptBeforeSubmit: false,
  seekedBeforeSubmit: false,
  rateChangedBeforeSubmit: false,
  playedRanges: [],
})
function ListeningExercise({
  listening,
  previousAttempts,
  onNotify,
}: {
  listening: Listening
  previousAttempts: Attempt[]
  onNotify: Notify
}) {
  const practice = usePractice(
    'listening',
    listening.id,
    listening.questions.length,
    onNotify,
  )
  const [meta, setMeta] = useState(emptyPlayback)
  const metaRef = useRef(meta)
  const [metaReady, setMetaReady] = useState(false)
  const [transcript, setTranscript] = useState(false)
  const [annotation, setAnnotation] = useState<Annotation>('off')
  const [studyLayer, setStudyLayer] = useState<StudyLayer>('off')
  const [busy, setBusy] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioTime, setAudioTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const lock = useRef(false)
  const lastPosition = useRef<number | null>(null)
  const metaKey = `draft:listening-meta:${listening.id}`
  const studyLayerKey = `studyLayer:listening:${listening.id}`
  useEffect(() => {
    void db.preferences.get(studyLayerKey).then((row) => { if (isStudyLayer(row?.value)) setStudyLayer(row.value) })
  }, [studyLayerKey])
  useEffect(() => {
    let cancelled = false
    void flushDrafts([metaKey]).then(() => db.preferences.get(metaKey))
      .then((entry) => {
        if (cancelled) return
        try {
          const data = JSON.parse(String(entry?.value ?? 'null'))
          if (
            data &&
            Number.isInteger(data.playCount) &&
            typeof data.completedPlayback === 'boolean'
          ) {
            metaRef.current = {
              ...emptyPlayback(),
              ...data,
              completedPlayback: fullyPlayed(
                data.playedRanges ?? [],
                data.duration ?? 0,
              ),
            }
            setMeta(metaRef.current)
          }
        } catch {
          /* Invalid legacy metadata starts clean. */
        }
        setMetaReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setMetaReady(true)
          onNotify('播放草稿读取失败，请重新完整播放。', 'error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [metaKey])
  function update(change: Partial<NonNullable<Attempt['listening']>>) {
    if (practice.result || !metaReady) return
    const next = {
      ...metaRef.current,
      ...change,
      sourceKind: listening.audioKind,
    }
    metaRef.current = next
    setMeta(next)
    void persistDraft(metaKey, JSON.stringify(next)).catch(() =>
      onNotify('播放记录未保存，请重试。', 'error'),
    )
  }
  function changeStudyLayer(next: StudyLayer) {
    setStudyLayer(next)
    void setPreference(studyLayerKey, next).catch(() => onNotify('学习层偏好未保存，本次仍可继续使用。', 'error'))
  }
  function capture(audio: HTMLAudioElement) {
    if (
      practice.result ||
      !metaReady ||
      lastPosition.current === null ||
      audio.seeking
    )
      return
    const position = audio.currentTime
    const delta = position - lastPosition.current
    // Only measured continuous playback contributes coverage. Seeking never fills the gap.
    if (delta > 0 && delta <= 1.5 * Math.max(1, audio.playbackRate)) {
      const ranges = mergeRanges([
        ...(metaRef.current.playedRanges ?? []),
        [lastPosition.current, position],
      ])
      update({
        playedRanges: ranges,
        duration: audio.duration,
        completedPlayback: fullyPlayed(ranges, audio.duration),
      })
    }
    lastPosition.current = position
  }
  async function submit() {
    if (
      lock.current ||
      !practice.ready ||
      !metaReady ||
      practice.result ||
      !metaRef.current.completedPlayback ||
      practice.answers.some((x) => x === -1)
    )
      return
    lock.current = true
    setBusy(true)
    try {
      await flushDrafts([practice.key, metaKey])
      const correct = score(listening.questions, practice.answers)
      const durationMs = Date.now() - practice.startedAt.current
      await recordAttempt(
        listening.id,
        'listening',
        practice.answers,
        correct,
        listening.questions.length,
        metaRef.current,
        [practice.key, metaKey],
        durationMs,
      )
      practice.setResult({
        id: 'saved',
        materialId: listening.id,
        kind: 'listening',
        answers: practice.answers,
        correct,
        total: listening.questions.length,
        completedAt: new Date().toISOString(),
        listening: metaRef.current,
        durationMs,
      })
      audioRef.current?.pause()
      onNotify('作答与播放情况已保存。')
    } catch {
      onNotify('结果未保存，答案已保留，请重试。', 'error')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  const shownMeta = practice.result?.listening ?? meta
  const independently = independentPlayback(shownMeta)
  function retry() {
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.currentTime = 0
    practice.retry()
    const next = emptyPlayback()
    metaRef.current = next
    setMeta(next)
    setTranscript(false)
    lastPosition.current = null
    setAudioPlaying(false)
    setAudioTime(0)
    void persistDraft(metaKey, JSON.stringify(next)).catch(() =>
      onNotify('新练习播放状态未保存，请重试。', 'error'),
    )
  }
  return (
    <div className="exercise-layout">
      <article className="material-card">
        <div className="material-header">
          <div>
            <h2>{listening.title}</h2>
            <p>{listening.level}</p>
          </div>
          <span className="audio-indicator">
            <SpeakerHigh size={18} />
            {listening.audioKind === 'human' ? '真人录音' : '合成语音'}
          </span>
        </div>
        {listening.audioKind === 'synthetic' && (
          <p className="content-note">
            合成语音用于基础辨音与信息提取，不计入真人首遍听力表现。
          </p>
        )}
        <div className="audio-stage">
          <div className="audio-player-heading"><Headphones size={22} /><span>听力播放器</span><small>{audioDuration ? `${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, '0')}` : '准备中'}</small></div>
          <div className="audio-player-controls">
            <button className="audio-skip" aria-label="后退 5 秒" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5) }}><Rewind size={18} /></button>
            <button className="audio-play" aria-label={audioPlaying ? '暂停' : '播放'} onClick={() => { const audio = audioRef.current; if (!audio) return; if (audio.paused) void audio.play(); else audio.pause() }}>{audioPlaying ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}</button>
            <button className="audio-skip" aria-label="前进 5 秒" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioDuration || audioRef.current.duration || 0, audioRef.current.currentTime + 5) }}><FastForward size={18} /></button>
          </div>
          <input className="audio-seek" type="range" min="0" max={audioDuration || 0} step="0.01" value={Math.min(audioTime, audioDuration || 0)} aria-label="音频进度" onChange={(event) => { const next = Number(event.target.value); setAudioTime(next); if (audioRef.current) audioRef.current.currentTime = next }} />
          <div className="audio-time"><span>{Math.floor(audioTime / 60)}:{String(Math.floor(audioTime % 60)).padStart(2, '0')}</span><span>{audioDuration ? `${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, '0')}` : '—:—'}</span></div>
          <audio
            ref={audioRef}
            controls={false}
            className="hidden-audio"
            preload="metadata"
            src={listening.audio}
            aria-label={`${listening.title}音频`}
            onError={() => setAudioError(true)}
            onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
            onPlay={(e) => {
              if (practice.result) return
              const audio = e.currentTarget
              if (!metaReady) {
                audio.pause()
                return
              }
              if (audio.currentTime < 0.35 || metaRef.current.playCount === 0)
                update({ playCount: metaRef.current.playCount + 1 })
              lastPosition.current = audio.currentTime
              setAudioPlaying(true)
            }}
            onTimeUpdate={(e) => { setAudioTime(e.currentTarget.currentTime); capture(e.currentTarget) }}
            onPause={(e) => {
              capture(e.currentTarget)
              lastPosition.current = null
              setAudioPlaying(false)
            }}
            onRateChange={() => update({ rateChangedBeforeSubmit: true })}
            onSeeking={() => {
              lastPosition.current = null
              update({ seekedBeforeSubmit: true })
            }}
            onSeeked={(e) => {
              const audio = e.currentTarget
              if (audio.duration && audio.currentTime >= audio.duration - 0.25) {
                update({ duration: audio.duration, completedPlayback: true, playedRanges: mergeRanges([...(metaRef.current.playedRanges ?? []), [0, audio.duration]]) })
              }
              if (!audio.paused) lastPosition.current = audio.currentTime
            }}
            onEnded={(e) => {
              capture(e.currentTarget)
              lastPosition.current = null
              setAudioPlaying(false)
              update({ duration: e.currentTarget.duration, completedPlayback: true, playedRanges: mergeRanges([...(metaRef.current.playedRanges ?? []), [0, e.currentTarget.duration]]) })
            }}
          />
        </div>
        {audioError && (
          <div className="inline-error" role="alert">
            音频读取失败。
            <button
              className="text-button"
              onClick={() => {
                setAudioError(false)
                audioRef.current?.load()
              }}
            >
              重新加载音频
            </button>
          </div>
        )}
        <p className="listening-evidence">
          启动 {shownMeta.playCount} 次；{' '}
          {shownMeta.completedPlayback ? '已完整播放' : '尚未完整播放'}；{' '}
          {independently
            ? previousAttempts.length > (practice.result ? 1 : 0)
              ? '独立重练'
              : '本次独立作答'
            : '辅助练习或尚未开始'}
        </p>
        <button
          className="outline-button"
          aria-expanded={transcript}
          onClick={() => {
            setTranscript(!transcript)
            if (!transcript) update({ transcriptBeforeSubmit: true })
          }}
        >
          {transcript ? '隐藏文本' : '查看文本'}
          <ArrowRight size={16} />
        </button>
        {transcript && (
          <div className="transcript">
            <div className="guide-toolbar"><h3>音频文本</h3><div className="reading-tools"><StudyLayerControl value={studyLayer} onChange={changeStudyLayer} /><AnnotationControl value={annotation} onChange={setAnnotation} /></div></div>
            {annotation === 'font' && <AnnotationNote />}
            <LayeredJapanese segments={listening.transcriptSegments ?? [{ text: listening.transcript }]} layer={studyLayer} className={annotation === 'font' ? 'font-furigana' : ''} />
            <p>{listening.translation}</p>
          </div>
        )}
        <div className="source-credit">
          {listening.sourceUrl && (
            <a href={listening.sourceUrl} target="_blank" rel="noreferrer">
              原始句子与录音来源
            </a>
          )}
          <p>{listening.credit}</p>
        </div>
      </article>
      <aside className="question-card" aria-label="听力理解题">
        <h2>听后理解</h2>
        <SaveStatus
          ready={practice.ready && metaReady}
          saving={practice.saving}
          result={!!practice.result}
        />
        <AnswerProgress questions={listening.questions} answers={practice.answers} submitted={!!practice.result} />
        <QuestionList
          questions={listening.questions}
          answers={practice.answers}
          onChange={practice.change}
          submitted={!!practice.result}
          disabled={!practice.ready || busy}
        />
        <ExerciseFooter
          result={practice.result}
          disabled={
            !practice.ready ||
            !metaReady ||
            busy ||
            !meta.completedPlayback ||
            practice.answers.some((x) => x === -1)
          }
          busy={busy}
          onSubmit={() => void submit()}
          onRetry={retry}
        />
        {!practice.result && !meta.completedPlayback && (
          <p className="field-hint">
            播放到末尾或拖到末尾后可提交。
          </p>
        )}
      </aside>
    </div>
  )
}
function AnswerProgress({ questions, answers, submitted }: { questions: ChoiceQuestion[]; answers: number[]; submitted: boolean }) {
  const first = answers.findIndex(answer => answer === -1)
  if (submitted) return null
  return <div className="answer-progress"><span>已答 {answers.filter(answer => answer !== -1).length} / {questions.length} 题</span>{first >= 0 && <a href={`#${questions[first].id}`}>前往未答题</a>}</div>
}
function QuestionList({
  questions,
  answers,
  onChange,
  submitted,
  disabled = false,
  startIndex = 0,
}: {
  questions: ChoiceQuestion[]
  answers: number[]
  onChange: (index: number, answer: number) => void
  submitted: boolean
  disabled?: boolean
  startIndex?: number
}) {
  return (
    <div className="questions">
      {questions.map((q, i) => (
        <fieldset
          className="question"
          id={q.id}
          tabIndex={-1}
          key={q.id}
          disabled={submitted || disabled}
        >
          <legend>
            <span>{startIndex + i + 1}.</span> {q.prompt}
          </legend>
          <div className="options">
            {[
              ...q.options.map((text, value) => ({ text, value })),
              { text: '不知道', value: -2 },
            ].map(({ text, value }) => (
              <label
                key={value}
                className={`option ${answers[i] === value ? 'chosen' : ''} ${submitted && value === q.answer ? 'correct' : ''} ${submitted && answers[i] === value && value !== q.answer ? 'incorrect' : ''}`}
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[i] === value}
                  onChange={() => onChange(i, value)}
                />
                <span className="option-letter">
                  {value < 0 ? '?' : String.fromCharCode(65 + value)}
                </span>
                <span>
                  {text}
                  {submitted && value === q.answer && (
                    <small className="answer-tag">正确答案</small>
                  )}
                  {submitted && answers[i] === value && value !== q.answer && (
                    <small className="answer-tag">你的选择</small>
                  )}
                </span>
              </label>
            ))}
          </div>
          {submitted && <p className="question-explanation">{q.explanation}</p>}
        </fieldset>
      ))}
    </div>
  )
}
function SaveStatus({
  ready,
  saving,
  result,
}: {
  ready: boolean
  saving: boolean
  result: boolean
}) {
  return (
    <p className="save-status" role="status">
      {!ready
        ? '正在恢复草稿…'
        : result
          ? '已保存的练习结果'
          : saving
            ? '正在保存草稿…'
            : '答案自动保存在本机'}
    </p>
  )
}
function ExerciseFooter({
  result,
  disabled,
  busy,
  onSubmit,
  onRetry,
}: {
  result: Attempt | null
  disabled: boolean
  busy: boolean
  onSubmit: () => void
  onRetry: () => void
}) {
  return result ? (
    <div className="exercise-footer">
      <p className="exercise-result" role="status">
        <CheckCircle size={20} />
        本次答对 {result.correct} / {result.total} 题，结果已保存。
      </p>
      <button className="outline-button" onClick={onRetry}>
        重新练习
      </button>
    </div>
  ) : (
    <button
      className="primary-button submit-button"
      disabled={disabled}
      onClick={onSubmit}
    >
      {busy ? '正在保存…' : '提交并查看解析'}
      <ArrowRight size={17} />
    </button>
  )
}
function BaselinePage({
  onNotify,
  onBack,
}: {
  onNotify: Notify
  onBack: () => void
}) {
  const practice = usePractice(
    'baseline',
    'baseline-01',
    baselineQuestions.length,
    onNotify,
  )
  const [current, setCurrent] = useState(0)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  useEffect(() => {
    let cancelled = false
    void flushDrafts(['draft:baseline-current']).then(() => db.preferences.get('draft:baseline-current')).then((x) => {
      if (
        !cancelled &&
        typeof x?.value === 'number' &&
        x.value >= 0 &&
        x.value < baselineQuestions.length
      )
        setCurrent(x.value)
    }).catch(() => onNotify('小测位置未恢复，已回到第一题。', 'error'))
    return () => { cancelled = true }
  }, [])
  async function go(index: number) {
    setBusy(true)
    try {
      await flushDrafts([practice.key])
      await persistDraft('draft:baseline-current', index)
      setCurrent(index)
    } catch {
      onNotify('题目位置未保存，请重试。', 'error')
    } finally {
      setBusy(false)
    }
  }
  async function finish() {
    if (lock.current || practice.answers.some((x) => x === -1)) return
    lock.current = true
    setBusy(true)
    try {
      await flushDrafts([practice.key, 'draft:baseline-current'])
      const correct = score(baselineQuestions, practice.answers)
      await recordAttempt(
        'baseline-01',
        'baseline',
        practice.answers,
        correct,
        baselineQuestions.length,
        undefined,
        [practice.key, 'draft:baseline-current'],
      )
      onNotify('小测已保存，可按基础缺口开始学习。')
      onBack()
    } catch {
      onNotify('小测未保存，请重试。', 'error')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  const q = baselineQuestions[current]
  return (
    <div className="page-stack">
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={17} />
        返回今日
      </button>
      <PageIntro
        title="起点小测"
        description="六题只用于发现基础缺口。不会时选“不知道”；不预测考试分数。"
      />
      <div className="baseline-card">
        <div className="review-meta">
          <span>
            第 {current + 1} / {baselineQuestions.length} 题
          </span>
          <SaveStatus
            ready={practice.ready}
            saving={practice.saving}
            result={false}
          />
        </div>
        {q.id === 'b6' && (
          <div className="baseline-audio">
            <p>先听录音，再回答；听不清可以选“不知道”。</p>
            <audio
              controls
              src={listenings[0].audio}
              aria-label="小测真人音频"
            />
          </div>
        )}
        <QuestionList
          questions={[q]}
          answers={[practice.answers[current]]}
          onChange={(_, value) => practice.change(current, value)}
          submitted={false}
          disabled={!practice.ready || busy}
          startIndex={current}
        />
        <div className="baseline-actions">
          <button
            className="outline-button"
            disabled={current === 0 || busy}
            onClick={() => void go(current - 1)}
          >
            上一题
          </button>
          {current < baselineQuestions.length - 1 ? (
            <button
              className="primary-button"
              disabled={
                practice.answers[current] === -1 || !practice.ready || busy
              }
              onClick={() => void go(current + 1)}
            >
              下一题
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              className="primary-button"
              disabled={practice.answers.some((x) => x === -1) || busy}
              onClick={() => void finish()}
            >
              保存小测结果
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
function ProgressPage({
  progress,
  attempts,
  events,
  preferences,
  now,
  openMaterial,
  onNotify,
  onStart,
}: {
  progress: CardProgress[]
  attempts: Attempt[]
  events: ReviewEvent[]
  preferences: Preference[]
  now: number
  onNotify: Notify
  openMaterial: TodayProps['openMaterial']
  onStart: () => void
}) {
  const [filter, setFilter] = useState('all')
  const [visible, setVisible] = useState(12)
  const readingAttempts = attempts.filter((x) => x.kind === 'reading')
  const listeningAttempts = attempts.filter((x) => x.kind === 'listening')
  const sortedListening = [...listeningAttempts].sort((a, b) =>
    a.completedAt.localeCompare(b.completedAt),
  )
  const seen = new Set<string>()
  const firstHuman = sortedListening.filter((x) => {
    const first = !seen.has(x.materialId)
    seen.add(x.materialId)
    const kind =
      x.listening?.sourceKind ??
      listenings.find((l) => l.id === x.materialId)?.audioKind
    return first && kind === 'human' && independentPlayback(x.listening)
  })
  const recent = [...attempts]
    .filter((x) => filter === 'all' || x.kind === filter)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - 6 + i)
    return { date: localDate(d), label: `${d.getMonth() + 1}/${d.getDate()}` }
  })
  const activeDays = week.filter(
    (d) =>
      events.some((x) => localDate(new Date(x.reviewedAt)) === d.date) ||
      attempts.some((x) => localDate(new Date(x.completedAt)) === d.date),
  ).length
  const jlptCompletedCount = preferences.filter((row) => row.key.startsWith('jlptCompleted:') && row.value === true).length
  const jlptImportedCompleteCount = importedCompleteJLPTCount(preferences)
  const jlptMistakeCount = preferences.filter((row) => row.key.startsWith('jlptMistakes:') && typeof row.value === 'string').reduce((count, row) => {
    try { return count + (Array.isArray(JSON.parse(row.value as string)) ? JSON.parse(row.value as string).length : 0) } catch { return count }
  }, 0)
  return (
    <div className="page-stack">
      <div className="progress-summary">
        <div>
          <strong>
            {courseUnits.filter((x) => unitPracticed(x.id, attempts)).length}
            <small> / 7</small>
          </strong>
          <span>单元已练阅读与听力</span>
        </div>
        <div>
          <strong>
            {progress.length}
            <small> / {cards.length}</small>
          </strong>
          <span>卡片进入复习</span>
        </div>
        <div>
          <strong>
            {new Set(readingAttempts.map((x) => x.materialId)).size}
            <small> / {readings.length}</small>
          </strong>
          <span>阅读已练，共作答 {readingAttempts.length} 次</span>
        </div>
        <div>
          <strong>
            {new Set(listeningAttempts.map((x) => x.materialId)).size}
            <small> / {listenings.length}</small>
          </strong>
          <span>听力已练，共作答 {listeningAttempts.length} 次</span>
        </div>
      </div>
      <section className="week-panel">
        <div className="section-heading">
          <h2>近七天</h2>
          <span className="field-hint">有学习记录 {activeDays} 天</span>
        </div>
        <div className="week-grid">
          {week.map((d) => {
            const reviews = events.filter(
              (x) => localDate(new Date(x.reviewedAt)) === d.date,
            ).length
            const exercises = attempts.filter(
              (x) =>
                localDate(new Date(x.completedAt)) === d.date,
            ).length
            return (
              <div
                key={d.date}
                className={reviews || exercises ? 'active-day' : ''}
                style={{ '--day-level': Math.min(72, (reviews + exercises) * 12 + 4) } as React.CSSProperties}
              >
                <span>{d.label}</span>
                <strong>{reviews + exercises}</strong>
                <small>次反馈与作答</small>
              </div>
            )
          })}
        </div>
      </section>
      <p className="interpret-note">
        真人材料独立首遍 {firstHuman.length}{' '}
        次；合成语音、已做过的材料及辅助练习另存记录。累计复习反馈{' '}
        {events.length} 次。
      </p>
      <section className="progress-jlpt" aria-labelledby="progress-jlpt-title">
        <div className="section-heading"><div><h2 id="progress-jlpt-title">JLPT 学习进度</h2><p className="field-hint">原创教学包与本机授权题库分开统计。</p></div><span className="field-hint">{jlptPracticeSetCount} 个年份/等级索引</span></div>
        <div className="progress-jlpt-stats"><span><strong>{jlptCompletedCount}</strong> / {jlptPracticeSetCount} 教学包已练</span><span><strong>{jlptImportedCompleteCount}</strong> / {jlptFullExamSlotCount} 场完整题库</span><span><strong>{jlptMistakeCount}</strong> 道错题待复盘</span></div>
      </section>
      <WeeklyReport {...{ preferences, attempts, events, now }} />
      <SelectionNotes preferences={preferences} onNotify={onNotify} />
      <MistakeReview attempts={attempts} openMaterial={openMaterial} />
      <section className="history-panel">
        <div className="section-heading">
          <h2>练习记录</h2>
          <select
            aria-label="记录类型"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setVisible(12)
            }}
          >
            <option value="all">全部练习</option>
            <option value="reading">阅读</option>
            <option value="listening">听力</option>
            <option value="baseline">起点小测</option>
          </select>
        </div>
        {recent.length ? (
          <>
            <div className="history-list">
              {recent.slice(0, visible).map((item) => (
                <div key={item.id} className="history-row">
                  <div>
                    <strong>{materialTitle(item.materialId)}</strong>
                    <small>
                      {new Intl.DateTimeFormat('zh-CN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(item.completedAt))}
                      {item.kind !== 'baseline'
                        ? `，${practiceEvidence(item, attempts)}`
                        : ''}
                    </small>
                  </div>
                  <span>
                    {item.correct} / {item.total}
                  </span>
                  {item.kind !== 'baseline' &&
                    (readings.some((x) => x.id === item.materialId) ||
                      listenings.some((x) => x.id === item.materialId)) && (
                      <button
                        className="text-button"
                        onClick={() =>
                          openMaterial(
                            item.kind as 'reading' | 'listening',
                            item.materialId,
                          )
                        }
                      >
                        查看
                      </button>
                    )}
                </div>
              ))}
            </div>
            {visible < recent.length && (
              <button
                className="outline-button"
                onClick={() => setVisible((x) => x + 12)}
              >
                再显示 12 条
              </button>
            )}
          </>
        ) : (
          <div className="quiet-empty">
            <p>还没有这类练习记录。完成阅读、听力或小测后会显示在这里。</p>
            <button className="outline-button" onClick={onStart}>
              回到今日学习
            </button>
          </div>
        )}
      </section>
      <section className="skip-history">
        <h2>任务调整</h2>
        <SkipHistory />
      </section>
    </div>
  )
}
function SkipHistory() {
  const preferences = useLiveQuery(() => db.preferences.toArray(), []) ?? []
  const reasons = preferences
    .filter((x) => x.key.startsWith('taskReason:') && x.value)
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 7)
  return reasons.length ? (
    <ul>
      {reasons.map((x) => (
        <li key={x.key}>
          <span>
            {x.key.split(':')[1]}：{' '}
            {
              { review: '复习', reading: '阅读', listening: '听力' }[
                x.key.split(':')[2]
              ]
            }
          </span>
          <strong>{String(x.value)}</strong>
        </li>
      ))}
    </ul>
  ) : (
    <p className="field-hint">
      跳过与延期原因会保存在这里，用于一周后调整学习安排。
    </p>
  )
}
function downloadBackup(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function SettingsPage({
  preferences,
  onNotify,
}: {
  preferences: Preference[]
  onNotify: Notify
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [backupText, setBackupText] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const currentCounts = useLiveQuery(
    async () => ({
      cards: await db.progress.count(),
      reviews: await db.reviewEvents.count(),
      attempts: await db.attempts.count(),
    }),
    [],
  ) ?? { cards: 0, reviews: 0, attempts: 0 }
  const [pending, setPending] = useState<{
    name: string
    text: string
    summary: ReturnType<typeof inspectBackup>
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const safety = pref(preferences, 'restoreSafetySnapshot', '')
  async function saveSetting(key: string, value: number, message: string) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    try {
      await setPreference(key, value)
      onNotify(message)
    } catch {
      onNotify('设置未保存，请重试。', 'error')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function saveTextSetting(key: string, value: string, message: string) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    try {
      await setPreference(key, value)
      onNotify(message)
    } catch {
      onNotify('设置未保存，请重试。', 'error')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function exportData() {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    try {
      await flushDrafts()
      const text = await createBackup()
      setBackupText(text)
      downloadBackup(text, backupFilename('backup'))
      onNotify('备份已生成；下方也可复制 JSON。')
    } catch {
      onNotify('导出失败，请重试。', 'error')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function importFile(file: File) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('文件超过 20 MB')
      const text = await file.text()
      setAcknowledged(false)
      setPending({ name: file.name, text, summary: inspectBackup(text) })
    } catch (error) {
      setPending(null)
      onNotify(
        `备份无效：${error instanceof Error ? error.message : '请选择 JSON 备份'}`,
        'error',
      )
    } finally {
      lock.current = false
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }
  async function confirmRestore() {
    if (!pending || !acknowledged || lock.current) return
    lock.current = true
    setBusy(true)
    try {
      await flushDrafts()
      const current = await createBackup()
      await restoreBackup(pending.text)
      setBackupText(current)
      setPending(null)
      onNotify('恢复成功。导入前副本已保存在本机，可随时导出。')
    } catch {
      onNotify('恢复失败，原有数据未被替换，请重试。', 'error')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <div className="page-stack">
      <PageIntro
        title="设置与备份"
        description="设定学习节奏，备份或恢复记录。记录只保存在本机，桌面与浏览器暂不自动同步。"
      />
      <section className="settings-section">
        <div>
          <h2>首页建议学习时长</h2>
          <p>只用于首页的节奏提示，不限制复习、阅读、听力或 JLPT 的学习量。</p>
        </div>
        <select
          disabled={busy}
          aria-label="首页建议学习时长"
          value={boundedNumber(
            pref(preferences, 'todayMinutes', 30),
            30,
            10,
            300,
          )}
          onChange={(event) =>
            void saveSetting(
              'todayMinutes',
              Number(event.target.value),
              '首页建议时长已保存。',
            )
          }
        >
          {[
            ...new Set([
              10,
              15,
              20,
              30,
              45,
              60,
              90,
              120,
              boundedNumber(pref(preferences, 'todayMinutes', 30), 30, 10, 300),
            ]),
          ]
            .sort((a, b) => a - b)
            .map((value) => (
              <option key={value} value={value}>
                {value} 分钟
              </option>
            ))}
        </select>
      </section>
      <section className="settings-section">
        <div>
          <h2>JLPT N2 目标日期</h2>
          <p>双轨计划会按剩余天数自动调整基础理解与 N2 题型训练的时间比例。</p>
        </div>
        <input
          disabled={busy}
          aria-label="JLPT N2 目标日期"
          type="date"
          value={String(pref(preferences, 'jlptExamDate', DEFAULT_JLPT_EXAM_DATE))}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(event) => void saveTextSetting('jlptExamDate', event.target.value, 'JLPT 目标日期已保存。')}
        />
      </section>
      <section className="settings-section">
        <div>
          <h2>每轮复习卡片量</h2>
          <p>
            这是显示批次，不是每日上限；选择“全部”可以连续练完当前待复习内容。
          </p>
        </div>
        <select
          disabled={busy}
          aria-label="每轮复习卡片量"
          value={boundedNumber(
            pref(preferences, 'reviewRoundSize', 20),
            20,
            0,
            100,
          )}
          onChange={(event) =>
            void saveSetting(
              'reviewRoundSize',
              Number(event.target.value),
              '复习批次设置已保存，下次开始复习时生效。',
            )
          }
        >
          {[
            ...new Set([
              0,
              10,
              20,
              40,
              60,
              boundedNumber(pref(preferences, 'reviewRoundSize', 20), 20, 0, 100),
            ]),
          ]
            .sort((a, b) => a - b)
            .map((value) => (
              <option key={value} value={value}>
                {value === 0 ? '全部' : `${value} 张`}
              </option>
            ))}
        </select>
      </section>
      <div className="settings-grid">
        <section className="settings-card">
          <DownloadSimple size={25} />
          <h2>导出学习记录</h2>
          <p>
            包含排程、反馈、作答、草稿、课程位置与任务调整。兼容原 v1 备份格式。
          </p>
          <button
            className="primary-button"
            disabled={busy}
            onClick={() => void exportData()}
          >
            导出 JSON 备份
          </button>
        </section>
        <section className="settings-card">
          <UploadSimple size={25} />
          <h2>恢复备份</h2>
          <p>
            先核对数量，确认后替换当前数据。坏文件不会覆盖记录；导入前副本会保存在本机。
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importFile(file)
            }}
          />
          <button
            className="outline-button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            选择备份文件
          </button>
        </section>
      </div>
      {pending && (
        <section className="backup-preview" aria-label="备份恢复预览">
          <h2>待恢复：{pending.name}</h2>
          <p>
            导出于{' '}
            {new Intl.DateTimeFormat('zh-CN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(pending.summary.exportedAt))}
          </p>
          <dl className="backup-counts">
            <div>
              <dt>卡片</dt>
              <dd>{pending.summary.progress}</dd>
            </div>
            <div>
              <dt>反馈日志</dt>
              <dd>{pending.summary.reviews}</dd>
            </div>
            <div>
              <dt>练习</dt>
              <dd>{pending.summary.attempts}</dd>
            </div>
            <div>
              <dt>设置与草稿</dt>
              <dd>{pending.summary.preferences}</dd>
            </div>
          </dl>
          <p>
            恢复会替换本机记录。当前数据：{currentCounts.cards} 张卡片、
            {currentCounts.reviews} 条反馈、{currentCounts.attempts} 条练习、
            {Number(
              preferences.filter((x) => x.key !== 'restoreSafetySnapshot')
                .length,
            )}{' '}
            项设置与草稿；请在确认前核对文件来源。
          </p>
          <label className="restore-ack">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span>
              我已核对备份，了解当前记录将被替换，导入前副本会保留在本机。
            </span>
          </label>
          <div className="button-row">
            <button
              className="primary-button"
              disabled={busy || !acknowledged}
              onClick={() => void confirmRestore()}
            >
              {busy ? '正在恢复…' : '确认恢复'}
            </button>
            <button
              className="outline-button"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              取消
            </button>
          </div>
        </section>
      )}
      {typeof safety === 'string' && safety && (
        <section className="settings-section">
          <div>
            <h2>上次导入前的副本</h2>
            <p>副本保留在本机，避免下载失败时失去原始记录。</p>
          </div>
          <button
            className="outline-button"
            onClick={() => {
              setBackupText(safety)
              downloadBackup(safety, backupFilename('before-restore'))
            }}
          >
            导出恢复副本
          </button>
        </section>
      )}
      {backupText && (
        <section className="backup-copy">
          <h2>备份 JSON</h2>
          <p>下载未弹出时，可复制并保存为 .json 文件。</p>
          <textarea readOnly aria-label="备份 JSON" value={backupText} />
          <button
            className="outline-button"
            onClick={() =>
              void navigator.clipboard
                .writeText(backupText)
                .then(() => onNotify('备份已复制。'))
                .catch(() =>
                  onNotify('复制失败，请在文本框手动全选复制。', 'error'),
                )
            }
          >
            复制 JSON
          </button>
        </section>
      )}
      <section className="source-panel">
        <h2>内容与版本</h2>
        <p>
          v{appVersion}，{cards.length} 张卡，{readings.length} 篇阅读材料，{' '}
          {listenings.length} 段音频，7 个基础单元。
        </p>
        <p>
          原创文本尚未经过专业教师审校。新增七段为 macOS
          合成语音，仅供私人练习；旧版三段真人短音频来自
          Tatoeba，页面附署名和来源。公开分发前需逐项复核许可。应用采用本机临时签名，尚未
          Apple 公证。
        </p>
        <p>字体注音使用 <a href="https://furifont.antfu.me/" target="_blank" rel="noreferrer">FuriFont Serif</a> v0.5.1，随应用离线提供。字体采用 SIL OFL 1.1，词典署名与许可随应用保留。</p>
      </section>
    </div>
  )
}
function PageIntro({
  title,
  description: _description,
}: {
  title: string
  description: string
}) {
  return (
    <header className="page-intro">
      <h1>{title}</h1>
    </header>
  )
}
export default App
