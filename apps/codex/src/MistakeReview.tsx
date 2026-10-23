import { useState } from 'react'
import type { Attempt } from './db'
import { materialTitle } from './content'
import { latestMistakes } from './mistakes'

export default function MistakeReview({ attempts, openMaterial }: {
  attempts: Attempt[]
  openMaterial: (kind: 'reading' | 'listening', id: string) => void
}) {
  const [kind, setKind] = useState('all')
  const [evidence, setEvidence] = useState('all')
  const [visible, setVisible] = useState(8)
  const { items, unavailable } = latestMistakes(attempts)
  const filtered = items.filter(x => (kind === 'all' || x.attempt.kind === kind) && (evidence === 'all' || x.evidence === evidence))
  return <section className="mistake-review" aria-labelledby="mistakes-title">
    <div className="section-heading"><h2 id="mistakes-title">错题复盘</h2><span className="field-hint">{items.length} 道待回看</span></div>
    <p className="field-hint">只看每份材料最新一次作答；重新答对后移出。查看解析不算新的练习。</p>
    <div className="mistake-filters">
      <select aria-label="错题类型" value={kind} onChange={e => { setKind(e.target.value); setVisible(8) }}><option value="all">阅读与听音</option><option value="reading">阅读</option><option value="listening">听音</option></select>
      <select aria-label="错题作答条件" value={evidence} onChange={e => { setEvidence(e.target.value); setVisible(8) }}><option value="all">全部作答条件</option>{[...new Set(items.map(x => x.evidence))].map(label => <option key={label}>{label}</option>)}</select>
    </div>
    <p className="field-hint" role="status">当前显示 {filtered.length} 道错题</p>
    {filtered.length ? <ul className="mistake-list">{filtered.slice(0,visible).map(({attempt,question,index,evidence}) => <li key={`${attempt.id}:${question.id}`}>
      <details>
        <summary><strong>{question.prompt}</strong><span>{materialTitle(attempt.materialId)} · 第 {index+1} 题</span><small>{evidence} · {new Intl.DateTimeFormat('zh-CN',{dateStyle:'short'}).format(new Date(attempt.completedAt))}</small></summary>
        <div className="mistake-analysis"><p>你的选择：{attempt.answers[index] === -2 ? '不知道' : question.options[attempt.answers[index]]}</p><p className="correct-answer">正确答案：{question.options[question.answer]}</p><p>{question.explanation}</p><button className="outline-button" onClick={() => openMaterial(attempt.kind as 'reading'|'listening',attempt.materialId)}>回到材料与练习</button></div>
      </details>
    </li>)}</ul> : <div className="quiet-empty"><p>{items.length ? '当前筛选没有错题，可切换作答条件。' : '当前没有待回看的错题。阅读或听音提交后，答错和“不知道”的题会显示在这里。'}</p></div>}
    {filtered.length > visible && <button className="outline-button" onClick={() => setVisible(x=>x+8)}>再显示 8 道</button>}
    {unavailable > 0 && <p className="field-hint">{unavailable} 份历史材料的题目无法可靠匹配，保留在练习记录中。</p>}
  </section>
}
