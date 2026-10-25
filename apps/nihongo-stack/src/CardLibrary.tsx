import { useEffect, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { BookmarkSimple } from '@phosphor-icons/react/dist/csr/BookmarkSimple'
import { cards, courseUnits } from './catalog'
import {
  db,
  setPreference,
  type CardProgress,
  type Preference,
  type ReviewEvent,
} from './db'
import { difficultCardIds } from './learning'
import AnnotationControl, { AnnotationNote, type Annotation } from './AnnotationControl'
import StudyLayerControl from './StudyLayerControl'
import LayeredJapanese from './LayeredJapanese'
import { isStudyLayer, type StudyLayer } from './language'

const kinds = { kana: '假名', vocabulary: '词汇', grammar: '语法' }
export default function CardLibrary({
  progress,
  events,
  preferences,
  now,
  onNotify,
  onReview,
}: {
  progress: CardProgress[]
  events: ReviewEvent[]
  preferences: Preference[]
  now: number
  onNotify: (message: string, kind?: 'success' | 'error') => void
  onReview: () => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [unit, setUnit] = useState('all')
  const [saving, setSaving] = useState<string | null>(null)
  const [visible, setVisible] = useState(20)
  const [annotation, setAnnotation] = useState<Annotation>('off')
  const [studyLayer, setStudyLayer] = useState<StudyLayer>('off')
  const studyLayerKey = 'studyLayer:cards'
  useEffect(() => {
    void db.preferences.get(studyLayerKey).then((row) => { if (isStudyLayer(row?.value)) setStudyLayer(row.value) })
  }, [])
  const states = new Map(progress.map((row) => [row.id, row]))
  const difficult = difficultCardIds(events)
  const bookmarks = new Set(
    preferences
      .filter(
        (row) => row.key.startsWith('cardBookmark:') && row.value === true,
      )
      .map((row) => row.key.slice('cardBookmark:'.length)),
  )
  const due = (id: string) =>
    !!states.get(id) && Date.parse(states.get(id)!.dueAt) <= now
  const query = search.trim().normalize('NFKC').toLocaleLowerCase()
  const filtered = cards.filter((card) => {
    const course = courseUnits.find((item) => item.id === card.unitId)
    const text = [
      card.front,
      card.reading,
      card.back,
      card.example,
      card.note,
      course?.title,
      kinds[card.kind],
    ]
      .join(' ')
      .normalize('NFKC')
      .toLocaleLowerCase()
    return (
      (!query || text.includes(query)) &&
      (unit === 'all' ||
        (unit === 'starter' ? !card.unitId : card.unitId === unit)) &&
      (filter === 'all' ||
        (filter === 'due' && due(card.id)) ||
        (filter === 'new' && !states.has(card.id)) ||
        (filter === 'difficult' && difficult.has(card.id)) ||
        (filter === 'bookmarked' && bookmarks.has(card.id)))
    )
  })
  async function toggleBookmark(id: string) {
    if (saving) return
    setSaving(id)
    try {
      await setPreference(`cardBookmark:${id}`, !bookmarks.has(id))
    } catch {
      onNotify('收藏未保存，请重试。', 'error')
    } finally {
      setSaving(null)
    }
  }
  return (
    <div className="page-stack">
      <div className="card-library-actions">
        <button className="outline-button" onClick={onReview}>
          前往复习
          <ArrowRight size={17} />
        </button>
      </div>
      <div className="card-library-tools">
        <label className="search-field">
          <MagnifyingGlass size={19} />
          <input
            type="search"
            aria-label="搜索卡片"
            placeholder="日文、读音或中文释义"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setVisible(20) }}
          />
        </label>
        <select
          aria-label="卡片状态"
          value={filter}
          onChange={(event) => { setFilter(event.target.value); setVisible(20) }}
        >
          <option value="all">全部卡片</option>
          <option value="due">到期复习</option>
          <option value="difficult">最近困难</option>
          <option value="new">尚未引入</option>
          <option value="bookmarked">我的收藏</option>
        </select>
        <select
          aria-label="卡片单元"
          value={unit}
          onChange={(event) => { setUnit(event.target.value); setVisible(20) }}
        >
          <option value="all">全部单元</option>
          <option value="starter">起步材料</option>
          {courseUnits.map((item) => (
            <option key={item.id} value={item.id}>
              {item.order}. {item.title}
            </option>
          ))}
        </select>
      </div>
      <p className="field-hint" role="status">
        显示 {filtered.length} / {cards.length}{' '}
        张{filter === 'difficult' ? '。最近困难按最后一次「再来一次 / 有点困难」反馈筛选。' : '；展开查看释义与例句。'}
      </p>
      {filtered.length ? (
        <ul className="card-library-list">
          {filtered.slice(0, visible).map((card) => {
            const state = states.get(card.id)
            return (
              <li key={card.id}>
                <details className="card-library-detail">
                  <summary>
                    <span className="library-card-word" lang="ja">
                      {card.front}
                    </span>
                    <span className="library-card-meta">
                      {kinds[card.kind]}，{' '}
                      {courseUnits.find((item) => item.id === card.unitId)
                        ?.title ?? '起步材料'}
                      <span>
                        {!state
                          ? '尚未引入'
                          : due(card.id)
                            ? '到期复习'
                            : `下次 ${new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(state.dueAt))}`}
                        {difficult.has(card.id) ? '，最近困难' : ''}
                      </span>
                    </span>
                    <span className="library-card-expand">查看释义</span>
                  </summary>
                  <div className="library-card-answer">
                    <div className="reading-tools">
                      <StudyLayerControl value={studyLayer} onChange={(next) => { setStudyLayer(next); void setPreference(studyLayerKey, next).catch(() => onNotify('学习层偏好未保存，本次仍可继续使用。', 'error')) }} />
                      <AnnotationControl label="字体注音" value={annotation} onChange={setAnnotation} />
                    </div>
                    {annotation === 'font' && <AnnotationNote />}
                    {card.reading && <p lang="ja">{card.reading}</p>}
                    <h2>{card.back}</h2>
                    <LayeredJapanese segments={[{ text: card.example }]} layer={studyLayer} className={annotation === 'font' ? 'font-furigana' : ''} />
                    {card.note && <p className="field-hint">{card.note}</p>}
                  </div>
                </details>
                <button
                  className="bookmark-button"
                  aria-label={`${bookmarks.has(card.id) ? '取消收藏' : '收藏'} ${card.front}`}
                  aria-pressed={bookmarks.has(card.id)}
                  disabled={saving !== null}
                  onClick={() => void toggleBookmark(card.id)}
                >
                  <BookmarkSimple
                    size={21}
                    weight={bookmarks.has(card.id) ? 'fill' : 'regular'}
                  />
                  <span>
                    {saving === card.id
                      ? '保存中'
                      : bookmarks.has(card.id)
                        ? '已收藏'
                        : '收藏'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="quiet-empty">
          <p>没有符合条件的卡片。</p>
          <button
            className="outline-button"
            onClick={() => {
              setSearch('')
              setFilter('all')
              setUnit('all')
            }}
          >
            清除筛选
          </button>
        </div>
      )}
      {filtered.length > visible && <button className="outline-button load-more" onClick={() => setVisible(count => count + 20)}>再显示 {Math.min(20, filtered.length - visible)} 张（已显示 {visible} / {filtered.length}）</button>}
    </div>
  )
}
