import { listeningSources, readings, type Listening } from './catalog'
export * from './catalog'
const audioAssets = import.meta.glob('../../../shared/content/audio/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
export const listenings: Listening[] = listeningSources.map((clip) => ({
  ...clip,
  audio: audioAssets[`../../../shared/content/audio/${clip.audioFile}`],
  audioKind: 'audioKind' in clip ? (clip.audioKind as 'synthetic') : 'human',
}))
export function materialTitle(id: string): string {
  return (
    readings.find((x) => x.id === id)?.title ??
    listenings.find((x) => x.id === id)?.title ??
    (id === 'baseline-01' ? '起点小测' : `历史材料 · ${id}`)
  )
}
