import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const styles = readFileSync(resolve(here, '../src/features/chronicles/components/chronicle-participants-workspace.css'), 'utf8')

test('Participantes diferencia las secciones y evita estirar la tarjeta de identidad en escritorio', () => {
  const v4 = styles.slice(styles.indexOf('PARTICIPANTS_DESKTOP_VISUAL_V4'))
  assert.match(v4, /@media \(min-width: 1181px\)/)
  assert.match(v4, /participant-two-column \{ align-items: start; \}/)
  assert.match(v4, /participant-card--identity-data \{[\s\S]*?align-self: start/)
  for (const color of ['#332917', '#18332f', '#302616', '#321b20', '#2b2235']) {
    assert.ok(v4.includes(color), `falta el fondo distintivo ${color}`)
  }
})

test('el refuerzo v4 no altera móvil ni tableta', () => {
  const v4 = styles.slice(styles.indexOf('PARTICIPANTS_DESKTOP_VISUAL_V4'))
  assert.doesNotMatch(v4, /@media \(max-width:/)
  assert.match(v4, /@media \(min-width: 1181px\)/)
})
