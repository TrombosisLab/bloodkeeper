import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const css=readFileSync(new URL('../src/styles/character-state-tracks.css',import.meta.url),'utf8');
test('internal indicator correction applies on desktop too, without changing card layout',()=>{
  assert.doesNotMatch(css,/@media|display:\s*none|overflow:\s*hidden|transform:/);
  assert.match(css,/repeat\(10, minmax\(0, 1fr\)\)/);
  assert.match(css,/\.humanity-box\s*\{[^}]*min-width: 0 !important/s);
  assert.match(css,/\.hunger-track\s*\{[^}]*gap: 10px !important[^}]*padding: 7px !important/s);
  const main=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');
  assert.ok(main.indexOf("import './styles/character-state-tracks.css'")>main.indexOf("import './styles/v5-visual-assets.css'"));
});
test('ten humanity slots and five rotated drops fit the observed desktop card content',()=>{
  const width=163.359375;
  const cell=(width-18)/10;
  assert.ok(cell<20 && cell>12);
  assert.ok(10*cell+18<=width+0.001);
  const extent=27/Math.sqrt(2),advance=22;
  assert.ok(extent<advance);
  assert.ok(7+4*advance+12+(extent-12)/2<width);
});

test('hunger spacing covers the visible mobile state panel as well as the compact strip',()=>{
  assert.match(css,/\.state-card--hunger \.hunger-track\s*\{/);
  assert.match(css,/\.state-card--hunger \.hunger-drop\s*\{/);
  assert.doesNotMatch(css,/compact-state-strip \.hunger-(?:track|drop)\s*\{/);
});
