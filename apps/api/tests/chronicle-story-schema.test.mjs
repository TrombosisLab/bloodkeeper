import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  CHRONICLE_STORY_MILESTONES,
  canEditChronicleStory,
  canTransitionChronicleStory,
  chronicleStoryProgress,
  normalizeChronicleStoryTitle,
} from '../src/chronicles/domain/chronicle-story.rules.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const schema = await readFile(resolve(root, 'prisma/schema.prisma'), 'utf8')
const migration = await readFile(
  resolve(root, 'prisma/migrations/20260825170500_add_chronicle_stories_core/migration.sql'),
  'utf8',
)

test('SPEC-060-A fija exactamente los cinco hitos visibles de la maqueta', () => {
  assert.deepEqual(
    CHRONICLE_STORY_MILESTONES.map(({ key, label, sortOrder }) => ({ key, label, sortOrder })),
    [
      { key: 'hook', label: 'Gancho', sortOrder: 0 },
      { key: 'first_turn', label: 'Primer giro', sortOrder: 1 },
      { key: 'revelation', label: 'Revelación', sortOrder: 2 },
      { key: 'climax', label: 'Clímax', sortOrder: 3 },
      { key: 'resolution', label: 'Resolución', sortOrder: 4 },
    ],
  )
  assert.deepEqual(chronicleStoryProgress(['hook', 'first_turn', 'revelation']), {
    completed: 3,
    total: 5,
    percentage: 60,
  })
})

test('SPEC-060-A valida título, edición y lifecycle base', () => {
  assert.equal(normalizeChronicleStoryTitle('  La desaparición  '), 'La desaparición')
  assert.throws(() => normalizeChronicleStoryTitle('   '))
  assert.equal(canEditChronicleStory('planned'), true)
  assert.equal(canEditChronicleStory('active'), true)
  assert.equal(canEditChronicleStory('completed'), false)
  assert.equal(canTransitionChronicleStory('planned', 'active'), true)
  assert.equal(canTransitionChronicleStory('active', 'completed'), true)
  assert.equal(canTransitionChronicleStory('completed', 'active'), false)
})

test('SPEC-060-A declara agregado, relaciones, privacidad y trazabilidad XP', () => {
  for (const model of [
    'ChronicleStory',
    'ChronicleStoryMilestone',
    'ChronicleStoryReminder',
    'ChronicleStorySession',
    'ChronicleStoryEvent',
    'ChronicleStoryCharacter',
    'ChronicleStoryNpc',
    'ChronicleStoryLocation',
    'ChronicleStoryCompletionOperation',
  ]) {
    assert.match(schema, new RegExp(`model ${model} \\{`))
  }
  assert.match(schema, /narratorNotes\s+String\?/)
  assert.match(schema, /experiencePace\s+ChronicleExperiencePace/)
  assert.match(schema, /experiencePaceSnapshot\s+ChronicleExperiencePace\?/)
  assert.match(schema, /storyId\s+String\?\s+@db\.Uuid/)
  assert.match(migration, /character_experience_story_reason_check/)
  assert.match(migration, /FOREIGN KEY \("sessionId", "chronicleId"\)/)
  assert.match(migration, /FOREIGN KEY \("eventId", "chronicleId"\)/)
  assert.match(migration, /FOREIGN KEY \("characterId", "chronicleId"\)/)
})
