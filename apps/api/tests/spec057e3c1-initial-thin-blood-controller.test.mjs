import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

test(
  '057-E3C1 publica PATCH dedicado autenticado y error 422 propio',
  async () => {
    const source =
      await readFile(
        new URL(
          '../src/characters/presentation/character-initial-vampire.controller.ts',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      source,
      /:characterId\/initial-vampire\/thin-blood/,
    )

    assert.match(
      source,
      /authenticatedActorId\(request\)/,
    )

    assert.match(
      source,
      /resolve\.resolveThinBloodState/,
    )

    assert.match(
      source,
      /INITIAL_VAMPIRE_THIN_BLOOD_INVALID/,
    )
  },
)
