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
  assert.match(source, /const heightForStoredPosition = maxStoredY > 0 \? \(\(maxStoredY \/ 100\) \* BOARD_POSITION_HEIGHT \+ 160\) : 0/)
  assert.match(source, /Math\.max\(layoutHeight, heightForStoredPosition, boardHeightFloor\)/)
  assert.match(source, /top: \(position\.y \/ 100 \* BOARD_POSITION_HEIGHT\) \+ 'px'/)
  assert.match(source, /y: \(topPx \/ BOARD_POSITION_HEIGHT\) \* 100/)
  assert.doesNotMatch(source, /1 - max(?:Stored)?Y \/ 100/)
})
