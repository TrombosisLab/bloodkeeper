import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
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
  'SPEC-053-C2 pagina characters en DB y HTTP',
  async () => {
    const repository =
      await source(
        'src/characters/infrastructure/prisma-character-draft.repository.ts',
      )
    const controller =
      await source(
        'src/characters/presentation/chronicle-character.controller.ts',
      )

    assert.match(
      repository,
      /listByChroniclePage[\s\S]*skip:\s*query\.offset[\s\S]*take:\s*query\.limit \+ 1/,
    )
    assert.match(
      repository,
      /orderBy:\s*\[[\s\S]*updatedAt:\s*'desc'[\s\S]*id:\s*'asc'/,
    )
    assert.match(
      repository,
      /MAX_OFFSET_PAGE_LIMIT[\s\S]*while \(nextOffset !== null\)/,
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

test(
  'SPEC-053-C2 pagina participants preservando orden y full helper',
  async () => {
    const repository =
      await source(
        'src/chronicles/infrastructure/prisma-chronicle-participant.repository.ts',
      )
    const controller =
      await source(
        'src/chronicles/presentation/chronicle.controller.ts',
      )
    const candidates =
      await source(
        'src/chronicles/application/list-chronicle-participant-candidates.use-case.ts',
      )

    assert.match(
      repository,
      /listByChronicleIdPage[\s\S]*skip:\s*query\.offset[\s\S]*take:\s*query\.limit \+ 1/,
    )
    assert.match(
      repository,
      /role:\s*'asc'[\s\S]*status:\s*'asc'[\s\S]*createdAt:\s*'asc'[\s\S]*id:\s*'asc'/,
    )
    assert.match(
      repository,
      /MAX_OFFSET_PAGE_LIMIT[\s\S]*while \(nextOffset !== null\)/,
    )

    const start =
      controller.indexOf(
        "@Get(':chronicleId/participants')",
      )
    const end =
      controller.indexOf(
        "@Get(':chronicleId/participant-candidates')",
        start,
      )
    const block =
      controller.slice(start, end)

    assert.match(
      block,
      /@Query\(\)[\s\S]*parseOffsetPaginationQuery/,
    )
    assert.match(
      block,
      /items:\s*page\.items\.map[\s\S]*nextOffset:/,
    )

    assert.match(
      candidates,
      /\.listByChronicleId\(\s*chronicleId,\s*\)/,
    )
  },
)
