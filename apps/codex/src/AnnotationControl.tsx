import { useId, useState } from 'react'

export type Annotation = 'off' | 'material' | 'font'
let fontLoad: Promise<FontFace> | undefined
function loadFont() {
  fontLoad ??= new FontFace('Furifont Serif', 'url("/fonts/FurifontSerif-Regular.woff2")', { weight: '400', style: 'normal', display: 'swap' })
    .load().then(face => { document.fonts.add(face); return face })
  return fontLoad
}

export default function AnnotationControl({ value, onChange, material = false, label = '文本注音', disabled = false }: {
  value: Annotation
  onChange: (value: Annotation) => void
  material?: boolean
  label?: string
  disabled?: boolean
}) {
  const id = useId()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  async function change(next: Annotation) {
    setError(false)
    if (next !== 'font') { onChange(next); return }
    setLoading(true)
    try {
      await loadFont()
      onChange(next)
    } catch {
      fontLoad = undefined
      setError(true)
    } finally { setLoading(false) }
  }
  return <div className="annotation-control">
    <label htmlFor={id}>{label}</label>
    <select id={id} value={value} disabled={disabled || loading} onChange={event => void change(event.target.value as Annotation)}>
      <option value="off">关闭注音</option>
      {material && <option value="material">材料注音</option>}
      <option value="font">字体注音 · FuriFont</option>
    </select>
    {loading && <span className="field-hint" role="status">正在读取本机字体…</span>}
    {error && <span className="inline-error" role="alert">字体未载入，请重新选择字体注音。</span>}
  </div>
}

export function AnnotationNote({ material = false }: { material?: boolean }) {
  return <p className="annotation-note">{material ? '已有材料读音优先；其余汉字由字体注音。' : 'FuriFont 自动注音；多音字请结合上下文核对。'}<a href="https://furifont.antfu.me/" target="_blank" rel="noreferrer">关于字体</a></p>
}
