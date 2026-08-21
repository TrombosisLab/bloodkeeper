import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const visual = readFileSync(
  new URL('../src/styles/bloodkeeper-visual-system.css', import.meta.url),
  'utf8',
);

test('El refinamiento visual conserva una sola fuente global', () => {
  assert.match(visual, /BLOODKEEPER_REFINEMENT_V1_START/);
  assert.match(visual, /\.character-list-card__status/);
  assert.match(visual, /\.chronicle-session-panel__item--selected/);
  assert.match(visual, /\.dashboard-panel--characters \.dashboard-panel__characters-action/);
  assert.doesNotMatch(visual, /visual-revolution-v[123]/);
});

test('El refinamiento no contiene reglas funcionales', () => {
  assert.doesNotMatch(visual, /fetch\(|axios|expectedRevision|consolidate|permission/i);
});
