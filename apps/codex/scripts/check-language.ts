import assert from 'node:assert/strict'
import { kanaToRomaji, lookupJapanese, segmentText } from '../src/language'

assert.equal(kanaToRomaji('がっこう'), 'gakkou')
assert.equal(kanaToRomaji('きょうと'), 'kyouto')
assert.equal(lookupJapanese('京都')?.gloss, '京都')
assert.equal(lookupJapanese('コンビニ')?.gloss, '便利店')
assert.ok(segmentText('毎日、電車').some((part) => part.entry?.surface === '毎日'))
const supplied = segmentText('にスーパーへ行きました。', 'にすーぱーへいきました。')
assert.equal(supplied.length, 1)
assert.equal(supplied[0].text, 'にスーパーへ行きました。')
assert.equal(supplied[0].reading, 'にすーぱーへいきました。')
console.log('Language checks passed: kana transliteration, merged glosses, katakana lookup, and segmentation')
