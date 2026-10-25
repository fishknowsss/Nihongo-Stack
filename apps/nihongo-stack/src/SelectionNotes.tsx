import { useMemo, useState } from 'react'
import { BookmarkSimple } from '@phosphor-icons/react/dist/csr/BookmarkSimple'
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple'
import { TrashSimple } from '@phosphor-icons/react/dist/csr/TrashSimple'
import LayeredJapanese from './LayeredJapanese'
import { db, setPreference, type Preference } from './db'

type SelectionNote = { text: string; note: string; favorite: boolean }

export default function SelectionNotes({ preferences, onNotify }: { preferences: Preference[]; onNotify: (message: string, kind?: 'success' | 'error') => void }) {
  const [filter, setFilter] = useState<'all' | 'favorite' | 'note'>('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const items = useMemo(() => {
    const notes = new Map<string, SelectionNote>()
    for (const row of preferences) {
      if (row.key.startsWith('annotationNote:')) {
        const text = row.key.slice('annotationNote:'.length)
        const current = notes.get(text) ?? { text, note: '', favorite: false }
        notes.set(text, { ...current, note: typeof row.value === 'string' ? row.value : '' })
      }
      if (row.key.startsWith('annotationFavorite:')) {
        const text = row.key.slice('annotationFavorite:'.length)
        const current = notes.get(text) ?? { text, note: '', favorite: false }
        notes.set(text, { ...current, favorite: row.value === true })
      }
    }
    return [...notes.values()].filter((item) => item.favorite || item.note).filter((item) => filter === 'all' || (filter === 'favorite' ? item.favorite : !!item.note)).sort((a, b) => a.text.localeCompare(b.text, 'ja'))
  }, [filter, preferences])
  async function toggleFavorite(item: SelectionNote) {
    try {
      await setPreference(`annotationFavorite:${item.text}`, false)
      onNotify('已取消这条选中内容的收藏。')
    } catch {
      onNotify('收藏状态未更新，请重试。', 'error')
    }
  }
  async function clearNote(item: SelectionNote) {
    try {
      await db.preferences.delete(`annotationNote:${item.text}`)
      onNotify('已删除这条选中笔记。')
    } catch {
      onNotify('笔记未删除，请重试。', 'error')
    }
  }
  function beginEdit(item: SelectionNote) {
    setEditing(item.text)
    setDraft(item.note)
  }
  async function saveEdit(item: SelectionNote) {
    const value = draft.trim()
    try {
      if (value) await setPreference(`annotationNote:${item.text}`, value)
      else await db.preferences.delete(`annotationNote:${item.text}`)
      setEditing(null)
      setDraft('')
      onNotify(value ? '选中笔记已更新。' : '选中笔记已删除。')
    } catch {
      onNotify('笔记未更新，请重试。', 'error')
    }
  }
  return <section className="selection-notes" aria-labelledby="selection-notes-title">
    <div className="section-heading"><div><h2 id="selection-notes-title">选中收藏与笔记</h2><p className="field-hint">在阅读、听力或 JLPT 中选中文字后保存的内容。</p></div><select aria-label="选中笔记筛选" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">全部</option><option value="favorite">仅收藏</option><option value="note">仅有笔记</option></select></div>
    {items.length ? <ul className="selection-notes-list">{items.map((item) => <li key={item.text}><div className="selection-note-main"><div className="selection-note-word"><LayeredJapanese segments={[{ text: item.text }]} layer="full" /></div>{editing === item.text ? <div className="selection-note-editor"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} aria-label={`编辑 ${item.text} 的笔记`} autoFocus /><div className="selection-note-editor-actions"><button className="text-button compact" onClick={() => { setEditing(null); setDraft('') }}>取消</button><button className="primary-button compact" onClick={() => void saveEdit(item)}>保存</button></div></div> : item.note && <p>{item.note}</p>}<span>{item.favorite ? <><BookmarkSimple size={14} weight="fill" /> 已收藏</> : '已保存笔记'}</span></div><div className="selection-note-actions">{item.favorite && <button className="icon-button" aria-label={`取消收藏 ${item.text}`} onClick={() => void toggleFavorite(item)}><BookmarkSimple size={17} /></button>}{item.note && editing !== item.text && <button className="icon-button" aria-label={`编辑笔记 ${item.text}`} onClick={() => beginEdit(item)}><PencilSimple size={17} /></button>}{item.note && <button className="icon-button" aria-label={`删除笔记 ${item.text}`} onClick={() => void clearNote(item)}><TrashSimple size={17} /></button>}</div></li>)}</ul> : <div className="quiet-empty"><p>{filter === 'all' ? '还没有保存的选中内容。先在日语材料中选中词句。' : '当前筛选没有内容。'}</p></div>}
  </section>
}
