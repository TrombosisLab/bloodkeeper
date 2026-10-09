import assert from 'node:assert/strict'
import test from 'node:test'
import { planVisualPackage } from '../src/features/chronicles/domain/context-visual-package.ts'

test('el ZIP incluye retratos y portadas, sin duplicar candidatos ni incluir recursos privados', () => {
  const context = { characters: [{ id: 'pj1' }], npcs: [], locations: [],
    resources: [{ id: 'private', visibility: 'narrator_only' }],
    imageCandidates: [
      { targetType: 'CHARACTER', targetId: 'pj1', name: 'Retrato de PJ: Inés', imageUrl: '/portrait' },
      { targetType: 'CHARACTER', targetId: 'pj1', name: 'Retrato de PJ: Inés', imageUrl: '/portrait' },
      { targetType: 'CHARACTER', targetId: 'outside', name: 'Otro personaje', imageUrl: '/outside' },
      { targetType: 'SESSION', targetId: 's1', name: 'Portada de sesión: Primera noche · 2026-09-05', imageUrl: '/session' },
      { targetType: 'RESOURCE', targetId: 'private', name: 'Secreto', imageUrl: '/private' },
    ] }
  const plan = planVisualPackage(context, { maps: [] }, 'shared')
  assert.equal(plan.images.length, 2)
  assert.deepEqual(plan.images.map(image => image.reference), ['PJ1', 'SES1'])
  assert.ok(plan.images.every(image => !['Secreto', 'Otro personaje'].includes(image.name)))
})
