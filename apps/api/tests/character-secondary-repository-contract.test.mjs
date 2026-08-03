import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const repository = await readFile(
  new URL(
    '../src/characters/infrastructure/prisma-character-secondary.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const types = await readFile(
  new URL(
    '../src/characters/domain/persisted-character-secondary.types.ts',
    import.meta.url,
  ),
  'utf8',
)

const moduleSource = await readFile(
  new URL(
    '../src/characters/characters.module.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '028-D mantiene contratos persistentes separados y sin JSON genérico',
  () => {
    assert.match(
      types,
      /PersistedCharacterInventoryItem/,
    )
    assert.match(types, /PersistedCharacterNote/)
    assert.match(
      types,
      /PersistedCharacterHistoryEntry/,
    )
    assert.match(types, /section: 'inventory'/)
    assert.match(types, /section: 'notes'/)
    assert.match(types, /section: 'history'/)
    assert.doesNotMatch(types, /Json|metadata/)
  },
)

test(
  '028-D limita lectura y escritura por propietario y revisión',
  () => {
    assert.match(
      repository,
      /findByCharacterId\(\s*ownerId: string,\s*characterId: string/,
    )
    assert.match(
      repository,
      /id: characterId,\s*ownerId/,
    )
    assert.match(
      repository,
      /id: data\.characterId,\s*ownerId,\s*revision: data\.expectedRevision/,
    )
    assert.match(
      repository,
      /revision: { increment: 1 }/,
    )
    assert.match(
      repository,
      /PrismaCharacterStatus\.DRAFT[\s\S]*PrismaCharacterStatus\.ACTIVE/,
    )
  },
)

test(
  '028-D sincroniza por identidad sin recrear elementos conservados',
  () => {
    assert.match(
      repository,
      /characterInventoryItem[\s\S]*updateMany[\s\S]*create/,
    )
    assert.match(
      repository,
      /characterNote[\s\S]*updateMany[\s\S]*create/,
    )
    assert.match(
      repository,
      /characterHistoryEntry[\s\S]*updateMany[\s\S]*create/,
    )
    assert.match(repository, /id: { notIn: ids }/)
  },
)

test(
  '028-D registra el repositorio secundario como dependencia interna',
  () => {
    assert.match(
      moduleSource,
      /PrismaCharacterSecondaryRepository/,
    )
    assert.match(
      moduleSource,
      /provide: CHARACTER_SECONDARY_REPOSITORY/,
    )
    assert.match(
      moduleSource,
      /exports:[\s\S]*CHARACTER_SECONDARY_REPOSITORY/,
    )
  },
)
