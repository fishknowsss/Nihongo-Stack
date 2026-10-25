import { useEffect, useRef, useState } from 'react'
import { BookmarkSimple, FloppyDisk, SpeakerHigh, X } from '@phosphor-icons/react'
import { db, setPreference } from './db'
import { kanaToRomaji, lookupJapanese, lookupJapaneseAsync, type LexiconEntry } from './language'

type SelectionState = { text: string; entry?: LexiconEntry; top: number; left: number }

function kanaReading(text: string): string | undefined {
  return /^[\u3040-\u30ffー\s、。！？・]+$/u.test(text) ? text : undefined
}

export default function SelectionExplainer({ onNotify }: { onNotify: (message: string, kind?: 'success' | 'error') => void }) {
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [favorite, setFavorite] = useState(false)
  const lastText = useRef('')
  const loadSequence = useRef(0)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function readSelection(force = false) {
      const current = window.getSelection()
      const text = current?.toString().trim() ?? ''
      if (!text || !/[\u3040-\u30ff\u3400-\u9fff]/u.test(text) || !current?.rangeCount) {
        lastText.current = ''
        return
      }
      const node = current.anchorNode instanceof Element ? current.anchorNode : current.anchorNode?.parentElement
      if (node?.closest('input, textarea, select, button, a')) return
      const rect = current.getRangeAt(0).getBoundingClientRect()
      if (lastText.current === text && !force) return
      lastText.current = text
      window.speechSynthesis?.cancel()
      const popupWidth = Math.min(348, Math.max(0, window.innerWidth - 24))
      const maxLeft = Math.max(12, window.innerWidth - popupWidth - 12)
      const isMobileViewport = window.innerWidth < 560
      const reservedBottom = isMobileViewport ? 76 : 12
      const estimatedHeight = isMobileViewport ? Math.min(480, window.innerHeight - 24) : 320
      const maxTop = Math.max(12, window.innerHeight - estimatedHeight - reservedBottom)
      const next = { text, entry: lookupJapanese(text), top: Math.max(12, Math.min(maxTop, rect.bottom + 10)), left: Math.max(12, Math.min(maxLeft, rect.left)) }
      setSelection(next)
      setSaved(false)
      const sequence = ++loadSequence.current
      void lookupJapaneseAsync(text).then((entry) => {
        if (sequence !== loadSequence.current) return
        setSelection((current) => current?.text === text ? { ...current, entry } : current)
      })
      void Promise.all([db.preferences.get(`annotationNote:${text}`), db.preferences.get(`annotationFavorite:${text}`)]).then(([noteRow, favoriteRow]) => {
        if (sequence !== loadSequence.current) return
        setNote(typeof noteRow?.value === 'string' ? noteRow.value : '')
        setFavorite(favoriteRow?.value === true)
      })
    }
    function handleContextMenu(event: MouseEvent) {
      const target = event.target
      if (target instanceof Element && target.closest('.selection-explainer')) return
      const current = window.getSelection()
      if (!current?.toString().trim()) return
      event.preventDefault()
      readSelection(true)
    }
    function closeOutside(event: MouseEvent) {
      // The browser dispatches right-button mousedown before contextmenu.
      // Keep the selection alive so the contextmenu handler can inspect it.
      if (event.button === 2) return
      const target = event.target
      if (target instanceof Element && target.closest('.selection-explainer')) return
      lastText.current = ''
      window.getSelection()?.removeAllRanges()
      setSelection(null)
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      lastText.current = ''
      window.getSelection()?.removeAllRanges()
      setSelection(null)
    }
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeWithEscape)
    const handleViewportChange = () => readSelection(true)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeWithEscape)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  if (!selection) return null
  const currentSelection = selection
  const reading = currentSelection.entry?.reading || kanaReading(currentSelection.text)
  const romaji = reading ? kanaToRomaji(reading) : undefined
  const needsDictionaryLookup = !reading || currentSelection.entry?.kind === 'phrase' || currentSelection.entry?.gloss?.includes('暂未收录')
  function speak() {
    if (!('speechSynthesis' in window)) {
      onNotify('当前环境不支持日语朗读。', 'error')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(currentSelection.text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.82
    window.speechSynthesis.speak(utterance)
  }
  async function save() {
    try {
      await setPreference(`annotationNote:${currentSelection.text}`, note.trim())
      await setPreference(`annotationFavorite:${currentSelection.text}`, favorite)
      setSaved(true)
      onNotify('选中内容的笔记已保存。')
    } catch {
      onNotify('笔记未保存，请重试。', 'error')
    }
  }
  return (
    <aside className="selection-explainer" style={{ top: selection.top, left: selection.left }} role="dialog" aria-label="日文选中解释" onMouseDown={(event) => event.stopPropagation()}>
      <div className="selection-explainer-top">
        <div>
          <span className="selection-label">选中解释</span>
          <strong lang="ja">{selection.text}</strong>
        </div>
        <button ref={closeButton} className="icon-button" aria-label="关闭解释" onClick={() => { lastText.current = ''; window.getSelection()?.removeAllRanges(); setSelection(null) }}><X size={17} /></button>
      </div>
      {romaji && <div className="selection-romaji">{romaji}</div>}
      <div className="selection-reading" lang="ja">{reading ?? '暂未收录读音'}</div>
      {selection.entry?.kind && <span className="selection-kind">{selection.entry.kind === 'grammar' ? '语法' : selection.entry.kind === 'katakana' ? '片假名词汇' : selection.entry.kind === 'phrase' ? '词句片段' : '词汇'}</span>}
      <p className="selection-gloss">{selection.entry?.gloss ?? '可先把这段加入笔记，稍后补充词义。'}</p>
      {selection.entry?.explanation && <p className="field-hint">{selection.entry.explanation}</p>}
      {selection.entry?.source && <p className="selection-source">{selection.entry.source}{selection.entry.jlptLevel ? '，' + selection.entry.jlptLevel : ''}</p>}
      {needsDictionaryLookup && <a className="selection-dictionary-link" href={`https://jisho.org/search/${encodeURIComponent(currentSelection.text)}`} target="_blank" rel="noreferrer">打开公开词典查询 <span>会在外部网站查找选中内容</span></a>}
      <button className="outline-button compact selection-speak" onClick={speak}><SpeakerHigh size={16} /> 日语朗读</button>
      <textarea value={note} onChange={(event) => { setNote(event.target.value); setSaved(false) }} placeholder="写下你的理解、例句或易错点…" aria-label="选中内容笔记" />
      <div className="selection-actions">
        <button className={`bookmark-button compact ${favorite ? 'selected' : ''}`} aria-pressed={favorite} onClick={() => { setFavorite((current) => !current); setSaved(false) }}><BookmarkSimple size={17} weight={favorite ? 'fill' : 'regular'} /> {favorite ? '已收藏' : '收藏'}</button>
        <button className="primary-button compact" onClick={() => void save()}><FloppyDisk size={16} /> {saved ? '已保存' : '保存笔记'}</button>
      </div>
    </aside>
  )
}
