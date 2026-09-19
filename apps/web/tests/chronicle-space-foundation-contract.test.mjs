import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const webRoot = process.cwd()
const componentPath = path.join(
  webRoot,
  'src/features/chronicle-space/components/ChronicleSpacePrototype.tsx',
)

test('Sala de Investigación usa un control semántico para cerrar fondos de diálogo', () => {
  const source = fs.readFileSync(componentPath, 'utf8')

  assert.match(source, /className="space-overlay__dismiss"/)
  assert.match(source, /aria-label="Cerrar previsualización"/)
  assert.match(source, /aria-label="Cerrar foco"/)
  assert.doesNotMatch(source, /<div[^>]+role="presentation"[^>]+onClick=/)
})

test('La pizarra no contiene el retorno siempre verdadero del layout experimental', () => {
  const source = fs.readFileSync(componentPath, 'utf8')

  assert.doesNotMatch(source, /Number\.isFinite\(Date\.now\(\)\)/)
})
