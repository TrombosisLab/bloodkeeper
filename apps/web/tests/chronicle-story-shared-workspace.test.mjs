import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const source = (path) => readFile(resolve(root, path), 'utf8')
const detail = await source('src/features/chronicles/components/ChronicleDetail.tsx')
const shared = await source('src/features/chronicles/components/ChronicleSharedStoryWorkspace.tsx')
const eventPanel = await source('src/features/chronicles/components/ChronicleEventPanel.tsx')
const gateway = await source('src/features/chronicles/infrastructure/chronicle-story.api.ts')

test('SPEC-060-F exposes Stories to active members with role-specific workspaces', () => {
  assert.match(detail, /canViewStories/)
  assert.match(detail, /ChronicleStoryWorkspace/)
  assert.match(detail, /ChronicleSharedStoryWorkspace/)
  assert.match(detail, /currentMembership !== undefined/)
})

test('SPEC-060-F shared workspace is read-only and uses only the shared route', () => {
  assert.match(shared, /listShared/)
  assert.match(shared, /Resumen compartido/)
  assert.match(shared, /Hitos de la historia/)
  assert.doesNotMatch(shared, /narratorNotes|reminders|eligibleCharacter|closure|sessions|events|characters|npcs|locations/)
  assert.ok(gateway.includes('/shared'))
  assert.match(gateway, /parseSharedStory/)
})

test('SPEC-060-F derives activation and completion in Timeline without duplicate Events', () => {
  assert.match(eventPanel, /story.startedAt/)
  assert.match(eventPanel, /story.completedAt/)
  assert.match(eventPanel, /Historia activada/)
  assert.match(eventPanel, /Historia completada/)
  assert.match(eventPanel, /no crean Sucesos duplicados/)
  assert.doesNotMatch(eventPanel, /storyGateway.create/)
})

test('SPEC-060-F refreshes Timeline when its tab becomes active', () => {
  assert.match(detail, /active={activeSection === 'timeline'}/)
  assert.match(eventPanel, /[chronicleId, active]/)
})
