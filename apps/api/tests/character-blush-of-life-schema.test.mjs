import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const schema =
  await readFile(
    new URL(
      '../prisma/schema.prisma',
      import.meta.url,
    ),
    'utf8',
  )

const migration =
  await readFile(
    new URL(
      '../prisma/migrations/20260821225000_add_character_blush_of_life_exemptions/migration.sql',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '059-D1A schema crea ledger contextual separado',
  () => {
    assert.match(
      schema,
      /model CharacterBlushOfLifeExemptionOperation\s*{/,
    )
    assert.match(
      schema,
      /@@id\(\[characterId, operationId\]\)/,
    )
    assert.match(
      schema,
      /sourceBloodOperationId\s+String[\s\S]*@db\.Uuid/,
    )
    assert.match(
      schema,
      /characterRevision\s+Int/,
    )
  },
)

test(
  '059-D1A no hace única la instancia fuente porque la exención persiste',
  () => {
    const model =
      schema.slice(
        schema.indexOf(
          'model CharacterBlushOfLifeExemptionOperation',
        ),
        schema.indexOf(
          'model CharacterRouseCheckOperation',
        ),
      )

    assert.doesNotMatch(
      model,
      /@@unique\(\[characterId,\s*sourceBloodOperationId\]\)/,
    )
    assert.match(
      model,
      /@@index\(\[characterId, sourceBloodOperationId\]\)/,
    )
  },
)

test(
  '059-D1A migración fuerza Hambre inmutable',
  () => {
    assert.match(
      migration,
      /"hungerBefore" BETWEEN 0 AND 5/,
    )
    assert.match(
      migration,
      /"hungerAfter" = "hungerBefore"/,
    )
    assert.match(
      migration,
      /"character_blood_resonance_operations"/,
    )
  },
)
