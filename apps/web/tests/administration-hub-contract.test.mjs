import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  appViewFromHash,
  hashForAppView,
  sectionForAppView,
} from '../src/features/navigation/domain/app-navigation-location.ts'

const main = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')
const navigation = await readFile(new URL('../src/features/navigation/components/AppNavigation.tsx', import.meta.url), 'utf8')
const hub = await readFile(new URL('../src/features/administration/components/AdministrationHub.tsx', import.meta.url), 'utf8')

test('040-A autoriza la ruta solo con permiso administrativo', () => {
  assert.equal(hashForAppView('administration'), '#/administration')
  assert.equal(appViewFromHash('#/administration', {
    canAccessChronicles: true, canAccessAdministration: true,
  }), 'administration')
  assert.equal(appViewFromHash('#/administration', {
    canAccessChronicles: true, canAccessAdministration: false,
  }), 'dashboard')
  assert.equal(sectionForAppView('administration'), 'administration')
})

test('040-A muestra el acceso solo cuando existe permiso', () => {
  assert.match(navigation, /\{canAccessAdministration \? \(/)
  assert.match(navigation, /selectSection\('administration'\)/)
  assert.match(main, /roles\.includes\('admin'\)/)
})

test('040-A renderiza administracion como una rama exclusiva', () => {
  assert.match(main, /view === 'administration'[\s\S]*?<AdministrationHub \/>[\s\S]*?: view === 'dashboard'/)
  assert.match(main, /: view === 'character-creation' \? \(/)
  assert.match(main, /\) : null\}\s*<\/AppLayout>/)
  const dashboard = main.match(/<Dashboard[\s\S]*?\/>/)?.[0] ?? ''
  assert.doesNotMatch(dashboard, /canAccessAdministration/)
})

test('040-A reutiliza usuarios y reserva operaciones tecnicas para otra fase', () => {
  assert.match(hub, /Usuarios y cuentas/)
  assert.match(hub, /Operaciones del sistema/)
  assert.match(hub, /window\.confirm/)
  assert.doesNotMatch(hub, /passwordHash|prisma|docker compose/i)
})
