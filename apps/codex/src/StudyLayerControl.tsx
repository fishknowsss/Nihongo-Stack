import type { StudyLayer } from './language'

export default function StudyLayerControl({ value, onChange }: { value: StudyLayer; onChange: (value: StudyLayer) => void }) {
  return <label className="study-layer-control">
    <span>学习层</span>
    <select aria-label="日语学习层" value={value} onChange={(event) => onChange(event.target.value as StudyLayer)}>
      <option value="off">只看原文</option>
      <option value="furigana">汉字 + 平假名</option>
      <option value="gloss">片假名 + 简易释义</option>
      <option value="romaji">原文 + 罗马音</option>
      <option value="full">平假名 + 释义 + 罗马音</option>
    </select>
  </label>
}
