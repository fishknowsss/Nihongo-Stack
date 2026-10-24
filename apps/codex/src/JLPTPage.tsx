import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, CheckCircle, GraduationCap, Info, ListChecks, SpeakerHigh, TrashSimple } from '@phosphor-icons/react'
import { jlptExamBlueprint, jlptExamSessionsByYear, jlptFullExamSlotCount, jlptLevelGuides, jlptLevels, jlptOfficialPracticeLinks, jlptQuestions, jlptResourceRoutes, jlptSets, jlptSources, jlptYears, type JLPTLevel, type JLPTQuestion, type JLPTSection } from './jlpt'
import { db, setPreference } from './db'
import { downloadCompleteImportTemplate, downloadImportTemplate, downloadJLPTCoverageManifest, downloadJLPTLevelFieldTemplate, parseImportedJLPTPack, type ImportedJLPTPack } from './jlpt-import'
import { kanaToRomaji } from './language'
import LayeredJapanese from './LayeredJapanese'

type Notify = (message: string, kind?: 'success' | 'error') => void
type JLPTMistakeRecord = { id: string; answer: number; incorrectCount: number; lastSeenAt: string }
type JLPTPracticeMode = 'learn' | 'exam'
type JLPTSupport = 'off' | 'reading' | 'full'

export default function JLPTPage({ onNotify }: { onNotify: Notify }) {
  const [level, setLevel] = useState<JLPTLevel>('N5')
  const [year, setYear] = useState(2025)
  const [activeSetId, setActiveSetId] = useState(`jlpt-2025-n5`)
  const [questionFilter, setQuestionFilter] = useState<JLPTSection | 'all'>('all')
  const [practiceMode, setPracticeMode] = useState<JLPTPracticeMode>('learn')
  const [support, setSupport] = useState<JLPTSupport>('reading')
  const [examSecondsLeft, setExamSecondsLeft] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [importing, setImporting] = useState(false)
  const preferences = useLiveQuery(() => db.preferences.toArray(), []) ?? []
  const completed = useMemo(() => new Set(preferences.filter((row) => row.key.startsWith('jlptCompleted:') && row.value === true).map((row) => row.key.slice('jlptCompleted:'.length))), [preferences])
  const completedSections = useMemo(() => new Set(preferences.filter((row) => row.key.startsWith(`jlptSectionCompleted:${activeSetId}:`) && row.value === true).map((row) => row.key.slice(`jlptSectionCompleted:${activeSetId}:`.length))), [activeSetId, preferences])
  const importedPacks = useMemo(() => preferences.flatMap((row) => {
    if (!row.key.startsWith('jlptImportedPack:') || typeof row.value !== 'string') return []
    try { return [parseImportedJLPTPack(row.value)] } catch { return [] }
  }), [preferences])
  const importedSets = useMemo(() => importedPacks.map((pack) => ({ id: pack.id, year: pack.year, session: pack.session, level: pack.level, title: pack.title, status: 'licensed-import' as const, questionIds: pack.questions.map((question) => question.id), note: `授权导入 · ${pack.sourceName} · ${pack.license}`, complete: pack.complete, fullPaper: pack.fullPaper, contentKind: pack.contentKind, rawSections: pack.rawSections, sourceUrl: pack.sourceUrl, questionCount: pack.questionCount, sectionQuestionCounts: pack.sectionQuestionCounts })), [importedPacks])
  const allSets = useMemo(() => [...jlptSets.filter((set) => !importedSets.some((imported) => imported.id === set.id)), ...importedSets], [importedSets])
  const allQuestions = useMemo(() => [...jlptQuestions, ...importedPacks.flatMap((pack) => pack.questions)], [importedPacks])
  const activeSet = allSets.find((set) => set.id === activeSetId) ?? allSets[0]
  const activeImportedPack = importedPacks.find((pack) => pack.id === activeSet.id)
  const questions = useMemo(() => activeSet.questionIds.map((id) => allQuestions.find((question) => question.id === id)).filter(Boolean) as JLPTQuestion[], [activeSet, allQuestions])
  const rawOnlyPack = Boolean(activeImportedPack?.rawSections && questions.length === 0)
  const visibleQuestions = useMemo(() => questionFilter === 'all' ? questions : questions.filter((question) => question.section === questionFilter), [questionFilter, questions])
  const persistedMistakes = useMemo(() => {
    const row = preferences.find((item) => item.key === `jlptMistakes:${activeSet.id}`)
    if (typeof row?.value !== 'string') return [] as Array<{ question: JLPTQuestion; answer: number; incorrectCount: number; lastSeenAt: string }>
    try {
      const values = JSON.parse(row.value) as Array<Partial<JLPTMistakeRecord> & { id?: string }>
      return values.flatMap((value) => {
        const question = allQuestions.find((item) => item.id === value.id)
        return question && typeof value.answer === 'number' ? [{ question, answer: value.answer, incorrectCount: typeof value.incorrectCount === 'number' && value.incorrectCount > 0 ? value.incorrectCount : 1, lastSeenAt: typeof value.lastSeenAt === 'string' ? value.lastSeenAt : '' }] : []
      }).sort((a, b) => b.incorrectCount - a.incorrectCount || b.lastSeenAt.localeCompare(a.lastSeenAt))
    } catch { return [] as Array<{ question: JLPTQuestion; answer: number; incorrectCount: number; lastSeenAt: string }> }
  }, [activeSet.id, allQuestions, preferences])
  const draftKey = `jlptDraft:${activeSet.id}`
  const fileRef = useRef<HTMLInputElement>(null)
  const builtInCompletedCount = jlptSets.filter((set) => completed.has(set.id)).length
  const completeImportedCount = useMemo(() => new Set(importedPacks.filter((pack) => pack.complete && pack.session).map((pack) => `${pack.year}-${pack.session}-${pack.level}`)).size, [importedPacks])
  const fullPaperImportedCount = useMemo(() => importedPacks.filter((pack) => pack.fullPaper).length, [importedPacks])
  const importedCompleteKeys = useMemo(() => new Set(importedPacks.filter((pack) => pack.complete && pack.session).map((pack) => `${pack.year}-${pack.session}-${pack.level}`)), [importedPacks])

  useEffect(() => {
    let cancelled = false
    setSubmitted(false)
    void db.preferences.get(draftKey).then((row) => {
      if (cancelled) return
      try {
        const value = typeof row?.value === 'string' ? JSON.parse(row.value) : {}
        setAnswers(value && typeof value === 'object' ? value as Record<string, number> : {})
      } catch {
        setAnswers({})
      }
    })
    return () => { cancelled = true }
  }, [draftKey])
  useEffect(() => {
    const value = preferences.find((row) => row.key === 'jlptSupport')?.value
    if (value === 'off' || value === 'reading' || value === 'full') setSupport(value)
    const mode = preferences.find((row) => row.key === 'jlptPracticeMode')?.value
    if (mode === 'learn' || mode === 'exam') setPracticeMode(mode)
  }, [preferences])
  useEffect(() => {
    const saved = preferences.find((row) => row.key === 'jlptActiveSet')?.value
    const savedSet = typeof saved === 'string' ? allSets.find((set) => set.id === saved) : undefined
    if (savedSet && savedSet.id !== activeSetId) {
      setActiveSetId(savedSet.id)
      setLevel(savedSet.level)
      setYear(savedSet.year)
    }
  }, [activeSetId, allSets, preferences])
  const timedExam = practiceMode === 'exam' && questionFilter === 'all' && activeSet.complete === true
  useEffect(() => {
    if (!timedExam || submitted) {
      setExamSecondsLeft(null)
      return
    }
    const duration = jlptExamBlueprint[activeSet.level].minutes.reduce((sum, minutes) => sum + minutes, 0) * 60
    const startedAt = Date.now()
    setExamSecondsLeft(duration)
    const timer = window.setInterval(() => {
      setExamSecondsLeft(Math.max(0, duration - Math.floor((Date.now() - startedAt) / 1000)))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [activeSet.complete, activeSet.id, activeSet.level, practiceMode, questionFilter, submitted])

  function chooseSet(nextLevel: JLPTLevel, nextYear: number) {
    setLevel(nextLevel)
    setYear(nextYear)
    setActiveSetId(`jlpt-${nextYear}-${nextLevel.toLowerCase()}`)
    setAnswers({})
    setSubmitted(false)
    setQuestionFilter('all')
    void setPreference('jlptActiveSet', `jlpt-${nextYear}-${nextLevel.toLowerCase()}`).catch(() => onNotify('JLPT 当前题库位置未保存，本次仍可继续使用。', 'error'))
  }
  function changeSupport(next: JLPTSupport) {
    setSupport(next)
    void setPreference('jlptSupport', next).catch(() => onNotify('JLPT 辅助层偏好未保存，本次仍可继续使用。', 'error'))
  }
  function retryQuestion(question: JLPTQuestion) {
    setQuestionFilter(question.section)
    setSubmitted(false)
    setAnswers((current) => {
      const next = { ...current }
      delete next[question.id]
      void setPreference(`jlptDraft:${activeSet.id}`, JSON.stringify(next)).catch(() => onNotify('本题草稿未保存，请稍后重试。', 'error'))
      return next
    })
    window.setTimeout(() => document.getElementById(`jlpt-question-${question.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }
  async function importPacks(files: File[]) {
    if (!files.length) return
    setImporting(true)
    try {
      const packs = await Promise.all(files.map(async (file) => parseImportedJLPTPack(await file.text())))
      if (new Set(packs.map((pack) => pack.id)).size !== packs.length) throw new Error('本次选择的题库 id 不能重复')
      const existingSlots = new Map(importedPacks.flatMap((pack) => { const key = importedSlotKey(pack); return key ? [[key, pack.id] as const] : [] }))
      const seenSlots = new Map<string, string>()
      for (const pack of packs) {
        const key = importedSlotKey(pack)
        if (!key) continue
        const conflict = existingSlots.get(key) ?? seenSlots.get(key)
        if (conflict && conflict !== pack.id) throw new Error(`${pack.year} 年 ${pack.session} 场 ${pack.level} 已有另一套完整题库（${conflict}）；请使用相同 id 更新，或先移除旧题库`)
        seenSlots.set(key, pack.id)
      }
      await db.preferences.bulkPut(packs.map((pack) => ({ key: `jlptImportedPack:${pack.id}`, value: JSON.stringify(pack) })))
      const pack = packs[0]
      setLevel(pack.level)
      setYear(pack.year)
      setActiveSetId(pack.id)
      await setPreference('jlptActiveSet', pack.id)
      setAnswers({})
      setSubmitted(false)
      setQuestionFilter('all')
      onNotify(packs.length === 1 ? `已导入 ${pack.title}，共 ${pack.questions.length} 题。` : `已批量导入 ${packs.length} 套题库，首套为 ${pack.title}。`)
    } catch (error) {
      onNotify(error instanceof Error ? error.message : '题库导入失败，请检查 JSON。', 'error')
    } finally {
      setImporting(false)
    }
  }
  async function removePack(packId: string) {
    const packPrefixes = [
      `jlptImportedPack:${packId}`,
      `jlptCompleted:${packId}`,
      `jlptSectionCompleted:${packId}:`,
      `jlptScore:${packId}`,
      `jlptLastAttempt:${packId}`,
      `jlptMistakes:${packId}`,
      `jlptDraft:${packId}`,
    ]
    const preferenceKeys = (await db.preferences.toArray()).map((row) => row.key).filter((key) => packPrefixes.some((prefix) => key === prefix || key.startsWith(prefix)))
    await db.preferences.bulkDelete(preferenceKeys)
    if (activeSetId === packId) {
      setActiveSetId(`jlpt-${year}-${level.toLowerCase()}`)
      void setPreference('jlptActiveSet', `jlpt-${year}-${level.toLowerCase()}`)
      setAnswers({})
      setSubmitted(false)
      setQuestionFilter('all')
    }
    onNotify('已移除本机导入题库。')
  }
  function submit() {
    if (visibleQuestions.some((question) => answers[question.id] === undefined)) {
      onNotify('请先完成当前练习包的每一道题。', 'error')
      return
    }
    setSubmitted(true)
    const attemptKey = questionFilter === 'all' ? activeSet.id : `${activeSet.id}:${questionFilter}`
    const previousMistakes = (() => {
      const raw = preferences.find((item) => item.key === `jlptMistakes:${activeSet.id}`)
      if (typeof raw?.value !== 'string') return [] as JLPTMistakeRecord[]
      try {
        const parsed = JSON.parse(raw.value) as Array<Partial<JLPTMistakeRecord>>
        return parsed.filter((item): item is JLPTMistakeRecord => typeof item.id === 'string' && typeof item.answer === 'number').map((item) => ({ id: item.id, answer: item.answer, incorrectCount: typeof item.incorrectCount === 'number' && item.incorrectCount > 0 ? item.incorrectCount : 1, lastSeenAt: typeof item.lastSeenAt === 'string' ? item.lastSeenAt : '' }))
      } catch { return [] as JLPTMistakeRecord[] }
    })()
    const mistakesById = new Map(previousMistakes.map((mistake) => [mistake.id, mistake]))
    const attemptedAt = new Date().toISOString()
    for (const question of visibleQuestions) {
      if (answers[question.id] === question.answer) mistakesById.delete(question.id)
      else {
        const previous = mistakesById.get(question.id)
        mistakesById.set(question.id, { id: question.id, answer: answers[question.id], incorrectCount: (previous?.incorrectCount ?? 0) + 1, lastSeenAt: attemptedAt })
      }
    }
    const mistakes = [...mistakesById.values()].sort((a, b) => b.incorrectCount - a.incorrectCount || b.lastSeenAt.localeCompare(a.lastSeenAt))
    void Promise.all([
      questionFilter === 'all' ? setPreference(`jlptCompleted:${activeSet.id}`, true) : setPreference(`jlptSectionCompleted:${attemptKey}`, true),
      setPreference(`jlptScore:${attemptKey}`, score),
      setPreference(`jlptLastAttempt:${attemptKey}`, new Date().toISOString()),
      setPreference(draftKey, JSON.stringify(answers)),
      setPreference(`jlptMistakes:${activeSet.id}`, JSON.stringify(mistakes)),
    ]).catch(() => onNotify('JLPT 练习结果未写入本机，请重试。', 'error'))
    onNotify('练习结果已显示；请按题目下的步骤回看。')
  }
  const score = visibleQuestions.filter((question) => answers[question.id] === question.answer).length
  const sectionScores = useMemo(() => [...new Set(questions.map((question) => question.section))].map((section) => {
    const sectionQuestions = questions.filter((question) => question.section === section)
    return { section, correct: sectionQuestions.filter((question) => answers[question.id] === question.answer).length, total: sectionQuestions.length }
  }), [answers, questions])
  return (
    <div className="page-stack jlpt-page">
      <header className="page-intro">
        <h1>JLPT 题型训练</h1>
        <p>按 N5–N2、年份和题型建立近七年的学习路线。内置内容是逐题教学包；有授权的完整历年试卷可导入本机，按场次、科目和音频原样练习。</p>
      </header>
      <section className="jlpt-intro-panel">
        <div className="jlpt-intro-icon"><GraduationCap size={24} /></div>
        <div>
          <h2>从基础开始，逐层读懂</h2>
          <p>初学者先看原句和释义，再隐藏辅助重复作答；N3/N2 题目增加结构拆解，避免只背答案。</p>
        </div>
        <span className="jlpt-progress-label"><strong>{builtInCompletedCount}</strong> / 28 教学包已练 · <strong>{fullPaperImportedCount}</strong> 套整卷资料 · <strong>{completeImportedCount}</strong> / {jlptFullExamSlotCount} 场近七年完整真题</span>
        <button className="outline-button compact" disabled={importing} onClick={() => fileRef.current?.click()}>{importing ? '正在读取…' : '导入本机题库/原卷资料 JSON（可多选）'}</button>
        <button className="text-button compact" onClick={() => downloadImportTemplate(downloadText)}>下载模板</button>
        <button className="text-button compact" onClick={() => downloadCompleteImportTemplate(downloadText)}>完整题库模板</button>
        <button className="text-button compact" onClick={() => downloadJLPTLevelFieldTemplate(downloadText, level, year)}>当前等级字段模板</button>
        <button className="text-button compact" onClick={() => downloadJLPTCoverageManifest(downloadText)}>下载 52 场清单</button>
        <input ref={fileRef} className="sr-only" type="file" multiple accept="application/json,.json" onChange={(event) => { void importPacks(Array.from(event.target.files ?? [])); event.currentTarget.value = '' }} />
      </section>
      <section className="jlpt-controls" aria-label="选择 JLPT 练习范围">
        <div className="jlpt-levels">
          {jlptLevels.map((item) => (
            <button key={item} className={item === level ? 'jlpt-level active' : 'jlpt-level'} onClick={() => chooseSet(item, year)}>{item}</button>
          ))}
        </div>
        <label>
          <span>年份索引</span>
          <select value={year} onChange={(event) => chooseSet(level, Number(event.target.value))}>
            {jlptYears.map((item) => <option key={item} value={item}>{item} 年</option>)}
          </select>
        </label>
      </section>
      <p className="jlpt-blueprint"><strong>{level} 完整卷结构：</strong>{jlptExamBlueprint[level].sections.join(' · ')}；建议考试计时 {jlptExamBlueprint[level].minutes.join(' + ')} 分钟。近七年实际场次按年份为 {jlptYears.map((item) => `${item}（${jlptExamSessionsByYear[item].join('、')}）`).join('、')}；导入题库时应覆盖对应科目。</p>
      <section className="jlpt-level-guide" aria-label={`${level} 分级学习指南`}>
        <div><span className="jlpt-guide-kicker">{level} 学习指南</span><h2>{jlptLevelGuides[level].title}</h2><p><strong>日语重点：</strong>{jlptLevelGuides[level].japaneseFocus}</p><p><strong>中文策略：</strong>{jlptLevelGuides[level].chineseStrategy}</p></div>
        <ol>{jlptLevelGuides[level].steps.map((step) => <li key={step}>{step}</li>)}</ol>
      </section>
      <section className="jlpt-year-grid" aria-label="近七年练习包">
        {jlptSets.filter((set) => set.level === level).map((set) => (
          <button key={set.id} className={`jlpt-set ${set.id === activeSet.id ? 'active' : ''}`} onClick={() => chooseSet(set.level, set.year)}>
            <span>{set.year}</span>
            <strong>{set.level} · 题型训练</strong>
            <small>{completed.has(set.id) ? '教学包已练' : `${set.questionIds.length} 题原创教学包`}</small>
          </button>
        ))}
      </section>
      <details className="jlpt-slot-details">
        <summary><span>查看 52 场完整真题覆盖清单</span><small>{completeImportedCount} / {jlptFullExamSlotCount} 已导入</small></summary>
        <div className="jlpt-slot-groups">
          {jlptYears.map((slotYear) => <div className="jlpt-slot-group" key={slotYear}><strong>{slotYear}</strong><div>{jlptExamSessionsByYear[slotYear].flatMap((session) => jlptLevels.map((slotLevel) => { const key = `${slotYear}-${session}-${slotLevel}`; const ready = importedCompleteKeys.has(key); return <span className={ready ? 'ready' : ''} key={key}>{session} · {slotLevel} · {ready ? '已导入' : '待导入'}</span> }))}</div></div>)}
        </div>
      </details>
      {importedPacks.length > 0 && (
        <section className="jlpt-imported-section" aria-label="已导入的 JLPT 资料">
          <div className="section-heading"><h2>已导入的 JLPT 资料</h2><span className="field-hint">只显示本机导入内容，完整卷与复盘包分开标注</span></div>
          <div className="jlpt-imported-grid">
            {importedSets.map((set) => {
              const pack = importedPacks.find((item) => item.id === set.id)
              return <div className="jlpt-imported-card" key={set.id}><button className={`jlpt-set ${set.id === activeSet.id ? 'active' : ''}`} onClick={() => { setLevel(set.level); setYear(set.year); setActiveSetId(set.id); setAnswers({}); setSubmitted(false); setQuestionFilter('all'); void setPreference('jlptActiveSet', set.id) }}><span>{set.year} 年 {set.session ? `第 ${set.session} 场` : ''} · {set.level}</span><strong>{set.title}</strong><small>{set.complete ? `完整真题 · ${set.questionCount ?? set.questionIds.length} 题 · 分区已核对` : set.rawSections && set.questionIds.length ? `原卷题目复盘 · ${set.questionCount ?? set.questionIds.length} 题 + ${Object.keys(set.rawSections).length} 个文本分区` : set.rawSections ? `原卷语料复盘 · ${Object.keys(set.rawSections).length} 个文本分区` : set.contentKind === 'full-paper' ? `${set.year < 2019 ? '完整历史整卷' : '完整个人整卷'} · ${set.questionCount ?? set.questionIds.length} 题` : set.contentKind === 'original-practice' ? `原创练习 · ${set.questionCount ?? set.questionIds.length} 题` : set.contentKind === 'text-excerpt' ? `文字词汇/阅读资料 · ${set.questionCount ?? set.questionIds.length} 题` : `导入题库 · ${set.questionIds.length} 题`}</small></button><div className="jlpt-imported-actions">{set.sourceUrl && <a href={set.sourceUrl} target="_blank" rel="noreferrer">原始来源</a>}{pack?.rightsEvidenceUrl && <a href={pack.rightsEvidenceUrl} target="_blank" rel="noreferrer">授权依据</a>}<button className="jlpt-remove-button" aria-label={`移除 ${set.title}`} onClick={() => void removePack(set.id)}><TrashSimple size={15} /> 移除</button></div>{pack?.rightsBasis && <small className="jlpt-rights-basis">使用依据：{pack.rightsBasis}</small>}</div>
            })}
          </div>
        </section>
      )}
      <section className="jlpt-resource-route" aria-labelledby="jlpt-resource-route-title">
        <div className="section-heading"><div><h2 id="jlpt-resource-route-title">公开资料学习路线</h2><p className="field-hint">先用真实场景建立理解，再回到当前等级做题。</p></div><span className="field-hint">当前 {level}</span></div>
        <ol className="jlpt-resource-list">
          {jlptResourceRoutes.map((resource, index) => <li key={resource.url}>
            <div className="jlpt-resource-meta"><span>{index + 1}</span><a href={resource.url} target="_blank" rel="noreferrer">{resource.label} <ArrowRight size={14} /></a><small>{resource.level}</small></div>
            <p className="jlpt-resource-goal" lang="ja">{resource.japaneseGoal}</p>
            <p>{resource.chineseMethod}</p>
            <ol className="jlpt-resource-steps">{resource.studySteps.map((step) => <li key={step}>{step}</li>)}</ol>
          </li>)}
        </ol>
      </section>
      <div className="jlpt-workbench">
        <article className="jlpt-practice-panel">
          <div className="section-heading">
            <div>
              <h2>{activeSet.title}</h2>
              <p className="field-hint">{activeSet.note}</p>
            </div>
            <div className="jlpt-practice-tools">
              {rawOnlyPack ? <span className="jlpt-raw-mode-label">原卷文本复盘 · 可直接选中日语解释</span> : <>
                <label><span className="sr-only">练习模式</span><select aria-label="练习模式" value={practiceMode} onChange={(event) => { const next = event.target.value as JLPTPracticeMode; setPracticeMode(next); void setPreference('jlptPracticeMode', next).catch(() => onNotify('练习模式偏好未保存，本次仍可继续使用。', 'error')); setSubmitted(false) }}><option value="learn">学习模式</option><option value="exam">考试模式</option></select></label>
                <label><span className="sr-only">JLPT 辅助层</span><select aria-label="JLPT 辅助层" value={support} onChange={(event) => changeSupport(event.target.value as JLPTSupport)}><option value="off">关闭辅助</option><option value="reading">显示读音</option><option value="full">读音 + 罗马音 + 释义</option></select></label>
                <label><span className="sr-only">题型筛选</span><select aria-label="题型筛选" value={questionFilter} onChange={(event) => { setQuestionFilter(event.target.value as JLPTSection | 'all'); setSubmitted(false) }}><option value="all">整套试卷</option>{[...new Set(questions.map((question) => question.section))].map((section) => <option key={section} value={section}>{section}</option>)}</select></label>
                <span className="jlpt-section-count"><ListChecks size={17} /> {visibleQuestions.length} / {questions.length} 题</span>
                {activeSet.complete && <span className="jlpt-section-progress">已完成科目 {completedSections.size} / 4</span>}
              </>}
            </div>
          </div>
          {timedExam && examSecondsLeft !== null && <div className={`jlpt-exam-timer ${examSecondsLeft < 300 ? 'warning' : ''}`} role="timer" aria-label="完整试卷剩余时间"><span>完整试卷计时</span><strong>{formatCountdown(examSecondsLeft)}</strong><small>{examSecondsLeft === 0 ? '时间已到，请提交当前答案。' : '按官方建议时长计时；时间到后仍可提交并查看解析。'}</small></div>}
          {rawOnlyPack ? <RawCorpusViewer pack={activeImportedPack as ImportedJLPTPack} /> : <div className="jlpt-questions">
            {visibleQuestions.map((question, index) => (
              <JLPTQuestionRow key={question.id} question={question} index={index} value={answers[question.id]} submitted={submitted} mode={practiceMode} support={support} onChange={(value) => { const next = { ...answers, [question.id]: value }; setAnswers(next); void setPreference(draftKey, JSON.stringify(next)).catch(() => onNotify('本题草稿未保存，请稍后重试。', 'error')) }} />
            ))}
          </div>}
          {!rawOnlyPack && activeImportedPack?.rawSections && <details className="jlpt-raw-source-details">
            <summary>查看本机原卷文字、答案线索和听力入口</summary>
            <RawCorpusViewer pack={activeImportedPack} />
          </details>}
          {!rawOnlyPack && persistedMistakes.length > 0 && <section className="jlpt-mistakes" aria-label="本套真题错题回看"><div className="section-heading"><h3>本套最近错题</h3><span className="field-hint">{persistedMistakes.length} 道 · 按错误次数</span></div>{persistedMistakes.map(({ question, answer, incorrectCount }) => <details key={question.id}><summary>{question.prompt}<small>错 {incorrectCount} 次 · {question.section}</small></summary><div><p>你的选择：{answer === -2 ? '不知道' : question.options[answer] ?? '未记录'}</p><p className="correct-answer">正确答案：{question.options[question.answer]}</p><p>{question.explanation}</p><button className="outline-button compact" onClick={() => retryQuestion(question)}>重新答这题</button></div></details>)}</section>}
          {!rawOnlyPack && (submitted ? (
            <div className="jlpt-result" role="status">
              <CheckCircle size={20} />
              本组答对 {score} / {visibleQuestions.length}。建议把错题下的“学习步骤”读一遍，再切换辅助层重做。
              {activeSet.complete && questionFilter === 'all' && <div className="jlpt-result-sections" aria-label="完整试卷分科得分">{sectionScores.map((item) => <span key={item.section}>{item.section} {item.correct} / {item.total}</span>)}</div>}
              <button className="outline-button" onClick={() => { setAnswers({}); setSubmitted(false) }}>重新作答</button>
            </div>
          ) : (
            <button className="primary-button jlpt-submit" onClick={submit}>提交本组并查看解析 <ArrowRight size={17} /></button>
          ))}
        </article>
        <aside className="jlpt-side-note">
          <h2><Info size={18} /> 资料边界与使用方式</h2>
          <p>安装包内是原创仿真题和逐题中文教学。完整历年试卷与公开原卷语料只接受本机 JSON 导入，并只保存在本机备份中；导入时保留来源和使用依据，避免把个人资料包带入公开仓库。</p>
          <ul>
            <li>先看日文原句，尝试自己读。</li>
            <li>再打开读音、释义和罗马音辅助。</li>
            <li>错题记录到“收藏/笔记”，第二天先重做。</li>
          </ul>
          <details className="jlpt-format-details">
            <summary>完整真题 JSON 需要哪些字段？</summary>
            <p>将 <code>complete</code> 设为 true 时，必须填写真实来源、<code>rightsBasis</code>（授权或个人使用依据）、<code>session</code>、<code>questionCount</code>、<code>sectionQuestionCounts</code> 和每道题的正整数 <code>questionNumber</code>；每题还要有平假名、中文释义、逐题解析和至少两步学习步骤。题数必须达到该等级和年份格式的整场试卷下限，四个学习分区的数量必须与实际题目一致，每道聴解题必须有真实 <code>http(s) audioUrl</code>。2020 年只接受 12 月场。这会阻止把几道题的教学节选误标成完整真题。</p>
          </details>
          <div className="jlpt-source-list">
            <details className="jlpt-official-details">
              <summary>打开 {level} 官方公开练习册</summary>
              {jlptOfficialPracticeLinks[level].map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} <ArrowRight size={14} /></a>)}
            </details>
            {jlptSources.map((source) => <div className="jlpt-source-item" key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} <ArrowRight size={14} /></a>{source.note && <small>{source.note}</small>}</div>)}
          </div>
        </aside>
      </div>
    </div>
  )
}

function importedSlotKey(pack: ImportedJLPTPack): string | undefined {
  return pack.complete && pack.session ? `${pack.year}-${pack.session}-${pack.level}` : undefined
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function downloadText(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function RawCorpusViewer({ pack }: { pack: ImportedJLPTPack }) {
  const sections = Object.entries(pack.rawSections ?? {}) as Array<[string, string]>
  const answerGroups = Object.entries(pack.answerKey ?? {})
  return (
    <section className="jlpt-raw-corpus" aria-label="原卷语料复盘">
      <div className="jlpt-raw-corpus-intro">
        <span className="jlpt-guide-kicker">原卷语料复盘</span>
        <h3>先读原文，再用答案线索复盘</h3>
        <p>这份本机资料保留了公开语料中的原文分区、答案线索和听力脚本。不同场次的 OCR、答案或听力可能不完整，因此它用于精读、选中解释和错因记录，不计入完整真题得分。</p>
      </div>
      <div className="jlpt-raw-corpus-sections">
        {sections.map(([section, body]) => (
          <details className="jlpt-raw-section" key={section} open={section === '文字・語彙' || section === '全文'}>
            <summary><span>{section}</span><small>{body.length.toLocaleString()} 字</small></summary>
            <div className="jlpt-raw-text" lang="ja">{body}</div>
          </details>
        ))}
      </div>
      {answerGroups.length > 0 && <details className="jlpt-raw-answer-key">
        <summary>查看答案线索（用于复盘，不代表官方计分）</summary>
        <pre>{JSON.stringify(pack.answerKey, null, 2)}</pre>
      </details>}
      {pack.listeningAudioUrl && <div className="jlpt-raw-audio">
        <span>本场听力音频</span>
        <audio controls preload="metadata" src={pack.listeningAudioUrl} aria-label={`${pack.year} 年 ${pack.session ?? ''} 场 ${pack.level} 听力音频`} />
      </div>}
      {pack.listeningScript && <details className="jlpt-raw-listening">
        <summary>查看听力原文</summary>
        <div className="jlpt-raw-text" lang="ja">{pack.listeningScript}</div>
      </details>}
    </section>
  )
}

function JLPTQuestionRow({ question, index, value, submitted, mode, support, onChange }: { question: JLPTQuestion; index: number; value?: number; submitted: boolean; mode: JLPTPracticeMode; support: JLPTSupport; onChange: (value: number) => void }) {
  const promptLayer = mode === 'learn' && support !== 'off' ? (support === 'full' ? 'full' : 'furigana') : 'off'
  const quotedPrompt = question.prompt.match(/^(.*?)(「[^」]+」)(.*)$/u)
  return (
    <fieldset id={`jlpt-question-${question.id}`} className={`jlpt-question ${submitted ? 'submitted' : ''}`}>
      <legend><span>{index + 1}</span><b>{question.section}</b>{question.questionNumber !== undefined && <em>原题第 {question.questionNumber} 题</em>}{question.itemType && <em>{question.itemType}</em>}<span className="jlpt-question-prompt">{quotedPrompt && promptLayer !== 'off' ? <><span>{quotedPrompt[1]}</span><LayeredJapanese as="span" segments={[{ text: quotedPrompt[2].slice(1, -1), reading: question.reading }]} layer={promptLayer} /><span>{quotedPrompt[3]}</span></> : question.prompt}</span></legend>
      {mode === 'learn' && support !== 'off' && (question.reading || question.gloss) && <div className="jlpt-question-support">{support === 'full' && question.reading && <small>{kanaToRomaji(question.reading)}</small>}<span lang="ja">{question.reading ?? '暂无读音'}</span>{support === 'full' && question.gloss && <strong>{question.gloss}</strong>}</div>}
      {question.imageUrl && <img className="jlpt-question-image" src={question.imageUrl} alt="题目图片" loading="lazy" />}
      {question.audioUrl && <audio className="jlpt-question-audio" controls preload="metadata" src={question.audioUrl} aria-label={`第 ${index + 1} 题听力`} />}
      {!question.audioUrl && question.audioText && <button className="outline-button compact jlpt-speech-button" onClick={() => speakJapanese(question.audioText as string)}><SpeakerHigh size={16} /> 播放合成日语朗读</button>}
      <div className="jlpt-options">
        {question.options.map((option, optionIndex) => (
          <label key={option} className={`${value === optionIndex ? 'chosen' : ''} ${submitted && optionIndex === question.answer ? 'correct' : ''} ${submitted && value === optionIndex && optionIndex !== question.answer ? 'incorrect' : ''}`}>
            <input type="radio" name={question.id} checked={value === optionIndex} disabled={submitted} onChange={() => onChange(optionIndex)} />
            <span><b className="jlpt-option-letter">{String.fromCharCode(65 + optionIndex)}.</b> {/^[\u3040-\u30ff\u3400-\u9fff]/u.test(option) && promptLayer !== 'off' ? <LayeredJapanese as="span" segments={[{ text: option }]} layer={promptLayer} /> : option}</span>
          </label>
        ))}
      </div>
      {submitted && (
        <div className="jlpt-explanation">
          <p><strong>{question.reading}</strong>{question.gloss ? ` · ${question.gloss}` : ''}</p>
          <p>{question.explanation}</p>
          <ol>{question.studySteps.map((step) => <li key={step}>{step}</li>)}</ol>
          {question.sourceUrl && <a className="jlpt-question-source" href={question.sourceUrl} target="_blank" rel="noreferrer">查看原始来源</a>}
        </div>
      )}
    </fieldset>
  )
}

function speakJapanese(text: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.78
  window.speechSynthesis.speak(utterance)
}
