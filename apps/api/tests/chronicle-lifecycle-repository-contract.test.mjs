import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const repository =
  await readFile(
    new URL(
      '../src/chronicles/infrastructure/prisma-chronicle.repository.ts',
      import.meta.url,
    ),
    'utf8',
  )

const schema =
  await readFile(
    new URL(
      '../prisma/schema.prisma',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '030-C localiza la crónica por narrador antes de transicionar',
  () => {
    assert.match(
      repository,
      /async findById\([\s\S]*narratorId: string,[\s\S]*chronicleId: string/,
    )
    assert.match(
      repository,
      /findFirst\(\{[\s\S]*id: chronicleId,[\s\S]*narratorId/,
    )
  },
)

test(
  '030-C persiste transición condicionada por propietario y estado actual',
  () => {
    assert.match(
      repository,
      /updateMany\(\{[\s\S]*id: data\.chronicleId,[\s\S]*narratorId,[\s\S]*status:[\s\S]*data\.expectedStatus/,
    )
    assert.match(
      repository,
      /status:[\s\S]*statusToPrisma\[data\.nextStatus\]/,
    )
    assert.match(
      repository,
      /ChronicleLifecycleWriteConflictError/,
    )
  },
)

test(
  '030-C archivado no elimina ni desvincula personajes',
  () => {
    assert.match(
      schema,
      /chronicle\s+Chronicle\?\s+@relation\("CharacterChronicle"[\s\S]*onDelete:\s*Restrict/,
    )
    assert.doesNotMatch(
      repository,
      /character\.(?:delete|deleteMany|updateMany)/,
    )
  },
)
