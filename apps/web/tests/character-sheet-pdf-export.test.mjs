import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const component = fs.readFileSync(
  new URL(
    '../src/features/character-sheet/components/PersistedCharacterPdfExport.tsx',
    import.meta.url,
  ),
  'utf8',
)

const gateway = fs.readFileSync(
  new URL(
    '../src/features/character-sheet/infrastructure/character-sheet-pdf.api.ts',
    import.meta.url,
  ),
  'utf8',
)

const sheet = fs.readFileSync(
  new URL(
    '../src/features/character-sheet/components/CharacterSheet.tsx',
    import.meta.url,
  ),
  'utf8',
)

test('SPEC-065 presenta formatos editable e impresión', () => {
  assert.match(component, /PDF editable/)
  assert.match(component, /PDF para imprimir/)
  assert.match(component, /Descargar ficha/)
  assert.match(component, /Generando PDF/)
  assert.match(component, /role="alert"/)
})

test('SPEC-065 descarga con sesión y nombre HTTP', () => {
  assert.match(gateway, /credentials: 'include'/)
  assert.match(gateway, /Accept: 'application\/pdf'/)
  assert.match(gateway, /Content-Disposition/)
  assert.match(gateway, /response\.blob\(\)/)
})

test('SPEC-065 solo expone exportación en ficha persistida', () => {
  assert.match(sheet, /PersistedCharacterPdfExport/)
  assert.match(sheet, /characterId !== undefined/)
})
