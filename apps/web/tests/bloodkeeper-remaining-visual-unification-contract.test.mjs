import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const visual = readFileSync(
  new URL('../src/styles/bloodkeeper-visual-system.css', import.meta.url),
  'utf8',
);

test('Unifica los módulos restantes en el sistema BloodKeeper', () => {
  assert.match(visual, /BLOODKEEPER_REMAINING_UNIFICATION_V1_START/);

  for (const selector of [
    '.administration-hub__card',
    '.authentication-card',
    '.dice-roll-panel',
    '.creation-layout',
    '.sheet-section',
  ]) {
    assert.match(
      visual,
      new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
});

test('La unificación restante no introduce lógica ni navegación', () => {
  assert.doesNotMatch(
    visual,
    /fetch\(|axios|expectedRevision|consolidate|permission|location\.href|href=/i,
  );
});
