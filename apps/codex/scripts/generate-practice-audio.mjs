import { readFile, mkdir, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
const root = fileURLToPath(new URL('../../../', import.meta.url))
const pack = JSON.parse(await readFile(resolve(root, 'shared/content/foundation-week.v2.json'), 'utf8'))
const audioDir = resolve(root, 'shared/content/audio')
const workingDir = resolve(root, 'output/product-improvement/2026-10-07/speech-source')
await mkdir(workingDir, { recursive: true })
for (const clip of pack.listenings) {
  const destination = resolve(audioDir, clip.audioFile)
  try { await access(destination); continue } catch { /* Create missing original-practice audio only. */ }
  const aiff = resolve(workingDir, `${clip.id}.aiff`)
  execFileSync('/usr/bin/say', ['-v', 'Kyoko', '-r', '155', '-o', aiff, clip.transcript])
  execFileSync('/opt/homebrew/bin/ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', aiff, '-codec:a', 'libmp3lame', '-b:a', '96k', destination])
  console.log(`Generated private synthetic practice: ${clip.audioFile}`)
}
