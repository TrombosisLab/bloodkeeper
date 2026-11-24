import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const base = '../src/features/character-creation/'
const [identity, dialog, catalog, styles] = await Promise.all([
  readFile(new URL(base + 'components/IdentityStep.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'components/ClanInfoDialog.tsx', import.meta.url), 'utf8'),
  readFile(new URL(base + 'data/clan-catalog-help.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/bloodkeeper-visual-system.css', import.meta.url), 'utf8'),
])

test('cada tarjeta ofrece una i de información sin seleccionar el clan', () => {
  assert.match(identity, /className="[^"]*clan-card-selector__info[^"]*"/)
  assert.ok(identity.includes('aria-label={`Información sobre ${clan.name}`}'))
  assert.match(identity, /onClick=\{\(\) => setInfoClan\(clan\)\}/)
  assert.match(identity, /className="clan-card-selector__item"[\s\S]*?clan-card-selector__card[\s\S]*?<\/button>[\s\S]*?clan-card-selector__info/)
})

test('la ventana muestra una pincelada y las Disciplinas del clan', () => {
  assert.match(dialog, /<dialog/)
  assert.match(dialog, /showModal\(\)/)
  assert.match(dialog, /¿Qué los caracteriza\?/)
  assert.match(dialog, /Disciplinas del clan/)
  assert.match(dialog, /aria-label="Cerrar información"/)
  assert.match(dialog, /Es una pincelada orientativa/)
})

test('el catálogo ofrece una descripción breve para cada clan y tipo especial', () => {
  const keys = ['banuHaqim', 'brujah', 'caitiff', 'gangrel', 'hecata', 'lasombra', 'malkavian', 'ministry', 'nosferatu', 'ravnos', 'salubri', 'thinBlood', 'toreador', 'tremere', 'tzimisce', 'ventrue']
  for (const key of keys) assert.match(catalog, new RegExp('\\b' + key + ':'))
  assert.match(catalog, /Record<ClanKey, string>/)
})

test('el botón queda superpuesto en la tarjeta y conserva el diseño adaptable', () => {
  assert.match(styles, /\.clan-card-selector__item\s*\{[\s\S]*?position: relative/)
  assert.match(styles, /\.clan-card-selector__info\s*\{[\s\S]*?position: absolute/)
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.clan-card-selector__grid/)
})
