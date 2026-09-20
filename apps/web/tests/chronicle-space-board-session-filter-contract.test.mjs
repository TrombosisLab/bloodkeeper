import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const boardSource = await readFile(
  new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url),
  'utf8',
)
const notebookSource = await readFile(
  new URL('../src/features/notebook/components/NotebookPhaseTwo.tsx', import.meta.url),
  'utf8',
)

test('la pizarra personal permite filtrar anotaciones por sesión', () => {
  assert.match(boardSource, /GENERAL_BOARD_SESSION_FILTER/)
  assert.match(boardSource, /selectionSession/)
  assert.match(boardSource, /sessionId: item\.sessionId/)
  assert.match(boardSource, /aria-label="Filtrar anotaciones por sesión"/)
  assert.match(boardSource, /card\.sessionId === boardSelectionSession/)
  assert.match(boardSource, /setBoardSelectionKind\('NOTA'\)/)
})

test('el filtro de sesión no se añade al Cuaderno oculto', () => {
  assert.doesNotMatch(notebookSource, /GENERAL_SESSION_FILTER/)
  assert.doesNotMatch(notebookSource, /Filtrar notas por sesión/)
})
