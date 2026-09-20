import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url),
  'utf8',
)

test('la pizarra reinicia la geometría al cambiar de crónica o vista', () => {
  assert.match(source, /CHRONICLE_SPACE_BOARD_LAYOUT_STABILITY_V1/)
  assert.match(source, /const boardLayoutResetKey = visibleCards\.map\(\(card\) => card\.id\)\.join\('\|'\)/)
  assert.match(source, /setBoardHeightFloor\(0\)/)
  assert.match(source, /\[boardLayoutResetKey, boardViewMode, chronicleId\]/)
})

test('la altura de posiciones guardadas no crece de forma inversa al porcentaje', () => {
  assert.match(source, /\(maxY \/ 100\) \* layoutHeight \+ 160/)
  assert.doesNotMatch(source, /1 - maxY \/ 100/)
})
