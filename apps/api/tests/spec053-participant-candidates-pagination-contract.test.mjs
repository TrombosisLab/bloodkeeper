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
  'SPEC-053 participant-candidates usa directory full + page sin Prisma nuevo',
  async () => {
    const contract =
      await source(
        'src/chronicles/application/chronicle-user-directory.ts',
      )
    const adapter =
      await source(
        'src/chronicles/infrastructure/list-users-chronicle-user-directory.ts',
      )

    assert.match(
      contract,
      /list\(\): Promise<[\s\S]*ChronicleUserDirectoryEntry/,
    )
    assert.match(
      contract,
      /list\([\s\S]*OffsetPaginationQuery[\s\S]*OffsetPage<ChronicleUserDirectoryEntry>/,
    )
    assert.match(
      adapter,
      /this\.listUsers\.execute\(\s*query,\s*\)/,
    )
  },
)

test(
  'SPEC-053 participant-candidates cuenta offset después del filtro',
  async () => {
    const usecase =
      await source(
        'src/chronicles/application/list-chronicle-participant-candidates.use-case.ts',
      )

    assert.match(
      usecase,
      /sourceOffset:[\s\S]*number \| null = 0/,
    )
    assert.match(
      usecase,
      /this\.users\.list\(\{[\s\S]*MAX_OFFSET_PAGE_LIMIT[\s\S]*sourceOffset/,
    )
    assert.match(
      usecase,
      /existingUserIds\.has/,
    )
    assert.match(
      usecase,
      /candidateIndex <[\s\S]*query\.offset/,
    )
    assert.match(
      usecase,
      /candidates\.length >[\s\S]*query\.limit/,
    )
    assert.match(
      usecase,
      /query\.offset \+[\s\S]*query\.limit/,
    )
    assert.doesNotMatch(
      usecase,
      /this\.users\.list\(\s*query\s*\)/,
    )
  },
)

test(
  'SPEC-053 HTTP participant-candidates devuelve page object',
  async () => {
    const controller =
      await source(
        'src/chronicles/presentation/chronicle.controller.ts',
      )

    const start =
      controller.indexOf(
        "@Get(':chronicleId/participant-candidates')",
      )
    const end =
      controller.indexOf(
        "@Post(':chronicleId/participants')",
        start,
      )
    const block =
      controller.slice(
        start,
        end,
      )

    assert.match(
      block,
      /@Query\(\)[\s\S]*parseOffsetPaginationQuery/,
    )
    assert.match(
      block,
      /INVALID_PAGINATION_QUERY/,
    )
    assert.match(
      block,
      /items:\s*page\.items[\s\S]*nextOffset:/,
    )
  },
)
