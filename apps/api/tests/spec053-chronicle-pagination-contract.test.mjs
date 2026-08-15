import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const repository = await readFile(
  new URL(
    '../src/chronicles/infrastructure/' +
      'prisma-chronicle.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const contract = await readFile(
  new URL(
    '../src/chronicles/application/' +
      'chronicle.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const controller = await readFile(
  new URL(
    '../src/chronicles/presentation/' +
      'chronicle.controller.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  'SPEC-053-C1 pagina Chronicle con orden estable',
  () => {
    const start =
      repository.indexOf(
        '  findByNarratorId(',
      )
    const end =
      repository.indexOf(
        '  async findById(',
        start,
      )
    const block =
      repository.slice(start, end)

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
  },
)

test(
  'SPEC-053-C1 expone OffsetPage por HTTP',
  () => {
    assert.match(
      contract,
      /OffsetPage<Chronicle>/,
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
