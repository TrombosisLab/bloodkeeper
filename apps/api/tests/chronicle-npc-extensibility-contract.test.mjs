import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL(
    '../prisma/schema.prisma',
    import.meta.url,
  ),
  'utf8',
)

const domain = await readFile(
  new URL(
    '../src/chronicles/domain/chronicle-npc.types.ts',
    import.meta.url,
  ),
  'utf8',
)

const dto = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle-npc.dto.ts',
    import.meta.url,
  ),
  'utf8',
)

const repository = await readFile(
  new URL(
    '../src/chronicles/infrastructure/prisma-chronicle-npc.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

function block(
  source,
  start,
  end,
) {
  const from =
    source.indexOf(start)
  const to =
    source.indexOf(
      end,
      from + start.length,
    )

  assert.notEqual(
    from,
    -1,
    `No se encontró ${start}`,
  )
  assert.notEqual(
    to,
    -1,
    `No se encontró ${end}`,
  )

  return source.slice(
    from,
    to,
  )
}

const npcModel =
  block(
    schema,
    'model ChronicleNpc {',
    'enum ChronicleLocationStatus {',
  )

const detailLevelEnum =
  block(
    schema,
    'enum ChronicleNpcDetailLevel {',
    'model ChronicleNpc {',
  )

test(
  '032-D detailLevel es un eje explícito de evolución y no un estado implícito',
  () => {
    assert.match(
      npcModel,
      /detailLevel\s+ChronicleNpcDetailLevel\s+@default\(SIMPLE\)/,
    )

    assert.match(
      detailLevelEnum,
      /\bSIMPLE\b/,
    )

    assert.match(
      domain,
      /export type ChronicleNpcDetailLevel/,
    )

    assert.match(
      domain,
      /readonly detailLevel:\s*ChronicleNpcDetailLevel/,
    )

    assert.match(
      dto,
      /readonly detailLevel:\s*'simple'/,
    )
  },
)

test(
  '032-D la primera versión sigue cerrada a SIMPLE sin impedir ampliar el enum después',
  () => {
    assert.doesNotMatch(
      detailLevelEnum,
      /\bDEVELOPED\b|\bFULL\b|\bCHARACTER\b/,
    )

    assert.match(
      repository,
      /PrismaChronicleNpcDetailLevel\.SIMPLE/,
    )

    assert.match(
      repository,
      /detailLevelFromPrisma/,
    )

    assert.match(
      npcModel,
      /@@index\(\[chronicleId, detailLevel\]\)/,
    )
  },
)

test(
  '032-D PNJ conserva identidad propia estable para futuras relaciones',
  () => {
    assert.match(
      npcModel,
      /id\s+String\s+@id\s+@default\(uuid\(\)\)\s+@db\.Uuid/,
    )

    assert.match(
      npcModel,
      /chronicleId\s+String\s+@db\.Uuid/,
    )

    assert.match(
      npcModel,
      /chronicle\s+Chronicle\s+@relation\("ChronicleNpcChronicle"/,
    )
  },
)

test(
  '062 amplía el perfil profundo sin convertir el PNJ en un Personaje completo',
  () => {
    assert.doesNotMatch(
      npcModel,
      /attributes|skills|health|willpower|dice/i,
    )

    assert.match(
      domain,
      /ChronicleNpcAttributes/,
    )

    assert.match(
      dto,
      /profileAttributes/,
    )

    for (const source of [domain, dto]) {
      assert.doesNotMatch(
        source,
        /skills|health|willpower|dice/i,
      )
    }

    assert.match(
      domain,
      /disciplineDetails/,
    )
  },
)

test(
  '032-D futuras relaciones o promoción pueden añadirse sin alterar la identidad narrativa existente',
  () => {
    for (const field of [
      'name',
      'category',
      'description',
      'narrativeRole',
      'notes',
      'status',
      'detailLevel',
      'createdAt',
      'updatedAt',
    ]) {
      assert.match(
        npcModel,
        new RegExp(`\\b${field}\\b`),
      )
    }

    assert.doesNotMatch(
      npcModel,
      /locationId|eventId|sessionId|characterId/,
    )
  },
)
