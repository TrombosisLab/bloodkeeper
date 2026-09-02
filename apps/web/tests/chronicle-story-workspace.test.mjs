import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = (path) => readFile(resolve(root, path), 'utf8')
const detail = await source('src/features/chronicles/components/ChronicleDetail.tsx')
const workspace = await source('src/features/chronicles/components/ChronicleStoryWorkspace.tsx')
const styles = await source('src/features/chronicles/components/chronicle-story-workspace.css')
const gateway = await source('src/features/chronicles/infrastructure/chronicle-story.api.ts')

test('SPEC-060-D separates Stories and Timeline in the approved order', () => {
  assert.match(detail, /Historias/)
  assert.match(detail, /Cronología/)
  assert.match(detail, /ChronicleStoryWorkspace/)
  assert.ok(detail.indexOf('Historias') < detail.indexOf('Sesiones'))
  assert.ok(detail.indexOf('Sesiones') < detail.indexOf('Cronología'))
})

test('SPEC-060-D fixes the desktop three-column visual contract', () => {
  assert.match(styles, /grid-template-columns:\s*22fr 52fr 26fr/)
  assert.match(styles, /gap:\s*12px/)
  assert.match(styles, /border:\s*1px solid/)
  for (const surface of ['story-browser', 'story-detail', 'story-sidebar']) {
    assert.match(workspace, new RegExp(`className="${surface}`))
  }
})

test('SPEC-060-D renders every approved section with real data', () => {
  for (const label of [
    'Premisa',
    'En juego',
    'Hitos de la historia',
    'Sesiones vinculadas',
    'Sucesos registrados',
    'Personajes implicados',
    'Localizaciones',
    'Notas del Narrador',
    'Recordatorios',
    'Cierre de historia',
  ]) {
    assert.match(workspace, new RegExp(label))
  }
  for (const milestone of ['Gancho', 'Primer giro', 'Revelación', 'Clímax', 'Resolución']) {
    assert.match(workspace, new RegExp(milestone))
  }
})

test('SPEC-060-D connects CRUD, milestones, reminders, context and closure', () => {
  for (const method of [
    'create:',
    'update:',
    'activate:',
    'archive:',
    'milestone:',
    'addReminder:',
    'updateReminder:',
    'removeReminder:',
    'replaceContext:',
    'updateSessionProgress:',
    'complete:',
  ]) {
    assert.match(gateway, new RegExp(method))
  }
  assert.match(workspace, /associatedCharacters/)
  assert.match(workspace, /selected\.counts\.characters/)
  assert.match(workspace, /selected\.progress\.completed === 5/)
})

test('SPEC-060-E presents real attendance eligibility and explicit closure confirmation', () => {
  assert.match(workspace, /selected\.closure\.eligibleCharacterCount/)
  assert.match(workspace, /selected\.closure\.hasEligibleSession/)
  assert.match(workspace, /selected\.closure\.hasPreparationSession/)
  assert.match(workspace, /Resoluci.n narrativa/)
  assert.match(workspace, /Confirmo el cierre/)
  assert.match(workspace, /operationId: completionOperationId/)
  assert.match(workspace, /storyCompletionOperationId/)
  assert.match(workspace, /getRandomValues/)
  assert.doesNotMatch(workspace, /crypto\.randomUUID/)
  assert.match(gateway, /CompleteChronicleStoryApiRequest/)
  assert.match(workspace, /selected\.status === 'planned' \|\| selected\.status === 'completed'/)
  assert.match(workspace, /hasCompletedClosure/)
  assert.doesNotMatch(workspace, /\{!readOnly \? <button type="button" className="story-archive"/)
})

test('SPEC-060-E respects the global page limit without hiding narrative context', () => {
  assert.match(gateway, /limit: '50'/)
  assert.match(gateway, /while \(offset !== null\)/)
  assert.match(workspace, /loadAllOffsetItems/)
  assert.match(workspace, /limit: 50/)
  assert.doesNotMatch(workspace, /limit: 100/)
})

test('SPEC-060-D keeps a stable form reference across asynchronous creation', () => {
  assert.match(workspace, /const form = event\.currentTarget/)
  assert.match(workspace, /new FormData\(form\)/)
  assert.match(workspace, /form\.reset\(\)/)
  assert.doesNotMatch(workspace, /event\.currentTarget\.reset\(\)/)
})
