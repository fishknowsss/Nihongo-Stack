import { cp, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const project = resolve(import.meta.dirname, '..')
const source = resolve(project, 'build/mygo/darwin-arm64/Nihongo Stack.app')
const destination = resolve(project, 'Nihongo Stack.app')

await rm(destination, { recursive: true, force: true })
await cp(source, destination, { recursive: true })
await rm(source, { recursive: true, force: true })
console.log(`Ready to open: ${destination}`)
