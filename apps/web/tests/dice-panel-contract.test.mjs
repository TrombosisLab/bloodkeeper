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
const main = await readFile(
  new URL('../src/main.tsx', import.meta.url),
  'utf8',
)

test('036-D mantiene el panel dentro de un módulo independiente', () => {
  assert.match(panel, /export function DiceRollPanel/)
  assert.match(panel, /mode: 'manual' \| 'character'/)
  assert.doesNotMatch(panel, /resolveDiceRoll|buildDicePool|Math\.random/)
})

test('036-D ofrece reserva manual y selección de ficha', () => {
  assert.match(panel, /Reserva base/)
  assert.match(panel, /Atributo/)
  assert.match(panel, /Habilidad/)
  assert.match(panel, /Dificultad opcional/)
})

test('036-D presenta resultado estructurado y Dados de Hambre', () => {
  assert.match(panel, /totalSuccesses/)
  assert.match(panel, /Crítico conflictivo/)
  assert.match(panel, /Fallo bestial/)
  assert.match(panel, /Dado de Hambre/)
  assert.match(styles, /dice-roll-result__die--hunger/)
})

test('036-D integra manual en Inicio y personaje junto a ficha persistida', () => {
  assert.match(main, /mode="manual"/)
  assert.match(main, /mode="character"/)
  assert.match(main, /characterId=\{creationCharacterId\}/)
  assert.match(main, /attributeDefinitions/)
  assert.match(main, /skillDefinitions/)
})

test('036-D conserva controles accesibles y resultado anunciado', () => {
  assert.match(panel, /aria-label="Resultado de la tirada"/)
  assert.match(panel, /aria-live="polite"/)
  assert.match(panel, /role="alert"/)
  assert.match(panel, /type="submit"/)
})


test('036-D presenta fallo cuando no supera dificultad y pluraliza exitos', () => {
  assert.match(panel, /meetsDifficulty === false/)
  assert.match(panel, /presentedOutcome\(result\)/)
  assert.match(panel, /totalSuccesses === 1/)
  assert.match(panel, /successCountLabel\(result\.roll\.totalSuccesses\)/)
})
