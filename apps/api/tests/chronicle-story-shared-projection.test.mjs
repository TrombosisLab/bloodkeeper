import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const source = (path) => readFile(resolve(root, path), 'utf8')

const permission = await source('src/chronicles/application/chronicle-story-permission.ts')
const repository = await source('src/chronicles/application/chronicle-story.repository.ts')
const useCases = await source('src/chronicles/application/chronicle-story.use-cases.ts')
const prisma = await source('src/chronicles/infrastructure/prisma-chronicle-story.repository.ts')
const dto = await source('src/chronicles/presentation/chronicle-story.dto.ts')
const controller = await source('src/chronicles/presentation/chronicle-story.controller.ts')

test('SPEC-060-F requires an active Chronicle membership for shared Stories', () => {
  assert.match(permission, /assertChronicleStoryParticipant/)
  assert.match(permission, /findActiveMembership/)
  assert.match(useCases, /ListSharedChronicleStoriesUseCase/)
  assert.match(useCases, /assertChronicleStoryParticipant/)
})

test('SPEC-060-F filters shared Stories at persistence level', () => {
  assert.match(repository, /listSharedByChronicleId/)
  assert.match(prisma, /visibility:[\s\S]*PrismaStoryVisibility\.CHRONICLE_PARTICIPANTS/)
  assert.match(prisma, /listSharedByChronicleId/)
})

test('SPEC-060-F exposes a dedicated read-only shared route', () => {
  assert.match(controller, /@Get\('shared'\)/)
  assert.match(controller, /ListSharedChronicleStoriesUseCase/)
  assert.match(controller, /toSharedChronicleStoryResponse/)
})

test('SPEC-060-F shared DTO contains no private Story surfaces', () => {
  const projection = dto.slice(dto.indexOf('export interface SharedChronicleStoryResponseDto'))
  assert.match(projection, /sharedSummary/)
  assert.match(projection, /progress/)
  assert.match(projection, /milestones/)
  for (const privateField of [
    'narratorNotes',
    'reminders',
    'sessions',
    'events',
    'characters',
    'npcs',
    'locations',
    'closure',
    'createdById',
    'revision',
  ]) {
    assert.doesNotMatch(projection, new RegExp(privateField))
  }
})
