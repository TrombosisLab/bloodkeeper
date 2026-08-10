import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const controller = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle.controller.ts',
    import.meta.url,
  ),
  'utf8',
)

const repository = await readFile(
  new URL(
    '../src/chronicles/infrastructure/prisma-chronicle.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '031-D sólo creación conserva requisito global narrator',
  () => {
    assert.equal(
      (
        controller.match(
          /authenticatedNarratorId\(request\)/g,
        ) ?? []
      ).length,
      1,
    )
  },
)

test(
  '031-D list/detail usan participación ACTIVE sin exigir NARRATOR',
  () => {
    for (const pattern of [
      /async findByNarratorId[\s\S]*?(?=\n  async )/,
      /async findById\([\s\S]*?(?=\n  async )/,
    ]) {
      const method =
        repository.match(pattern)?.[0] ??
        ''

      assert.match(
        method,
        /PrismaChronicleParticipantStatus\.ACTIVE/,
      )
      assert.doesNotMatch(
        method,
        /PrismaChronicleParticipantRole\.NARRATOR/,
      )
    }
  },
)

test(
  '031-D lifecycle conserva Narrador contextual',
  () => {
    const method =
      repository.match(
        /async transitionLifecycle[\s\S]*?(?=\n  async |\n})/,
      )?.[0] ?? ''

    assert.match(
      method,
      /PrismaChronicleParticipantRole\.NARRATOR/,
    )
    assert.match(
      method,
      /PrismaChronicleParticipantStatus\.ACTIVE/,
    )
  },
)
