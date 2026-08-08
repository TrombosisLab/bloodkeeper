import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(
  new URL(
    '../src/characters/infrastructure/prisma-character-draft.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const start = source.indexOf(
  'async updateState(',
)
const end = source.indexOf(
  'async transitionLifecycle(',
)

const updateStateSource =
  source.slice(start, end)

test(
  'SPEC-024 persiste estados con CAS de propietario/revisión',
  () => {
    assert.ok(start >= 0)
    assert.ok(end > start)

    assert.match(
      updateStateSource,
      /ownerId/,
    )
    assert.match(
      updateStateSource,
      /revision:\s*data\.expectedRevision/,
    )
    assert.match(
      updateStateSource,
      /revision:\s*\{\s*increment:\s*1\s*\}/,
    )
  },
)

test(
  'SPEC-024 permite estado operativo sólo en draft/active',
  () => {
    assert.match(
      updateStateSource,
      /PrismaCharacterStatus\.DRAFT/,
    )
    assert.match(
      updateStateSource,
      /PrismaCharacterStatus\.ACTIVE/,
    )
    assert.doesNotMatch(
      updateStateSource,
      /PrismaCharacterStatus\.ARCHIVED/,
    )
  },
)

test(
  'SPEC-024 limita la escritura a daño y Humanidad/Manchas',
  () => {
    assert.match(
      updateStateSource,
      /characterDamageState/,
    )
    assert.match(
      updateStateSource,
      /characterHumanityState/,
    )
    assert.doesNotMatch(
      updateStateSource,
      /characterBloodState/,
    )
    assert.doesNotMatch(
      updateStateSource,
      /characterAttributes\.update/,
    )
    assert.doesNotMatch(
      updateStateSource,
      /characterIdentity/,
    )
  },
)
