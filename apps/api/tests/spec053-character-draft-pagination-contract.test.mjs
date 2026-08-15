import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const repository = await readFile(
  new URL(
    '../src/characters/infrastructure/' +
      'prisma-character-draft.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const applicationContract = await readFile(
  new URL(
    '../src/characters/application/' +
      'character-draft.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const useCase = await readFile(
  new URL(
    '../src/characters/application/' +
      'list-character-drafts.use-case.ts',
    import.meta.url,
  ),
  'utf8',
)

const controller = await readFile(
  new URL(
    '../src/characters/presentation/' +
      'character-draft.controller.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  'SPEC-053-B acota listByOwner con orden estable',
  () => {
    const ownerStart =
      repository.indexOf(
        '  async listByOwner(',
      ) >= 0
        ? repository.indexOf(
            '  async listByOwner(',
          )
        : repository.indexOf(
            '  listByOwner(',
          )

    const chronicleStart =
      repository.indexOf(
        '  async listByChronicle(',
      )

    assert.notEqual(
      ownerStart,
      -1,
    )
    assert.notEqual(
      chronicleStart,
      -1,
    )

    const block =
      repository.slice(
        ownerStart,
        chronicleStart,
      )

    assert.match(
      block,
      /skip:\s*query\.offset/,
    )
    assert.match(
      block,
      /take:\s*query\.limit \+ 1/,
    )
    assert.match(
      block,
      /updatedAt:\s*'desc'/,
    )
    assert.match(
      block,
      /id:\s*'asc'/,
    )
  },
)

test(
  'SPEC-053-C2 pagina listByChronicle sin romper el contrato 053-B',
  () => {
    const start =
      repository.indexOf(
        '  async listByChronicle(',
      )
    const end =
      repository.indexOf(
        '  async findById(',
        start,
      )
    const block =
      repository.slice(
        start,
        end,
      )

    assert.notEqual(
      start,
      -1,
    )
    assert.notEqual(
      end,
      -1,
    )
    assert.match(
      block,
      /listByChroniclePage/,
    )
    assert.match(
      block,
      /skip:\s*query\.offset/,
    )
    assert.match(
      block,
      /take:\s*query\.limit \+ 1/,
    )
    assert.match(
      block,
      /updatedAt:\s*'desc'/,
    )
    assert.match(
      block,
      /id:\s*'asc'/,
    )
    assert.match(
      block,
      /MAX_OFFSET_PAGE_LIMIT/,
    )
    assert.match(
      block,
      /while \(nextOffset !== null\)/,
    )
  },
)

test(
  'SPEC-053-B propaga OffsetPage desde repository hasta HTTP',
  () => {
    assert.match(
      applicationContract,
      /OffsetPaginationQuery/,
    )
    assert.match(
      applicationContract,
      /OffsetPage<PersistedCharacterDraft>/,
    )
    assert.match(
      useCase,
      /query: OffsetPaginationQuery/,
    )
    assert.match(
      controller,
      /parseOffsetPaginationQuery/,
    )
    assert.match(
      controller,
      /INVALID_PAGINATION_QUERY/,
    )
    assert.match(
      controller,
      /page\.nextOffset/,
    )
  },
)
