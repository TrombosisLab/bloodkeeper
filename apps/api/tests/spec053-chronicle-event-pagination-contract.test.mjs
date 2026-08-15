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
  'SPEC-053 pagina el listado público Event en DB',
  async () => {
    const contract =
      await source(
        'src/chronicles/application/chronicle-event.repository.ts',
      )
    const repository =
      await source(
        'src/chronicles/infrastructure/prisma-chronicle-event.repository.ts',
      )

    assert.match(
      contract,
      /listByChronicleId\([\s\S]*OffsetPaginationQuery[\s\S]*OffsetPage<ChronicleEvent>/,
    )

    const start =
      repository.indexOf(
        '  async listByChronicleId(',
      )
    const end =
      repository.indexOf(
        '  async findById(',
        start,
      )
    const listing =
      repository.slice(start, end)

    assert.match(
      listing,
      /skip:\s*query\.offset/,
    )
    assert.match(
      listing,
      /take:\s*query\.limit \+ 1/,
    )
    assert.match(
      listing,
      /status:\s*'asc'[\s\S]*timelineOrder:\s*'asc'[\s\S]*createdAt:\s*'asc'[\s\S]*id:\s*'asc'/,
    )
    assert.match(
      listing,
      /offsetPageFromRows/,
    )
  },
)

test(
  'SPEC-053 mantiene las dos lecturas reorderActive completas',
  async () => {
    const repository =
      await source(
        'src/chronicles/infrastructure/prisma-chronicle-event.repository.ts',
      )

    const start =
      repository.indexOf(
        '  async reorderActive(',
      )
    const end =
      repository.indexOf(
        '  async archive(',
        start,
      )
    const reorder =
      repository.slice(start, end)

    assert.equal(
      (
        reorder.match(
          /transaction\.chronicleEvent\.findMany/g,
        ) ?? []
      ).length,
      2,
    )
    assert.doesNotMatch(
      reorder,
      /skip:|take:/,
    )
    assert.match(
      reorder,
      /new Set\(eventIds\)/,
    )
    assert.match(
      reorder,
      /active\.map/,
    )
    assert.match(
      reorder,
      /Promise\.all/,
    )
  },
)

test(
  'SPEC-053 GET Events expone OffsetPage sin alterar reorder',
  async () => {
    const controller =
      await source(
        'src/chronicles/presentation/chronicle-event.controller.ts',
      )
    const usecase =
      await source(
        'src/chronicles/application/list-chronicle-events.use-case.ts',
      )

    assert.match(
      usecase,
      /query:\s*OffsetPaginationQuery/,
    )
    assert.match(
      usecase,
      /Promise<OffsetPage<ChronicleEvent>>/,
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

    const reorderStart =
      controller.indexOf(
        "@Patch('reorder')",
      )
    const detailStart =
      controller.indexOf(
        "@Get(':eventId')",
        reorderStart,
      )
    const reorder =
      controller.slice(
        reorderStart,
        detailStart,
      )

    assert.match(
      reorder,
      /parseReorderChronicleEventsRequest/,
    )
    assert.match(
      reorder,
      /await this\.reorderEvents\.execute/,
    )
    assert.match(
      reorder,
      /\.map\([\s\S]*toChronicleEventResponse/,
    )
  },
)
