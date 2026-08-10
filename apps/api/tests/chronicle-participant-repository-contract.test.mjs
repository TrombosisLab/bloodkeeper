import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const participantRepo = await readFile(
  new URL(
    '../src/chronicles/infrastructure/prisma-chronicle-participant.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const chronicleRepo = await readFile(
  new URL(
    '../src/chronicles/infrastructure/prisma-chronicle.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '031-B membresía activa es la base de autorización contextual',
  () => {
    assert.match(
      participantRepo,
      /findActiveMembership[\s\S]*chronicleId,[\s\S]*userId,[\s\S]*ACTIVE/,
    )
  },
)

test(
  '031-B retirada cambia estado y no elimina relación',
  () => {
    assert.match(
      participantRepo,
      /async retire[\s\S]*updateMany/,
    )
    assert.match(
      participantRepo,
      /RETIRED/,
    )
    assert.doesNotMatch(
      participantRepo,
      /chronicleParticipant\.delete/,
    )
  },
)

test(
  '031-B cuenta Narradores activos',
  () => {
    assert.match(
      participantRepo,
      /countActiveNarrators[\s\S]*NARRATOR[\s\S]*ACTIVE/,
    )
  },
)

test(
  '031-B nueva Crónica crea membresía Narrador activa',
  () => {
    assert.match(
      chronicleRepo,
      /participants:\s*\{[\s\S]*create:[\s\S]*userId: data\.narratorId[\s\S]*NARRATOR[\s\S]*ACTIVE/,
    )
  },
)

test(
  '031-B listado detalle y lifecycle usan Narrador contextual',
  () => {
    assert.match(
      chronicleRepo,
      /findByNarratorId[\s\S]*participants:[\s\S]*some:[\s\S]*userId: narratorId[\s\S]*NARRATOR[\s\S]*ACTIVE/,
    )
    assert.match(
      chronicleRepo,
      /findById[\s\S]*participants:[\s\S]*some:[\s\S]*userId: narratorId[\s\S]*NARRATOR[\s\S]*ACTIVE/,
    )
    assert.match(
      chronicleRepo,
      /transitionLifecycle[\s\S]*participants:[\s\S]*some:[\s\S]*userId: narratorId[\s\S]*NARRATOR[\s\S]*ACTIVE/,
    )
  },
)
