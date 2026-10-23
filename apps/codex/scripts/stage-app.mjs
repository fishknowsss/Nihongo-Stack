import { cp, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const project = resolve(fileURLToPath(new URL('..', import.meta.url)))
const source = resolve(project, 'src-tauri/target/release/bundle/macos/Nihongo Stack Codex.app')
const destination = resolve(project, 'Nihongo Stack Codex.app')

await rm(destination, { recursive: true, force: true })
await cp(source, destination, { recursive: true })
console.log(`Ready to open: ${destination}`)
