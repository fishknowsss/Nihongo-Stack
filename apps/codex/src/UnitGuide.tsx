import { cards, readings, type CourseUnit } from './content'
import { useState } from 'react'
import AnnotationControl, { AnnotationNote, type Annotation } from './AnnotationControl'

export default function UnitGuide({ unit }: { unit: CourseUnit }) {
  const [annotation, setAnnotation] = useState<Annotation>('off')
  const reading = readings.find(item => item.id === unit.readingId)!
  const unitCards = unit.cardIds.map(id => cards.find(card => card.id === id)!)
  return (
    <details className="unit-guide">
      <summary>本单元学习要点 <span>词句、例句与复盘</span></summary>
      <div className="unit-guide-content">
        <h3>读的时候，留意这些</h3>
        <ul>{reading.focus.map(text => <li key={text}>{text}</li>)}</ul>
        <div className="guide-toolbar"><h3>六个重点词句</h3><AnnotationControl label="例句注音" value={annotation} onChange={setAnnotation} /></div>
        {annotation === 'font' && <AnnotationNote />}
        <dl className="guide-phrases">
          {unitCards.map(card => <div key={card.id}>
            <dt><span lang="ja">{card.front}</span>{card.reading && <small lang="ja">{card.reading}</small>}</dt>
            <dd><p>{card.back}</p><p className={`guide-example ${annotation === 'font' ? 'font-furigana' : ''}`} lang="ja">{card.example}</p>{card.note && <p className="field-hint">{card.note}</p>}</dd>
          </div>)}
        </dl>
        <h3>学完后，试着说一说</h3>
        <p>{unit.reflection}</p>
        <p className="field-hint">整理自本单元现有试用材料，教师审校待完成。先理解例句，再回到卡片中试着回忆。</p>
      </div>
    </details>
  )
}
