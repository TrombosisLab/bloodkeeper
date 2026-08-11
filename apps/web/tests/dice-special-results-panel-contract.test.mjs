import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const panel = await readFile(
  new URL('../src/features/dice/components/DiceRollPanel.tsx', import.meta.url),
  'utf8',
)
const styles = await readFile(
  new URL('../src/features/dice/components/dice-roll-panel.css', import.meta.url),
  'utf8',
)

test('038-B separa exito global de condicion especial', () => {
  assert.match(panel, /result\.roll\.isSuccessful/)
  assert.match(panel, /specialResultLabel/)
  assert.match(panel, /dice-roll-result__special/)
})

test('038-B presenta evidencia recibida sin reclasificar tiradas', () => {
  assert.match(panel, /specialEvidenceLabel/)
  assert.match(panel, /criticalPairs\.length/)
  assert.match(panel, /bestialFailureDieIndices\.length/)
  assert.doesNotMatch(panel, /resolveSpecialResult|buildCriticalPairs/)
})

test('038-B identifica dieces y unos de Hambre con texto ademas de color', () => {
  assert.match(panel, /Diez crítico/)
  assert.match(panel, /Uno de Hambre/)
  assert.match(panel, /die\.isCriticalTen/)
  assert.match(panel, /die\.isBestialFailureDie/)
})

test('038-B conserva estilos modulares para estados especiales', () => {
  assert.match(styles, /SPEC-038-B-SPECIAL-RESULTS-20260811/)
  assert.match(styles, /dice-roll-result__special--messy_critical/)
  assert.match(styles, /dice-roll-result__die--bestial-one/)
})
