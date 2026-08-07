import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentSource =
  await readFile(
    new URL(
      '../src/features/navigation/components/AppBreadcrumbs.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const stylesSource =
  await readFile(
    new URL(
      '../src/features/navigation/components/app-breadcrumbs.css',
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

test('SPEC-011 presenta una miga semántica en la creación de personaje', () => {
  assert.match(
    componentSource,
    /<nav[\s\S]*aria-label="Migas de pan"/,
  )
  assert.match(
    componentSource,
    /<ol>/,
  )
  assert.match(
    componentSource,
    /aria-current="page"/,
  )
})

test('SPEC-011 conserva la cadena Personajes y Crear personaje', () => {
  assert.match(
    componentSource,
    />\s*Personajes\s*</,
  )
  assert.match(
    componentSource,
    />\s*Crear personaje\s*</,
  )
})

test('SPEC-011 permite volver a Personajes desde la miga', () => {
  assert.match(
    componentSource,
    /onClick=\{onNavigateCharacters\}/,
  )
  assert.match(
    mainSource,
    /onNavigateCharacters=\{\(\) =>[\s\S]*navigateTo\('characters'\)/,
  )
})

test('SPEC-011 muestra la miga únicamente en la vista anidada de creación', () => {
  assert.match(
    mainSource,
    /view === 'character-creation' \? \([\s\S]*<AppBreadcrumbs/,
  )
  assert.equal(
    (
      mainSource.match(
        /<AppBreadcrumbs/g,
      ) ?? []
    ).length,
    1,
  )
})

test('SPEC-011 mantiene accesibilidad foco y adaptación móvil', () => {
  assert.match(
    stylesSource,
    /\.app-breadcrumbs button:focus-visible/,
  )
  assert.match(
    stylesSource,
    /@media \(max-width: 600px\)/,
  )
  assert.match(
    stylesSource,
    /var\(--color-control-text\)/,
  )
})

test('SPEC-011 no convierte áreas bloqueadas en destinos ficticios', () => {
  assert.doesNotMatch(
    componentSource,
    />\s*(?:Dados|Administración|Configuración|Ayuda)\s*</,
  )
  assert.match(
    mainSource,
    /characterId=\{creationCharacterId\}/,
  )
  assert.match(
    mainSource,
    /onCharacterPersisted=\{setCreationCharacterId\}/,
  )
  assert.match(
    mainSource,
    /aria-label="Secciones principales"/,
  )
})
