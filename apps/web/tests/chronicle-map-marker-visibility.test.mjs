import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const page = await readFile(new URL('../src/features/map/components/ChronicleMapPage.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/map/components/chronicle-map.css', import.meta.url), 'utf8')

test('el panel Marcadores permite filtrar temporalmente los cuatro tipos y las zonas', () => {
  assert.match(page, /Marcadores/)
  assert.match(page, /aria-expanded=\{mapLayerPanelOpen\}/)
  for (const layer of ['LOCATION', 'REFUGE', 'LANDMARK', 'DANGER', 'AREAS']) assert.match(page, new RegExp("['\"]" + layer + "['\"]"))
  assert.match(page, /Lugares/)
  assert.match(page, /Refugios/)
  assert.match(page, /Puntos de interés/)
  assert.match(page, /Zonas peligrosas/)
  assert.match(page, /Zonas delimitadas/)
  assert.match(page, /visibleMapLayers\[marker\.kind as MapLayer\]/)
  assert.match(page, /visibleMapLayers\.AREAS/)
  assert.match(page, /Mostrar todo/)
})

test('los filtros no alteran el mapa guardado y el panel funciona en móvil', () => {
  assert.match(page, /preferencia local de vista, nunca modifica los datos guardados/)
  assert.match(page, /setVisibleMapLayers\(current => \(\{ \.\.\.current, \[layer\]: !current\[layer\] \}\)\)/)
  assert.match(styles, /\.chronicle-map-layer-panel/)
  assert.match(styles, /@media \(max-width: 600px\)/)
  assert.match(page, /onClick=\{mapClick\}/)
})
