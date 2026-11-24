import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(
  new URL(
    '../src/features/character-sheet/components/PersistedCharacterEmbrace.tsx',
    import.meta.url,
  ),
  'utf8',
)

const styles = await readFile(
  new URL('../src/styles/character-sheet.css', import.meta.url),
  'utf8',
)

test('el Abrazo se realza dentro del bloque existente de la ficha', () => {
  assert.match(component, /className="sheet-section embrace-section"/)
  assert.match(component, /className="embrace-section__irreversible"/)
  assert.match(component, /No se puede volver atrás/)
  assert.match(styles, /\.embrace-section\s*\{[\s\S]*color-border-accent/)
  assert.match(styles, /\.embrace-section__primary\s*\{[\s\S]*ui-button-primary-bg/)
})
