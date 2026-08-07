import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  appViewFromHash,
  hashForAppView,
  sectionForAppView,
} from '../src/features/navigation/domain/app-navigation-location.ts'

const dashboardSource =
  await readFile(
    new URL(
      '../src/features/dashboard/components/Dashboard.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const dashboardStyles =
  await readFile(
    new URL(
      '../src/features/dashboard/components/dashboard.css',
      import.meta.url,
    ),
    'utf8',
  )

const mainSource =
  await readFile(
    new URL(
      '../src/main.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const navigationSource =
  await readFile(
    new URL(
      '../src/features/navigation/components/AppNavigation.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const navigationTypes =
  await readFile(
    new URL(
      '../src/features/navigation/types/app-navigation.types.ts',
      import.meta.url,
    ),
    'utf8',
  )

test('SPEC-013 materializa Inicio como vista y sección real', () => {
  assert.match(
    navigationTypes,
    /\|\s*'dashboard'/,
  )
  assert.equal(
    hashForAppView('dashboard'),
    '#/dashboard',
  )
  assert.equal(
    appViewFromHash(
      '',
      { canManageChronicles: false },
    ),
    'dashboard',
  )
  assert.equal(
    appViewFromHash(
      '#/dashboard',
      { canManageChronicles: false },
    ),
    'dashboard',
  )
  assert.equal(
    sectionForAppView('dashboard'),
    'dashboard',
  )
})

test('SPEC-013 integra Dashboard dentro de AppLayout', () => {
  assert.match(
    mainSource,
    /import \{ Dashboard \}/,
  )
  assert.match(
    mainSource,
    /view === 'dashboard' \? \([\s\S]*<Dashboard/,
  )
  assert.doesNotMatch(
    dashboardSource,
    /<main(?:\s|>)/,
  )
  assert.match(
    dashboardSource,
    /<section[\s\S]*className="dashboard"/,
  )
})

test('SPEC-013 ofrece Inicio en la navegación persistente', () => {
  assert.match(
    navigationSource,
    /selectSection\('dashboard'\)/,
  )
  assert.match(
    navigationSource,
    />\s*Inicio\s*</,
  )
  assert.match(
    navigationSource,
    /activeSection === 'dashboard'/,
  )
})

test('SPEC-013 muestra acceso real a Personajes sin fingir un listado', () => {
  assert.match(
    dashboardSource,
    /onNavigateCharacters/,
  )
  assert.match(
    dashboardSource,
    />\s*Ir a Personajes\s*</,
  )
  assert.doesNotMatch(
    dashboardSource,
    /personajes recientes|personajes activos/i,
  )
  assert.doesNotMatch(
    dashboardSource,
    /\/api\/characters/,
  )
})

test('SPEC-013 limita el resumen de Crónicas al rol existente', () => {
  assert.match(
    dashboardSource,
    /canManageChronicles\s*\?\s*\(/,
  )
  assert.match(
    dashboardSource,
    /await gateway\.list\(\)/,
  )
  assert.match(
    mainSource,
    /canManageChronicles=\{[\s\S]*canManageChronicles/,
  )
  assert.match(
    mainSource,
    /onNavigateChronicles=\{\(\) =>[\s\S]*navigateTo\('chronicles'\)/,
  )
})

test('SPEC-013 resume Crónicas sin duplicar su módulo completo', () => {
  assert.match(
    dashboardSource,
    /\.slice\(0, 3\)/,
  )
  assert.match(
    dashboardSource,
    /Crónicas relevantes/,
  )
  assert.doesNotMatch(
    dashboardSource,
    /Nueva crónica/,
  )
  assert.doesNotMatch(
    dashboardSource,
    /<form/,
  )
})

test('SPEC-013 representa carga vacío error contenido y reintento', () => {
  for (const state of [
    'loading',
    'empty',
    'error',
    'content',
  ]) {
    assert.match(
      dashboardSource,
      new RegExp(
        `(?:data-view-state=["{]|chronicleViewState)[\\s\\S]*${state}`,
      ),
    )
  }

  assert.match(
    dashboardSource,
    /role="status"[\s\S]*aria-live="polite"/,
  )
  assert.match(
    dashboardSource,
    /role="alert"[\s\S]*aria-live="assertive"/,
  )
  assert.match(
    dashboardSource,
    />\s*Reintentar\s*</,
  )
})

test('SPEC-013 no crea actividad administración ni destinos ficticios', () => {
  const combined =
    dashboardSource
    + navigationSource
    + mainSource

  assert.doesNotMatch(
    combined,
    /Actividad reciente/,
  )
  assert.doesNotMatch(
    combined,
    />\s*(?:Dados|Administración|Configuración|Ayuda)\s*</,
  )
})

test('SPEC-013 mantiene un diseño responsive con tokens existentes', () => {
  assert.match(
    dashboardStyles,
    /grid-template-columns:[\s\S]*auto-fit/,
  )
  assert.match(
    dashboardStyles,
    /@media \(max-width: 900px\)/,
  )
  assert.match(
    dashboardStyles,
    /@media \(max-width: 600px\)/,
  )
  assert.match(
    dashboardStyles,
    /var\(--color-panel-border-subtle\)/,
  )
  assert.match(
    dashboardStyles,
    /var\(--color-surface-card\)/,
  )
})

test('SPEC-013 personaliza la entrada sin crear componentes genéricos', () => {
  assert.match(
    dashboardSource,
    /Bienvenido, \{displayName\}/,
  )
  assert.match(
    dashboardSource,
    /aria-labelledby="dashboard-title"/,
  )

  for (const componentName of [
    'LoadingState',
    'EmptyState',
    'ErrorState',
    'PermissionState',
  ]) {
    assert.doesNotMatch(
      dashboardSource,
      new RegExp(
        `(?:function|const|class)\\s+${componentName}\\b`,
      ),
    )
  }
})
