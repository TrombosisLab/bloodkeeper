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
  'SPEC-053-C4 pagina Locations en DB sin helper full backend',
  async () => {
    const contract =
      await source(
        'src/chronicles/application/chronicle-location.repository.ts',
      )
    const repository =
      await source(
        'src/chronicles/infrastructure/prisma-chronicle-location.repository.ts',
      )

    assert.match(
      contract,
      /listByChronicleId\([\s\S]*OffsetPaginationQuery[\s\S]*OffsetPage<ChronicleLocation>/,
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
      repository,
      /offsetPageFromRows/,
    )
    assert.doesNotMatch(
      repository,
      /while \(nextOffset !== null\)/,
    )
  },
)

test(
  'SPEC-053-C4 expone GET Locations como OffsetPage',
  async () => {
    const controller =
      await source(
        'src/chronicles/presentation/chronicle-location.controller.ts',
      )
    const usecase =
      await source(
        'src/chronicles/application/list-chronicle-locations.use-case.ts',
      )

    assert.match(
      usecase,
      /query:\s*OffsetPaginationQuery/,
    )
    assert.match(
      usecase,
      /Promise<OffsetPage<ChronicleLocation>>/,
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
  },
)
