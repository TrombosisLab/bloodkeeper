import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css = readFileSync(new URL('../src/features/resources/components/resource-library.css', import.meta.url),'utf8');
const layout = css.split('/* BLOODKEEPER_RESOURCE_TREE_LAYOUT_V1 */')[1];
test('tree has a bounded independently scrolling list',()=>{
  assert.ok(layout);
  assert.match(layout,/max-height: clamp\(240px, 65dvh, 720px\)/);
  assert.match(layout,/\.resource-tree > ul\s*\{[^}]*min-height: 0;[^}]*overflow-y: auto;/s);
  assert.match(layout,/\.resource-tree > h2\s*\{\s*flex: 0 0 auto;/);
});
test('whole image is top-aligned and uses its own natural height',()=>{
  assert.match(layout,/\.resource-preview__image img\s*\{[^}]*position: static;[^}]*height: auto;[^}]*object-fit: contain;[^}]*object-position: center top;/s);
  assert.match(layout,/\.resource-showcase\s*\{\s*align-items: start;/);
});
test('mobile tree remains bounded and keyboard focus stays visible',()=>{
  assert.match(layout,/max-height: min\(40dvh, 320px\)/);
  assert.match(layout,/button:focus-visible/);
});
