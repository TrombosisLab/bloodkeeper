import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(
  new URL('../src/features/chronicles/components/chronicle-summary-workspace.css', import.meta.url),
  'utf8',
)

test('la premisa y la situación se apilan a ancho completo solo en escritorio', () => {
  const match = css.match(/@media\s*\(min-width:\s*1101px\)\s*\{([\s\S]*?)\n\}/)
  assert.ok(match, 'falta el bloque exclusivo de escritorio')
  assert.match(match[1], /\.summary-block-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.match(match[1], /\.summary-block-grid article\s*,\s*\.summary-block-grid article \+ article/)
  assert.match(match[1], /\.summary-block-grid p\s*\{[^}]*max-width:\s*none/)
})

test('la diferenciación cromática conserva los acentos discretos de BloodKeeper', () => {
  assert.match(css, /SUMMARY_DESKTOP_VISUAL_SEPARATION_V1/)
  assert.match(css, /\.summary-block-grid article:first-child \.summary-eyebrow\s*\{\s*color:\s*#c7a66c/)
  assert.match(css, /\.summary-block-grid article \+ article \.summary-eyebrow\s*\{\s*color:\s*#d46b7b/)
  assert.match(css, /\.summary-card--pulse\s*\{[^}]*border-left:\s*3px solid #559b94/)
})

test('las reglas móviles existentes siguen presentes y el nuevo bloque no las modifica', () => {
  assert.match(css, /@media\s*\(max-width:\s*760px\)/)
  const markerIndex = css.indexOf('SUMMARY_DESKTOP_VISUAL_SEPARATION_V1')
  const mobileIndex = css.indexOf('@media(max-width:760px)')
  assert.ok(mobileIndex >= 0 && mobileIndex < markerIndex)
  assert.match(css.slice(markerIndex), /@media\s*\(min-width:\s*1101px\)/)
})
