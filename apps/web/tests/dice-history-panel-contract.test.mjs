import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const panel = await readFile(
  new URL('../src/features/dice/components/DiceHistoryPanel.tsx', import.meta.url),
  'utf8',
)
const styles = await readFile(
  new URL('../src/features/dice/components/dice-history-panel.css', import.meta.url),
  'utf8',
)
const rollPanel = await readFile(
  new URL('../src/features/dice/components/DiceRollPanel.tsx', import.meta.url),
  'utf8',
)
const main = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')
const sessions = await readFile(
  new URL('../src/features/chronicles/components/ChronicleSessionPanel.tsx', import.meta.url),
  'utf8',
)
const chronicle = await readFile(
  new URL('../src/features/chronicles/components/ChronicleDetail.tsx', import.meta.url),
  'utf8',
)

test('039-C mantiene historial dentro del modulo independiente de Dados', () => {
  assert.match(panel, /export function DiceHistoryPanel/)
  assert.match(panel, /createDiceGateway/)
  assert.match(panel, /\.\/dice-history-panel\.css/)
  assert.doesNotMatch(panel, /ChronicleApi|CharacterDraftApi/)
})

test('039-C presenta quien contexto reserva resultado y momento', () => {
  assert.match(panel, /actorDisplayName/)
  assert.match(panel, /contextText\(item\)/)
  assert.match(panel, /pool\.finalPool/)
  assert.match(panel, /roll\.totalSuccesses/)
  assert.match(panel, /displayedTime\(item\.createdAt\)/)
})

test('039-C carga detalle con dados individuales y resultado especial', () => {
  assert.match(panel, /gateway\.historyDetail/)
  assert.match(panel, /aria-label="Detalle de la tirada"/)
  assert.match(panel, /aria-label="Dados individuales"/)
  assert.match(panel, /die\.type === 'hunger'/)
  assert.match(panel, /rerollParentId/)
})

test('039-C pagina por cursor sin cargar todo el historial', () => {
  assert.match(panel, /limit: 10/)
  assert.match(panel, /cursor: nextCursor/)
  assert.match(panel, /Mostrar más/)
  assert.match(panel, /mergedItems/)
})

test('039-C ofrece filtros de origen y descripcion', () => {
  assert.match(panel, /Aplicar filtros/)
  assert.match(panel, /source === ''/)
  assert.match(panel, /description\.trim\(\)/)
  assert.match(panel, /type="search"/)
})

test('039-C mantiene el historial de dados fuera de Inicio y dentro de Sesiones', () => {
  assert.doesNotMatch(main, /<DiceHistoryPanel/)
  assert.match(sessions, /Historial de la/)
  assert.match(sessions, /workspaceTab/)
})

test('039-C integra dados de Sesion dentro del workspace seleccionado', () => {
  assert.doesNotMatch(chronicle, /Historial de la crónica/)
  assert.doesNotMatch(chronicle, /<DiceRollPanel/)
  assert.doesNotMatch(chronicle, /<DiceHistoryPanel/)
  assert.match(sessions, /chronicleId=\{chronicleId\}/)
  assert.match(sessions, /sessionId=\{[\s\S]*selectedSession\.id/)
  assert.match(sessions, /Historial de la sesión seleccionada/)
  assert.match(sessions, /workspaceTab\([\s\S]*'dice',[\s\S]*'Tiradas'/)
})

test('039-C permite registrar tirada contextual o privada desde Sesiones', () => {
  assert.match(rollPanel, /readonly chronicleId\?: string/)
  assert.match(rollPanel, /readonly sessionId\?: string/)
  assert.match(rollPanel, /Visibilidad/)
  assert.match(rollPanel, /value="private"/)
  assert.match(sessions, /<DiceRollPanel/)
})
