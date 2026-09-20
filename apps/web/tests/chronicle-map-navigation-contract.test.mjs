import assert from 'node:assert/strict'
import test from 'node:test'
import { appViewFromHash, hashForAppView, sectionForAppView } from '../src/features/navigation/domain/app-navigation-location.ts'

test('map is a protected application section with a canonical hash', () => {
  assert.equal(appViewFromHash('#/map', { canAccessChronicles: true }), 'map')
  assert.equal(appViewFromHash('#/map', { canAccessChronicles: false }), 'dashboard')
  assert.equal(hashForAppView('map'), '#/map')
  assert.equal(sectionForAppView('map'), 'map')
})
