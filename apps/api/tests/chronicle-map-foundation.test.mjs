import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const testsDirectory = path.dirname(fileURLToPath(import.meta.url))
const apiDirectory = path.resolve(testsDirectory, '..')
const schema = await readFile(path.join(apiDirectory, 'prisma/schema.prisma'), 'utf8')
const controller = await readFile(path.join(apiDirectory, 'src/chronicles/presentation/chronicle-map.controller.ts'), 'utf8')

test('chronicle map supports delayed parent assignment and safe hierarchy changes', () => {
  assert.match(schema, /parentMapId\s+String\?\s+@db\.Uuid/)
  assert.match(schema, /model ChronicleMap\s*\{/)
  assert.match(schema, /model ChronicleMapRequest\s*\{/)
  assert.match(controller, /CHRONICLE_MAP_HIERARCHY_CYCLE/)
  assert.match(controller, /parentMapId !== undefined/)
})

test('chronicle map keeps player requests separate from narrator markers', () => {
  assert.match(schema, /enum ChronicleMapRequestStatus\s*\{[\s\S]*PENDING[\s\S]*APPROVED[\s\S]*REJECTED/)
  assert.match(controller, /@Post\(':mapId\/requests'\)/)
  assert.match(controller, /@Patch\(':mapId\/requests\/:requestId'\)/)
  assert.match(controller, /@Post\(':mapId\/markers'\)/)
})
