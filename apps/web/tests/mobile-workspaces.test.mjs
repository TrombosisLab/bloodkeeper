import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = new URL('../src/features/', import.meta.url);
const files = [
  ['chronicles/components/chronicle-detail.css', 'BLOODKEEPER_CHRONICLES_MOBILE_V2'],
  ['map/components/chronicle-map.css', 'BLOODKEEPER_MAP_MOBILE_V2'],
  ['chronicle-space/components/chronicle-space-prototype.css', 'BLOODKEEPER_INVESTIGATION_MOBILE_V2'],
  ['chronicles/components/chronicle-story-guide-workspace.css', 'BLOODKEEPER_GUIDE_MOBILE_V2'],
  ['chronicle-space/components/relationship-maps.css', 'BLOODKEEPER_RELATIONS_MOBILE_V2'],
];
const patches = files.map(([file, marker]) => {
  const source = readFileSync(new URL(file, root), 'utf8');
  assert.ok(source.includes(marker));
  return source.slice(source.indexOf('/* ' + marker));
});
test('todos los ajustes se limitan a pantallas de hasta 720px', () => {
  for (const css of patches) {
    assert.equal((css.match(/@media/g) || []).length, 1);
    assert.match(css, /@media\s*\(max-width: 720px\)/);
    let depth = 0;
    for (const char of css.slice(css.indexOf('@media'))) {
      if (char === '{') depth++;
      if (char === '}') depth--;
      assert.ok(depth >= 0);
    }
    assert.equal(depth, 0);
  }
});
test('no cambia geometría, rutas ni interacción de tarjetas y marcas', () => {
  for (const css of patches) {
    assert.doesNotMatch(css, /(?:transform|touch-action|pointer-events|zoom)\s*:/);
    assert.doesNotMatch(css, /\.(?:story-guide-card|story-guide__canvas|story-guide__edges|chronicle-map-marker|chronicle-map-area|chronicle-map-canvas__content|board-card)\b\s*[{,:]/);
    assert.doesNotMatch(css, /display:\s*none/);
  }
});
test('pestañas legibles y navegación sin etiquetas cortadas', () => {
  assert.match(patches[0], /section-tabs[^}]*flex-wrap: wrap/s);
  assert.match(patches[2], /space-nav[^}]*repeat\(2, minmax\(0, 1fr\)\)/s);
});
test('mapa y diálogos adaptan sus controles sin cambiar el dibujo', () => {
  assert.match(patches[1], /chronicle-select[^}]*grid-column: 1 \/ -1/s);
  assert.match(patches[1], /max-height: calc\(100dvh - 24px\)/);
  assert.match(patches[3], /board-wrap[^}]*grid-template-rows: auto minmax\(0, 1fr\)/s);
});
test('controles y formularios cómodos para uso táctil', () => {
  for (const css of patches) assert.match(css, /min-height: 44px/);
  for (const css of patches.slice(1)) assert.match(css, /font-size: 16px/);
});
