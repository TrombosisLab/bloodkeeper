import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import test from 'node:test'

const identity = readFileSync(
  new URL('../src/features/character-sheet/components/CharacterIdentity.tsx', import.meta.url),
  'utf8',
)
const portrait = readFileSync(
  new URL('../src/features/character-sheet/components/CharacterPortrait.tsx', import.meta.url),
  'utf8',
)
const iconPath = new URL('../public/assets/v5/clans/symbols/human.png', import.meta.url)

test('la ficha comunica que el estado humano llega al componente del retrato', () => {
  assert.match(identity, /clan=\{character\.clan\}\s+isHuman=\{human\}/)
})

test('el retrato vacío de humanos muestra la H y la etiqueta Humano', () => {
  assert.match(portrait, /isHuman \? \([\s\S]*?src="\/assets\/v5\/clans\/symbols\/human\.png"/)
  assert.match(portrait, /<span>\{isHuman \? 'Humano' : displayValue\(clan, 'Sin clan'\)\}<\/span>/)
  assert.match(portrait, /<V5VisualMark kind="clan-symbol" value=\{clan\} decorative \/>/)
})

test('al retirar una foto, el mensaje corresponde al estado del personaje', () => {
  assert.match(portrait, /setMessage\(isHuman \? 'Se vuelve a mostrar el emblema humano\.' : 'Se vuelve a mostrar el emblema del clan\.'\)/)
})

test('el archivo del emblema humano ya existe y no está vacío', () => {
  assert.ok(statSync(iconPath).size > 1_000)
})
