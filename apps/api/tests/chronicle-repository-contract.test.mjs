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

test(
  '030-B persiste Crónicas mediante el modelo canónico',
  () => {
    assert.match(
      repository,
      /database\.chronicle\.create/,
    )
    assert.match(
      repository,
      /narratorId: data\.narratorId/,
    )
    assert.match(
      repository,
      /description: data\.description/,
    )
  },
)

test(
  '030-B lista exclusivamente por narratorId',
  () => {
    assert.match(
      repository,
      /async findByNarratorId\(/,
    )
    assert.match(
      repository,
      /chronicle\.findMany\(\{\s*where: \{\s*narratorId,/,
    )
    assert.match(
      repository,
      /updatedAt: 'desc'/,
    )
  },
)
