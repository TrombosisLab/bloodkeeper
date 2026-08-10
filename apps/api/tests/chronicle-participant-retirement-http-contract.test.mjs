import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const controller =
  await readFile(
    new URL(
      '../src/chronicles/presentation/chronicle.controller.ts',
      import.meta.url,
    ),
    'utf8',
  )

const useCase =
  await readFile(
    new URL(
      '../src/chronicles/application/retire-chronicle-participant.use-case.ts',
      import.meta.url,
    ),
    'utf8',
  )

const adapter =
  await readFile(
    new URL(
      '../src/chronicles/infrastructure/prisma-chronicle-participant-relations.ts',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '031-D retirada exige resolver personajes no archivados',
  () => {
    assert.match(
      useCase,
      /hasNonArchivedCharacters/,
    )
    assert.match(
      adapter,
      /status:\s*\{[\s\S]*not:\s*CharacterStatus\.ARCHIVED/,
    )
    assert.match(
      controller,
      /CHRONICLE_PARTICIPANT_ACTIVE_CHARACTER_RELATION/,
    )
  },
)
