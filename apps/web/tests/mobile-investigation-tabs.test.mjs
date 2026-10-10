import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const marker = '/* BLOODKEEPER_INVESTIGATION_TABS_MOBILE_V1 */';
assert.ok(source.includes(marker));
const css = source.slice(source.indexOf(marker));
test('dos columnas solo en móvil', () => {
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.equal((css.match(/@media/g) || []).length, 1);
  let depth = 0;
  for (const c of css.slice(css.indexOf('@media'))) {
    if (c === '{') depth++;
    if (c === '}') depth--;
    assert.ok(depth >= 0);
  }
  assert.equal(depth, 0);
});
test('etiquetas completas y controles táctiles', () => {
  assert.match(css, /min-height: 48px !important/);
  assert.match(css, /white-space: normal/);
  assert.doesNotMatch(css, /display:\s*none|text-overflow:\s*ellipsis|line-clamp/);
});
