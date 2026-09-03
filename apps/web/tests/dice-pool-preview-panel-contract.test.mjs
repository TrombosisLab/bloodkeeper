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

test('037-C prepara en backend antes de habilitar el lanzamiento', () => {
  assert.match(panel, /gateway\.previewManual/)
  assert.match(panel, /gateway\.previewCharacter/)
  assert.match(panel, /Preparar reserva/)
  assert.match(panel, /prepared === null/)
})

test('037-C congela el comando preparado para cada ejecucion', () => {
  assert.match(panel, /Object\.freeze\(command\)/)
  assert.match(panel, /prepared\.command/)
  assert.match(panel, /Lanzar de nuevo/)
})

test('037-C invalida preview y resultado al cambiar entradas', () => {
  assert.match(panel, /function invalidatePrepared/)
  assert.match(panel, /setPreview\(null\)/)
  assert.match(panel, /setPrepared\(null\)/)
  assert.match(panel, /setResult\(null\)/)
})

test('037-C muestra desglose transparente sin calcular reglas', () => {
  assert.match(panel, /Reserva final:/)
  assert.match(panel, /preview\.components\.map/)
  assert.match(panel, /preview\.modifiers\.map/)
  assert.match(panel, /preview\.normalDice/)
  assert.match(panel, /preview\.hungerDice/)
  assert.doesNotMatch(panel, /buildDicePool|resolveDiceRoll/)
})

test('037-C presenta nombres visibles sin filtrar claves internas', () => {
  assert.match(panel, /function presentedComponentLabel/)
  assert.match(panel, /normalizedAttributes\.find/)
  assert.match(panel, /normalizedSkills\.find/)
  assert.match(panel, /presentedComponentLabel\(/)
})

test('037-C ofrece descripcion origen y confirmacion accesible', () => {
  assert.match(panel, /Descripción opcional/)
  assert.match(panel, /Origen del modificador/)
  assert.match(panel, /maxLength=\{160\}/)
  assert.match(panel, /aria-label="Reserva preparada"/)
  assert.match(styles, /dice-pool-preview__totals/)
})
