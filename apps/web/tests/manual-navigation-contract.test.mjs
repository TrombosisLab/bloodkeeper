import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { appViewFromHash, hashForAppView, sectionForAppView } from '../src/features/navigation/domain/app-navigation-location.ts'

test('manual is available as the last general application section', () => {
  assert.equal(appViewFromHash('#/manual', { canAccessChronicles: false }), 'manual')
  assert.equal(hashForAppView('manual'), '#/manual')
  assert.equal(sectionForAppView('manual'), 'manual')
})

test('manual page includes the three permission-oriented guides', async () => {
  const source = await readFile(new URL('../src/features/manual/components/ManualPage.tsx', import.meta.url), 'utf8')

  assert.match(source, /admin: \{/)
  assert.match(source, /narrator: \{/)
  assert.match(source, /player: \{/)
  assert.match(source, /scripts\/admin-menu\.sh/)
  assert.match(source, /Generación rápida de crónicas/)
  assert.match(source, /Eventos y línea temporal/)
})
