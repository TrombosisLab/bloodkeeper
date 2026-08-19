import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

const contract = readFileSync(
  new URL(
    '../src/chronicles/application/chronicle-session-context.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const prisma = readFileSync(
  new URL(
    '../src/chronicles/infrastructure/prisma-chronicle-session-context.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '035-D repositorio expone consulta y reemplazo de contexto',
  () => {
    assert.match(
      contract,
      /findBySessionId/,
    )
    assert.match(
      contract,
      /replace/,
    )
    assert.match(
      contract,
      /ChronicleSessionContextReferenceError/,
    )
    assert.match(
      contract,
      /ChronicleSessionContextNotEditableError/,
    )
  },
)

test(
  '035-D reemplazo valida pertenencia antes de mutar y es transaccional',
  () => {
    assert.match(
      prisma,
      /\$transaction/,
    )

    for (const resource of [
      'chronicleEvent',
      'chronicleNpc',
      'chronicleLocation',
    ]) {
      assert.match(
        prisma,
        new RegExp(
          `${resource}\\.findMany`,
        ),
      )
    }

    assert.match(
      prisma,
      /chronicleId:[\s\S]*data\.chronicleId/,
    )

    const validationPosition =
      prisma.indexOf(
        "invalidReference(\n          'event'",
      )
    const deletionPosition =
      prisma.indexOf(
        'chronicleSessionEvent.deleteMany',
      )

    assert.ok(validationPosition >= 0)
    assert.ok(deletionPosition >= 0)
    assert.ok(
      validationPosition <
        deletionPosition,
    )
  },
)

test(
  '035-D archivado bloquea escritura antes de reemplazar relaciones',
  () => {
    assert.match(
      prisma,
      /PrismaChronicleSessionStatus\.ARCHIVED/,
    )
    assert.match(
      prisma,
      /ChronicleSessionContextNotEditableError/,
    )

    const archivedCheck =
      prisma.indexOf(
        'PrismaChronicleSessionStatus.ARCHIVED',
      )

    const firstDelete =
      prisma.indexOf(
        'chronicleSessionEvent.deleteMany',
      )

    assert.ok(archivedCheck >= 0)
    assert.ok(firstDelete >= 0)
    assert.ok(
      archivedCheck < firstDelete,
    )
  },
)
