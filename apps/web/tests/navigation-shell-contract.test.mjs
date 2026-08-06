import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  appViewFromHash,
  hashForAppView,
  sectionForAppView,
} from '../src/features/navigation/domain/app-navigation-location.ts'

const testsDirectory =
  path.dirname(
    fileURLToPath(import.meta.url),
  )

const webDirectory =
  path.resolve(testsDirectory, '..')

const componentSource =
  await readFile(
    path.join(
      webDirectory,
      'src/features/navigation/components/AppNavigation.tsx',
    ),
    'utf8',
  )

const navigationStyles =
  await readFile(
    path.join(
      webDirectory,
      'src/features/navigation/components/app-navigation.css',
    ),
    'utf8',
  )

const mainSource =
  await readFile(
    path.join(
      webDirectory,
      'src/main.tsx',
    ),
    'utf8',
  )

const packageSource =
  await readFile(
    path.join(
      webDirectory,
      'package.json',
    ),
    'utf8',
  )

test('SPEC-011 reconoce las ubicaciones reales de Personajes y Crónicas', () => {
  assert.equal(
    appViewFromHash(
      '#/characters',
      { canManageChronicles: true },
    ),
    'characters',
  )
  assert.equal(
    appViewFromHash(
      '#/characters/create',
      { canManageChronicles: true },
    ),
    'character-creation',
  )
  assert.equal(
    appViewFromHash(
      '#/chronicles',
      { canManageChronicles: true },
    ),
    'chronicles',
  )
})

test('SPEC-011 normaliza una ubicación desconocida a Personajes', () => {
  assert.equal(
    appViewFromHash(
      '#/unknown',
      { canManageChronicles: true },
    ),
    'characters',
  )
  assert.equal(
    appViewFromHash(
      '',
      { canManageChronicles: true },
    ),
    'characters',
  )
})

test('SPEC-011 impide abrir Crónicas sin el permiso ya existente', () => {
  assert.equal(
    appViewFromHash(
      '#/chronicles',
      { canManageChronicles: false },
    ),
    'characters',
  )
})

test('SPEC-011 mantiene hashes canónicos estables', () => {
  assert.equal(
    hashForAppView('characters'),
    '#/characters',
  )
  assert.equal(
    hashForAppView(
      'character-creation',
    ),
    '#/characters/create',
  )
  assert.equal(
    hashForAppView('chronicles'),
    '#/chronicles',
  )
})

test('SPEC-011 conserva la creación dentro de la sección Personajes', () => {
  assert.equal(
    sectionForAppView(
      'character-creation',
    ),
    'characters',
  )
  assert.equal(
    sectionForAppView('chronicles'),
    'chronicles',
  )
})

test('SPEC-011 ofrece menú semántico persistente y sección activa', () => {
  assert.match(
    componentSource,
    /<nav[\s\S]*aria-label=\{navigationLabel\}/,
  )
  assert.match(
    mainSource,
    /<AppNavigation[\s\S]*aria-label="Secciones principales"/,
  )
  assert.match(
    componentSource,
    /aria-current=/,
  )
  assert.match(
    componentSource,
    /Personajes/,
  )
  assert.match(
    componentSource,
    /Crónicas/,
  )
})

test('SPEC-011 conserva Crónicas condicionada por permisos', () => {
  assert.match(
    componentSource,
    /canManageChronicles\s*\?\s*\(/,
  )
  assert.match(
    mainSource,
    /roles\.includes\(\s*'narrator'/,
  )
})

test('SPEC-011 no inventa destinos sin consumidores reales', () => {
  assert.doesNotMatch(
    componentSource,
    />\s*(?:Inicio|Dados|Administración|Configuración|Ayuda)\s*</,
  )
})

test('SPEC-011 adapta el menú a escritorio tablet y móvil', () => {
  assert.match(
    navigationStyles,
    /grid-template-columns:[\s\S]*13rem[\s\S]*17rem/,
  )
  assert.match(
    navigationStyles,
    /@media \(max-width: 900px\)/,
  )
  assert.match(
    navigationStyles,
    /@media \(max-width: 600px\)/,
  )
  assert.match(
    componentSource,
    /aria-expanded=/,
  )
  assert.match(
    componentSource,
    /hidden=\{!navigationVisible\}/,
  )
})

test('SPEC-011 usa ubicación nativa sin introducir un router externo', () => {
  assert.match(
    mainSource,
    /window\.location\.hash/,
  )
  assert.match(
    mainSource,
    /hashchange/,
  )
  assert.match(
    mainSource,
    /<AppNavigation/,
  )
  assert.doesNotMatch(
    packageSource,
    /react-router|@tanstack\/router/,
  )
})
