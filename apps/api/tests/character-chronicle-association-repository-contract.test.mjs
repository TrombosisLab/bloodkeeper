import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const repository = await readFile(
  new URL(
    '../src/characters/infrastructure/prisma-character-draft.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const contract = await readFile(
  new URL(
    '../src/characters/application/character-draft.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const chronicleModule = await readFile(
  new URL(
    '../src/chronicles/chronicles.module.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '031-C repositorio declara operación dedicada y consulta de historial',
  () => {
    assert.match(
      contract,
      /hasHistoryEntries\(/,
    )
    assert.match(
      contract,
      /updateChronicleAssociation\(/,
    )
  },
)

test(
  '031-C asociación se protege por ownerId y expectedRevision',
  () => {
    assert.match(
      repository,
      /updateChronicleAssociation[\s\S]*updateMany[\s\S]*id: data\.characterId,[\s\S]*ownerId,[\s\S]*revision:[\s\S]*data\.expectedRevision/,
    )
    assert.match(
      repository,
      /chronicleId: data\.chronicleId,[\s\S]*revision:[\s\S]*increment: 1/,
    )
  },
)

test(
  '031-C no transfiere propiedad ni borra historial',
  () => {
    const method =
      repository.match(
        /async updateChronicleAssociation\([\s\S]*?\n  }\n\n  async update\(/,
      )?.[0] ?? ''

    assert.ok(method.length > 0)
    assert.doesNotMatch(
      method,
      /ownerId:\s*data\./,
    )
    assert.doesNotMatch(
      method,
      /historyEntry\.(?:delete|deleteMany)/,
    )
  },
)

test(
  '031-C detecta historial existente sin modificarlo',
  () => {
    assert.match(
      repository,
      /hasHistoryEntries[\s\S]*_count:[\s\S]*historyEntries: true/,
    )
  },
)

test(
  '031-C ChroniclesModule exporta el port de membresía',
  () => {
    assert.match(
      chronicleModule,
      /exports:[\s\S]*CHRONICLE_PARTICIPANT_REPOSITORY/,
    )
  },
)
