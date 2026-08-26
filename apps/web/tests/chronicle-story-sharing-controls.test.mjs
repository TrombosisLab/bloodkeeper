import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const workspace = await readFile(
  new URL('../src/features/chronicles/components/ChronicleStoryWorkspace.tsx', import.meta.url),
  'utf8',
)
const sharedWorkspace = await readFile(
  new URL('../src/features/chronicles/components/ChronicleSharedStoryWorkspace.tsx', import.meta.url),
  'utf8',
)

test('SPEC-060-F gives the Narrator explicit Story publication controls', () => {
  assert.match(workspace, /Publicación/)
  assert.match(workspace, /Visibilidad de la historia/)
  assert.match(workspace, /Resumen compartido/)
  assert.match(workspace, /chronicle_participants/)
  assert.match(workspace, /Guardar publicación/)
})

test('SPEC-060-F persists visibility and shared summary through the Story gateway', () => {
  assert.match(workspace, /visibility: visibilityDraft/)
  assert.match(workspace, /sharedSummary: sharedSummaryDraft/)
  assert.match(workspace, /expectedRevision: selected.revision/)
})

test('SPEC-060-F keeps new Stories private by default and player view read-only', () => {
  assert.match(workspace, /visibility: 'narrator_only'/)
  assert.match(sharedWorkspace, /listShared/)
  assert.doesNotMatch(sharedWorkspace, /Guardar publicación|storyGateway.update/)
})
