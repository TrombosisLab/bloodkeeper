import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = async (path) => readFile(resolve(root, path), 'utf8')
const controller = await source('src/chronicles/presentation/chronicle-story.controller.ts')
const dto = await source('src/chronicles/presentation/chronicle-story.dto.ts')
const repository = await source('src/chronicles/infrastructure/prisma-chronicle-story.repository.ts')
const useCases = await source('src/chronicles/application/chronicle-story.use-cases.ts')
const moduleSource = await source('src/chronicles/chronicles.module.ts')

test('SPEC-060-C exposes real narrative relationships', () => {
  assert.match(controller, /@Put\(':storyId\/context'\)/)
  assert.match(controller, /@Patch\(':storyId\/sessions\/:sessionId'\)/)
  for (const relation of [
    'sessionLinks',
    'eventLinks',
    'characterLinks',
    'npcLinks',
    'locationLinks',
  ]) {
    assert.match(repository, new RegExp(relation))
  }
  assert.match(dto, /counts:/)
  assert.match(dto, /sessions: story\.sessions\.length/)
  assert.match(dto, /characters: story\.characters\.length/)
})

test('SPEC-060-C replaces context atomically and validates ownership', () => {
  assert.match(repository, /replaceContext/)
  assert.match(repository, /assertContextReferences/)
  assert.match(repository, /chronicleId: data\.chronicleId/)
  assert.match(repository, /chronicleStorySession\.deleteMany/)
  assert.match(repository, /chronicleStorySession\.createMany/)
  assert.match(dto, /must not contain duplicates/)
  assert.match(useCases, /ReplaceChronicleStoryContextUseCase/)
  assert.match(useCases, /UpdateChronicleStorySessionProgressUseCase/)
  assert.match(moduleSource, /ReplaceChronicleStoryContextUseCase/)
  assert.match(moduleSource, /UpdateChronicleStorySessionProgressUseCase/)
})
