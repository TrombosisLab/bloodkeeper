import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const catalog = JSON.parse(await readFile(
  new URL('../../../packages/character-rules/catalogs/advantages.json', import.meta.url),
  'utf8',
))
const source = await readFile(
  new URL('../src/features/character-creation/components/AdvantagesStep.tsx', import.meta.url),
  'utf8',
)

test('Contactos no supera los 3 puntos permitidos por el catálogo', () => {
  const contacts = catalog.find(({ key }) => key === 'contacts')
  assert.deepEqual(contacts.allowedRatings, [1, 2, 3])
  const branch = source.split("'contact' ? (")[1]?.split("'retainer' ? (")[0]
  assert.match(branch, /allowedRatings=\{definition\.allowedRatings\}/)
  assert.match(branch, /max=\{definition\.allowedRatings\[definition\.allowedRatings\.length - 1\]\}/)
})

test('los controles especiales respetan las puntuaciones permitidas por definición', () => {
  for (const [kind, next] of [
    ['contact', 'retainer'], ['retainer', 'herd'], ['herd', 'resources'],
    ['resources', 'status'], ['status', 'mask'], ['mask', 'haven'],
  ]) {
    const branch = source.split(`'${kind}' ? (`)[1]?.split(`'${next}' ? (`)[0]
    assert.match(branch, /allowedRatings=\{definition\.allowedRatings\}/, kind)
  }
})
