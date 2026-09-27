import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const catalog = await readFile(new URL('../src/features/chronicles/components/ChronicleResourceCatalog.tsx', import.meta.url), 'utf8')
const notebook = await readFile(new URL('../src/features/notebook/components/NotebookPhaseTwo.tsx', import.meta.url), 'utf8')

test('Recursos permite seleccionar jugadores concretos', () => {
  assert.match(catalog, /selected_players/)
  assert.match(catalog, /audienceUserIds/)
  assert.match(catalog, /Jugadores destinatarios/)
  assert.ok(catalog.includes('/participants?limit=50'))
})

test('Archivo no marca como solo narrador un recurso visible para jugadores seleccionados', () => {
  assert.match(notebook, /restricted: item\.visibility === 'narrator_only'/)
})
