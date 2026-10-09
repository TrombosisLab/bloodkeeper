import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
const page = await readFile(new URL('../src/features/map/components/ChronicleMapPage.tsx', import.meta.url), 'utf8')
test('el formulario recupera, envía y muestra la descripción propia del marcador', () => {
  assert.match(page, /setInteractionDescription\(marker.description \|\| ''\)/)
  assert.match(page, /const input = \{[^\n]*description: interactionDescription.trim\(\) \|\| null/)
  assert.match(page, /marker.description \|\| marker.resource\?\.summary/)
  assert.match(page, /maxLength=\{2000\}/)
})
test('marcadores y zonas usan confirmación propia, cancelación y bloqueo de doble envío', () => {
  const removals = page.slice(page.indexOf('  function removeMarker'), page.indexOf('  async function removeMap'))
  assert.doesNotMatch(removals, /window.confirm/)
  assert.match(removals, /workspace\?\.canManage/)
  assert.match(removals, /activeMap\?\.id !== deletion.mapId/)
  assert.match(removals, /deleting/)
  assert.match(removals, /deleteMarker\(chronicleId, deletion.mapId, deletion.id\)/)
  assert.match(removals, /deleteArea\(chronicleId, deletion.mapId, deletion.id\)/)
  assert.match(page, /aria-labelledby="map-delete-title"/)
  assert.match(page, /Confirmar eliminación/)
  assert.match(page, /event.key === 'Escape'/)
  assert.match(page, /event.key === 'Tab'/)
})
