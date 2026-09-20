import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const page = await readFile(
  new URL('../src/features/map/components/ChronicleMapPage.tsx', import.meta.url),
  'utf8',
)

const api = await readFile(
  new URL('../src/features/map/infrastructure/chronicle-map.api.ts', import.meta.url),
  'utf8',
)

const styles = await readFile(
  new URL('../src/features/map/components/chronicle-map.css', import.meta.url),
  'utf8',
)

test('el mapa permite editar y borrar marcadores y zonas', () => {
  assert.match(api, /updateMarker:/)
  assert.match(api, /deleteMarker:/)
  assert.match(api, /updateArea:/)
  assert.match(api, /deleteArea:/)
  assert.match(page, /Modificar/)
  assert.match(page, /removeMarker/)
  assert.match(page, /removeArea/)
  assert.match(page, /Eliminar zona/)
  assert.match(page, /Redibujar zona en el mapa/)
})

test('el dibujo de zonas muestra una previsualización durante el arrastre', () => {
  assert.match(page, /onPointerMove=\{moveArea\}/)
  assert.match(page, /chronicle-map-area--preview/)
  assert.match(styles, /chronicle-map-area--preview/)
})

test('los marcadores vinculados abren la ficha protegida del recurso', () => {
  assert.match(page, /notebookApi\.resourcePreview/)
  assert.match(page, /if \(marker\.resource\)/)
  assert.match(page, /Abrir recurso/)
  assert.match(page, /chronicle-map-resource-dialog/)
  assert.match(page, /marker\.resource\.imageUrl/)
  assert.match(styles, /chronicle-map-resource-dialog/)
})

test('los marcadores usan una escala visual compacta', () => {
  assert.match(styles, /\.chronicle-map-marker\s*\{[^}]*width:\s*1\.55rem/)
  assert.match(styles, /\.chronicle-map-marker\s*\{[^}]*height:\s*1\.55rem/)
})

test('la ficha del punto permanece flotante sobre la interfaz', () => {
  assert.match(styles, /\.chronicle-map-inspector\s*\{[^}]*position:\s*fixed/)
  assert.match(styles, /\.chronicle-map-inspector\s*\{[^}]*z-index:\s*80/)
})


test('el mapa ofrece tres tamaños persistentes y conserva la cabecera global', async () => {
  const header = await readFile(new URL('../src/components/layout/AppHeader.tsx', import.meta.url), 'utf8')
  assert.match(page, /Tamaño del marcador/)
  assert.match(page, /Pequeño · 1\/3 del tamaño actual/)
  assert.match(page, /Medio · 1\/2 del tamaño actual/)
  assert.match(page, /Grande · tamaño actual/)
  assert.match(styles, /\.chronicle-map-marker--size-small/)
  assert.match(styles, /\.chronicle-map-marker--size-medium/)
  assert.match(styles, /\.chronicle-map-marker--size-large/)
  assert.match(api, /size: ChronicleMapMarkerSize/)
  assert.match(header, /Cartografía de la crónica/)
  assert.doesNotMatch(page, /chronicle-map-page__intro/)
})

    
test('las zonas admiten estilos independientes', () => {
  assert.match(api, /fillColor/)
  assert.match(api, /labelColor/)
  assert.match(api, /labelVertical/)
  assert.match(api, /labelHorizontal/)
  assert.match(page, /Color del borde/)
  assert.match(page, /Color del relleno/)
  assert.match(page, /Color del texto/)
  assert.match(page, /Posición vertical/)
  assert.match(page, /Posición horizontal/)
  assert.match(page, /Tamaño de letra/)
  assert.match(styles, /\.chronicle-map-area--v-center/)
  assert.match(styles, /\.chronicle-map-area--h-right/)
  assert.match(styles, /\.chronicle-map-color-swatch/)
})
