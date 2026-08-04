import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = await readFile(
  new URL(
    '../prisma/migrations/20260804121000_add_predator_type_choices_to_creation_state/migration.sql',
    import.meta.url,
  ),
  'utf8',
)

const repository = await readFile(
  new URL(
    '../src/characters/infrastructure/prisma-character-draft.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '004-E.1B.1 conserva elecciones de Tipo de Depredador en el estado del creador',
  () => {
    assert.match(
      schema,
      /predatorTypeChoices\s+Json\s+@default\("\{\}"\)/,
    )

    assert.match(
      migration,
      /ADD COLUMN "predatorTypeChoices" JSONB NOT NULL DEFAULT '\{\}'::jsonb/,
    )
  },
)

test(
  '004-E.1B.1 crea carga y actualiza las elecciones mediante Prisma',
  () => {
    assert.match(
      repository,
      /predatorTypeChoices:\s*toPredatorTypeChoicesJson\(/,
    )

    assert.match(
      repository,
      /predatorTypeChoices:\s*fromPredatorTypeChoicesJson\(/,
    )

    assert.match(
      repository,
      /data\.creation\s*\.predatorTypeChoices !== undefined[\s\S]*creationUpdate\.predatorTypeChoices/,
    )
  },
)
