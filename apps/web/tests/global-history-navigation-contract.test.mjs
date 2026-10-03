import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import {
  appViewFromHash,
  hashForAppView,
  sectionForAppView,
} from '../src/features/navigation/domain/app-navigation-location.ts'

const navigation = fs.readFileSync(
  new URL(
    '../src/features/navigation/components/AppNavigation.tsx',
    import.meta.url,
  ),
  'utf8',
)
const main = fs.readFileSync(
  new URL('../src/main.tsx', import.meta.url),
  'utf8',
)
const page = fs.readFileSync(
  new URL(
    '../src/features/history/components/GlobalHistoryPage.tsx',
    import.meta.url,
  ),
  'utf8',
)

test('Historia es una sección global con ruta propia', () => {
  const permissions = {
    canAccessChronicles: false,
    canAccessAdministration: false,
  }

  assert.equal(
    appViewFromHash('#/history', permissions),
    'history',
  )
  assert.equal(hashForAppView('history'), '#/history')
  assert.equal(sectionForAppView('history'), 'history')
  assert.match(navigation, /<span>Historia<\/span>/)
  assert.match(navigation, /Memoria global del mundo/)
  assert.match(main, /<GlobalHistoryPage \/>/)
})

test('el archivo histórico permite ordenar, publicar y relacionar sin encerrar la entrada en una crónica', () => {
  assert.doesNotMatch(page, /global-history__intro/)
  assert.match(page, /Categorías históricas/)
  assert.match(page, /Año inicial/)
  assert.match(page, /Periodo mostrado/)
  assert.match(page, /Visibilidad/)
  assert.match(page, /Crónicas relacionadas/)
  assert.match(page, /La entrada seguirá siendo global/)
})

test('el detalle respeta los filtros y el editor bloquea el desplazamiento del fondo', () => {
  assert.match(page, /const selected =\s*filtered\.find/)
  assert.match(page, /filtered\[0\] \?\? null/)
  assert.match(page, /selected\?\.id === entry\.id/)
  assert.match(page, /Sin resultados/)
  assert.match(page, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(page, /document\.body\.style\.overflow = previous/)
})
