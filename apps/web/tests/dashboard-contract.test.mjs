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
      { canAccessChronicles: false },
    ),
    'dashboard',
  )
  assert.equal(
    appViewFromHash(
      '#/dashboard',
      { canAccessChronicles: false },
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

test('SPEC-013 muestra el acceso contextual a la ficha de personaje', () => {
  assert.match(dashboardSource, /onNavigateCharacters/)
  assert.match(dashboardSource, /dashboard-character-panel/)
  assert.match(dashboardSource, /Abrir ficha/)
})

test('SPEC-013 carga el contexto de cronica y personaje desde el endpoint vigente', () => {
  assert.equal(dashboardSource.includes('/api/dashboard/context?'), true)
  assert.match(dashboardSource, /selectedChronicleId/)
  assert.match(dashboardSource, /selectedCharacterId/)
  assert.match(mainSource, /<Dashboard/)
})

test('SPEC-013 muestra tarjetas seleccionables sin duplicar el modulo de cronicas', () => {
  assert.match(dashboardSource, /Tus cronicas activas/)
  assert.match(dashboardSource, /data.chronicles.map/)
  assert.match(dashboardSource, /Cambiar cronica/)
  assert.doesNotMatch(dashboardSource, /<form/)
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
    /ViewStateStatus[\s\S]*state="loading"/,
  )
  assert.match(
    dashboardSource,
    /ViewStateStatus[\s\S]*state="empty"/,
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

test('SPEC-013 no crea actividad ni destinos todavía ficticios', () => {
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
    />\s*(?:Dados|Configuración|Ayuda)\s*</,
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
test('UX Inicio presenta el panel contextual del personaje', () => {
  assert.match(dashboardSource, /dashboard-character-panel/)
  assert.match(dashboardSource, /dashboard-panel__wide-action/)
  assert.match(dashboardSource, /onClick={onNavigateCharacters}/)
  assert.match(dashboardStyles, /dashboard-character-panel__content/)
})

test('UX Inicio permite seleccionar todas las cronicas devueltas por el contexto', () => {
  assert.match(dashboardSource, /dashboard-chronicle-cards/)
  assert.match(dashboardSource, /data.chronicles.map/)
  assert.doesNotMatch(dashboardSource, /slice(0,s*3)|limit:s*3/)
})

test('UX Inicio conserva responsive y no inventa contenido', () => {
  assert.match(dashboardStyles, /@media/)
  assert.match(dashboardStyles, /dashboard-character-panel__content/)
  assert.match(dashboardStyles, /dashboard-chronicle-cards/)
  assert.doesNotMatch(dashboardSource, /Actividad reciente|Estadisticas|Metricas|Buscar cronicas|Filtrar cronicas/)
})

test('UX Inicio mantiene Dados fuera del dashboard contextual', () => {
  assert.doesNotMatch(mainSource, /<DiceRollPanel|<DiceHistoryPanel/)
  assert.match(dashboardSource, /dashboard-previous/)
  assert.match(dashboardSource, /dashboard-pending/)
})

test('UX Inicio usa la rejilla primaria actual sin rellenar contenido ficticio', () => {
  assert.match(dashboardStyles, /dashboard-primary-grid/)
  assert.match(dashboardStyles, /dashboard-secondary-grid/)
  assert.doesNotMatch(dashboardSource, /Personajes recientes|Personajes activos|Ultimo personaje|Estadisticas/)
})
