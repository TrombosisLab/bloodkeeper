import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const prisma = await readFile(
  new URL(
    '../src/users/infrastructure/' +
      'prisma-user-administration.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const useCase = await readFile(
  new URL(
    '../src/users/application/' +
      'list-users.use-case.ts',
    import.meta.url,
  ),
  'utf8',
)

const directory = await readFile(
  new URL(
    '../src/chronicles/infrastructure/' +
      'list-users-chronicle-user-directory.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  'SPEC-053-A acota cada findMany de usuarios',
  () => {
    assert.match(
      prisma,
      /skip:\s*query\.offset/,
    )
    assert.match(
      prisma,
      /take:\s*query\.limit \+ 1/,
    )
    assert.match(
      prisma,
      /MAX_OFFSET_PAGE_LIMIT/,
    )
  },
)

test(
  'SPEC-053-A conserva el directorio interno completo sin findMany ilimitado',
  () => {
    assert.match(
      useCase,
      /execute\(\): Promise</,
    )
    assert.match(
      useCase,
      /query: OffsetPaginationQuery/,
    )
    assert.match(
      directory,
      /await this\.listUsers\.execute\(\)/,
    )
  },
)
