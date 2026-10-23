import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, CheckCircle, GraduationCap, Info, ListChecks, TrashSimple } from '@phosphor-icons/react'
import { jlptExamBlueprint, jlptLevels, jlptOfficialPracticeLinks, jlptQuestions, jlptSets, jlptSources, jlptYears, type JLPTLevel, type JLPTQuestion } from './jlpt'
import { db, setPreference } from './db'
import { downloadImportTemplate, parseImportedJLPTPack } from './jlpt-import'

type Notify = (message: string, kind?: 'success' | 'error') => void

export default function JLPTPage({ onNotify }: { onNotify: Notify }) {
  const [level, setLevel] = useState<JLPTLevel>('N5')
  const [year, setYear] = useState(2025)
  const [activeSetId, setActiveSetId] = useState(`jlpt-2025-n5`)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const preferences = useLiveQuery(() => db.preferences.toArray(), []) ?? []
  const completed = useMemo(() => new Set(preferences.filter((row) => row.key.startsWith('jlptCompleted:') && row.value === true).map((row) => row.key.slice('jlptCompleted:'.length))), [preferences])
  const importedPacks = useMemo(() => preferences.flatMap((row) => {
    if (!row.key.startsWith('jlptImportedPack:') || typeof row.value !== 'string') return []
    try { return [parseImportedJLPTPack(row.value)] } catch { return [] }
  }), [preferences])
  const importedSets = useMemo(() => importedPacks.map((pack) => ({ id: pack.id, year: pack.year, level: pack.level, title: pack.title, status: 'licensed-import' as const, questionIds: pack.questions.map((question) => question.id), note: `授权导入 · ${pack.sourceName} · ${pack.license}`, complete: pack.complete })), [importedPacks])
  const allSets = useMemo(() => [...jlptSets.filter((set) => !importedSets.some((imported) => imported.id === set.id)), ...importedSets], [importedSets])
  const allQuestions = useMemo(() => [...jlptQuestions, ...importedPacks.flatMap((pack) => pack.questions)], [importedPacks])
  const activeSet = allSets.find((set) => set.id === activeSetId) ?? allSets[0]
  const questions = useMemo(() => activeSet.questionIds.map((id) => allQuestions.find((question) => question.id === id)).filter(Boolean) as JLPTQuestion[], [activeSet, allQuestions])
  const draftKey = `jlptDraft:${activeSet.id}`
  const fileRef = useRef<HTMLInputElement>(null)

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

  function chooseSet(nextLevel: JLPTLevel, nextYear: number) {
    setLevel(nextLevel)
    setYear(nextYear)
    setActiveSetId(`jlpt-${nextYear}-${nextLevel.toLowerCase()}`)
    setAnswers({})
    setSubmitted(false)
  }
  async function importPack(file?: File) {
    if (!file) return
    try {
      const pack = parseImportedJLPTPack(await file.text())
      await setPreference(`jlptImportedPack:${pack.id}`, JSON.stringify(pack))
      setLevel(pack.level)
      setYear(pack.year)
      setActiveSetId(pack.id)
      setAnswers({})
      setSubmitted(false)
      onNotify(`已导入 ${pack.title}，共 ${pack.questions.length} 题。`)
    } catch (error) {
      onNotify(error instanceof Error ? error.message : '题库导入失败，请检查 JSON。', 'error')
    }
  }
  async function removePack(packId: string) {
    await db.preferences.delete(`jlptImportedPack:${packId}`)
    if (activeSetId === packId) {
      setActiveSetId(`jlpt-${year}-${level.toLowerCase()}`)
      setAnswers({})
      setSubmitted(false)
    }
    onNotify('已移除本机导入题库。')
  }
  function submit() {
    if (questions.some((question) => answers[question.id] === undefined)) {
      onNotify('请先完成当前练习包的每一道题。', 'error')
      return
    }
    setSubmitted(true)
    void Promise.all([
      setPreference(`jlptCompleted:${activeSet.id}`, true),
      setPreference(`jlptScore:${activeSet.id}`, score),
      setPreference(`jlptLastAttempt:${activeSet.id}`, new Date().toISOString()),
      setPreference(draftKey, JSON.stringify(answers)),
    ]).catch(() => onNotify('JLPT 练习结果未写入本机，请重试。', 'error'))
    onNotify('练习结果已显示；请按题目下的步骤回看。')
  }
  const score = questions.filter((question) => answers[question.id] === question.answer).length
  return (
    <div className="page-stack jlpt-page">
      <header className="page-intro">
        <h1>JLPT 题型训练</h1>
        <p>按 N5–N2、年份和题型建立近七年的学习路线。先做一小组，再逐题看读音、中文义和解题步骤。</p>
      </header>
      <section className="jlpt-intro-panel">
        <div className="jlpt-intro-icon"><GraduationCap size={24} /></div>
        <div>
          <h2>从基础开始，逐层读懂</h2>
          <p>初学者先看原句和释义，再隐藏辅助重复作答；N3/N2 题目增加结构拆解，避免只背答案。</p>
        </div>
        <span className="jlpt-progress-label"><strong>{completed.size}</strong> / 28 包已练</span>
        <button className="outline-button compact" onClick={() => fileRef.current?.click()}>导入完整真题</button>
        <button className="text-button compact" onClick={() => downloadImportTemplate(downloadText)}>下载模板</button>
        <input ref={fileRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => { void importPack(event.target.files?.[0]); event.currentTarget.value = '' }} />
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
      <p className="jlpt-blueprint"><strong>{level} 完整卷结构：</strong>{jlptExamBlueprint[level].sections.join(' · ')}；建议考试计时 {jlptExamBlueprint[level].minutes.join(' + ')} 分钟。导入题库时应覆盖对应科目。</p>
      <section className="jlpt-year-grid" aria-label="近七年练习包">
        {jlptSets.filter((set) => set.level === level).map((set) => (
          <button key={set.id} className={`jlpt-set ${set.id === activeSet.id ? 'active' : ''}`} onClick={() => chooseSet(set.level, set.year)}>
            <span>{set.year}</span>
            <strong>{set.level} · 题型训练</strong>
            <small>{completed.has(set.id) ? '已练' : `${set.questionIds.length} 题教学包`}</small>
          </button>
        ))}
      </section>
      {importedPacks.length > 0 && (
        <section className="jlpt-imported-section" aria-label="已导入的完整真题">
          <div className="section-heading"><h2>已导入的完整真题</h2><span className="field-hint">只显示本机导入内容</span></div>
          <div className="jlpt-imported-grid">
            {importedSets.map((set) => <div className="jlpt-imported-card" key={set.id}><button className={`jlpt-set ${set.id === activeSet.id ? 'active' : ''}`} onClick={() => { setLevel(set.level); setYear(set.year); setActiveSetId(set.id); setAnswers({}); setSubmitted(false) }}><span>{set.year} · {set.level}</span><strong>{set.title}</strong><small>{set.complete ? '完整真题' : '导入题库'} · {set.questionIds.length} 题</small></button><button className="jlpt-remove-button" aria-label={`移除 ${set.title}`} onClick={() => void removePack(set.id)}><TrashSimple size={15} /> 移除</button></div>)}
          </div>
        </section>
      )}
      <div className="jlpt-workbench">
        <article className="jlpt-practice-panel">
          <div className="section-heading">
            <div>
              <h2>{activeSet.title}</h2>
              <p className="field-hint">{activeSet.note}</p>
            </div>
            <span className="jlpt-section-count"><ListChecks size={17} /> {questions.length} 题</span>
          </div>
          <div className="jlpt-questions">
            {questions.map((question, index) => (
              <JLPTQuestionRow key={question.id} question={question} index={index} value={answers[question.id]} submitted={submitted} onChange={(value) => { const next = { ...answers, [question.id]: value }; setAnswers(next); void setPreference(draftKey, JSON.stringify(next)).catch(() => onNotify('本题草稿未保存，请稍后重试。', 'error')) }} />
            ))}
          </div>
          {submitted ? (
            <div className="jlpt-result" role="status">
              <CheckCircle size={20} />
              本组答对 {score} / {questions.length}。建议把错题下的“学习步骤”读一遍，再切换辅助层重做。
              <button className="outline-button" onClick={() => { setAnswers({}); setSubmitted(false) }}>重新作答</button>
            </div>
          ) : (
            <button className="primary-button jlpt-submit" onClick={submit}>提交本组并查看解析 <ArrowRight size={17} /></button>
          )}
        </article>
        <aside className="jlpt-side-note">
          <h2><Info size={18} /> 资料边界与使用方式</h2>
          <p>安装包内是原创仿真题和逐题中文教学。已获授权的完整真题可用上方导入，题库只保存在本机备份中。</p>
          <ul>
            <li>先看日文原句，尝试自己读。</li>
            <li>再打开读音、释义和罗马音辅助。</li>
            <li>错题记录到“收藏/笔记”，第二天先重做。</li>
          </ul>
          <div className="jlpt-source-list">
            <details className="jlpt-official-details">
              <summary>打开 {level} 官方公开练习册</summary>
              {jlptOfficialPracticeLinks[level].map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} <ArrowRight size={14} /></a>)}
            </details>
            {jlptSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} <ArrowRight size={14} /></a>)}
          </div>
        </aside>
      </div>
    </div>
  )
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

function JLPTQuestionRow({ question, index, value, submitted, onChange }: { question: JLPTQuestion; index: number; value?: number; submitted: boolean; onChange: (value: number) => void }) {
  return (
    <fieldset className={`jlpt-question ${submitted ? 'submitted' : ''}`}>
      <legend><span>{index + 1}</span><b>{question.section}</b>{question.itemType && <em>{question.itemType}</em>}{question.prompt}</legend>
      {question.audioUrl && <audio className="jlpt-question-audio" controls preload="metadata" src={question.audioUrl} aria-label={`第 ${index + 1} 题听力`} />}
      <div className="jlpt-options">
        {question.options.map((option, optionIndex) => (
          <label key={option} className={`${value === optionIndex ? 'chosen' : ''} ${submitted && optionIndex === question.answer ? 'correct' : ''} ${submitted && value === optionIndex && optionIndex !== question.answer ? 'incorrect' : ''}`}>
            <input type="radio" name={question.id} checked={value === optionIndex} disabled={submitted} onChange={() => onChange(optionIndex)} />
            <span>{String.fromCharCode(65 + optionIndex)}. {option}</span>
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
