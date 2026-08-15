import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

async function source(relative) {
  return readFile(
    new URL(
      `../${relative}`,
      import.meta.url,
    ),
    'utf8',
  )
}

test(
  'SPEC-053-C3 pagina PNJ en DB y HTTP sin helper full',
  async () => {
    const repository =
      await source(
        'src/chronicles/infrastructure/prisma-chronicle-npc.repository.ts',
      )
    const controller =
      await source(
        'src/chronicles/presentation/chronicle-npc.controller.ts',
      )
    const contract =
      await source(
        'src/chronicles/application/chronicle-npc.repository.ts',
      )

    assert.match(
      repository,
      /skip:\s*query\.offset/,
    )
    assert.match(
      repository,
      /take:\s*query\.limit \+ 1/,
    )
    assert.match(
      repository,
      /status:\s*'asc'[\s\S]*name:\s*'asc'[\s\S]*createdAt:\s*'asc'[\s\S]*id:\s*'asc'/,
    )
    assert.match(
      controller,
      /@Query\(\)[\s\S]*parseOffsetPaginationQuery/,
    )
    assert.match(
      controller,
      /INVALID_PAGINATION_QUERY/,
    )
    assert.match(
      controller,
      /items:\s*page\.items\.map[\s\S]*nextOffset:/,
    )
    assert.match(
      contract,
      /listByChronicleId\([\s\S]*OffsetPaginationQuery[\s\S]*OffsetPage<ChronicleNpc>/,
    )
    assert.doesNotMatch(
      repository,
      /while \(nextOffset !== null\)/,
    )
  },
)

test(
  'SPEC-053-C3 pagina Sesiones preservando orden',
  async () => {
    const repository =
      await source(
        'src/chronicles/infrastructure/prisma-chronicle-session.repository.ts',
      )
    const controller =
      await source(
        'src/chronicles/presentation/chronicle-session.controller.ts',
      )
    const contract =
      await source(
        'src/chronicles/application/chronicle-session.repository.ts',
      )

    assert.match(
      repository,
      /skip:\s*query\.offset/,
    )
    assert.match(
      repository,
      /take:\s*query\.limit \+ 1/,
    )
    assert.match(
      repository,
      /status:\s*'asc'[\s\S]*sessionNumber:\s*'asc'[\s\S]*realDate:\s*'asc'[\s\S]*createdAt:\s*'asc'[\s\S]*id:\s*'asc'/,
    )
    assert.match(
      controller,
      /@Query\(\)[\s\S]*parseOffsetPaginationQuery/,
    )
    assert.match(
      controller,
      /INVALID_PAGINATION_QUERY/,
    )
    assert.match(
      contract,
      /listByChronicleId\([\s\S]*OffsetPaginationQuery[\s\S]*OffsetPage<ChronicleSession>/,
    )
    assert.doesNotMatch(
      repository,
      /while \(nextOffset !== null\)/,
    )
  },
)
