import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(
  new URL(
    '../src/features/character-sheet/components/PersistedInitialVampireTransition.tsx',
    import.meta.url,
  ),
  'utf8',
)

const styles = await readFile(
  new URL(
    '../src/styles/character-sheet.css',
    import.meta.url,
  ),
  'utf8',
)

test('la transición explica dependencias sin repetir la lista de pendientes', () => {
  assert.match(component, /Puedes avanzar en el orden que prefieras/)
  assert.match(component, /Clan y\s+Generación habilitan opciones/)
  assert.match(component, /el Sire se decide\s+por separado/)
  assert.doesNotMatch(component, /Decisiones pendientes/)
  assert.doesNotMatch(component, /initial-vampire-transition__pending/)
  assert.match(component, /transition\.identity\.clanKey === null/)
})

test('las tarjetas se adaptan al ancho de su columna sin invadir el retrato', () => {
  assert.match(
    styles,
    /\.initial-vampire-transition__actions\s*\{[^}]*repeat\(auto-fit, minmax\(min\(100%, 17rem\), 1fr\)\)/s,
  )
  assert.doesNotMatch(
    styles,
    /\.initial-vampire-transition\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s,
  )
  assert.doesNotMatch(
    styles,
    /\.initial-vampire-transition\s*\{[^}]*width:\s*100vw/s,
  )
})

test('los controles conservan su foco visible y los botones siguen adaptándose en móvil', () => {
  assert.match(styles, /\.initial-vampire-transition__card select:focus-visible/)
  assert.match(styles, /\.initial-vampire-transition__submit:focus-visible/)
  assert.match(styles, /@media \(max-width: 600px\)/)
  assert.match(styles, /\.initial-vampire-transition__submit\s*\{\s*width: 100%/s)
})
