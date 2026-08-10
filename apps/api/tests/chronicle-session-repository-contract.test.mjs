import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

const contract = readFileSync(
  new URL(
    '../src/chronicles/application/chronicle-session.repository.ts',
    import.meta.url,
  ),
  'utf8',
)
const prisma = readFileSync(
  new URL(
    '../src/chronicles/infrastructure/prisma-chronicle-session.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '035-B repositorio declara operaciones exactas',
  () => {
    for (const method of [
      'listByChronicleId',
      'findById',
      'create',
      'update',
      'complete',
      'archive',
    ]) {
      assert.match(contract, new RegExp(method))
    }
    assert.doesNotMatch(contract, /delete|reorder/i)
  },
)

test(
  '035-B crea PREPARATION y lista con orden reproducible',
  () => {
    assert.match(prisma, /PrismaChronicleSessionStatus\.PREPARATION/)
    assert.match(prisma, /sessionNumber: 'asc'/)
    assert.match(prisma, /createdAt: 'asc'/)
  },
)

test(
  '035-B update complete y archive permanecen dentro de chronicleId',
  () => {
    assert.match(prisma, /id: data\.sessionId,[\s\S]*chronicleId: data\.chronicleId/)
    assert.match(prisma, /status:[\s\S]*PrismaChronicleSessionStatus\.PREPARATION/)
    assert.match(prisma, /PrismaChronicleSessionStatus\.COMPLETED/)
    assert.match(prisma, /PrismaChronicleSessionStatus\.ARCHIVED/)
  },
)

test(
  '035-B persistencia no adelanta relaciones ni dados',
  () => {
    assert.doesNotMatch(
      prisma,
      /chronicleEvent|chronicleNpc|chronicleLocation|character|dice/i,
    )
  },
)
