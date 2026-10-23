import { useEffect, useRef, useState } from 'react'
import { db, setPreference, type Attempt } from './db'
const writes = new Map<string, Promise<void>>()
export function persistDraft(
  key: string,
  value: string | number | boolean,
): Promise<void> {
  const next = (writes.get(key) ?? Promise.resolve())
    .catch(() => {})
    .then(() => setPreference(key, value))
  writes.set(key, next)
  void next.finally(() => { if (writes.get(key) === next) writes.delete(key) }).catch(() => {})
  return next
}
export async function flushDrafts(keys?: string[]): Promise<void> {
  await Promise.all(keys ? keys.map((key) => writes.get(key)) : [...writes.values()])
}
export function usePractice(
  kind: 'reading' | 'listening' | 'baseline',
  id: string,
  count: number,
  notify: (text: string, kind?: 'success' | 'error') => void,
) {
  const key = kind === 'baseline' ? 'draft:baseline' : `draft:${kind}:${id}`
  const [answers, setAnswers] = useState<number[]>(Array(count).fill(-1))
  const [result, setResult] = useState<Attempt | null>(null)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const answerRef = useRef(answers)
  const startedAt = useRef(Date.now())
  const pending = useRef(0)
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await flushDrafts([key])
        const [draft, history] = await Promise.all([
          db.preferences.get(key),
          db.attempts.where('materialId').equals(id).filter(x => x.kind === kind).toArray(),
        ])
        if (cancelled) return
        const parsed: unknown =
          typeof draft?.value === 'string' ? JSON.parse(draft.value) : null
        if (
          Array.isArray(parsed) &&
          parsed.length === count &&
          parsed.every((x) => Number.isInteger(x) && x >= -2)
        ) {
          answerRef.current = parsed
          setAnswers(parsed)
        } else {
          const latest = history.sort((a, b) =>
            b.completedAt.localeCompare(a.completedAt),
          )[0]
          if (latest && latest.answers.length === count) {
            answerRef.current = latest.answers
            setAnswers(latest.answers)
            setResult(latest)
          }
        }
        setReady(true)
      } catch {
        if (!cancelled) {
          setReady(true)
          notify('草稿读取失败。可继续作答，请检查备份。', 'error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // Each exercise is keyed by material id; notify does not affect the saved practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, id, count])
  function change(index: number, answer: number) {
    if (!ready || result) return
    const next = answerRef.current.map((x, i) => (i === index ? answer : x))
    answerRef.current = next
    setAnswers(next)
    setSaving(true)
    pending.current++
    void persistDraft(key, JSON.stringify(next))
      .catch(() => {
        notify('草稿未保存，请重试选择或导出备份。', 'error')
      })
      .finally(() => { pending.current--; if (pending.current === 0) setSaving(false) })
  }
  function retry() {
    const empty = Array(count).fill(-1)
    answerRef.current = empty
    setAnswers(empty)
    setResult(null)
    startedAt.current = Date.now()
    void persistDraft(key, JSON.stringify(empty)).catch(() =>
      notify('新练习草稿保存失败，请重试。', 'error'),
    )
  }
  return {
    answers,
    change,
    result,
    setResult,
    ready,
    saving,
    retry,
    key,
    startedAt,
  }
}
