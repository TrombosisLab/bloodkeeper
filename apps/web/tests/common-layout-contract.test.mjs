import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const testsDirectory =
  path.dirname(
    fileURLToPath(import.meta.url),
  )

const webDirectory =
  path.resolve(testsDirectory, '..')

async function source(relativePath) {
  return readFile(
    path.join(webDirectory, relativePath),
    'utf8',
  )
}

const [
  layoutSource,
  mainSource,
  wizardSource,
  chroniclesSource,
  authenticationSource,
  navigationSource,
] = await Promise.all([
  source('src/components/layout/AppLayout.tsx'),
  source('src/main.tsx'),
  source(
    'src/features/character-creation/components/'
      + 'CharacterCreationWizard.tsx',
  ),
  source(
    'src/features/chronicles/components/'
      + 'ChronicleListCreate.tsx',
  ),
  source(
    'src/features/authentication/components/'
      + 'AuthenticationGate.tsx',
  ),
  source(
    'src/features/navigation/components/'
      + 'AppNavigation.tsx',
  ),
])

function mainLandmarks(value) {
  return (
    value.match(/<main(?:\s|>)/g) ?? []
  ).length
}

test('SPEC-012 materializa un AppLayout reutilizable', () => {
  assert.match(
    layoutSource,
    /export function AppLayout/,
  )
  assert.match(
    layoutSource,
    /className="application"/,
  )
  assert.match(
    layoutSource,
    /className="application-shell"/,
  )
  assert.match(
    layoutSource,
    /className="application-shell__content"/,
  )
  assert.equal(mainLandmarks(layoutSource), 1)
})

test('SPEC-012 ofrece slots para la estructura común', () => {
  assert.match(
    layoutSource,
    /readonly header: ReactNode/,
  )
  assert.match(
    layoutSource,
    /readonly navigation: ReactNode/,
  )
  assert.match(
    layoutSource,
    /readonly breadcrumbs\?: ReactNode/,
  )
  assert.match(
    layoutSource,
    /readonly children: ReactNode/,
  )
  assert.match(
    layoutSource,
    /readonly contentClassName\?: string/,
  )
  assert.match(
    layoutSource,
    /<main className=\{contentClassName\}>/,
  )
})

test('SPEC-012 integra el layout sin cambiar los consumidores', () => {
  assert.match(mainSource, /<AppLayout/)
  assert.match(
    mainSource,
    /header=\{<AppHeader \/>\}/,
  )
  assert.match(
    mainSource,
    /navigation=\{[\s\S]*<AppNavigation/,
  )
  assert.match(
    mainSource,
    /breadcrumbs=\{[\s\S]*<AppBreadcrumbs/,
  )
  assert.match(
    mainSource,
    /<CharacterSheet \/>/,
  )
  assert.match(
    mainSource,
    /<PersistedCharacterSheet/,
  )
  assert.match(
    mainSource,
    /<CharacterCreationWizard/,
  )
  assert.match(
    mainSource,
    /<ChronicleListCreate \/>/,
  )
  assert.match(
    mainSource,
    /<Dashboard/,
  )
})

test('SPEC-012 preserva navegación activa y permisos', () => {
  assert.match(
    mainSource,
    /aria-label="Secciones principales"/,
  )
  assert.match(
    mainSource,
    /activeSection=\{[\s\S]*sectionForAppView\(view\)/,
  )
  assert.match(
    mainSource,
    /canManageChronicles=\{[\s\S]*canManageChronicles/,
  )
  assert.match(
    navigationSource,
    /aria-current=/,
  )
  assert.match(
    navigationSource,
    /canManageChronicles\s*\?\s*\(/,
  )
})

test('SPEC-012 retira la estructura duplicada de main.tsx', () => {
  assert.equal(mainLandmarks(mainSource), 0)
  assert.doesNotMatch(
    mainSource,
    /<div className="application-shell">/,
  )
  assert.doesNotMatch(
    mainSource,
    /<div className="application-shell__content">/,
  )
  assert.match(
    mainSource,
    /contentClassName=\{[\s\S]*'application-content'/,
  )
})

test('SPEC-012 convierte el creador en contenido interno', () => {
  assert.equal(mainLandmarks(wizardSource), 0)
  assert.match(
    wizardSource,
    /<section[\s\S]*className="creation-page"/,
  )
  assert.match(
    wizardSource,
    /aria-busy=\{persistenceBusy\}/,
  )
  assert.match(wizardSource, /<\/section>/)
})

test('SPEC-012 convierte Crónicas en contenido interno', () => {
  assert.equal(mainLandmarks(chroniclesSource), 0)
  assert.match(
    chroniclesSource,
    /<section className="chronicle-workspace">/,
  )
  assert.match(chroniclesSource, /<\/section>/)
})

test('SPEC-012 preserva autenticación y no crea estados genéricos', () => {
  assert.equal(
    mainLandmarks(authenticationSource),
    3,
  )
  assert.match(
    mainSource,
    /<AuthenticationGate>[\s\S]*<App \/>/,
  )
  assert.doesNotMatch(
    layoutSource,
    /(?:EmptyState|LoadingState|ErrorState|PermissionState)/,
  )
  assert.doesNotMatch(
    navigationSource,
    />\s*(?:Dados|Administración|Configuración|Ayuda)\s*</,
  )
})
