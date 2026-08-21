import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const header = readFileSync(
  new URL('../src/components/layout/AppHeader.tsx', import.meta.url),
  'utf8',
);
const visual = readFileSync(
  new URL('../src/styles/bloodkeeper-visual-system.css', import.meta.url),
  'utf8',
);

test('BloodKeeper usa una sola fuente visual global', () => {
  assert.match(main, /bloodkeeper-visual-system\.css/);
  assert.doesNotMatch(main, /visual-revolution-v[123]\.css/);

  for (const token of [
    '--color-canvas: #080808',
    '--color-accent: #b93647',
    '--ui-surface-panel-gradient',
    '--ui-button-primary-bg',
  ]) {
    assert.match(visual, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('La marca visible se presenta como BloodKeeper', () => {
  assert.match(header, /<strong>BloodKeeper<\/strong>/);
  assert.match(header, /<span>Vampiro V5 Revolution<\/span>/);
});

test('El sistema visual no contiene lógica de dominio', () => {
  assert.doesNotMatch(visual, /fetch\(|axios|expectedRevision|consolidate|permission/i);
});
