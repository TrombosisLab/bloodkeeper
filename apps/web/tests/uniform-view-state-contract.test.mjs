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

async function source(
  relativePath,
) {
  return readFile(
    path.join(
      webDirectory,
      relativePath,
    ),
    'utf8',
  )
}

const [
  authenticationSource,
  mainSource,
  wizardSource,
  chroniclesSource,
  persistedSource,
  layoutSource,
] = await Promise.all([
  source(
    'src/features/authentication/components/'
      + 'AuthenticationGate.tsx',
  ),
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
    'src/features/character-sheet/components/'
      + 'PersistedCharacterSheet.tsx',
  ),
  source('src/components/layout/AppLayout.tsx'),
])

const stateSources =
  authenticationSource
  + wizardSource
  + chroniclesSource
  + persistedSource

test('SPEC-012 representa los cinco estados alcanzables', () => {
  for (const state of [
    'loading',
    'empty',
    'error',
    'permission',
    'content',
  ]) {
    assert.match(
      stateSources,
      new RegExp(
        `(?:data-view-state=["{]|const \\w*ViewState)[\\s\\S]*${state}`,
      ),
    )
  }
})

test('SPEC-012 no crea una biblioteca visual genérica', () => {
  for (const componentName of [
    'LoadingState',
    'EmptyState',
    'ErrorState',
    'PermissionState',
  ]) {
    assert.doesNotMatch(
      layoutSource + stateSources,
      new RegExp(
        `(?:function|const|class)\\s+${componentName}\\b`,
      ),
    )
  }
})

test('Autenticación anuncia loading de forma no intrusiva', () => {
  assert.match(
    authenticationSource,
    /data-view-state="loading"[\s\S]*role="status"[\s\S]*aria-live="polite"[\s\S]*aria-busy="true"/,
  )
})

test('Autenticación diferencia error y acceso requerido', () => {
  assert.match(
    authenticationSource,
    /data-view-state="error"[\s\S]*role="alert"[\s\S]*aria-live="assertive"/,
  )
  assert.match(
    authenticationSource,
    /data-view-state="permission"[\s\S]*aria-busy=\{submitting\}/,
  )
})

test('Creación clasifica sus estados de persistencia reales', () => {
  assert.match(
    wizardSource,
    /const persistenceViewState =[\s\S]*'loading'[\s\S]*'permission'[\s\S]*'content'[\s\S]*'error'/,
  )
  assert.match(
    wizardSource,
    /data-view-state=\{persistenceViewState\}/,
  )
})

test('Creación usa live regions según severidad', () => {
  assert.match(
    wizardSource,
    /persistenceViewState ===[\s\S]*'loading'[\s\S]*\? 'status'[\s\S]*: 'alert'/,
  )
  assert.match(
    wizardSource,
    /\? 'polite'[\s\S]*: 'assertive'/,
  )
  assert.match(
    wizardSource,
    /aria-busy=\{persistenceBusy\}/,
  )
})

test('Crónicas clasifica loading empty error permission y content', () => {
  assert.match(
    chroniclesSource,
    /type ChronicleFailureState =[\s\S]*'error'[\s\S]*'permission'/,
  )
  assert.match(
    chroniclesSource,
    /const viewState =[\s\S]*'loading'[\s\S]*'empty'[\s\S]*'content'/,
  )
  assert.match(
    chroniclesSource,
    /<section className="chronicle-workspace">/,
  )
  assert.match(
    chroniclesSource,
    /data-view-state="empty"/,
  )
  assert.match(
    chroniclesSource,
    /<ul className="chronicle-cards">/,
  )
})

test('Crónicas anuncia carga vacío y fallo con semántica uniforme', () => {
  assert.match(
    chroniclesSource,
    /data-view-state="loading"[\s\S]*role="status"[\s\S]*aria-live="polite"/,
  )
  assert.match(
    chroniclesSource,
    /data-view-state="empty"[\s\S]*role="status"[\s\S]*aria-live="polite"/,
  )
  assert.match(
    chroniclesSource,
    /failureState \?\? 'error'[\s\S]*role="alert"[\s\S]*aria-live="assertive"/,
  )
  assert.match(
    chroniclesSource,
    /const viewState =[\s\S]*loading[\s\S]*submitting/,
  )
})

test('Ficha persistida diferencia loading permission y error', () => {
  assert.match(
    persistedSource,
    /const viewState =[\s\S]*'loading'[\s\S]*'content'[\s\S]*'permission'[\s\S]*'error'/,
  )
  assert.match(
    persistedSource,
    /data-view-state=\{viewState\}/,
  )
  assert.match(
    persistedSource,
    /viewState === 'loading'[\s\S]*\? 'status'[\s\S]*: 'alert'/,
  )
  assert.match(
    persistedSource,
    /\? 'polite'[\s\S]*: 'assertive'/,
  )
})

test('Personajes permanece como orquestador sin estados ficticios', () => {
  assert.doesNotMatch(
    mainSource,
    /data-view-state=/,
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
    /<ChronicleListCreate/,
  )
})
