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

test('SPEC-013 muestra el resumen de Crónicas a participantes autenticados', () => {
  assert.match(
    dashboardSource,
    /canAccessChronicles\s*\?\s*\(/,
  )
  assert.match(
    dashboardSource,
    /await gateway\.listPage\(\{/,
  )
  assert.match(
    mainSource,
    /canAccessChronicles=\{[\s\S]*canAccessChronicles/,
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
    /Tus crónicas/,
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
test(
  'UX Inicio compacta Personajes como acceso directo sin cambiar navegación',
  () => {
    assert.match(
      dashboardSource,
      /dashboard-panel--characters/,
    )
    assert.match(
      dashboardSource,
      /dashboard-panel__characters-action/,
    )
    assert.match(
      dashboardSource,
      /onClick=\{onNavigateCharacters\}/,
    )
    assert.match(
      dashboardStyles,
      /\.dashboard-panel--characters\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/,
    )
    assert.match(
      dashboardStyles,
      /\.dashboard-panel__characters-action[\s\S]*width:\s*auto/,
    )
  },
)

test(
  'UX Inicio densifica las tres crónicas de resumen sin inventar paginación',
  () => {
    assert.match(
      dashboardSource,
      /limit:\s*3/,
    )
    assert.match(
      dashboardSource,
      /\.slice\(0,\s*3\)/,
    )
    assert.match(
      dashboardStyles,
      /\.dashboard-chronicles\s*\{[\s\S]*gap:\s*0\.5rem/,
    )
    assert.match(
      dashboardStyles,
      /\.dashboard-chronicles article\s*\{[\s\S]*padding:\s*0\.65rem 0\.75rem/,
    )
    assert.doesNotMatch(
      dashboardSource,
      /Cargar más crónicas|chroniclesNextOffset|loadMoreChronicles/,
    )
  },
)

test(
  'UX Inicio conserva responsive y no introduce contenido ficticio',
  () => {
    assert.match(
      dashboardStyles,
      /@media \(max-width:\s*600px\)[\s\S]*dashboard-panel--characters[\s\S]*grid-template-columns:\s*1fr/,
    )
    assert.doesNotMatch(
      dashboardSource,
      /Actividad reciente|Estadísticas|Métricas|Buscar crónicas|Filtrar crónicas/,
    )
  },
)

test(
  'UX Inicio alinea Tirada manual e Historial con el Dashboard sin tocar Dados',
  () => {
    assert.match(
      mainSource,
      /<Dashboard[\s\S]*<DiceRollPanel mode="manual" \/>[\s\S]*<DiceHistoryPanel \/>/,
    )
    assert.match(
      dashboardStyles,
      /\.dashboard \+ \.dice-roll-panel\s*\{[\s\S]*width:\s*auto[\s\S]*max-width:\s*none/,
    )
    assert.match(
      dashboardStyles,
      /\.dashboard[\s\S]*\+ \.dice-roll-panel[\s\S]*\+ \.dice-history-panel\s*\{[\s\S]*margin:/,
    )
    assert.match(
      dashboardStyles,
      /\.dashboard\s*\{[\s\S]*padding-bottom:\s*0\.75rem/,
    )
    assert.doesNotMatch(
      mainSource,
      /dashboard-dice-wrapper|dashboard-workspace-wrapper/,
    )
  },
)

test(
  'UX Inicio alinea la altura de Personajes con Crónicas sin rellenar contenido',
  () => {
    assert.match(
      dashboardStyles,
      /\.dashboard-panel--characters\s*\{[\s\S]*align-self:\s*stretch/,
    )
    assert.match(
      dashboardStyles,
      /\.dashboard-panel--characters\s*\{[\s\S]*align-content:\s*start/,
    )
    assert.doesNotMatch(
      dashboardSource,
      /Personajes recientes|Personajes activos|Último personaje|Estadísticas/,
    )
  },
)
