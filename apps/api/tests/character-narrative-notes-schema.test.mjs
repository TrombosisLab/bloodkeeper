import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  parseUpdateCharacterDraftRequest,
} from '../dist/characters/presentation/character-draft.dto.js'

const schema = readFileSync(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

test(
  'la actualización narrativa admite notas junto a vínculos y convicciones',
  () => {
    const result =
      parseUpdateCharacterDraftRequest(
        '10000000-0000-4000-8000-000000000001',
        {
          expectedRevision: 4,
          humanityNarrative: {
            notes: 'Protege todavía a su hermana mortal.',
            convictions: [
              {
                convictionId: 'conviction-1',
                text: 'No abandonar a la familia',
                touchstoneId: 'touchstone-1',
              },
            ],
            touchstones: [
              {
                touchstoneId: 'touchstone-1',
                name: 'Lucía',
                relationship: 'Hermana',
              },
            ],
          },
        },
      )

    assert.equal(
      result.humanityNarrative?.notes,
      'Protege todavía a su hermana mortal.',
    )
  },
)

const migration = readFileSync(
  new URL(
    '../prisma/migrations/20261002190000_add_character_narrative_notes/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

const repository = readFileSync(
  new URL(
    '../src/characters/infrastructure/prisma-character-draft.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  'las notas narrativas se guardan con la Humanidad del personaje',
  () => {
    assert.match(
      schema,
      /model CharacterHumanityState[\s\S]*notes\s+String\s+@default\(""\)/,
    )
    assert.match(
      migration,
      /ADD COLUMN "notes" TEXT NOT NULL DEFAULT ''/,
    )
  },
)

test(
  'una ficha activa admite sólo narrativa, Ambición y Deseo',
  () => {
    assert.match(
      repository,
      /updatesOnlyEditableSheetFields/,
    )
    assert.match(
      repository,
      /key === 'humanityNarrative'/,
    )
    assert.match(
      repository,
      /key === 'ambition' \|\|[\s\S]*key === 'desire'/,
    )
    assert.match(
      repository,
      /not:[\s\S]*PrismaCharacterStatus\.ARCHIVED/,
    )
    assert.match(
      repository,
      /: PrismaCharacterStatus\.DRAFT/,
    )
  },
)
