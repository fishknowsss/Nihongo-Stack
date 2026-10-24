import fs from 'node:fs/promises'
import vm from 'node:vm'

const root = new URL('../../', import.meta.url)
const output = new URL('private-assets/conjugaizen-v.json', root)
const landing = await (await fetch('https://conjugaizen.com/jlpt-n4-practice-test/')).text()
const asset = landing.match(/(?:src|href)="(\/assets\/jlptMock-[^"]+\.js)"/)?.[1]
if (!asset) throw new Error('没有找到 Conjugaizen JLPT 数据脚本')
const source = await (await fetch(`https://conjugaizen.com${asset}`)).text()
const start = source.indexOf('var r=')
const end = source.lastIndexOf('export{')
if (start < 0 || end < 0) throw new Error('Conjugaizen 数据脚本结构已变化，请重新检查提取器')
const body = source.slice(start, end)
const code = `const e=()=>({jsx(){},jsxs(){}}); const t=()=>({}); const n=()=>{}; ${body}; globalThis.__data=v;`
const context = { globalThis: {}, console, URL, Math, Date, JSON, window: {}, document: {} }
vm.runInNewContext(code, context, { timeout: 20_000 })
await fs.mkdir(new URL('private-assets/', root), { recursive: true })
await fs.writeFile(output, JSON.stringify(context.globalThis.__data), 'utf8')
console.log(`已提取 Conjugaizen 数据：${asset}`)
