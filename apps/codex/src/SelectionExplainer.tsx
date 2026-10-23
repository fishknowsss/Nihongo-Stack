import { useEffect, useRef, useState } from 'react'
import { BookmarkSimple, FloppyDisk, X } from '@phosphor-icons/react'
import { db, setPreference } from './db'
import { kanaToRomaji, lookupJapanese, type LexiconEntry } from './language'

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

  useEffect(() => {
    function readSelection() {
      const current = window.getSelection()
      const text = current?.toString().trim() ?? ''
      if (!text || !/[\u3040-\u30ff\u3400-\u9fff]/u.test(text) || !current?.rangeCount) {
        lastText.current = ''
        return
      }
      const node = current.anchorNode instanceof Element ? current.anchorNode : current.anchorNode?.parentElement
      if (node?.closest('input, textarea, select, button, a')) return
      const rect = current.getRangeAt(0).getBoundingClientRect()
      if (lastText.current === text) return
      lastText.current = text
      const next = { text, entry: lookupJapanese(text), top: Math.min(window.innerHeight - 320, rect.bottom + 10), left: Math.min(window.innerWidth - 360, Math.max(12, rect.left)) }
      setSelection(next)
      setSaved(false)
      const sequence = ++loadSequence.current
      void Promise.all([db.preferences.get(`annotationNote:${text}`), db.preferences.get(`annotationFavorite:${text}`)]).then(([noteRow, favoriteRow]) => {
        if (sequence !== loadSequence.current) return
        setNote(typeof noteRow?.value === 'string' ? noteRow.value : '')
        setFavorite(favoriteRow?.value === true)
      })
    }
    document.addEventListener('mouseup', readSelection)
    document.addEventListener('keyup', readSelection)
    document.addEventListener('selectionchange', readSelection)
    function closeOutside(event: MouseEvent) {
      const target = event.target
      if (target instanceof Element && target.closest('.selection-explainer')) return
      lastText.current = ''
      setSelection(null)
    }
    document.addEventListener('mousedown', closeOutside)
    const poll = window.setInterval(readSelection, 350)
    return () => {
      document.removeEventListener('mouseup', readSelection)
      document.removeEventListener('keyup', readSelection)
      document.removeEventListener('selectionchange', readSelection)
      document.removeEventListener('mousedown', closeOutside)
      window.clearInterval(poll)
    }
  }, [])

  if (!selection) return null
  const currentSelection = selection
  const reading = currentSelection.entry?.reading ?? kanaReading(currentSelection.text)
  const romaji = reading ? kanaToRomaji(reading) : undefined
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
        <button className="icon-button" aria-label="关闭解释" onClick={() => { lastText.current = ''; window.getSelection()?.removeAllRanges(); setSelection(null) }}><X size={17} /></button>
      </div>
      <div className="selection-reading" lang="ja">{reading ?? '暂未收录读音'}</div>
      {romaji && <div className="selection-romaji">{romaji}</div>}
      {selection.entry?.kind && <span className="selection-kind">{selection.entry.kind === 'grammar' ? '语法' : selection.entry.kind === 'katakana' ? '片假名词汇' : '词汇'}</span>}
      <p className="selection-gloss">{selection.entry?.gloss ?? '可先把这段加入笔记，稍后补充词义。'}</p>
      {selection.entry?.explanation && <p className="field-hint">{selection.entry.explanation}</p>}
      <textarea value={note} onChange={(event) => { setNote(event.target.value); setSaved(false) }} placeholder="写下你的理解、例句或易错点…" aria-label="选中内容笔记" />
      <div className="selection-actions">
        <button className={`bookmark-button compact ${favorite ? 'selected' : ''}`} aria-pressed={favorite} onClick={() => { setFavorite((current) => !current); setSaved(false) }}><BookmarkSimple size={17} weight={favorite ? 'fill' : 'regular'} /> {favorite ? '已收藏' : '收藏'}</button>
        <button className="primary-button compact" onClick={() => void save()}><FloppyDisk size={16} /> {saved ? '已保存' : '保存笔记'}</button>
      </div>
    </aside>
  )
}
