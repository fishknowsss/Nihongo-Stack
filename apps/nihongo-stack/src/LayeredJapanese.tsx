import type { ReactNode } from 'react'
import { kanaToRomaji, segmentText, type StudyLayer } from './language'

export default function LayeredJapanese({ segments, layer, className = '', as = 'div' }: { segments: Array<{ text: string; reading?: string }>; layer: StudyLayer; className?: string; as?: 'div' | 'span' }) {
  const showFurigana = layer === 'furigana' || layer === 'full'
  const showGloss = layer === 'gloss' || layer === 'full'
  const showRomaji = layer === 'romaji' || layer === 'full'
  const Root = as
  return <Root className={`layered-japanese ${layer !== 'off' ? `layer-${layer}` : ''} ${className}`} lang="ja">
    {segments.map((segment, segmentIndex) => {
      const parts = segmentText(segment.text, segment.reading)
      return <span key={`${segment.text}-${segmentIndex}`}>{parts.map((part, partIndex) => {
        const entry = part.entry
        const needsRuby = /[\u3400-\u9fff々\u30a0-\u30ff]/u.test(part.text)
        const content: ReactNode = showFurigana && needsRuby && (entry?.reading || part.reading)
          ? <ruby>{part.text}<rt>{entry?.reading ?? part.reading}</rt></ruby>
          : part.text
        const hasRomaji = showRomaji && Boolean(part.reading || entry?.romaji)
        const gloss = entry?.gloss?.startsWith('平假名表达') || entry?.gloss?.startsWith('汉字词暂未收录')
          ? undefined
          : entry?.gloss
        const hasGloss = showGloss && Boolean(gloss)
        if (!hasRomaji && !hasGloss) return <span key={`${part.text}-${partIndex}`}>{content}</span>
        return <span className="layer-token" key={`${part.text}-${partIndex}`}>
          {showRomaji && <small className="layer-romaji" aria-hidden={!hasRomaji}>{hasRomaji ? (part.reading ? kanaToRomaji(part.reading) : entry?.romaji) : '\u00a0'}</small>}
          {content}
          {showGloss && <small className="layer-gloss" aria-hidden={!hasGloss}>{hasGloss ? gloss : '\u00a0'}</small>}
        </span>
      })}</span>
    })}
  </Root>
}
