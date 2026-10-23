import { cards, readings, type CourseUnit } from './content'
import { useEffect, useState } from 'react'
import AnnotationControl, { AnnotationNote, type Annotation } from './AnnotationControl'
import StudyLayerControl from './StudyLayerControl'
import LayeredJapanese from './LayeredJapanese'
import { isStudyLayer, type StudyLayer } from './language'
import { db, setPreference } from './db'

export default function UnitGuide({ unit, onNotify }: { unit: CourseUnit; onNotify?: (message: string, kind?: 'success' | 'error') => void }) {
  const [annotation, setAnnotation] = useState<Annotation>('off')
  const [studyLayer, setStudyLayer] = useState<StudyLayer>('off')
  const studyLayerKey = `studyLayer:unit:${unit.id}`
  useEffect(() => {
    void db.preferences.get(studyLayerKey).then((row) => { if (isStudyLayer(row?.value)) setStudyLayer(row.value) })
  }, [studyLayerKey])
  const reading = readings.find(item => item.id === unit.readingId)!
  const unitCards = unit.cardIds.map(id => cards.find(card => card.id === id)!)
  return (
    <details className="unit-guide">
      <summary>本单元学习要点 <span>词句、例句与复盘</span></summary>
      <div className="unit-guide-content">
        <h3>读的时候，留意这些</h3>
        <ul>{reading.focus.map(text => <li key={text}>{text}</li>)}</ul>
        <div className="guide-toolbar"><h3>六个重点词句</h3><div className="reading-tools"><StudyLayerControl value={studyLayer} onChange={(next) => { setStudyLayer(next); void setPreference(studyLayerKey, next).catch(() => onNotify?.('学习层偏好未保存，请重试。', 'error')) }} /><AnnotationControl label="字体注音" value={annotation} onChange={setAnnotation} /></div></div>
        {annotation === 'font' && <AnnotationNote />}
        <dl className="guide-phrases">
          {unitCards.map(card => <div key={card.id}>
            <dt><LayeredJapanese segments={[{ text: card.front, reading: card.reading }]} layer={studyLayer} />{card.reading && studyLayer === 'off' && <small lang="ja">{card.reading}</small>}</dt>
            <dd><p>{card.back}</p><LayeredJapanese segments={[{ text: card.example }]} layer={studyLayer} className={`guide-example ${annotation === 'font' ? 'font-furigana' : ''}`} />{card.note && <p className="field-hint">{card.note}</p>}</dd>
          </div>)}
        </dl>
        <h3>学完后，试着说一说</h3>
        <p>{unit.reflection}</p>
        <p className="field-hint">整理自本单元现有试用材料，教师审校待完成。先理解例句，再回到卡片中试着回忆。</p>
      </div>
    </details>
  )
}
