import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const panel = await readFile(new URL('../src/features/chronicles/components/ChronicleSessionContextPanel.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/chronicles/components/chronicle-session-context-panel.css', import.meta.url), 'utf8')

test('SPEC-069 preparación vincula eventos, PNJ, localizaciones y recursos', () => {
  for (const marker of ['gateway.sessionContext', 'gateway.events', 'gateway.npcs', 'gateway.locations', 'resourceIds', 'Documentos, artefactos y organizaciones', 'Guardar contexto']) {
    assert.match(panel, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(panel, /gateway\.replaceSessionContext/)
  assert.match(panel, /eventIds,[\s\S]*npcIds,[\s\S]*locationIds,[\s\S]*resourceIds/)
})

test('SPEC-069 selector diferencia recursos públicos y privados', () => {
  assert.match(panel, /chronicle_participants/)
  assert.match(panel, /Solo Narrador/)
  assert.match(panel, /Compartido/)
})

test('SPEC-069 mantiene una rejilla compacta y responsive', () => {
  assert.match(styles, /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(styles, /@media \(max-width:\s*1100px\)/)
  assert.match(styles, /@media \(max-width:\s*760px\)/)
})
