import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const schema = await read('../prisma/schema.prisma')
const repository = await read('../src/chronicles/infrastructure/prisma-chronicle-story.repository.ts')
const dto = await read('../src/chronicles/presentation/chronicle-story.dto.ts')
const resources = await read('../src/chronicles/presentation/chronicle-resource.controller.ts')

test('stories link active library NPCs and locations attached to the same chronicle', () => {
  assert.match(schema, /model ChronicleStoryResource/)
  assert.match(repository, /kind: 'npc'/)
  assert.match(repository, /kind: 'location'/)
  assert.match(repository, /status: 'active'/)
  assert.match(repository, /ownerId: data\.actorUserId/)
  assert.match(repository, /bindings: \{ some: \{ chronicleId: data\.chronicleId, status: 'attached' \} \}/)
  assert.match(repository, /chronicleStoryResource\.createMany/)
})

test('linking a resource never changes its audience or publishes private details to players', () => {
  assert.match(resources, /visibility: binding\?\.visibility/)
  assert.match(resources, /audienceUserIds:/)
  const sharedProjection = dto.slice(dto.indexOf('export function toSharedChronicleStoryResponse'))
  assert.doesNotMatch(sharedProjection, /story\.(?:npcs|locations|resourceLinks)/)
})
