import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  CHRONICLE_STORY_MILESTONES,
  chronicleStoryProgress,
} from '../src/chronicles/domain/chronicle-story.rules.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const controller = await readFile(
  resolve(root, 'src/chronicles/presentation/chronicle-story.controller.ts'),
  'utf8',
)
const dto = await readFile(
  resolve(root, 'src/chronicles/presentation/chronicle-story.dto.ts'),
  'utf8',
)
const repository = await readFile(
  resolve(root, 'src/chronicles/infrastructure/prisma-chronicle-story.repository.ts'),
  'utf8',
)
const useCases = await readFile(
  resolve(root, 'src/chronicles/application/chronicle-story.use-cases.ts'),
  'utf8',
)
const moduleSource = await readFile(
  resolve(root, 'src/chronicles/chronicles.module.ts'),
  'utf8',
)

test('SPEC-060-B conserva cinco hitos y progreso derivado', () => {
  assert.equal(CHRONICLE_STORY_MILESTONES.length, 5)
  assert.deepEqual(
    chronicleStoryProgress(['hook', 'first_turn', 'revelation']),
    {
      completed: 3,
      total: 5,
      percentage: 60,
    },
  )
  assert.match(repository, /CHRONICLE_STORY_MILESTONES\.map/)
})

test('SPEC-060-B expone CRUD, lifecycle, hitos y recordatorios', () => {
  for (const route of [
    /@Get\(\)/,
    /@Post\(\)/,
    /@Get\(':storyId'\)/,
    /@Patch\(':storyId'\)/,
    /@Post\(':storyId\/activate'\)/,
    /@Post\(':storyId\/archive'\)/,
    /@Patch\(':storyId\/milestones\/:milestoneKey'\)/,
    /@Post\(':storyId\/reminders'\)/,
    /@Patch\(':storyId\/reminders\/:reminderId'\)/,
    /@Delete\(':storyId\/reminders\/:reminderId'\)/,
  ]) {
    assert.match(controller, route)
  }
})

test('SPEC-060-B valida entrada cerrada, revisión y privacidad', () => {
  assert.match(dto, /body contains unsupported fields/)
  assert.match(dto, /body\.expectedRevision must be a positive integer/)
  assert.match(dto, /narratorNotes:\s*story\.narratorNotes/)
  assert.match(dto, /chronicleStoryProgress/)
  assert.match(controller, /CHRONICLE_STORY_PERMISSION_DENIED/)
  assert.match(controller, /CHRONICLE_STORY_REVISION_CONFLICT/)
  assert.match(useCases, /assertChronicleStoryNarrator/)
  assert.match(useCases, /ChronicleStoryImmutableError/)
})

test('SPEC-060-B registra DI y escrituras atómicas', () => {
  assert.match(repository, /database\.\$transaction/)
  assert.match(repository, /revision:\s*\{\s*increment: 1/)
  assert.match(repository, /mutableStoryWhere/)
  assert.match(moduleSource, /ChronicleStoryController/)
  assert.match(moduleSource, /CHRONICLE_STORY_REPOSITORY/)
  assert.match(moduleSource, /PrismaChronicleStoryRepository/)
  assert.match(moduleSource, /UpdateChronicleStoryMilestoneUseCase/)
  assert.match(moduleSource, /CreateChronicleStoryReminderUseCase/)
})
