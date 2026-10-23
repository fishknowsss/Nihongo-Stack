import type { ReactNode } from 'react'
import { kanaToRomaji, segmentText, type StudyLayer } from './language'

export default function LayeredJapanese({ segments, layer, className = '' }: { segments: Array<{ text: string; reading?: string }>; layer: StudyLayer; className?: string }) {
  const showFurigana = layer === 'furigana' || layer === 'full'
  const showGloss = layer === 'gloss' || layer === 'full'
  const showRomaji = layer === 'romaji' || layer === 'full'
  return <div className={`layered-japanese ${layer !== 'off' ? `layer-${layer}` : ''} ${className}`} lang="ja">
    {segments.map((segment, segmentIndex) => {
      const parts = segmentText(segment.text, segment.reading)
      return <span key={`${segment.text}-${segmentIndex}`}>{parts.map((part, partIndex) => {
        const entry = part.entry
        const content: ReactNode = showFurigana && (entry?.reading || part.reading)
          ? <ruby>{part.text}<rt>{entry?.reading ?? part.reading}</rt></ruby>
          : part.text
        const hasRomaji = showRomaji && Boolean(part.reading || entry?.romaji)
        const hasGloss = showGloss && Boolean(entry?.gloss)
        if (!hasRomaji && !hasGloss) return <span key={`${part.text}-${partIndex}`}>{content}</span>
        return <span className="layer-token" key={`${part.text}-${partIndex}`}>
          {hasRomaji && <small className="layer-romaji">{part.reading ? kanaToRomaji(part.reading) : entry?.romaji}</small>}
          {content}
          {hasGloss && <small className="layer-gloss">{entry?.gloss}</small>}
        </span>
      })}</span>
    })}
  </div>
}
