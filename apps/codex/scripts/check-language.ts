import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { kanaToRomaji, lookupJapanese, segmentText } from '../src/language'
import { cards } from '../src/catalog'

assert.equal(kanaToRomaji('がっこう'), 'gakkou')
assert.equal(kanaToRomaji('きょうと'), 'kyouto')
assert.equal(lookupJapanese('京都')?.gloss, '京都')
assert.equal(lookupJapanese('コンビニ')?.gloss, '便利店')
assert.equal(lookupJapanese('何か')?.reading, 'なにか')
assert.equal(lookupJapanese('行きます')?.gloss, '去')
assert.equal(lookupJapanese('週末')?.reading, 'しゅうまつ')
assert.equal(lookupJapanese('三つ')?.romaji, 'mittsu')
assert.equal(lookupJapanese('午前中')?.gloss, '上午；上午期间')
assert.equal(lookupJapanese('「毎日」')?.reading, 'まいにち')
assert.equal(lookupJapanese('「毎日」。')?.reading, 'まいにち')
assert.equal(lookupJapanese('『毎日』')?.reading, 'まいにち')
assert.equal(lookupJapanese('は')?.kind, 'grammar')
assert.equal(lookupJapanese('は')?.romaji, 'wa')
assert.equal(lookupJapanese('を')?.gloss, '动作对象助词')
assert.equal(lookupJapanese('で')?.explanation?.includes('交通工具'), true)
const particleSentence = segmentText('私は電車で行きます')
assert.deepEqual(particleSentence.map((part) => part.entry?.surface), ['私', 'は', '電車', 'で', '行きます'])
assert.equal(particleSentence.find((part) => part.entry?.surface === 'は')?.entry?.gloss, '主题助词：说到……')
assert.equal(particleSentence.find((part) => part.entry?.surface === 'で')?.entry?.gloss, '动作场所或手段')
assert.deepEqual(segmentText('はじめまして。').map((part) => part.text), ['はじめまして。'])
assert.equal(lookupJapanese('アプリ')?.reading, 'あぷり')
assert.equal(lookupJapanese('アプリ')?.gloss, '应用；应用程序')
assert.equal(lookupJapanese('インスタ')?.kind, 'katakana')
assert.equal(lookupJapanese('インスタ')?.reading, 'いんすた')
assert.equal(lookupJapanese('たべました')?.romaji, 'tabemashita')
assert.equal(lookupJapanese('未知漢字')?.kind, 'kanji')
assert.equal(lookupJapanese('未知漢字')?.reading, '')
assert.equal(lookupJapanese('未知漢字を')?.kind, 'phrase')
assert.equal(lookupJapanese('これは だれの かばんですか')?.kind, 'phrase')
const missingCardReadings = cards.flatMap((card) => segmentText(card.example).filter((part) => /[一-龯]/u.test(part.text) && !part.entry).map((part) => `${card.id}:${part.text}`))
assert.deepEqual(missingCardReadings, [], `card examples missing readings: ${missingCardReadings.join(', ')}`)
assert.ok(segmentText('毎日、電車').some((part) => part.entry?.surface === '毎日'))
assert.ok(segmentText('インスタ').some((part) => part.entry?.kind === 'katakana'))
const supplied = segmentText('にスーパーへ行きました。', 'にすーぱーへいきました。')
assert.equal(supplied.length, 1)
assert.equal(supplied[0].text, 'にスーパーへ行きました。')
assert.equal(supplied[0].reading, 'にすーぱーへいきました。')
const offlineIndex = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/openjlpt-jlpt.json'), 'utf8')) as {
  license?: string
  entries?: Record<string, { reading?: string; gloss?: string; level?: string }>
}
assert.equal(offlineIndex.license, 'CC BY-SA 4.0')
assert.ok(offlineIndex.entries && Object.keys(offlineIndex.entries).length > 10000)
assert.equal(offlineIndex.entries?.['会う']?.reading, 'あう')
assert.equal(offlineIndex.entries?.['会う']?.level, 'N5')
console.log('Language checks passed: kana transliteration, merged glosses, katakana lookup, and segmentation')
