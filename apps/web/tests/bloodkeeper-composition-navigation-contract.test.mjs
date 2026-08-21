import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const visual = readFileSync(
  new URL('../src/styles/bloodkeeper-visual-system.css', import.meta.url),
  'utf8',
);

test('La composición usa información real sin inventar destinos', () => {
  assert.match(visual, /BLOODKEEPER_COMPOSITION_V1_START/);
  assert.match(visual, /\.dashboard__header::after/);
  assert.match(visual, /\.dashboard-panel--characters::after/);
  assert.match(visual, /\.chronicle-session-panel__workspace-empty/);
  assert.match(visual, /@media \(max-width: 1100px\)/);
  assert.doesNotMatch(visual, /href=|location\.href|fetch\(|axios|permission/i);
});

test('La composición mantiene una única hoja visual', () => {
  assert.doesNotMatch(visual, /visual-revolution-v[123]/);
});
