import { useEffect, useRef, useState } from 'react'
import { persistDraft } from './drafts'
import { localDate } from './learning'

import { STUDY_TIME_PREFIX, IDLE_MS, activeDelta, splitAtMidnight, type StudyTime } from './activityModel'
export { STUDY_TIME_PREFIX, parseStudyTime, formatStudyTime } from './activityModel'

export function useStudyTime(view: string, ready: boolean, notify: (text: string, kind?: 'error') => void) {
  const [session, setSession] = useState<StudyTime | null>(null)
  const controls = useRef({ pause: () => {}, resume: () => {}, finish: () => {} })
  const notifyRef = useRef(notify)
  notifyRef.current = notify
  useEffect(() => {
    if (!ready || !['review', 'reading', 'listening', 'baseline'].includes(view)) {
      setSession(null)
      return
    }
    let key = `${STUDY_TIME_PREFIX}${crypto.randomUUID()}`
    let row: StudyTime = {
      day: localDate(new Date()), view, startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), activeMs: 0, status: 'running',
    }
    let last = performance.now(), lastInput = last
    const isForeground = () => !document.hidden && document.hasFocus() && window.__NIHONGO_NATIVE_FOCUS__ !== false
    let paused = false, ended = false, failed = false
    let savedAt = last
    const save = () => {
      const snapshot = { ...row }
      void persistDraft(key, JSON.stringify(snapshot)).catch(() => {
        if (!failed) notifyRef.current('学习计时未保存，请检查本机备份。', 'error')
        failed = true
      })
      savedAt = performance.now()
    }
    const tick = (persist = false) => {
      const now = performance.now()
      const foreground = isForeground()
      const enabled = foreground && !paused && !ended
      const delta = activeDelta(last, now, lastInput, enabled)
      const today = localDate(new Date())
      if (row.day !== today) {
        // Attribute only the measured part before midnight to yesterday.
        const midnight = new Date(); midnight.setHours(0, 0, 0, 0)
        const measuredEnd = Date.now() - (now - Math.min(now, lastInput + IDLE_MS))
        const [beforeMidnight, afterMidnight] = splitAtMidnight(delta, measuredEnd, midnight.getTime())
        row.activeMs += beforeMidnight
        row.status = 'ended'; row.updatedAt = midnight.toISOString(); save()
        key = `${STUDY_TIME_PREFIX}${crypto.randomUUID()}`
        row = { ...row, day: today, startedAt: midnight.toISOString(), activeMs: afterMidnight }
      } else row.activeMs += delta
      last = now
      row.updatedAt = new Date().toISOString()
      row.status = ended ? 'ended' : paused ? 'paused' : !foreground ? 'background' : now - lastInput >= IDLE_MS ? 'idle' : 'running'
      setSession({ ...row })
      if (persist || now - savedAt >= 5000) save()
    }
    const activity = () => { tick(); lastInput = performance.now(); tick() }
    const visibility = () => {
      tick(true)
      last = performance.now(); lastInput = last; tick(true)
    }
    controls.current = {
      pause: () => { tick(); paused = true; tick(true) },
      resume: () => { paused = false; ended = false; last = performance.now(); lastInput = last; tick(true) },
      finish: () => { tick(); ended = true; tick(true) },
    }
    tick()
    const timer = window.setInterval(() => tick(), 1000)
    for (const event of ['pointerdown', 'keydown', 'scroll']) document.addEventListener(event, activity, true)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('focus', visibility)
    window.addEventListener('blur', visibility)
    window.addEventListener('nihongo-native-focus', visibility)
    window.addEventListener('pagehide', controls.current.finish)
    const finish = controls.current.finish
    return () => {
      finish(); window.clearInterval(timer)
      for (const event of ['pointerdown', 'keydown', 'scroll']) document.removeEventListener(event, activity, true)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('focus', visibility); window.removeEventListener('blur', visibility)
      window.removeEventListener('nihongo-native-focus', visibility)
      window.removeEventListener('pagehide', finish)
    }
  }, [view, ready])
  return { session, pause: () => controls.current.pause(), resume: () => controls.current.resume(), finish: () => controls.current.finish() }
}
