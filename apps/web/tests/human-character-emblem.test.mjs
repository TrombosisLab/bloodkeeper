import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import test from 'node:test'

const identity = readFileSync(
  new URL('../src/features/character-sheet/components/CharacterIdentity.tsx', import.meta.url),
  'utf8',
)
const iconPath = new URL('../public/assets/v5/clans/symbols/human.png', import.meta.url)

test('la ficha presenta el emblema humano en el mismo bloque que los emblemas de clan', () => {
  assert.match(identity, /human \? \([\s\S]*?className="clan-mark clan-mark--human"/)
  assert.match(identity, /src="\/assets\/v5\/clans\/symbols\/human\.png"/)
  assert.match(identity, /<strong>Humano<\/strong>/)
  assert.match(identity, /kind="clan-symbol"[\s\S]*?transitionalValue\(character\.clan/)
})

test('el recurso del emblema humano está instalado y no está vacío', () => {
  const size = statSync(iconPath).size
  assert.ok(size > 1_000, `Tamaño de icono inesperado: ${size}`)
})
