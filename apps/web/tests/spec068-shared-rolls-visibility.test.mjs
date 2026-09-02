import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const play = await readFile(
  new URL('../src/features/chronicles/components/ChroniclePlayWorkspace.tsx', import.meta.url),
  'utf8',
)
const roll = await readFile(
  new URL('../src/features/dice/components/DiceRollPanel.tsx', import.meta.url),
  'utf8',
)

test('SPEC-068 muestra en Jugar todas las tiradas de la crónica', () => {
  assert.match(play, /DiceHistoryPanel chronicleId=\{chronicleId\} contextLabel="Tiradas de la crónica"/)
  assert.doesNotMatch(play, /DiceHistoryPanel chronicleId=\{chronicleId\} sessionId=/)
})

test('SPEC-068 usa visibilidad compartida por defecto y privacidad explícita', () => {
  assert.match(roll, /useState<'contextual' \| 'private'>\('contextual'\)/)
  assert.match(roll, /Visible para toda la crónica/)
  assert.match(roll, /Solo tú y el Narrador/)
})
