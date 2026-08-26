import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = (path) => readFile(resolve(root, path), 'utf8')
const controller = await source('src/chronicles/presentation/chronicle-story.controller.ts')
const dto = await source('src/chronicles/presentation/chronicle-story.dto.ts')
const repository = await source('src/chronicles/infrastructure/prisma-chronicle-story.repository.ts')
const useCases = await source('src/chronicles/application/chronicle-story.use-cases.ts')
const moduleSource = await source('src/chronicles/chronicles.module.ts')

test('SPEC-060-E exposes an explicit first-class story completion command', () => {
  assert.match(controller, /@Post\(':storyId\/complete'\)/)
  assert.match(controller, /CompleteChronicleStoryUseCase/)
  assert.match(dto, /operationId: uuid/)
  assert.match(dto, /body\.confirmed must be true/)
  assert.match(dto, /resolution: requiredText/)
  assert.match(useCases, /stories\.complete/)
  assert.match(moduleSource, /CompleteChronicleStoryUseCase/)
})

test('SPEC-060-E derives eligibility from real attendance and closed sessions', () => {
  assert.match(repository, /chronicleSessionAttendance\.findMany/)
  assert.match(repository, /removedAt: null/)
  assert.match(repository, /PrismaSessionStatus\.COMPLETED/)
  assert.match(repository, /PrismaSessionStatus\.ARCHIVED/)
  assert.match(repository, /PrismaSessionStatus\.PREPARATION/)
  assert.match(repository, /distinct: \['characterId'\]/)
  assert.doesNotMatch(repository, /storyCharacterIds.*eligible/i)
})

test('SPEC-060-E closes and grants exactly one story XP atomically', () => {
  assert.match(repository, /database\.\$transaction/)
  assert.match(repository, /PrismaExperienceMovementType\.GRANT/)
  assert.match(repository, /PrismaExperienceComponent\.EARNED/)
  assert.match(repository, /amount: 1/)
  assert.match(repository, /reason: 'story_end'/)
  assert.match(repository, /story_end:\$\{data\.storyId\}:\$\{characterId\}/)
  assert.match(repository, /status: PrismaStoryStatus\.COMPLETED/)
  assert.match(repository, /chronicleStoryCompletionOperation\.create/)
})

test('SPEC-060-E is idempotent and reports closure outcome', () => {
  assert.match(repository, /findUnique\(\{\s*where: \{ operationId: data\.operationId \}/)
  assert.match(repository, /storyId: data\.storyId/)
  assert.match(dto, /eligibleCharacterCount/)
  assert.match(dto, /grantedCount/)
  assert.match(dto, /skippedCount/)
  assert.match(dto, /excludedCharacters/)
})
